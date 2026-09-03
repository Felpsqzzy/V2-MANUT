const CACHE='biotrop-shell-v2';
const CORE=['./','./app.html','./config.js','./app.js','./assets/biotrop-logo.svg'];

self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE).catch(()=>{})).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const key of await caches.keys())if(key!==CACHE)await caches.delete(key);await self.clients.claim()})())});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith((async()=>{
    try{
      const response=await fetch(event.request,{cache:'no-store'});
      if(response.ok && (url.pathname.endsWith('.html')||url.pathname.endsWith('.js')||url.pathname.endsWith('.css'))) {
        const cache=await caches.open(CACHE);await cache.put(event.request,response.clone());
      }
      return response;
    }catch{return caches.match(event.request)}
  })());
});
