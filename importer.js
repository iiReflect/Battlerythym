/* Battle Rhythm importer: reads an Excel, Word, PDF, CSV or text file on the device (nothing is uploaded)
   and pulls out the tasks, guessing how often each repeats, which day, what time and when it is due. */
(function(){
'use strict';

/* ---------- small helpers ---------- */
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const parseD=s=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
const addDays=(s,n)=>{const d=parseD(s);d.setDate(d.getDate()+n);return ymd(d);};
const dim=(y,m)=>new Date(y,m+1,0).getDate();
const letters=s=>(String(s).match(/[a-z]/gi)||[]).length;
const tidy=s=>String(s==null?'':s).replace(/ /g,' ').replace(/[ \t\f\v]+/g,' ').replace(/ *\n */g,'\n').trim();

const MONTH_RE='(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|May|may(?=\\s*\\d)|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const MON3=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const monIdx=s=>MON3.indexOf(s.slice(0,3).toLowerCase());
const WD_TOKEN='(sun(?:day)?|mon(?:day)?|tue(?:s(?:day)?)?|wed(?:nesday|s)?|thu(?:r(?:s(?:day)?)?)?|fri(?:day)?|sat(?:urday)?)';
const WD3=['sun','mon','tue','wed','thu','fri','sat'];
const wdIdx=s=>WD3.indexOf(s.slice(0,3).toLowerCase());

/* ---------- reading what's in the text ---------- */
function weekdaysIn(text){
  const set=new Set();let s=' '+text+' ';
  s=s.replace(new RegExp('\\b'+WD_TOKEN+'s?\\.?\\s*(?:-|–|—|to|through|thru)\\s*'+WD_TOKEN+'s?\\b','gi'),(m,a,b)=>{let i=wdIdx(a);const j=wdIdx(b);for(let k=0;k<7;k++){set.add(i);if(i===j)break;i=(i+1)%7;}return ' ';});
  s=s.replace(/\bM\s*-\s*F\b/g,()=>{[1,2,3,4,5].forEach(d=>set.add(d));return ' ';});
  s=s.replace(/\bweek\s*days?\b/gi,()=>{[1,2,3,4,5].forEach(d=>set.add(d));return ' ';});
  s=s.replace(/\bweekends?\b/gi,()=>{set.add(0);set.add(6);return ' ';});
  const re=new RegExp('\\b'+WD_TOKEN+'s?\\b\\.?','gi');let m;
  while((m=re.exec(s))){const w=m[1];if(/^(sun|sat|wed|mon)$/i.test(w)&&w===w.toLowerCase())continue;set.add(wdIdx(w));}
  return set;
}
function parseTime(s,loose){
  s=String(s);let m;
  if((m=s.match(/\b(\d{1,2}):([0-5]\d)\s*([ap])\.?\s?m\b\.?/i))||(m=s.match(/\b(\d{1,2})()\s*([ap])\.?\s?m\b\.?/i))){
    let h=Number(m[1])%12;if(m[3].toLowerCase()==='p')h+=12;if(h>23)return null;return pad(h)+':'+pad(m[2]||0);}
  if((m=s.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/)))return pad(m[1])+':'+m[2];
  if((m=s.match(/\b([01]\d|2[0-3])([0-5]\d)\s*(?:L|Z|J|R|hrs?|hours|local)\b/i)))return m[1]+':'+m[2];
  if((m=s.match(/(?:^|\s)([01]\d|2[0-3])([0-5]\d)\s*[-–—]\s*([01]\d|2[0-3])[0-5]\d\b/)))return m[1]+':'+m[2];
  if((m=s.match(/^\s*([01]\d|2[0-3])([0-5]\d)(?=\s+[A-Za-z(])/)))return m[1]+':'+m[2];
  if(loose&&(m=s.match(/(?:^|[\s(@])([01]\d|2[0-3])([0-5]\d)(?![\d/:-])/)))return m[1]+':'+m[2];
  return null;
}
function nextOnOrAfter(today,mo,day){ // next date >= today for month index mo (0-11) and day
  const t=parseD(today);for(let y=t.getFullYear();y<t.getFullYear()+2;y++){const d=new Date(y,mo,Math.min(day,dim(y,mo)));if(ymd(d)>=today)return ymd(d);}return null;
}
function parseDate(s,today){
  const parts=String(s).split(/\s+\/\s+|;|,(?!\s*\d{4})|\s+and\s+|&/).map(p=>parseDate1(p,today)).filter(Boolean).sort();
  if(!parts.length)return parseDate1(s,today);
  return parts.find(d=>d>=today)||parts[parts.length-1];
}
function parseDate1(s,today){
  s=String(s);let m;
  if((m=s.match(/\b(20\d\d)-(\d{1,2})-(\d{1,2})\b/)))return m[1]+'-'+pad(m[2])+'-'+pad(m[3]);
  if((m=s.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{4}|\d{2})\b/))){const y=m[3].length===2?2000+Number(m[3]):Number(m[3]);const mo=Number(m[1]),d=Number(m[2]);if(mo>=1&&mo<=12&&d>=1&&d<=31)return y+'-'+pad(mo)+'-'+pad(Math.min(d,dim(y,mo-1)));}
  if((m=s.match(new RegExp('\\b(\\d{1,2})(?:st|nd|rd|th)?\\s*-?\\s*'+MONTH_RE+'\\b\\.?\\s*-?\\s*(\\d{4}|\\d{2}(?!\\d|:))?','i')))){
    const mo=monIdx(m[2]),d=Number(m[1]);if(d>=1&&d<=31){if(m[3]){const y=m[3].length===2?2000+Number(m[3]):Number(m[3]);return y+'-'+pad(mo+1)+'-'+pad(Math.min(d,dim(y,mo)));}return nextOnOrAfter(today,mo,d);}}
  if((m=s.match(new RegExp('\\b'+MONTH_RE+'\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b,?\\s*(\\d{4})?','i')))){
    const mo=monIdx(m[1]),d=Number(m[2]);if(d>=1&&d<=31){if(m[3])return m[3]+'-'+pad(mo+1)+'-'+pad(Math.min(d,dim(Number(m[3]),mo)));return nextOnOrAfter(today,mo,d);}}
  return null;
}
const NTH={first:1,'1st':1,second:2,'2nd':2,third:3,'3rd':3,fourth:4,'4th':4,last:-1,final:-1};
function nthWeekday(y,mo,n,wd){
  if(n>0){const f=new Date(y,mo,1);const d=1+((wd-f.getDay()+7)%7)+(n-1)*7;return d<=dim(y,mo)?new Date(y,mo,d):null;}
  const l=new Date(y,mo,dim(y,mo));return new Date(y,mo,l.getDate()-((l.getDay()-wd+7)%7));
}
/* guess how often something repeats from free text */
function guess(text,today){
  const s=' '+String(text||'')+' ';const L=s.toLowerCase();const g={freq:null,days:null,wd:null,monthDay:null,nth:null,month:null,time:null,date:null,every2:false};
  let rest=s;
  const nth=s.match(new RegExp('\\b(first|1st|second|2nd|third|3rd|fourth|4th|last|final)\\s+'+WD_TOKEN+'\\b','i'));
  if(nth){g.nth={n:NTH[nth[1].toLowerCase()],wd:wdIdx(nth[2])};rest=s.replace(nth[0],' ');}
  if(/semi[\s-]?annual|bi[\s-]?annual|twice\s+(a|per|each)\s+year|every\s+(6|six)\s+months|\b(6|six)[\s-]?month(ly)?\b|half[\s-]?year/.test(L))g.freq='semiannual';
  else if(/quarterly|every\s+(3|three)\s+months|\bqtr(ly)?\b|(per|each|every|a)\s+quarter\b/.test(L))g.freq='quarterly';
  else if(/\bannual(ly)?\b|\byearly\b|every\s+(year|12\s+months)|(once\s+)?(a|per|each)\s+year\b|\b(12|twelve)[\s-]?month(ly)?\b/.test(L))g.freq='annual';
  else if(/bi[\s-]?monthly|every\s+(other|2|two)\s+months/.test(L)){g.freq='monthly';g.every2=true;}
  else if(/monthly|every\s+month|(each|per|a|the)\s+month\b|of\s+(the|each|every)\s+month|\beom\b|end\s+of\s+(the\s+)?month/.test(L)||(g.nth&&/\bmonth|\bmo\b/.test(L)))g.freq='monthly';
  else if(/bi[\s-]?weekly|every\s+(other|2|two)\s+weeks?|fortnight/.test(L)){g.freq='weekly';g.every2=true;}
  else if(/weekly|every\s+week|(each|per|a)\s+week\b|\bwkly\b/.test(L))g.freq='weekly';
  else if(/daily|every\s+(day|morning|evening|night|shift)|(each|per|a)\s+day\b|nightly|\bm\s*-\s*f\b|week\s*days|mon(day)?\s*(-|–|to|thru|through)\s*fri(day)?/.test(L))g.freq='daily';
  if(g.nth&&!g.freq)g.freq='monthly';
  if(!g.freq&&/\b(one[\s-]?time|once\s+only|single\s+event|as\s+required|as\s+needed|one[\s-]?off|non[\s-]?recurring)\b/.test(L))g.freq='once';
  const days=weekdaysIn(rest);
  if(days.size){
    if(g.freq==='daily'||((!g.freq||g.freq==='weekly')&&days.size>1)){g.freq='daily';g.days=days.size===7?null:[...days].sort();}
    else if(!g.freq||g.freq==='weekly'){g.freq='weekly';g.wd=[...days][0];}
  }
  let m;
  if((m=L.match(/\b(\d{1,2})(st|nd|rd|th)\b(?!\s*(?:sun|mon|tue|wed|thu|fri|sat|week|qtr|quarter))/))&&Number(m[1])<=31&&(g.freq==='monthly'||/month/.test(L))){g.monthDay=Number(m[1]);if(!g.freq)g.freq='monthly';}
  if(/last\s+(business\s+|working\s+)?day\s+of\s+(the\s+|each\s+|every\s+)?month|\beom\b|end\s+of\s+(the\s+)?month/.test(L))g.monthDay=31;
  g.time=parseTime(s,false);
  g.date=parseDate(s,today);
  if(!g.date&&(m=s.match(new RegExp('\\b'+MONTH_RE+'\\b(?!\\s*\\d)','i')))&&/annual|quarter|year|semi/.test(g.freq||''))g.month=monIdx(m[1]);
  return g;
}
const FILLER=/\b(every|each|per|on|at|the|of|by|due|and|or|a|an|to|thru|through|until|starting|start|from|times?|once|twice|other|first|second|third|fourth|last|final|1st|2nd|3rd|4th|\d+(st|nd|rd|th)|days?|weeks?|months?|years?|quarters?|hrs?|hours?|am|pm|nlt|no|later|than|end|eom|in|weekdays?|weekends?|business|working|recurring|recurrence|frequency|freq|occurs?|cycle|repeat|repeats|only|as|required|semi|bi|annual(ly)?|semiannual(ly)?|biannual(ly)?|yearly|quarterly|monthly|weekly|daily|nightly|biweekly|bimonthly|fortnightly|qtr(ly)?|wkly|local|l|z|j)\b/gi;
function isMeta(seg){
  let s=' '+seg+' ';
  s=s.replace(new RegExp('\\b'+WD_TOKEN+'s?\\b','gi'),' ').replace(new RegExp('\\b'+MONTH_RE+'\\b','gi'),' ').replace(/\bM\s*-\s*F\b/g,' ').replace(FILLER,' ').replace(FILLER,' ');
  return letters(s)<3;
}
function cleanTitle(s){
  s=tidy(s).replace(/\n+/g,' ');
  s=s.replace(/^(?:[•●◦▪■□☐☑✓✔*>·‣⁃]|o(?=\s)|[-–—](?=\s))\s*/,'').replace(/^\(?(?:\d{1,3}|[a-z])[.)]\s+/i,'').replace(/^(?:[•●◦▪■□☐☑✓✔*>·‣⁃-])\s*/,'');
  s=s.replace(/^(?:\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?|\d{3,4}\s*(?:L|Z|hrs?)?)(?:\s*[-–—]\s*(?:\d{1,2}:\d{2}\s*(?:[ap]\.?m\.?)?|\d{3,4}\s*(?:L|Z|hrs?)?))?\s*[:\-–—]?\s+(?=[A-Za-z(])/i,'');
  return s.replace(/[\s:;,.\-–—|]+$/,'').replace(/^[\s:;,.\-–—|]+/,'').trim().slice(0,140);
}
/* a single line of text: keep the parts that aren't schedule info as the title */
function titleFromLine(line){
  const segs=tidy(line).split(/\s+[-–—|]\s+|\s*[()[\]]\s*|\t+|\s*;\s*|:\s+|,\s+(?=(?:every|each|on|at|due|nlt|weekly|monthly|daily|quarterly|annual|semi|\d))/i).map(cleanTitle).filter(Boolean);
  const keep=segs.filter(x=>!isMeta(x));
  let t=cleanTitle(keep.join(' - '));
  const w=t.split(' ');
  for(let i=1;i<w.length;i++){
    if(!/^(due|nlt|by|at|every|each|on|in|starting|from|weekly|monthly|daily|quarterly|annually|yearly)$/i.test(w[i])&&!/,$/.test(w[i-1]))continue;
    const tail=w.slice(i).join(' ');if(isMeta(tail)&&letters(w.slice(0,i).join(' '))>=3){t=cleanTitle(w.slice(0,i).join(' '));break;}
  }
  return t;
}
const JUNK=[/^page\s*\d+(\s*(of|\/)\s*\d+)?$/i,/^(unclassified|cui|controlled unclassified information|for official use only|fouo|secret|confidential|top secret)(\s*\/\/.*)?$/i,/^(as of|updated|last updated|prepared by|approved by|version|rev(ision)?)\b.{0,40}$/i];
const isJunk=s=>letters(s)<3||JUNK.some(r=>r.test(s.trim()));
const HEAD={
  title:/^(tasks?|events?|meetings?|activit(y|ies)|items?|requirements?|description|actions?|name|title|reports?|battle\s*rhythm(\s*events?)?|boards?|what|duty|duties|deliverables?|subject|inspections?|checks?|evolution)$/i,
  freq:/(freq|recurr|cycle|periodicity|how\s*often|occurs?|interval|repeat|cadence|rhythm|schedule)/i,
  day:/^(day|days|day\s*of\s*(the\s*)?week|weekday|when|day\s*[\/&]\s*time|day\s*and\s*time|date\s*[\/&]\s*time)$/i,
  time:/^(time|times|start(\s*time)?|hour|hrs|time\s*\(?l\)?)$/i,
  date:/(due|date|suspense|deadline|next|nlt)/i,
  cat:/^(category|section|type|group|dept|department|shop|division|area|program|functional\s*area)$/i,
  owner:/^(opr|owner|lead|poc|responsible|chair|who|oci|assigned\s*to|resp(onsible)?\.?|billet)$/i,
  notes:/^(notes?|remarks?|comments?|location|where|attendees|purpose|output|inputs?|outputs?|reference|ref|duration|length|venue|method|products?)$/i
};
function asHeader(cells){
  const ne=cells.filter(c=>c.t);if(ne.length<2)return null;
  const wdCols=[];cells.forEach((c,i)=>{if(c.t&&new RegExp('^'+WD_TOKEN+'s?\\.?(\\s+\\d.*)?$','i').test(c.t.trim()))wdCols.push(i);});
  if(wdCols.length>=3){const map={wd:{}};wdCols.forEach(i=>map.wd[i]=wdIdx(cells[i].t.trim()));cells.forEach((c,i)=>{if(c.t&&!(i in map.wd)&&/time|hour|^$/i.test(c.t))map.time=i;});if(map.time==null&&wdCols[0]>0)map.time=0;return {grid:true,map,xs:cells.map(c=>c.x),labels:cells.map(c=>c.t)};}
  const map={};let known=0;
  cells.forEach((c,i)=>{const t=c.t.trim();if(!t||t.length>32||t.split(/\s+/).length>4)return;for(const k of ['title','freq','day','time','date','cat','owner','notes']){if(map[k]==null&&HEAD[k].test(t)){map[k]=i;known++;return;}}});
  if((map.title!=null&&known>=2)||known>=3)return {grid:false,map,xs:cells.map(c=>c.x),labels:cells.map(c=>c.t)};
  return null;
}
/* rows from a PDF carry x positions; line them up under the header's columns */
function place(cells,hdr){
  if(!hdr.xs||hdr.xs.some(x=>x==null)||cells.some(c=>c.x==null))return cells.map(c=>c.t);
  const out=hdr.xs.map(()=>'');
  for(const c of cells){if(!c.t)continue;let k=0;for(let i=0;i<hdr.xs.length;i++)if(hdr.xs[i]<=c.x+6)k=i;out[k]=out[k]?out[k]+' '+c.t:c.t;}
  return out;
}
const HEADING_WORDS=/^(tasks?|requirements?|events?|items?|meetings?|reports?|actions?|duties|checks?|inspections?|deliverables?|battle|rhythm|recurring|schedule|cycle|and|&|the|of|briefs?|boards?|syncs?)$/i;
function asSection(t,isHeading,today){
  const s=t.trim().replace(/:$/,'');const words=s.split(/\s+/);
  if(words.length>6||s.length>48)return null;
  const g=guess(s,today);
  const rest=words.filter(w=>!isMeta(w)&&!HEADING_WORDS.test(w.replace(/[^\w&]/g,'')));
  if(g.freq&&!rest.length)return {freq:g,name:null};
  if(isHeading||/:$/.test(t.trim())||(s===s.toUpperCase()&&letters(s)>=3&&words.length<=3))return g.freq?{freq:g,name:null}:{freq:null,name:titleCase(s)};
  return null;
}
const titleCase=s=>s===s.toUpperCase()?s.toLowerCase().replace(/\b[a-z]/g,c=>c.toUpperCase()):s;

function mergeG(primary,secondary){ // fill gaps in primary from secondary
  const g={...primary};
  if(!g.freq&&secondary.freq){g.freq=secondary.freq;g.days=secondary.days;g.wd=secondary.wd;g.every2=secondary.every2;if(g.nth==null)g.nth=secondary.nth;if(g.monthDay==null)g.monthDay=secondary.monthDay;if(g.month==null)g.month=secondary.month;}
  for(const k of ['time','date'])if(!g[k]&&secondary[k])g[k]=secondary[k];
  return g;
}
function dueFor(g,today){
  if(g.date)return {date:g.date,guessed:false};
  const t=parseD(today);
  if(g.freq==='weekly'&&g.wd!=null)return {date:addDays(today,(g.wd-t.getDay()+7)%7),guessed:false};
  if(g.freq==='daily')return {date:today,guessed:false};
  if(g.freq==='monthly'&&g.nth){for(let i=0;i<3;i++){const d=nthWeekday(t.getFullYear(),t.getMonth()+i,g.nth.n,g.nth.wd);if(d&&ymd(d)>=today)return {date:ymd(d),guessed:false};}}
  if(g.freq==='monthly'&&g.monthDay){for(let i=0;i<2;i++){const y=t.getFullYear(),mo=t.getMonth()+i;const dd=new Date(y,mo,Math.min(g.monthDay,new Date(y,mo+1,0).getDate()));if(ymd(dd)>=today)return {date:ymd(dd),guessed:false};}}
  if(g.month!=null)return {date:nextOnOrAfter(today,g.month,1),guessed:false};
  if(g.freq==='weekly')return {date:today,guessed:true};
  if(g.freq)return {date:today,guessed:true};
  return {date:'',guessed:false};
}
function noteFor(g){
  const n=[];
  if(g.every2)n.push(g.freq==='weekly'?'Every other week in the document; the app repeats it weekly.':'Every other month in the document; the app repeats it monthly.');
  if(g.nth&&g.freq==='monthly')n.push('Document says the '+(g.nth.n>0?['','1st','2nd','3rd','4th'][g.nth.n]:'last')+' '+['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][g.nth.wd]+' of the month; the app repeats on the same date each month.');
  return n.join(' ');
}

/* ---------- turn rows into tasks ---------- */
function extract(rows,today){
  const out=[];const gridItems=[];let hdr=null,grid=null,secName='',secG=null,prev=null;
  const push=(title,g,extra)=>{
    title=cleanTitle(title);if(!title||isJunk(title))return null;
    g=secG?mergeG(g,secG):g;
    const it={title,g,section:secName,notes:extra.notes||'',src:extra.src||'',cat:extra.cat||'',strongTitle:!!extra.strong};out.push(it);return it;
  };
  for(const r of rows){
    if(r.brk){hdr=null;grid=null;prev=null;continue;}
    const cells=r.cells.map(c=>({t:tidy(c.t),x:c.x}));
    const ne=cells.filter(c=>c.t);if(!ne.length)continue;
    const all=ne.map(c=>c.t).join(' | ');
    if(isJunk(all.replace(/\|/g,' ')))continue;
    if(r.sheet){secName=r.cells[0].t;secG=null;hdr=null;grid=null;continue;}
    const h=asHeader(cells);
    if(h){if(h.grid){grid=h;hdr=null;}else{hdr=h;grid=null;}prev=null;continue;}
    if(ne.length===1&&!/\n/.test(ne[0].t)){
      const sec=asSection(ne[0].t,r.heading,today);
      if(sec){if(sec.freq){secG=sec.freq;}else{secName=sec.name;secG=null;}prev=null;continue;}
    }
    if(grid){
      const pos=place(cells,grid);const rowTime=grid.map.time!=null?parseTime(pos[grid.map.time]||'',true):null;
      for(const [col,wd] of Object.entries(grid.map.wd)){
        const txt=pos[col]||'';if(!txt)continue;
        for(const line of txt.split(/\n|;|\s•\s/)){
          const l=line.trim();if(letters(l)<3||isJunk(l))continue;
          const title=titleFromLine(l)||cleanTitle(l);if(!title)continue;
          gridItems.push({title,wd:Number(wd),time:parseTime(l,false)||rowTime,section:secName,src:l});
        }
      }
      continue;
    }
    if(hdr){
      let pos=place(cells,hdr);const m=hdr.map;
      const isPdf=cells.some(c=>c.x!=null);
      // a PDF table cell that wraps onto a second line: join it to the row above
      if(isPdf&&prev&&prev.pos&&(m.freq==null||!pos[m.freq])){
        const t=m.title!=null?pos[m.title]:'';
        if(!t||/^[a-z(&]/.test(t)||/[-,&/]$|\b(and|of|the|for|to|with|in|on)$/i.test(prev.pos[m.title]||'')){
          pos=prev.pos.map((v,i)=>[v,pos[i]].filter(Boolean).join(' '));out.splice(out.indexOf(prev),1);
        }
      }
      let title=m.title!=null?pos[m.title]:'';
      if(!title){const cand=pos.map((t,i)=>({t,i})).filter(o=>o.t&&![m.freq,m.day,m.time,m.date,m.owner].includes(o.i)&&!isMeta(o.t));cand.sort((a,b)=>letters(b.t)-letters(a.t));title=cand.length?cand[0].t:'';}
      if(!title)continue;
      const lab=i=>hdr.labels[i]||'';
      const meta=[m.freq,m.day].filter(i=>i!=null).map(i=>pos[i]).join(' ');
      let g=guess(meta,today);
      if(m.date!=null&&pos[m.date]){const d=parseDate(pos[m.date],today);if(d)g.date=d;else g=mergeG(g,guess(pos[m.date],today));}
      if(m.time!=null&&pos[m.time])g.time=parseTime(pos[m.time],true)||g.time;
      if(!g.time&&m.day!=null&&pos[m.day])g.time=parseTime(pos[m.day],true);
      g=mergeG(g,guess(title,today));
      const notes=[];pos.forEach((t,i)=>{if(!t||i===m.title||[m.freq,m.day,m.time,m.date,m.cat].includes(i))return;notes.push((lab(i)?lab(i).replace(/:$/,'')+': ':'')+t.replace(/\n/g,' '));});
      prev=push(title.replace(/\n/g,' '),g,{notes:notes.join('\n'),src:pos.filter(Boolean).join(' · ').replace(/\n/g,' '),cat:m.cat!=null?pos[m.cat]:'',strong:true});
      if(prev)prev.pos=pos;
      continue;
    }
    // no header: a line of text, or a row of cells
    if(ne.length===1){
      for(const line of ne[0].t.split('\n')){
        if(letters(line)<3||isJunk(line))continue;
        const title=titleFromLine(line);if(!title)continue;
        prev=push(title,guess(line,today),{src:line});
      }
    }else{
      const cand=ne.filter(c=>!isMeta(c.t)).sort((a,b)=>letters(b.t)-letters(a.t));
      if(!cand.length)continue;
      const title=cand[0].t.split('\n')[0];
      const g=guess(ne.map(c=>c.t).join(' ; '),today);
      const notes=cand.slice(1).map(c=>c.t.replace(/\n/g,' ')).filter(t=>!isMeta(t)).join('\n');
      prev=push(title,g,{notes,src:all.replace(/\n/g,' ')});
    }
  }
  // weekly grid: the same event on several days becomes one task
  const byKey=new Map();
  for(const gi of gridItems){const k=gi.title.toLowerCase()+'|'+(gi.time||'');if(!byKey.has(k))byKey.set(k,{...gi,days:new Set()});byKey.get(k).days.add(gi.wd);}
  for(const gi of byKey.values()){
    const days=[...gi.days].sort();const g={freq:days.length===1?'weekly':'daily',wd:days.length===1?days[0]:null,days:days.length>1&&days.length<7?days:null,time:gi.time,date:null,monthDay:null,nth:null,month:null,every2:false};
    out.push({title:gi.title,g,section:gi.section,notes:'',src:gi.src,cat:''});
  }
  // finish: due dates, notes, de-duplicate
  const seen=new Map();const res=[];
  for(const it of out){
    const g=it.g;const d=dueFor(g,today);
    const key=it.title.toLowerCase()+'|'+(g.freq||'')+'|'+(g.time||'');
    if(seen.has(key))continue;seen.set(key,1);
    const n=[it.notes,noteFor(g)].filter(Boolean).join('\n');
    res.push({title:it.title,freq:g.freq||'',days:g.freq==='daily'?g.days:null,due:d.date||'',dueGuessed:d.guessed,time:g.time||'',notes:n,section:it.section||'',cat:tidy(it.cat||''),src:it.src.slice(0,200)});
  }
  return res;
}

/* ---------- file readers ---------- */
const kids=(el,name)=>[...el.childNodes].filter(n=>n.nodeType===1&&n.localName===name);
const desc=(el,name)=>[...el.getElementsByTagNameNS('*',name)];
const xml=s=>new DOMParser().parseFromString(s,'application/xml');

async function readDocx(buf){
  const zip=await window.JSZip.loadAsync(buf);
  const f=zip.file('word/document.xml');if(!f)throw new Error('This Word file looks empty or damaged.');
  const doc=xml(await f.async('string'));const body=desc(doc,'body')[0];const rows=[];
  const runText=p=>{let s='';const walk=n=>{for(const c of n.childNodes){if(c.nodeType!==1)continue;const ln=c.localName;if(ln==='t')s+=c.textContent;else if(ln==='tab')s+='\t';else if(ln==='br'||ln==='cr')s+='\n';else if(ln==='rPr'||ln==='pPr'||ln==='instrText'||ln==='delText')continue;else walk(c);}};walk(p);return s;};
  const isHead=p=>{const ps=desc(p,'pStyle')[0];if(ps&&/heading|title/i.test(ps.getAttribute('w:val')||ps.getAttributeNS('*','val')||''))return true;const runs=desc(p,'r').filter(r=>desc(r,'t').some(t=>t.textContent.trim()));return runs.length>0&&runs.every(r=>{const b=desc(r,'b')[0];return b&&!/^(0|false)$/.test(b.getAttribute('w:val')||'');});};
  const isTitle=p=>{const ps=desc(p,'pStyle')[0];return !!ps&&/^(title|subtitle)$/i.test(ps.getAttribute('w:val')||'');};
  const walk=el=>{for(const c of el.childNodes){if(c.nodeType!==1)continue;const ln=c.localName;
    if(ln==='p'){const t=runText(c);for(const line of t.split('\n')){const parts=line.split('\t').map(x=>x.trim()).filter(Boolean);if(parts.length&&!isTitle(c))rows.push({cells:parts.map(t=>({t})),heading:isHead(c)});}}
    else if(ln==='tbl'){rows.push({brk:true});for(const tr of kids(c,'tr')){const cells=kids(tr,'tc').map(tc=>({t:desc(tc,'p').map(runText).join('\n')}));rows.push({cells});}rows.push({brk:true});}
    else if(ln==='sdt'||ln==='sdtContent'||ln==='customXml'||ln==='smartTag')walk(c);}};
  walk(body);return rows;
}
async function readXlsx(buf){
  const zip=await window.JSZip.loadAsync(buf);
  const X=async p=>{const f=zip.file(p);return f?xml(await f.async('string')):null;};
  const ss=[];const sst=await X('xl/sharedStrings.xml');
  if(sst)for(const si of desc(sst,'si')){let s='';for(const c of si.childNodes){if(c.nodeType!==1)continue;if(c.localName==='t')s+=c.textContent;else if(c.localName==='r')s+=desc(c,'t').map(t=>t.textContent).join('');}ss.push(s);}
  const fmts={};const kinds=[];const st=await X('xl/styles.xml');
  if(st){for(const nf of desc(st,'numFmt'))fmts[nf.getAttribute('numFmtId')]=nf.getAttribute('formatCode')||'';
    const cx=desc(st,'cellXfs')[0];if(cx)for(const xf of kids(cx,'xf')){const id=Number(xf.getAttribute('numFmtId')||0);let k='';
      if((id>=14&&id<=17)||id===22||(id>=27&&id<=36)||(id>=50&&id<=58))k=id===22?'datetime':'date';else if((id>=18&&id<=21)||(id>=45&&id<=47))k='time';
      else if(fmts[id]){const c=fmts[id].replace(/"[^"]*"|\[[^\]]*\]|\\./g,'');if(/[dy]/i.test(c))k=/h/i.test(c)?'datetime':'date';else if(/h|s/i.test(c))k='time';}
      kinds.push(k);}}
  const wb=await X('xl/workbook.xml');const rels=await X('xl/_rels/workbook.xml.rels');const relMap={};
  if(rels)for(const r of desc(rels,'Relationship'))relMap[r.getAttribute('Id')]=r.getAttribute('Target');
  const rows=[];const sheets=wb?desc(wb,'sheet'):[];
  const colNum=ref=>{const m=/^([A-Z]+)/.exec(ref||'');if(!m)return -1;let n=0;for(const ch of m[1])n=n*26+ch.charCodeAt(0)-64;return n-1;};
  const serial=(v,k)=>{const ms=Math.round((v-25569)*86400000);const d=new Date(ms);const dd=d.getUTCFullYear()+'-'+pad(d.getUTCMonth()+1)+'-'+pad(d.getUTCDate());const tt=pad(d.getUTCHours())+':'+pad(d.getUTCMinutes());return k==='time'?tt:(k==='datetime'&&tt!=='00:00'?dd+' '+tt:dd);};
  for(const sh of sheets){
    if(/hidden/i.test(sh.getAttribute('state')||''))continue;
    const rid=sh.getAttribute('r:id')||[...sh.attributes].find(a=>a.localName==='id')?.value;let target=relMap[rid]||'';
    target=target.startsWith('/')?target.slice(1):'xl/'+target.replace(/^\.\//,'');
    const s=await X(target);if(!s)continue;
    if(sheets.length>1)rows.push({brk:true},{sheet:true,cells:[{t:sh.getAttribute('name')||'Sheet'}]});else rows.push({brk:true});
    for(const row of desc(s,'row')){
      if(row.getAttribute('hidden')==='1')continue;
      const cells=[];let i=0;
      for(const c of kids(row,'c')){
        const ci=colNum(c.getAttribute('r'));const at=ci>=0?ci:i;while(cells.length<at)cells.push({t:''});
        const t=c.getAttribute('t');const v=kids(c,'v')[0]?.textContent;let val='';
        if(t==='s')val=ss[Number(v)]||'';else if(t==='inlineStr')val=desc(c,'t').map(x=>x.textContent).join('');else if(t==='b')val=v==='1'?'TRUE':'FALSE';else if(t==='str'||t==='e')val=v||'';
        else if(v!=null&&v!==''){const k=kinds[Number(c.getAttribute('s')||0)];val=k?serial(Number(v),k):v;}
        cells.push({t:val});i=at+1;
      }
      if(cells.some(c=>c.t))rows.push({cells});
    }
    rows.push({brk:true});
  }
  return rows;
}
async function readPdf(buf){
  const lib=window.pdfjsLib;lib.GlobalWorkerOptions.workerSrc='lib/pdf.worker.min.js';
  const pdf=await lib.getDocument({data:new Uint8Array(buf),isEvalSupported:false}).promise;const rows=[];
  for(let p=1;p<=pdf.numPages;p++){
    const page=await pdf.getPage(p);const tc=await page.getTextContent();
    const items=tc.items.filter(i=>i.str&&i.str.trim()).map(i=>({s:i.str,x:i.transform[4],y:i.transform[5],w:i.width,h:Math.hypot(i.transform[2],i.transform[3])||i.height||10}));
    items.sort((a,b)=>b.y-a.y||a.x-b.x);
    const lines=[];for(const it of items){const l=lines.find(l=>Math.abs(l.y-it.y)<=Math.max(2,it.h*.45));if(l)l.items.push(it);else lines.push({y:it.y,items:[it]});}
    lines.sort((a,b)=>b.y-a.y);
    for(const l of lines){
      l.items.sort((a,b)=>a.x-b.x);const cells=[];let cur=null;
      for(const it of l.items){if(cur&&it.x-(cur.end)<Math.max(3,it.h*.6)){cur.t+=(it.x-cur.end>it.h*.15&&!/\s$/.test(cur.t)?' ':'')+it.s;cur.end=it.x+it.w;}else{cur={t:it.s,x:it.x,end:it.x+it.w};cells.push(cur);}}
      rows.push({cells:cells.map(c=>({t:c.t.trim(),x:c.x}))});
    }
  }
  return rows;
}
function parseCsv(text,delim){
  const rows=[];let row=[],f='',q=false;
  for(let i=0;i<text.length;i++){const ch=text[i];
    if(q){if(ch==='"'){if(text[i+1]==='"'){f+='"';i++;}else q=false;}else f+=ch;}
    else if(ch==='"')q=true;else if(ch===delim){row.push(f);f='';}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(f);rows.push(row);row=[];f='';}else f+=ch;}
  if(f||row.length){row.push(f);rows.push(row);}
  return [{brk:true},...rows.map(r=>({cells:r.map(t=>({t}))}))];
}
function readText(text){
  const lines=String(text).replace(/\r\n?/g,'\n').split('\n');
  if(lines.filter(l=>l.includes('\t')).length>=Math.max(2,lines.length*.3))return parseCsv(text,'\t');
  return lines.map(l=>({cells:[{t:l}]}));
}
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('Could not load '+src));document.head.appendChild(s);});}
async function readFile(file){
  const name=(file.name||'').toLowerCase();const ext=name.split('.').pop();
  if(/^(doc|xls|ppt|pages|numbers|key|rtf|odt|ods)$/.test(ext))throw new Error(({doc:'This is an older Word file (.doc).',xls:'This is an older Excel file (.xls).',pages:'This is a Pages file.',numbers:'This is a Numbers file.'}[ext]||'This file type can\'t be read.')+' Open it and save or export it as .docx (Word), .xlsx (Excel) or PDF, then import that.');
  if(/^(png|jpe?g|heic|gif|webp)$/.test(ext))throw new Error('Pictures can\'t be read. Import the original Word, Excel or PDF file instead, or paste the text.');
  const buf=await file.arrayBuffer();
  if(ext==='docx'||ext==='docm'){if(!window.JSZip)await loadScript('lib/jszip.min.js');return readDocx(buf);}
  if(ext==='xlsx'||ext==='xlsm'){if(!window.JSZip)await loadScript('lib/jszip.min.js');return readXlsx(buf);}
  if(ext==='pdf'){if(!window.pdfjsLib)await loadScript('lib/pdf.min.js');return readPdf(buf);}
  const text=new TextDecoder().decode(buf);
  if(ext==='csv')return parseCsv(text,',');
  if(ext==='tsv')return parseCsv(text,'\t');
  return readText(text);
}
window.BRImport={readFile,readText,extract,guess,parseTime,parseDate,titleFromLine,_readDocx:readDocx,_readXlsx:readXlsx,_readPdf:readPdf};
})();
