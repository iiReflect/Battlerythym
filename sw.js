// Offline cache for Battle Rhythm. Bump VERSION when files change.
const VERSION='br-v13';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','fonts.css','importer.js','lib/jszip.min.js','lib/pdf.min.js','lib/pdf.worker.min.js','lib/jspdf.umd.min.js','lib/jspdf.plugin.autotable.min.js','fonts/Barlow-400.woff2','fonts/Barlow-500.woff2','fonts/Barlow-600.woff2','fonts/Barlow-700.woff2','fonts/BarlowCondensed-500.woff2','fonts/BarlowCondensed-600.woff2','fonts/BarlowCondensed-700.woff2','fonts/IBMPlexMono-400.woff2','fonts/IBMPlexMono-500.woff2','fonts/IBMPlexMono-600.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES.map(f=>new Request(f,{cache:'reload'})))).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// Network first (so fixes show up straight away when online), falling back to the saved copy when offline.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith((async()=>{
    const cache=await caches.open(VERSION);
    try{
      const ctrl=new AbortController();const timer=setTimeout(()=>ctrl.abort(),4000);
      const r=await fetch(e.request,{cache:'no-cache',signal:ctrl.signal});clearTimeout(timer);
      if(r&&r.ok)cache.put(e.request,r.clone());
      return r;
    }catch(err){
      return (await cache.match(e.request,{ignoreSearch:true}))||(e.request.mode==='navigate'?await cache.match('index.html'):Response.error());
    }
  })());
});
