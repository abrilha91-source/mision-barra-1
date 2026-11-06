const C='mb1-v2.6';const F=['./','index.html','styles.css','app.js','bank.js','bank2.js','bank3.js','config.js','audios.js','xlsx.bundle.js','NotoSans-latin.woff2','icon.svg','icon-192.png','icon-512.png','manifest.webmanifest','fx.js','alc.js','alc.css','pdfjs/pdf.min.mjs','pdfjs/pdf.worker.min.mjs'];
self.window=self;try{importScripts('audios.js')}catch(e){}
const AU=Object.keys(self.AUDIOS||{}).map(k=>'audio/'+k+'.mp3');
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(async c=>{await c.addAll(F);for(let i=0;i<AU.length;i+=40)await Promise.all(AU.slice(i,i+40).map(u=>c.add(u).catch(()=>{})))}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||e.request.url.includes('/api/'))return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request).then(n=>{if(n.ok&&new URL(e.request.url).origin===location.origin){const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp))}return n}).catch(()=>caches.match('index.html'))))});
