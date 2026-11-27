const C='mb1-v2.17.2';const F=['./','index.html','manual.html','styles.css','app.js','bank.js','bank2.js','bank3.js','config.js','audios.js','xlsx.bundle.js','NotoSans-latin.woff2','icon.svg','icon-192.png','icon-512.png','manifest.webmanifest','fx.js','alc.js','alc.css','importar.js','bancos.js','vocab.js','vocab.css','vocab_data.js','practica.js','practica_data.js','practica.css','perfil.js','calif.js','sombra.js','uso.js','pdfjs/pdf.min.mjs','pdfjs/pdf.worker.min.mjs'];
self.window=self;try{importScripts('audios.js')}catch(e){}
const AU=Object.keys(self.AUDIOS||{}).map(k=>'audio/'+k+'.mp3');
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(async c=>{await c.addAll(F);for(let i=0;i<AU.length;i+=40)await Promise.all(AU.slice(i,i+40).map(u=>c.add(u).catch(()=>{})))}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
function headersOf(r,size,start,end){
  const h=new Headers();const ct=r.headers.get('Content-Type')||'audio/mpeg';
  h.set('Content-Type',ct);h.set('Accept-Ranges','bytes');h.set('Content-Length',String(end-start+1));
  if(start!==0||end!==size-1)h.set('Content-Range',`bytes ${start}-${end}/${size}`);
  return h;
}
async function sliceRange(full,range){
  const buf=await full.arrayBuffer(),size=buf.byteLength;
  const m=/bytes=(\d*)-(\d*)/.exec(range||'');
  if(!m)return new Response(buf,{status:200,headers:headersOf(full,size,0,size-1)});
  let start=m[1]===''?(m[2]?Math.max(0,size-Number(m[2])):0):Number(m[1]);
  let end=m[2]===''?size-1:Number(m[2]);
  if(start>end||start>=size)return new Response(null,{status:416,headers:{'Content-Range':'bytes */'+size}});
  end=Math.min(end,size-1);
  return new Response(buf.slice(start,end+1),{status:206,headers:headersOf(full,size,start,end)});
}
async function fullAudio(url){
  const bare=new Request(url);
  let full=await caches.match(bare,{ignoreSearch:true});
  if(full&&full.status!==200)full=null;
  if(!full){
    const n=await fetch(bare);
    if(n.ok&&n.status===200){const cp=n.clone();caches.open(C).then(c=>c.put(bare,cp));full=n;}
    else return n;
  }
  return full;
}
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET'||req.url.includes('/api/'))return;
  const u=new URL(req.url);if(u.origin!==location.origin)return; // v2.12: la Hoja (Apps Script) y otros dominios van directo a la red
  const isAud=/\.(mp3|m4a|ogg|wav)(\?|$)/i.test(u.pathname);
  e.respondWith((async()=>{
    try{
      if(isAud){
        const full=await fullAudio(u.href);
        if(!(full&&full.ok&&full.status===200))return full;
        if(req.headers.has('Range'))return sliceRange(full,req.headers.get('Range'));
        return full;
      }
      const hit=await caches.match(req,{ignoreSearch:true});
      if(hit)return hit;
      const n=await fetch(req);
      if(n.ok&&n.status===200&&u.origin===location.origin){const cp=n.clone();caches.open(C).then(c=>c.put(req,cp))}
      return n;
    }catch(err){return caches.match('index.html')}
  })());
});
