/* v2.5 · efectos del diseño dinámico: confeti, vibración y transición entre pantallas. No guarda datos. */
/* v2.10 · audio: entrada de silencio, calentamiento de la salida, voces TTS y referencia a las utterances. */
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
};

const LEAD=0;
let _ac=null,_gen=0,_utt=[],_voces=[],_file=null,_unlocked=false,_watch=0,_estado='off';
function ctx(){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;if(!_ac||_ac.state==='closed')_ac=new AC();if(_ac.state==='suspended')_ac.resume().catch(()=>{});return _ac}
function cargarVoces(){if(!('speechSynthesis'in window))return;try{_voces=speechSynthesis.getVoices()}catch(e){_voces=[]}_voces=_voces||[]}
if('speechSynthesis'in window){cargarVoces();speechSynthesis.addEventListener('voiceschanged',cargarVoces)}
function vocesEN(){cargarVoces();const all=_voces.length?_voces:(('speechSynthesis'in window?speechSynthesis.getVoices():[])||[]);const en=all.filter(v=>/^en([-_]|$)/i.test(v.lang||''));return en.length?en:all}
function vozGuardada(){return localStorage.getItem('mb1_voice')||''}
function rateGuardada(fb){const r=parseFloat(localStorage.getItem('mb1_rate')||localStorage.getItem('mb1_alc_rate')||fb||.9);return(r>=.6&&r<=1.2)?r:(fb||.9)}
function vozElegida(pred){const vs=vocesEN(),all=('speechSynthesis'in window?speechSynthesis.getVoices():[])||[],id=vozGuardada();const pref=vs.find(v=>v.voiceURI===id||v.name===id);if(pref)return pref;if(typeof pred==='function'){const p=pred(vs);if(p)return p}return vs.find(v=>/^en[-_]US/i.test(v.lang||''))||vs.find(v=>/^en/i.test(v.lang||''))||vs[0]||all[0]||null}
function guardarVoz(id){localStorage.setItem('mb1_voice',id||'')}
function guardarRate(r){localStorage.setItem('mb1_rate',String(r));localStorage.setItem('mb1_alc_rate',String(r))}
function msgAudio(m){try{if(window.toast)window.toast(m)}catch(e){}}
const MSG_NO='No se oyó el audio. Activa el volumen (en iPad, también el interruptor de silencio) o instala una voz en inglés en Ajustes › Texto a voz.';
function setEstado(est){_estado=est;try{document.querySelectorAll('.audio').forEach(el=>{el.classList.toggle('hablando',est==='on');const b=el.querySelector('.btn.big, .eplay, [data-act=play]');if(!b||b.closest('.ebtns'))return;if(!b.dataset.lbl)b.dataset.lbl=b.textContent;b.textContent=est==='on'?'▶ Reproduciendo…':b.dataset.lbl})}catch(e){}}
function listo(){return _unlocked}
function cancelar(){_gen++;if(_file){try{_file.pause();_file.removeAttribute('src')}catch(e){}_file=null}if('speechSynthesis'in window)try{speechSynthesis.cancel()}catch(e){}_utt=[];setEstado('off')}
function resumeSS(){if(!('speechSynthesis'in window))return;try{speechSynthesis.resume()}catch(e){}}
function ensureWatch(){if(_watch)return;_watch=setInterval(()=>{try{if(!_utt.length||!speechSynthesis.speaking){clearInterval(_watch);_watch=0;return}if(speechSynthesis.paused)speechSynthesis.resume()}catch(e){}},250)}
function warmup(seg){const t=Math.max(.05,seg==null?.15:seg),my=_gen;return new Promise(res=>{const ac=ctx();if(!ac){setTimeout(()=>{if(my===_gen)res()},t*1000);return}const n=Math.max(1,Math.ceil(ac.sampleRate*t)),buf=ac.createBuffer(1,n,ac.sampleRate),src=ac.createBufferSource(),g=ac.createGain();g.gain.value=0.0001;src.buffer=buf;src.connect(g);g.connect(ac.destination);src.onended=()=>{if(my===_gen)res()};try{src.start()}catch(e){setTimeout(()=>{if(my===_gen)res()},t*1000)}setTimeout(()=>{if(my===_gen)res()},t*1000+40)})}
function waitReady(el,ms){return new Promise(res=>{if(el.readyState>=3)return res();const t=setTimeout(ok,ms||2500);function ok(){clearTimeout(t);el.removeEventListener('canplaythrough',ok);el.removeEventListener('canplay',ok);res()}el.addEventListener('canplaythrough',ok);el.addEventListener('canplay',ok)})}
function trozos(t){const parts=String(t||'').replace(/_{2,}/g,' blank ').split(/(?<=[.!?])\s+/).map(s=>s.trim()).filter(Boolean);const out=[];for(const p of parts.length?parts:[String(t||'')]){if(p.length<=180){out.push(p);continue}let buf='';for(const bit of p.split(/(?<=,)\s+/)){if(buf&&(buf+' '+bit).length>180){out.push(buf);buf=bit}else buf=buf?buf+' '+bit:bit}if(buf)out.push(buf)}return out.length?out:[String(t||'')]}
function silentUrl(sec){const rate=8000,n=Math.max(1,Math.ceil(rate*(sec==null?.15:sec))),buf=new ArrayBuffer(44+n*2),v=new DataView(buf);const w=(o,s)=>{for(let i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i))};w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);v.setUint32(24,rate,true);v.setUint32(28,rate*2,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);return URL.createObjectURL(new Blob([buf],{type:'audio/wav'}))}
function markStart(src,via){try{if(window.__audPlays)window.__audPlays.push({t:performance.now(),src:src||'',via:via||'mb1'})}catch(e){}}
function playFile(url,opts){opts=opts||{};cancelar();const my=_gen,rate=opts.rate==null?1:opts.rate;ctx();_unlocked=true;
  const el=new Audio();el.preload='auto';el.playbackRate=rate||1;el.src=url;_file=el;setEstado('on');markStart(url,'html');
  const fail=e=>{if(my!==_gen)return;setEstado('off');if(opts.onFail)opts.onFail(e);else msgAudio(MSG_NO)};
  el.onended=()=>{if(my===_gen){if(_file===el)_file=null;setEstado('off');if(opts.onEnd)opts.onEnd()}};
  el.onerror=()=>fail(el.error||new Error('audio'));
  el.onplaying=()=>{if(my===_gen)setEstado('on')};
  try{const p=el.play();if(p&&p.catch)p.catch(fail)}catch(e){fail(e)}
  return Promise.resolve(el)}
function speak(text,opts){opts=opts||{};if(!('speechSynthesis'in window)){if(opts.onFail)opts.onFail();else msgAudio(MSG_NO);return}
  cargarVoces();cancelar();const my=_gen,rate=opts.rate==null?rateGuardada(.9):opts.rate,lines=opts.lines||[{t:String(text==null?'':text)}];
  const chunks=[];lines.forEach(ln=>trozos(ln.t).forEach(c=>{if(c&&String(c).trim())chunks.push({t:String(c),voice:ln.voice,pitch:ln.pitch})}));
  if(!chunks.length){if(opts.onFail)opts.onFail();else msgAudio('No hay texto para leer en voz alta.');return}
  _unlocked=true;resumeSS();
  const v0=vozElegida();
  const go=i=>{if(my!==_gen)return;const c=chunks[i],u=new SpeechSynthesisUtterance(c.t);u.lang=(c.voice&&c.voice.lang)||(v0&&v0.lang)||'en-US';u.rate=rate;const v=c.voice||v0;if(v){try{u.voice=v}catch(e){}}if(c.pitch)try{u.pitch=c.pitch}catch(e){};
    u.onend=()=>{if(my!==_gen)return;if(i<chunks.length-1)go(i+1);else{setEstado('off');if(opts.onEnd)opts.onEnd()}};
    u.onerror=ev=>{if(my!==_gen)return;setEstado('off');if(opts.onFail)opts.onFail(ev);else if(ev&&ev.error&&ev.error!=='interrupted'&&ev.error!=='canceled')msgAudio(MSG_NO)};
    _utt.push(u);try{if(window.__audSpeaks)window.__audSpeaks.push({t:performance.now(),text:c.t,lang:u.lang,rate:u.rate,voice:v&&(v.name||v.voiceURI)||''})}catch(e){}
    speechSynthesis.speak(u);resumeSS();ensureWatch()};
  setEstado('on');markStart('tts','tts');go(0)}
function opcionesVoz(){const vs=vocesEN(),id=vozGuardada();if(!vs.length)return'<option value="">Voz en inglés del dispositivo</option>';return vs.map(v=>`<option value="${v.voiceURI.replace(/"/g,'&quot;')}" ${v.voiceURI===id||v.name===id?'selected':''}>${v.name} (${v.lang})</option>`).join('')}
function bindAudioUI(root){const r=root||document,sel=r.querySelector('#vozsel'),rate=r.querySelector('#ratesel'),pr=r.querySelector('#probarvoz');if(sel){if(!sel.options.length||sel.dataset.ok!=='1'){sel.innerHTML=opcionesVoz();sel.dataset.ok='1'}sel.onchange=()=>guardarVoz(sel.value)}if(rate){const v=String(rateGuardada(.9));if([...rate.options].some(o=>o.value===v))rate.value=v;rate.onchange=()=>guardarRate(rate.value)}if(pr)pr.onclick=()=>speak('Good morning, Cadet. Please listen carefully and choose the best answer.',{rate:rateGuardada(.9)})}
window.MB1AUD={LEAD,cancelar,warmup,playFile,speak,vocesEN,vozElegida,rateGuardada,guardarVoz,guardarRate,opcionesVoz,bindAudioUI,cargarVoces,listo,MSG_NO};
})();
