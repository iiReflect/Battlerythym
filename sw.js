// Offline cache for Battle Rhythm. Bump VERSION when files change.
const VERSION='br-v3';
const FILES=['./','index.html','manifest.webmanifest','icon-180.png','icon-512.png','fonts.css','fonts/Barlow-400.woff2','fonts/Barlow-500.woff2','fonts/Barlow-600.woff2','fonts/Barlow-700.woff2','fonts/BarlowCondensed-500.woff2','fonts/BarlowCondensed-600.woff2','fonts/BarlowCondensed-700.woff2','fonts/IBMPlexMono-400.woff2','fonts/IBMPlexMono-500.woff2','fonts/IBMPlexMono-600.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
// Serve from cache first (works with no signal); refresh the cache in the background when online.
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(hit=>{
    const net=fetch(e.request).then(r=>{if(r&&r.ok){const cp=r.clone();caches.open(VERSION).then(c=>c.put(e.request,cp));}return r;}).catch(()=>hit);
    return hit||net;
  }));
});
