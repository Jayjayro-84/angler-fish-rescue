const CACHE='angler-fish-rescue-v6';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()).then(()=>{ precacheVoices(); })); });
async function precacheVoices(){ try{ const list=await (await fetch('voices/list.json')).json(); const c=await caches.open(CACHE); for(const f of list){ const u='voices/'+f; if(!(await c.match(u))){ try{ await c.add(u); }catch(e){} } } }catch(e){} }
async function ranged(req){ const c=await caches.open(CACHE); let res=await c.match(req.url,{ignoreSearch:true}); if(!res){ res=await fetch(req.url); if(res.ok) c.put(req.url,res.clone()); }
  const buf=await res.arrayBuffer(); const m=/bytes=(\d*)-(\d*)/.exec(req.headers.get('range')||''); const a=m&&m[1]?+m[1]:0, b=m&&m[2]?Math.min(+m[2],buf.byteLength-1):buf.byteLength-1;
  return new Response(buf.slice(a,b+1),{status:206,headers:{'Content-Type':'audio/mpeg','Content-Range':`bytes ${a}-${b}/${buf.byteLength}`,'Content-Length':String(b-a+1),'Accept-Ranges':'bytes'}}); }
self.addEventListener('fetch',e=>{ if(e.request.method!=='GET') return; if(e.request.url.endsWith('.apk')) return; if(e.request.headers.has('range')&&e.request.url.includes('/voices/')){ e.respondWith(ranged(e.request).catch(()=>fetch(e.request))); return; } e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(res=>{ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,copy)); return res; }).catch(()=>caches.match('index.html')))); });
