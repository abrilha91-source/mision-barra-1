/* v2.5 · efectos del diseño dinámico: confeti, vibración y transición entre pantallas. No guarda datos. */
(function(){'use strict';
const MOV=()=>!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
function confeti(n,el){if(!MOV())return;let c=document.getElementById('confeti');if(!c){c=document.createElement('canvas');c.id='confeti';document.body.appendChild(c)}
 const d=window.devicePixelRatio||1,x=c.getContext('2d'),W=c.width=innerWidth*d,H=c.height=innerHeight*d;c.style.width=innerWidth+'px';c.style.height=innerHeight+'px';
 let ox=W/2,oy=H*.35;if(el&&el.getBoundingClientRect){const r=el.getBoundingClientRect();ox=(r.left+r.width/2)*d;oy=(r.top+r.height/2)*d}
 const col=['#6366f1','#a855f7','#ec4899','#06b6d4','#f59e0b','#10b981'],T=el?45:110;
 const P=Array.from({length:n},()=>{const a=Math.random()*Math.PI*2,v=(el?4:7+Math.random()*7)*d*(.5+Math.random());return {x:ox,y:oy,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(el?3:6)*d,r:(3+Math.random()*4)*d,c:col[Math.random()*col.length|0],t:Math.random()*6,s:Math.random()<.5}});
 let f=0;const step=()=>{x.clearRect(0,0,W,H);f++;P.forEach(p=>{p.vy+=.25*d;p.vx*=.985;p.x+=p.vx;p.y+=p.vy;p.t+=.2;x.globalAlpha=Math.max(0,1-f/T);x.fillStyle=p.c;x.save();x.translate(p.x,p.y);x.rotate(p.t);if(p.s)x.fillRect(-p.r,-p.r/2,p.r*2,p.r);else{x.beginPath();x.arc(0,0,p.r/1.4,0,7);x.fill()}x.restore()});if(f<T)requestAnimationFrame(step);else x.clearRect(0,0,W,H)};requestAnimationFrame(step)}
let k0='',t0=0;
window.FX={
 ok(el){confeti(26,el||document.querySelector('.opts .ok,.op.ok'))},
 no(){try{navigator.vibrate&&navigator.vibrate(60)}catch(e){}},
 fin(n){setTimeout(()=>confeti(n||150),200)},
 vista(k){const a=document.getElementById('app');if(!a||k===k0)return;k0=k;a.classList.remove('entra');void a.offsetWidth;a.classList.add('entra');clearTimeout(t0);t0=setTimeout(()=>a.classList.remove('entra'),700)},
 tema(t){document.documentElement.style.background=t==='oscuro'?'#0d0f1c':'';const m=document.querySelector('meta[name=theme-color]');if(m)m.content=t==='oscuro'?'#0d0f1c':'#6366f1'}
};})();
