/* Módulo ALC para Misión: Obtener la Barra I (v2.8).
   Vista: solo Práctica y Simulacro. El material se conserva en el dispositivo (IndexedDB «mb1_alc») y sigue usándose; no se muestran formas, bancos ni evaluaciones formales.
   Nada se publica. No modifica los datos de la app (mb1_estado_v2). */
(function(){'use strict';
function crear(MODO){const PT=MODO==='alcpt';/* v2.16: misma vista para ALC y para ALCPT (dos instancias) */
/* Práctica y simulacro ALC · v2.8 · Esc. Mil. Enfría.
   La app se publica VACÍA. El material de práctica se carga en cada dispositivo (IndexedDB) desde Administración › Ajustes. */
const VER='1.0';
let ROOT=null,V=null,VIEW='inicio',VARG='';const $=s=>(ROOT||document).querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=m=>{if(typeof window.toast==='function')return window.toast(m);const t=document.getElementById('toast');if(t){t.textContent=m;t.classList.add('on');setTimeout(()=>t.classList.remove('on'),2400)}};
const fechaL=d=>{const x=new Date(d);return isNaN(x)?String(d).slice(0,10):`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`};
const hoy=()=>fechaL(new Date());
const L='ABCD';
const limpioE=s=>String(s??'').replace(/\s*\((?:Book|Libro)\s*\d+[^)]*\)/gi,'').replace(/\b(?:Book|Libro)\s*\d+(?:\s*,?\s*(?:Lesson|Lecci[oó]n)\s*\d+)?/gi,'').replace(/\s{2,}/g,' ').trim();
const LS=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}},SS=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
/* ---------- almacenamiento ---------- */
function idb(){return new Promise((ok,ko)=>{const r=indexedDB.open('mb1_alc',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)})}
async function idbGet(k){const d=await idb();return new Promise((ok,ko)=>{const r=d.transaction('kv').objectStore('kv').get(k);r.onsuccess=()=>ok(r.result);r.onerror=()=>ko(r.error)})}
async function idbSet(k,v){const d=await idb();return new Promise((ok,ko)=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>ok();t.onerror=()=>ko(t.error)})}
async function idbDel(k){const d=await idb();return new Promise(ok=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').delete(k);t.oncomplete=()=>ok()})}
let BANK=null;
/* integración con Misión Barra I: sesión, rol y piloto (solo lectura del estado de la app) */
const SES=()=>{try{return (typeof S!=='undefined'&&S&&S.sesion)||null}catch(e){return null}};
const ADM=()=>{const s=SES();return !!(s&&s.perfil==='admin')}; const SOLO_LEC=()=>{const s=SES();return !!(s&&s.perfil==='directora')};
const PIL=()=>{try{return typeof esPiloto==='function'&&esPiloto()}catch(e){return false}};
const nomDef=()=>{const s=SES();return s&&s.perfil!=='admin'&&s.perfil!=='directora'?s.nombre:(localStorage.getItem('mb1_alc_nom')||'')};
const matDef=()=>{const s=SES();return s&&s.perfil!=='admin'&&s.perfil!=='directora'?s.m:''};
const RKEY=PT?'mb1_alcpt_res':'mb1_alc_res',UKEY=PT?'mb1_alcpt_ultimo':'mb1_alc_ultimo';
const RES=()=>LS(RKEY,[]),setRES=a=>SS(RKEY,a);
/* ---------- esquemas ---------- */
const ESQ_DEF={programa:{nombre:'2 libros por semestre',parciales:2,pond:{examen:.6,portafolio:.3,participacion:.1,parciales:.6,final:.4,minima:6},final:'ALCPT',cursos:[]}};
const esqId=()=>{const e=LS('mb1_alc_esq',null);return BANK&&BANK.esquemas&&BANK.esquemas[e]?e:(BANK&&BANK.esquema_def)||'programa'};
const ESQ=()=>(BANK&&BANK.esquemas&&BANK.esquemas[esqId()])||ESQ_DEF.programa;
const cursos=()=>ESQ().cursos.length?ESQ().cursos:(BANK?BANK.semestres.map(s=>({id:'S'+s.n,n:s.n,nombre:s.nombre,libros:s.libros})):[]);
const curso=id=>cursos().find(c=>c.id===id)||cursos()[0];
const CFG=()=>Object.assign({},ESQ().pond,LS('mb1_alc_cfg_'+esqId(),{}));
/* semestres ALCPT que corresponden a un curso del esquema */
function semsDe(c){if(esqId()==='superioridad')return {A1:[1],A2:[2,3],A3:[4,5],A4:[6,7]}[c.id]||[c.n];return [c.n]}
/* ---------- navegación ---------- */
const TABS=[['inicio','Inicio'],['practica','Práctica'],['simulacro','Simulacro'],['resultados','Resultados']];
function go(v){const [a,b]=String(v||'inicio').replace(/^#/,'').split('/');VIEW=a||'inicio';VARG=b||'';render()}
function nav(){const n=ROOT&&ROOT.querySelector('#alcnav');if(n)n.innerHTML=TABS.map(([k,t])=>`<button type="button" data-v="${k}" class="${VIEW===k?'on':''}">${t}</button>`).join('')}
function links(){if(!V)return;V.querySelectorAll('a[href^="#"]').forEach(a=>a.onclick=ev=>{ev.preventDefault();go(a.getAttribute('href'))})}
function render(){if(!V||!document.body.contains(V))return;nav();let h=VIEW;
 if(EX&&h!=='examen'){if(!confirm('¿Salir del examen en curso? Se perderá.')){VIEW='examen';nav();return}EX=null;if(AUD)AUD.pause();if(PISTA){PISTA.el.pause();PISTA=null}speechSynthesis&&speechSynthesis.cancel()}
 if(['alc','alcpt','final','calif','banco'].includes(h)){VIEW=h==='alc'||h==='alcpt'?'practica':'inicio';nav();h=VIEW}(PT?{inicio:ptInicio,practica:ptPractica,simulacro:ptSimulacro,resultados:vRes,examen:vExamen}[h]||ptInicio:{inicio:vInicio,practica:vPractica,simulacro:vSimulacro,alcpt:vPractica,alc:vPractica,resultados:vRes,examen:vExamen}[h]||vInicio)();links();const top=ROOT.getBoundingClientRect().top+scrollY-70;if(scrollY>top)window.scrollTo(0,Math.max(0,top))}
const sinBanco=()=>{const adm=ADM()&&!SOLO_LEC();return `<div class="card"><h1>Material de práctica</h1><p class="muted">${adm?'Esta sección se publica vacía. Carga aquí el archivo que entrega la Mesa de Inglés. Se guarda solo en este dispositivo.':'El material de práctica aún no está en este dispositivo. Se descarga solo cuando entras con internet, si Administración ya lo publicó.'}</p>${adm?`<label class="btn big">Cargar material (.json)<input type="file" class="imp" accept=".json,application/json" hidden></label>`:''}</div>${adm?'':'<div data-pubcad></div>'}`};
const sinAlc=()=>BANK&&!nAlc()?`<div class="card"><h1>Práctica ALC</h1><p class="muted">Aún no hay reactivos ALC en este dispositivo. ${ADM()&&!SOLO_LEC()?'Importa un banco con destino ALC en Ajustes › Bancos de preguntas.':'Se descargan solos cuando Administración los publica.'} Los reactivos ALCPT están en la pestaña ALCPT.</p></div>${ADM()?'':'<div data-pubcad></div>'}`:sinBanco();
function bindImp(){document.querySelectorAll('input.imp').forEach(i=>i.onchange=importar)}
function importar(e){const f=e&&e.target&&e.target.files?e.target.files[0]:e;if(!f||!f.name)return;return importarMaterial(f)}
function importarMaterial(f){if(SOLO_LEC()||!ADM()){toast('Solo Administración puede cargar el material de práctica.');return Promise.resolve(false)}
 return new Promise((ok,ko)=>{const r=new FileReader();r.onerror=()=>ko(r.error);r.onload=async()=>{let b;
  try{b=JSON.parse(String(r.result).replace(/^\uFEFF/,''))}catch(x){alert('El archivo no es JSON válido.');ok(false);return}
  if(!b||b.tipo!=='banco_alcpt_alc'||!Array.isArray(b.alcpt)||!Array.isArray(b.alc)){alert('Este archivo no es el material de práctica de la Mesa de Inglés.');ok(false);return}
  BASE=b;mezclar();try{await idbSet('bank',b)}catch(x){alert('No se pudo guardar en el dispositivo: '+x.message);ok(false);return}
  toast('Material de práctica listo en este dispositivo.');if(V&&document.body.contains(V))render();ok(true)};r.readAsText(f)})}
/* ---------- utilidades ---------- */
function shuffle(a,seed){a=a.slice();let x=seed||Math.random()*1e9|0;const rnd=()=>{x=(x*1103515245+12345)&0x7fffffff;return x/0x7fffffff};for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function seg(name,opts,val){return `<div class="seg" data-k="${name}">${opts.map(([v,t])=>`<button type="button" data-v="${esc(v)}" class="${String(val)===String(v)?'on':''}">${esc(t)}</button>`).join('')}</div>`}
const parN=()=>ESQ().parciales||2;
function librosEval(f){const c=curso(f.curso);if(f.alcance==='libro')return [+f.libro];if(f.alcance==='parcial')return [c.libros[(+f.par||1)-1]].filter(Boolean);return c.libros}
function pool(f){
 if(f.fuente==='alc'){const bs=librosEval(f);return BANK.alc.filter(it=>bs.includes(it.libro)&&(!f.lec||it.leccion==+f.lec||(f.lec&&it.leccion==null&&f.comp))&&(!f.sec||it.sec===f.sec)&&(!f.tipo||it.tipo===f.tipo))}
 return BANK.alcpt.filter(it=>{
  if(f.alcance==='forma'){if(it.forma!==f.forma)return false}
  else{const c=curso(f.curso),ss=semsDe(c);if(!ss.includes(it.sem))return false;
   if(f.alcance==='parcial'){const p=parN()===3?(it.par3||it.par):it.par;if(f.acum?p>+f.par:p!=+f.par)return false}}
  if(f.sec&&it.sec!==f.sec)return false;if(f.tipo&&it.tipo!==f.tipo)return false;return true})}
function armar(f){let p=pool(f);if(!p.length)return [];const n=Math.min(+f.n||p.length,p.length);
 const Lp=shuffle(p.filter(i=>i.sec==='L')),Rp=shuffle(p.filter(i=>i.sec==='R'));
 let nl=Math.round(n*Lp.length/p.length);if(f.fuente==='alcpt'&&!f.sec){nl=Math.min(Lp.length,Math.round(n/2));if(n-nl>Rp.length)nl=n-Rp.length}
 let sel=Lp.slice(0,nl).concat(Rp.slice(0,n-nl));
 if(f.alcance==='forma'&&(!+f.n||+f.n>=p.length))sel=p.slice().sort((a,b)=>a.sec===b.sec?a.id.localeCompare(b.id):a.sec==='L'?-1:1);
 return sel.sort((a,b)=>a.sec===b.sec?0:a.sec==='L'?-1:1)}
/* ---------- voz ---------- */
function vocesALC(){return (window.MB1AUD?MB1AUD.vocesEN():(speechSynthesis.getVoices()||[])).filter(v=>/^en/i.test(v.lang||''))}
function hablar(txt,fin){if(!('speechSynthesis'in window)){alert('Este navegador no tiene voz en inglés. Actívala en Ajustes › Texto a voz.');return}
 const VOCES=vocesALC(),vM=VOCES.find(v=>/male|david|alex|fred|daniel|guy/i.test(v.name)&&!/female/i.test(v.name))||VOCES[0],vW=VOCES.find(v=>/female|samantha|zira|victoria|jenny|aria|karen/i.test(v.name))||VOCES[1]||VOCES[0];
 const lines=String(txt).replace(/_{2,}/g,' blank ').split('\n').filter(x=>x.trim()).map(l=>{let t=l,v=window.MB1AUD?MB1AUD.vozElegida():VOCES[0];const m=l.match(/^\s*([MW]):\s*(.*)$/);if(m){t=m[2];v=m[1]==='M'?vM:vW}return{t,voice:v}});
 if(window.MB1AUD){if(AUD){try{AUD.pause()}catch(e){}}MB1AUD.speak('',{rate:MB1AUD.rateGuardada(.9),onEnd:fin,lines});return}
 speechSynthesis.cancel();lines.forEach((ln,i)=>{const u=new SpeechSynthesisUtterance(ln.t);u.lang='en-US';u.rate=+(localStorage.getItem('mb1_rate')||localStorage.getItem('mb1_alc_rate')||.9);if(ln.voice)u.voice=ln.voice;if(i===lines.length-1&&fin)u.onend=fin;speechSynthesis.speak(u)})}
/* ---------- inicio ---------- */
function tablaCursos(){const E=ESQ();return `<div class="tw"><table><tr><th>Curso</th><th>Libros ALC</th>${parN()===3?'<th>P1</th><th>P2</th><th>P3</th>':'<th>Parcial 1</th><th>Parcial 2</th>'}<th>Puntaje de referencia</th></tr>${cursos().map(c=>`<tr><td>${esc(c.nombre)}${c.nota==='inferido'?' <span class="mini">(inferido)</span>':''}</td><td>${c.libros.join(', ')}</td>${Array.from({length:parN()},(_,i)=>`<td>Book ${c.libros[i]??'—'}</td>`).join('')}<td>${esc(c.ref||'—')}</td></tr>`).join('')}</table></div><p class="mini">${esc(E.fuente||'')}</p>`}
function selEsq(){const es=BANK.esquemas||{};if(Object.keys(es).length<2)return `<p class="mini">${esc((es[esqId()]||{}).nombre||'')}</p>`;return `<label class="f">Esquema de la materia</label><select id="esq">${Object.entries(es).map(([k,e])=>`<option value="${k}" ${k===esqId()?'selected':''}>${esc(e.nombre)}</option>`).join('')}</select>`}
function bindEsq(fn){const s=$('#esq');if(s)s.onchange=()=>{SS('mb1_alc_esq',s.value);F={};fn()}}
/* v2.16: ALC usa solo reactivos ALC (nunca ALCPT) */
const nAlc=()=>BANK&&Array.isArray(BANK.alc)?BANK.alc.filter(i=>i&&Array.isArray(i.o)&&i.k!=null).length:0;
function armarLibre(n,sec,mezcla){let p=(BANK.alc||[]).filter(i=>i&&Array.isArray(i.o)&&i.k!=null);p=p.filter(it=>!sec||it.sec===sec);if(!p.length)return[];const Lp=shuffle(p.filter(i=>i.sec==='L')),Rp=shuffle(p.filter(i=>i.sec==='R'));n=Math.min(+n||p.length,p.length);let nl=sec==='L'?n:sec==='R'?0:Math.min(Lp.length,Math.round(n/2));if(n-nl>Rp.length)nl=n-Rp.length;return Lp.slice(0,nl).concat(Rp.slice(0,n-nl))}
function iniciarLibre(modo){if(!BANK||!nAlc()){toast('Aún no hay reactivos ALC en este dispositivo.');return}const sec=($('#sec')&&$('#sec').value)||'';const n=modo==='practica'?(+($('#n')&&$('#n').value)||20):100;const its=armarLibre(n,sec,modo==='practica');if(!its.length){toast('No hay reactivos ALC con ese filtro.');return}const nom=(($('#nom')&&$('#nom').value.trim())||nomDef());if($('#nom'))localStorage.setItem('mb1_alc_nom',nom);EX={fuente:'alcpt',c:{alcance:'libre'},modo:modo==='practica'?'practica':'simulacro',nom,its,i:0,r:its.map(()=>null),plays:its.map(()=>0),ini:Date.now()};go('examen')}
function vInicio(){if(!BANK||!nAlc()){V.innerHTML=sinAlc();bindImp();return}
 const mm=matDef(),r=RES().filter(x=>ADM()||!mm||x.m===mm).slice(-5).reverse();
 V.innerHTML=`<div class="card"><h1>Práctica ALC</h1><p class="muted">Practica o presenta un simulacro. Es práctica: no es un resultado que cuente.</p>
 <div class="row"><a class="btn big" href="#practica">Práctica</a><a class="btn big" href="#simulacro">Simulacro</a></div></div>
 <div class="card" id="audio-cfg"><h2>Audio</h2><p class="muted">Si el reactivo tiene grabación, se usa esa (la voz no se puede cambiar). Si se lee con la voz del dispositivo, elige la voz aquí. Hay una pausa breve al inicio para oír completa la pregunta. En simulacro cada audio se escucha hasta 2 veces (la pausa no cuenta como una reproducción).</p>
 <label class="f">Voz en inglés</label><select id="vozsel">${window.MB1AUD?MB1AUD.opcionesVoz():'<option value="">Voz del dispositivo</option>'}</select>
 <label class="f">Velocidad</label><select id="ratesel">${[[.8,'Lenta'],[.9,'Normal'],[1,'Rápida']].map(([v,l])=>`<option value="${v}" ${window.MB1AUD&&MB1AUD.rateGuardada(.9)===v?'selected':''}>${l}</option>`).join('')}</select>
 <button class="btn ghost" type="button" id="probarvoz">Probar voz</button></div>
 <div class="card"><h2>Últimos resultados</h2>${r.length?tablaRes(r):'<p class="muted">Aún no hay resultados en este dispositivo.</p>'}</div>${ADM()?'':'<div data-pubcad></div>'}`;if(window.MB1AUD)MB1AUD.bindAudioUI(V)}
function vPractica(){if(!BANK||!nAlc()){V.innerHTML=sinAlc();bindImp();return}
 V.innerHTML=`<div class="card"><h1>Práctica</h1><p class="muted">Respondes y ves de inmediato si acertaste.</p>
 <div class="row"><div><label class="f">Sección</label><select id="sec"><option value="">Ambas</option><option value="L">Comprensión auditiva</option><option value="R">Lectura y estructura</option></select></div>
 <div><label class="f">Número de preguntas</label><input type="number" id="n" min="5" max="50" value="20"></div></div>
 <label class="f">Nombre (opcional, para tu registro)</label><input type="text" id="nom" value="${esc(nomDef())}">
 <button class="btn big" id="go">Comenzar práctica</button></div>`;
 $('#go').onclick=()=>iniciarLibre('practica')}
function vSimulacro(){if(!BANK||!nAlc()){V.innerHTML=sinAlc();bindImp();return}
 V.innerHTML=`<div class="card"><h1>Simulacro</h1><p class="muted">Preguntas de comprensión auditiva y de lectura, con revisión al final. Es práctica: no es un resultado que cuente.</p>
 <label class="f">Sección</label><select id="sec"><option value="">Completo</option><option value="L">Solo comprensión auditiva</option><option value="R">Solo lectura y estructura</option></select>
 <label class="f">Nombre (opcional, para tu registro)</label><input type="text" id="nom" value="${esc(nomDef())}">
 <button class="btn big" id="go">Iniciar simulacro</button></div>`;
 $('#go').onclick=()=>iniciarLibre('simulacro')}
/* ---------- v2.16 · sección ALCPT ----------
   Banco de la app: reactivos ORIGINALES con la estructura del ALCPT (bank.js, bank2.js, bank3.js; públicos, no oficiales).
   Material de la Mesa: si Administración lo cargó en este dispositivo (IndexedDB «mb1_alc»), también se usan sus reactivos ALCPT. Nada privado vive en el código. */
const TEMAS_PT={lir:'Listening: respuestas',lic:'Listening: comprensión',tie:'Gramática: tiempos verbales',est:'Gramática: estructura',voc:'Vocabulario',lec:'Lectura'};
let PUB=null;
function pubALCPT(){if(PUB)return PUB;let B=[];try{B=(typeof BANCO!=='undefined'&&Array.isArray(BANCO))?BANCO:[]}catch(e){B=[]}
 const ak=t=>{try{return typeof akey==='function'?akey(t):''}catch(e){return ''}};
 PUB=B.filter(b=>TEMAS_PT[b.t]&&b.o&&b.o.length>=2).map(b=>{const lis=b.t==='lir'||b.t==='lic';const ord=shuffle(b.o.map((o,j)=>j),(Math.abs(hashS(b.id))%2147483646)+1);
  const k=lis?ak(b.au):'';return {id:'APP-'+b.id,sec:lis?'L':'R',tema:b.t,tipo:TEMAS_PT[b.t],s:lis?b.au:'',q:b.t==='lir'?'Choose the best response.':(b.q||''),pas:b.pas||'',o:ord.map(j=>b.o[j]),k:ord.indexOf(0),e:!lis&&String(b.q).includes('___')?'Oración completa: '+String(b.q).replace('___',b.o[0]):'',mp3:lis&&k&&window.AUDIOS&&window.AUDIOS[k]?'audio/'+k+'.mp3':'',origen:'app'}});return PUB}
function hashS(s){let h=0;s=String(s);for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return h}
const temaDev=it=>{if(TEMAS_PT[it.tema])return it.tema;const t=String(it.tipo||'');if(it.sec==='L')return /escucha|enunciado|pregunta|di[aá]logo/i.test(t)?'lic':'lic';if(/vocab/i.test(t))return 'voc';if(/gram/i.test(t))return 'est';if(/lect|aviso|noticia/i.test(t))return 'lec';return 'est'};
function devALCPT(){return (BANK&&Array.isArray(BANK.alcpt)?BANK.alcpt:[]).filter(i=>i&&Array.isArray(i.o)&&i.k!=null).map(i=>Object.assign({},i,{tema:temaDev(i),origen:'dev'}))}
function poolPT(fu,tema,sec){let p=fu==='dev'?devALCPT():fu==='app'?pubALCPT():pubALCPT().concat(devALCPT());if(tema)p=p.filter(i=>tema==='lis'?i.sec==='L':tema==='gra'?(i.tema==='tie'||i.tema==='est'):i.tema===tema);if(sec)p=p.filter(i=>i.sec===sec);return p}
function armarPT(n,fu,tema,sec,simul){const p=poolPT(fu,tema,sec);if(!p.length)return [];const Lp=shuffle(p.filter(i=>i.sec==='L')),Rp=shuffle(p.filter(i=>i.sec==='R'));n=Math.min(+n||p.length,p.length);
 let nl=sec==='L'?n:sec==='R'?0:simul||!tema?Math.min(Lp.length,Math.round(n/2)):Math.round(n*Lp.length/p.length);if(n-nl>Rp.length)nl=n-Rp.length;return Lp.slice(0,nl).concat(Rp.slice(0,n-nl))}
const fuSel=()=>{const dev=!!(BANK&&BANK.alcpt&&BANK.alcpt.length);return `<label class="f">Banco</label><select id="fu"><option value="app">Banco de la app (${pubALCPT().length})</option>${dev?`<option value="dev">Material cargado en este dispositivo (${devALCPT().length})</option><option value="todo" selected>Ambos (${pubALCPT().length+devALCPT().length})</option>`:''}</select>`};
function iniciarPT(modo){const fu=($('#fu')&&$('#fu').value)||'app',tema=($('#tema')&&$('#tema').value)||'',sec=($('#sec')&&$('#sec').value)||'';
 const n=modo==='practica'?(+($('#n')&&$('#n').value)||20):(+($('#nsim')&&$('#nsim').value)||100);const its=armarPT(n,fu,modo==='practica'?tema:'',sec,modo!=='practica');
 if(!its.length){toast('No hay reactivos con esos filtros.');return}const nom=(($('#nom')&&$('#nom').value.trim())||nomDef());
 EX={fuente:'alcpt',c:{alcance:'libre',banco:fu},modo:modo==='practica'?'practica':'simulacro',nom,its,i:0,r:its.map(()=>null),plays:its.map(()=>0),ini:Date.now()};go('examen')}
function tocarMp3(src,txt){if(/^idb:/.test(src)){if(!window.IMPORTA){hablar(txt);return}IMPORTA.url(src).then(u=>{if(u)tocarMp3(u,txt);else if(txt)hablar(txt);else toast('No se encontró el audio en este dispositivo.')});return}try{if(AUD){AUD.pause()}}catch(e){}if(window.MB1AUD){MB1AUD.cancelar&&MB1AUD.cancelar();MB1AUD.playFile(src,{rate:MB1AUD.rateGuardada(.9)<.85?.72:1,onFail:()=>hablar(txt)}).then(el=>{AUD=el}).catch(()=>hablar(txt));return}AUD=new Audio(src);AUD.play().catch(()=>hablar(txt))}
function ptInicio(){const mm=matDef(),r=RES().filter(x=>ADM()||!mm||x.m===mm).slice(-5).reverse(),p=pubALCPT(),dv=devALCPT();
 V.innerHTML=`<div class="card"><h1>ALCPT</h1><p class="muted">Practica con el formato del ALCPT: Parte I, comprensión auditiva (respuestas y comprensión), y Parte II, lectura y estructura (gramática, vocabulario y lectura). Es práctica: no es un resultado oficial.</p>
 <div class="row"><a class="btn big" href="#practica">Práctica</a><a class="btn big" href="#simulacro">Simulacro</a></div>
 <p class="mini">Banco de la app: ${p.length} reactivos originales tipo ALCPT (${p.filter(i=>i.sec==='L').length} de comprensión auditiva y ${p.filter(i=>i.sec==='R').length} de lectura y estructura).${dv.length?` Material cargado en este dispositivo (Mesa o importado en Administración): ${dv.length} reactivos.`:''} No son reactivos oficiales del examen.</p></div>
 <div data-pubcad></div><div id="ptrec"></div><div class="card"><h2>También para el ALCPT</h2><p class="muted">Refuerza con las otras secciones de la app.</p><div class="row"><button class="btn ghost" type="button" data-tab="vocab">Flash cards de vocabulario</button><button class="btn ghost" type="button" data-tab="escucha">Listening Lab y Completa la palabra</button></div></div>
 <div class="card" id="audio-cfg"><h2>Audio</h2><p class="muted">Si el reactivo tiene grabación, se usa esa. Si se lee con la voz del dispositivo, elige la voz aquí. En simulacro cada audio se escucha hasta 2 veces.</p>
 <label class="f">Voz en inglés</label><select id="vozsel">${window.MB1AUD?MB1AUD.opcionesVoz():'<option value="">Voz del dispositivo</option>'}</select>
 <label class="f">Velocidad</label><select id="ratesel">${[[.8,'Lenta'],[.9,'Normal'],[1,'Rápida']].map(([v,l])=>`<option value="${v}" ${window.MB1AUD&&MB1AUD.rateGuardada(.9)===v?'selected':''}>${l}</option>`).join('')}</select>
 <button class="btn ghost" type="button" id="probarvoz">Probar voz</button></div>
 <div class="card"><h2>Últimos resultados ALCPT</h2>${r.length?tablaRes(r):'<p class="muted">Aún no hay resultados en este dispositivo.</p>'}</div>`;
 V.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{try{tab=b.dataset.tab;window.render&&window.render()}catch(e){}});if(window.IMPORTA)IMPORTA.recursosCadete(V.querySelector('#ptrec'));if(window.MB1AUD)MB1AUD.bindAudioUI(V)}
function ptPractica(){V.innerHTML=`<div class="card"><h1>Práctica ALCPT</h1><p class="muted">Respondes y ves de inmediato si acertaste. Elige una parte del examen o practica todo.</p>
 ${fuSel()}<div class="row"><div><label class="f">Parte</label><select id="tema"><option value="">Todo (mitad auditiva, mitad lectura)</option><option value="lis">Comprensión auditiva (todas)</option><option value="lir">Listening: respuestas</option><option value="lic">Listening: comprensión</option><option value="gra">Gramática</option><option value="voc">Vocabulario</option><option value="lec">Lectura</option></select></div>
 <div><label class="f">Número de preguntas</label><input type="number" id="n" min="5" max="50" value="20"></div></div>
 <label class="f">Nombre (opcional, para tu registro)</label><input type="text" id="nom" value="${esc(nomDef())}">
 <button class="btn big" id="go">Comenzar práctica</button></div>`;$('#go').onclick=()=>iniciarPT('practica')}
function ptSimulacro(){V.innerHTML=`<div class="card"><h1>Simulacro ALCPT</h1><p class="muted">Como el examen: Parte I, comprensión auditiva, y Parte II, lectura y estructura, con revisión al final. Cada audio se escucha hasta 2 veces. Es práctica: no es un resultado oficial.</p>
 ${fuSel()}<div class="row"><div><label class="f">Sección</label><select id="sec"><option value="">Completo (Parte I y Parte II)</option><option value="L">Solo comprensión auditiva</option><option value="R">Solo lectura y estructura</option></select></div>
 <div><label class="f">Preguntas</label><select id="nsim"><option value="100">100 (completo, ~70 min)</option><option value="50">50 (medio, ~35 min)</option><option value="20">20 (corto, ~15 min)</option></select></div></div>
 <label class="f">Nombre (opcional, para tu registro)</label><input type="text" id="nom" value="${esc(nomDef())}">
 <button class="btn big" id="go">Iniciar simulacro</button></div>`;$('#go').onclick=()=>iniciarPT('simulacro')}
/* ---------- selección ALC / ALCPT ---------- */
let F={};
function filtros(fuente){return F[fuente]||(F[fuente]={fuente,alcance:'parcial',curso:cursos()[0].id,par:'1',libro:'',lec:'',comp:true,forma:'A',sec:'',tipo:'',n:fuente==='alc'?'30':'50',modo:'examen',acum:false})}
function vSel(fuente){if(!BANK){V.innerHTML=sinBanco();bindImp();return}
 const f=filtros(fuente);if(!cursos().some(c=>c.id===f.curso))f.curso=cursos()[0].id;const c=curso(f.curso);
 const tipos=[...new Set((fuente==='alc'?BANK.alc:BANK.alcpt).map(i=>i.tipo))];
 const formas=[...new Set(BANK.alcpt.map(i=>i.forma))].sort();
 const alc=fuente==='alc'?[['parcial','Por parcial'],['semestral',esqId()==='superioridad'?'Anual (todos los libros)':'Semestral (ambos libros)'],['libro','Un libro']]:[['parcial','Por parcial'],['semestral',esqId()==='superioridad'?'Por año':'Semestral'],['forma','Por forma']];
 const cnt=pool(f).length;const allB=[...new Set(BANK.alc.map(i=>i.libro))].sort((a,b)=>a-b);
 const bs=fuente==='alc'?librosEval(f):[];
 V.innerHTML=`<div class="card"><h1>${fuente==='alc'?'ALC · Evaluación Parcial 1 y 2':'ALCPT'}</h1>${selEsq()}
 <label class="f">Evaluar</label>${seg('alcance',alc,f.alcance)}
 ${f.alcance==='forma'?`<label class="f">Forma</label>${seg('forma',formas.map(x=>[x,x==='V'?'V (vocabulario ALC 19–30)':x]),f.forma)}<p class="mini">Formas A–H: 100 reactivos (50 auditiva + 50 lectura). Para el examen final con formas y audios cargados usa la pestaña «Final ALCPT».</p>`:
 f.alcance==='libro'&&fuente==='alc'?`<label class="f">Libro</label><select id="libro">${allB.map(b=>`<option value="${b}" ${b==f.libro?'selected':''}>Book ${b}</option>`).join('')}</select>`:
 `<label class="f">Curso</label><select id="curso">${cursos().map(x=>`<option value="${x.id}" ${x.id===f.curso?'selected':''}>${esc(x.nombre)} · Books ${x.libros.join(', ')}</option>`).join('')}</select>
 ${f.alcance==='parcial'?`<label class="f">Parcial</label>${seg('par',Array.from({length:parN()},(_,i)=>[i+1,`Parcial ${i+1}`+(fuente==='alc'||true?` · Book ${c.libros[i]??'—'}`:'')]),f.par)}
 ${fuente==='alcpt'?`<label class="mini"><input type="checkbox" id="acum" ${f.acum?'checked':''}> Acumulativo (incluye los parciales anteriores)</label>`:''}`:''}`}
 ${fuente==='alc'&&bs.length===1?`<label class="f">Lección del Book ${bs[0]}</label>${seg('lec',[['','Todas'],['1','1'],['2','2'],['3','3'],['4','4']],f.lec)}${f.lec?`<label class="mini"><input type="checkbox" id="comp" ${f.comp?'checked':''}> Incluir reactivos complementarios del libro (sin lección asignada)</label>`:''}`:''}
 <div class="row"><div><label class="f">Sección</label><select id="sec"><option value="">Ambas</option><option value="L" ${f.sec==='L'?'selected':''}>Comprensión auditiva</option><option value="R" ${f.sec==='R'?'selected':''}>Lectura y estructura</option></select></div>
 <div><label class="f">Tipo</label><select id="tipo"><option value="">Todos</option>${tipos.map(t=>`<option ${f.tipo===t?'selected':''}>${esc(t)}</option>`).join('')}</select></div>
 <div><label class="f">Número de reactivos</label><input type="number" id="n" min="5" max="${cnt}" value="${esc(f.n)}"></div></div>
 <p class="muted">Disponibles con estos filtros: <b>${cnt}</b>.</p>
 <label class="f">Modo</label>${seg('modo',[['examen','Examen (calificación al final)'],['practica','Práctica (retroalimentación inmediata)']],f.modo)}
 <label class="f">Nombre del cadete (opcional, para el registro)</label><input type="text" id="nom" value="${esc(nomDef())}" placeholder="Ej. Cad. García Rodríguez">
 <button class="btn big" id="go" ${cnt?'':'disabled'}>Comenzar</button></div>
 ${fuente==='alc'&&bs.length?`<div class="card"><h2>Contenido</h2>${bs.map(b=>{const l=BANK.libros[b]||{};return `<p><span class="tag">Book ${b}</span> ${l.programa?l.programa.map(esc).join('<br>'):[1,2,3,4].map(i=>`L${i}: ${esc((l.lecciones||{})[i]||'')}`).join('<br>')}${l.tema?`<br><span class="mini">Complementarios: ${esc(l.tema)}</span>`:''}</p>`}).join('')}</div>`:''}`;
 bindEsq(()=>vSel(fuente));
 V.querySelectorAll('.seg').forEach(s=>s.onclick=e=>{const b=e.target.closest('button');if(!b)return;f[s.dataset.k]=b.dataset.v;if(s.dataset.k==='alcance'){if(b.dataset.v==='forma'){f.n='100'}else if(f.n==='100')f.n=fuente==='alc'?'30':'50';if(b.dataset.v==='libro'&&!f.libro)f.libro=String(curso(f.curso).libros[0])}if(s.dataset.k!=='lec'&&s.dataset.k!=='modo'&&s.dataset.k!=='par')f.lec=f.alcance==='libro'?f.lec:'';vSel(fuente)});
 const up=()=>{['curso','libro','sec','tipo','n'].forEach(k=>{const e=$('#'+k);if(e)f[k]=e.value});f.acum=$('#acum')?$('#acum').checked:false;f.comp=$('#comp')?$('#comp').checked:f.comp};
 ['#curso','#libro','#sec','#tipo','#acum','#comp'].forEach(s=>{const e=$(s);if(e)e.onchange=()=>{up();if(s==='#curso')f.lec='';vSel(fuente)}});
 $('#go').onclick=()=>{up();localStorage.setItem('mb1_alc_nom',$('#nom').value.trim());iniciar(fuente,f,$('#nom').value.trim())}}
const vALCPT=()=>vSel('alcpt');
function vALC(){const m=(VARG||'').match(/^p([12])$/);if(m&&BANK){const f=filtros('alc');f.alcance='parcial';f.par=m[1];VARG=''}vSel('alc')}
/* ---------- final: formas y audios que se cargan después ---------- */
/* Formato JSON: {"tipo":"formas_alcpt","formas":[{"id":"F1","titulo":"…","items":[{"n":1,"sec":"L","s":"guion opcional","q":"pregunta","o":["a","b","c","d"],"k":"B"}]}]}
   Formato CSV (encabezado): forma,titulo,n,seccion,guion,pregunta,a,b,c,d,clave   (seccion = L o R; clave = A–D) */
let FORMAS=[];
const fKey=(fid,n)=>'aud|'+fid+'|'+(n==null?'forma':n);
async function guardarFormas(){if(SOLO_LEC()||!ADM())return;await idbSet('formas',FORMAS)}
function normItem(it,j){const o=(it.o||[it.a,it.b,it.c,it.d]).map(x=>String(x??'').trim()).filter(x=>x!=='');let k=it.k;if(typeof k==='string')k=k.trim()?L.indexOf(k.trim().toUpperCase()[0]):null;if(!(k>=0&&k<o.length))k=null;
 const sec=/^(l|aud|list)/i.test(String(it.sec||it.seccion||''))?'L':'R';return {n:+it.n||j+1,sec,s:String(it.s||it.guion||'').replace(/\\n/g,'\n'),q:String(it.q||it.pregunta||''),o,k}}
function parseCSV(t){const rows=[];let r=[],c='',q=false;t=t.replace(/^\uFEFF/,'');const sep=(t.split('\n')[0].match(/;/g)||[]).length>(t.split('\n')[0].match(/,/g)||[]).length?';':',';
 for(let i=0;i<t.length;i++){const ch=t[i];if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++}else q=false}else c+=ch}else if(ch==='"')q=true;else if(ch===sep){r.push(c);c=''}else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&t[i+1]==='\n')i++;r.push(c);c='';if(r.some(x=>x.trim()))rows.push(r);r=[]}else c+=ch}
 r.push(c);if(r.some(x=>x.trim()))rows.push(r);return rows}
function formasDeCSV(t,nombre){const rows=parseCSV(t);if(rows.length<2)throw new Error('El CSV está vacío.');const h=rows[0].map(x=>x.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''));
 const ix=k=>h.indexOf(k);if(ix('pregunta')<0&&ix('a')<0)throw new Error('Faltan columnas. Usa: forma,titulo,n,seccion,guion,pregunta,a,b,c,d,clave');
 const by={};rows.slice(1).forEach(r=>{const g=k=>ix(k)>=0?(r[ix(k)]||'').trim():'';const id=g('forma')||nombre.replace(/\.[^.]+$/,'');(by[id]=by[id]||{id,titulo:g('titulo')||('Forma '+id),items:[]}).items.push({n:g('n'),sec:g('seccion'),s:g('guion'),q:g('pregunta'),a:g('a'),b:g('b'),c:g('c'),d:g('d'),k:g('clave')})});return Object.values(by)}
function agregarFormas(lst){let n=0;lst.forEach(f=>{const id=String(f.id||f.titulo||('F'+(FORMAS.length+1))).trim();const items=(f.items||[]).map(normItem).filter(i=>i.o.length>=2);if(!items.length)return;
 const nf={id,titulo:f.titulo||('Forma '+id),fuente:f.fuente||'',items,fecha:hoy()};const i=FORMAS.findIndex(x=>x.id===id);if(i>=0)FORMAS[i]=nf;else FORMAS.push(nf);n++});return n}
function importarForma(e){const fl=[...e.target.files];if(!fl.length)return;let tot=0,errs=[];
 Promise.all(fl.map(f=>f.text().then(t=>{try{if(/\.csv$/i.test(f.name)||!/^\s*[\[{]/.test(t)){tot+=agregarFormas(formasDeCSV(t,f.name))}else{const j=JSON.parse(t.replace(/^\uFEFF/,''));
   if(j.tipo==='formas_originales_alcpt')throw new Error('este archivo (formas recopiladas no confiables) no se carga en la app');
   tot+=agregarFormas(Array.isArray(j)?j:(j.formas||[j]))}}catch(x){errs.push(f.name+': '+x.message)}}))).then(async()=>{await guardarFormas();if(errs.length)alert(errs.join('\n'));if(tot)toast(`Formas cargadas: ${tot}`);vFinal()})}
async function adjuntarAudio(fid,n,file){if(!file)return;if(!/^audio\//.test(file.type)&&!/\.(mp3|m4a|aac|wav|ogg)$/i.test(file.name)){alert('Elige un archivo de audio (mp3 o m4a).');return}
 await idbSet(fKey(fid,n),{name:file.name,type:file.type||'audio/mpeg',blob:file});const f=FORMAS.find(x=>x.id===fid);if(f){f.aud=f.aud||{};f.aud[n==null?'forma':n]=file.name;await guardarFormas()}}
function nombreANum(nm){const m=nm.replace(/\.[^.]+$/,'').match(/(\d{1,3})(?!.*\d)/);return m?+m[1]:null}
async function audioURL(fid,n){const r=await idbGet(fKey(fid,n));return r?URL.createObjectURL(r.blob):null}
let FF={forma:'',parte:'',modo:'examen',tabla:''};
function vFinal(){vFinal0();if(!ADM())V.querySelectorAll('.adm').forEach(x=>x.remove())}
function vFinal0(){const conv=BANK&&BANK.conversion||{};
 if(!FORMAS.some(f=>f.id===FF.forma))FF.forma=(FORMAS[0]||{}).id||'';const fm=FORMAS.find(f=>f.id===FF.forma);
 const sel=fm?fm.items.filter(i=>!FF.parte||i.sec===FF.parte):[];const conK=sel.filter(i=>i.k!=null).length;const aud=fm&&fm.aud||{};
 const esPDF=fm&&fm.tipo==='pdf',conKF=fm?fm.items.filter(i=>i.k!=null).length:0,hp=fm?HOJAS().filter(h=>h.fid===fm.id):[];
 const nL=sel.filter(i=>i.sec==='L').length,conA=sel.filter(i=>i.sec==='L'&&aud[i.n]).length;
 V.innerHTML=`<div class="card"><h1>Examen final ALCPT</h1><p class="muted">Agrega aquí las formas originales del ALCPT (PDF) y sus audios (MP3) para el examen final o el extraordinario. La clave es opcional. Todo se guarda <b>solo en este dispositivo</b>; nada se publica.</p>
 <div class="adm"><h2>Agregar forma original (PDF)</h2><p class="mini">El PDF de la forma se guarda en este dispositivo y se ve dentro de la app. Después adjunta el audio MP3 y, si la tienes, captura la clave.</p>
 <div class="row"><div><label class="f">Nombre de la forma</label><input type="text" id="ptit" placeholder="p. ej. ALCPT Forma 125"></div><div><label class="f">Reactivos</label><input type="number" id="pn" value="100" min="1" max="300"></div><div><label class="f">De ellos, comprensión auditiva</label><input type="number" id="pnl" value="50" min="0" max="300"></div></div>
 <label class="btn">Elegir PDF de la forma<input type="file" id="ppdf" accept="application/pdf,.pdf" hidden></label><span class="mini" id="ppdfn"></span> <button class="btn" id="pgua">Guardar forma PDF</button>
 <h2>O cargar forma como datos (opcional)</h2><label class="btn ghost">Cargar forma (JSON o CSV)<input type="file" id="impf" accept=".json,.csv,application/json,text/csv" multiple hidden></label><button class="btn ghost" id="plant">Descargar plantilla CSV</button>
 <p class="mini">CSV: <code>forma,titulo,n,seccion,guion,pregunta,a,b,c,d,clave</code> · sección L (auditiva) o R (lectura) · clave A–D. Un archivo puede traer varias formas.</p></div>
 ${FORMAS.length?`<div class="tw"><table><tr><th>Forma</th><th>Tipo</th><th>Reactivos</th><th>Auditiva / Lectura</th><th>Con clave</th><th>Audios</th></tr>${FORMAS.map(f=>{const a=f.aud||{};const L1=f.items.filter(i=>i.sec==='L');return `<tr><td>${esc(f.titulo)}</td><td>${f.tipo==='pdf'?'PDF':'datos'}</td><td>${f.items.length}</td><td>${L1.length} / ${f.items.length-L1.length}</td><td>${f.items.filter(i=>i.k!=null).length}</td><td>${a.forma?'pista completa':''}${a.forma&&Object.keys(a).length>1?' + ':''}${Object.keys(a).filter(x=>x!=='forma').length?Object.keys(a).filter(x=>x!=='forma').length+' por reactivo':''}${!Object.keys(a).length?'—':''}</td></tr>`}).join('')}</table></div>`:'<p class="muted">Aún no hay formas cargadas.</p>'}</div>
 ${fm?`<div class="card"><h2>Aplicar</h2><label class="f">Forma</label><select id="forma">${FORMAS.map(f=>`<option value="${esc(f.id)}" ${f.id===FF.forma?'selected':''}>${esc(f.titulo)}</option>`).join('')}</select>
 <label class="f">Parte</label>${seg('parte',[['','Completa'],['L','Solo comprensión auditiva'],['R','Solo lectura']],FF.parte)}
 <p class="muted">${sel.length} reactivos · <b>${conK}</b> con clave${sel.length-conK?` · <span class="badt">${sel.length-conK} sin clave (no cuentan)</span>`:''}${nL?` · auditiva: ${conA} con audio propio${aud.forma?', pista completa cargada':''}`:''}.</p>
 <label class="f">Tabla de conversión a calificación</label><select id="tabla"><option value="">Porcentaje (aciertos ÷ reactivos con clave × 10)</option>${Object.entries(conv).map(([k,t])=>`<option value="${k}" ${FF.tabla===k?'selected':''}>${esc(t.nombre)} · mínimo ${t.t[t.t.length-1][0]} pts</option>`).join('')}</select>
 <label class="f">Modo</label>${seg('modo',[['examen','Examen final / extraordinario'],['practica','Práctica']],FF.modo)}
 <label class="f">Nombre del cadete (opcional)</label><input type="text" id="nom" value="${esc(nomDef())}">
 ${esPDF?`<button class="btn big" id="go">Comenzar con hoja de respuestas</button>${conK?'':'<p class="mini">Sin clave: las hojas se guardan pendientes y se califican al capturar la clave.</p>'}`:`<button class="btn big" id="go" ${conK?'':'disabled'}>Comenzar</button>${conK?'':'<p class="badt">La forma no tiene clave: vuelve a cargarla con la columna «clave».</p>'}`}</div>
 ${esPDF?`<div class="card adm"><h2>PDF de la forma</h2><p class="mini">${esc(fm.pdf||'')} · ${fm.items.length} reactivos (${fm.nL||0} auditiva)</p><button class="btn ghost" id="verpdf">Ver PDF</button><label class="btn ghost">Reemplazar PDF<input type="file" id="reppdf" accept="application/pdf,.pdf" hidden></label><div id="pdfbox"></div></div>
 <div class="card adm"><h2>Clave (opcional)</h2><p class="mini">Escribe las letras en orden (<code>ABDC CABD…</code>; usa <code>-</code> si falta alguna) o con número (<code>1 A, 2 C…</code>). También puedes cargar un CSV con columnas <code>n,clave</code>.</p><textarea id="clv" rows="4" spellcheck="false" style="width:100%;font:1rem monospace">${conKF?claveTxt(fm):''}</textarea><div><button class="btn" id="gclv">Guardar clave</button><label class="btn ghost">Clave desde CSV<input type="file" id="clvcsv" accept=".csv,text/csv,.txt" hidden></label>${conKF?'<button class="btn ghost" id="bclv">Borrar clave</button>':''}</div><p class="mini">${conKF}/${fm.items.length} reactivos con clave.</p></div>`:''}
 ${hp.length?`<div class="card adm"><h2>Hojas pendientes de calificar</h2><p class="mini">Se califican con la tabla de conversión elegida arriba.</p><div class="tw"><table><tr><th>Fecha</th><th>Cadete</th><th>Contestados</th><th></th></tr>${hp.map(h=>`<tr><td>${fechaL(h.fecha)}</td><td>${esc(h.nom||'—')}</td><td>${h.r.filter(x=>x!==null).length}/${h.r.length}</td><td><button class="btn sm" data-h="${h.id}" ${conKF?'':'disabled'}>Calificar</button><button class="btn sm ghost" data-hq="${h.id}">Quitar</button></td></tr>`).join('')}</table></div></div>`:''}
 <div class="card adm"><h2>Audios de la forma</h2><p class="muted">MP3 (o m4a). Puedes cargar una <b>pista completa</b> de la parte auditiva y/o un audio <b>por reactivo</b>. Si eliges varios archivos a la vez, se asignan por el último número del nombre (p. ej. <i>item_07.mp3</i> → reactivo 7). En examen cada audio por reactivo se escucha hasta 2 veces.</p>
 <label class="btn">Pista completa${aud.forma?' (reemplazar)':''}<input type="file" id="audf" accept="audio/*,.mp3,.m4a" hidden></label><label class="btn ghost">Audios por reactivo<input type="file" id="audn" accept="audio/*,.mp3,.m4a" multiple hidden></label>${aud.forma?`<audio controls preload="none" id="pf" style="width:100%;margin-top:6px"></audio>`:''}
 <div class="tw"><table><tr><th>Reactivo</th><th>Pregunta</th><th>Audio</th><th></th></tr>${fm.items.filter(i=>i.sec==='L').map(i=>`<tr><td>${i.n}</td><td>${esc((i.q||i.s||(esPDF?'(en el PDF)':'')).slice(0,60))}</td><td>${aud[i.n]?esc(aud[i.n]):(i.s?'voz (guion)':'—')}</td><td><label class="btn sm ghost">${aud[i.n]?'Cambiar':'Adjuntar'}<input type="file" class="audi" data-n="${i.n}" accept="audio/*,.mp3,.m4a" hidden></label>${aud[i.n]?`<button class="btn sm ghost qa" data-n="${i.n}">Quitar</button>`:''}</td></tr>`).join('')||'<tr><td colspan="4">La forma no tiene reactivos de auditiva.</td></tr>'}</table></div></div>
 <div class="card noprint adm">${esPDF?'':'<button class="btn ghost" id="imprimir">Imprimir cuadernillo y clave</button>'}<button class="btn peligro" id="qf">Quitar esta forma${esPDF?', su PDF':''} y sus audios</button></div>`:''}`;
 $('#impf').onchange=importarForma;$('#ppdf').onchange=e=>{$('#ppdfn').textContent=(e.target.files[0]||{}).name||''};$('#pgua').onclick=guardarFormaPDF;
 $('#plant').onclick=()=>{const csv='\uFEFFforma,titulo,n,seccion,guion,pregunta,a,b,c,d,clave\r\nF1,Forma de ejemplo,1,L,"M: Where is the clinic?\\nW: Next to the main gate.",Where is the clinic?,Behind the gym,Next to the main gate,In the barracks,At the airport,B\r\nF1,Forma de ejemplo,2,R,,She ___ a nurse.,is,are,am,be,A\r\n';const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));l.download='plantilla_forma_alcpt.csv';l.click()};
 if(!fm)return;
 $('#forma').onchange=e=>{FF.forma=e.target.value;vFinal()};$('#tabla').onchange=e=>{FF.tabla=e.target.value};
 V.querySelectorAll('.seg').forEach(s=>s.onclick=e=>{const b=e.target.closest('button');if(!b)return;FF[s.dataset.k]=b.dataset.v;vFinal()});
 if(aud.forma)audioURL(fm.id,null).then(u=>{const p=$('#pf');if(p&&u)p.src=u});
 $('#audf').onchange=async e=>{await adjuntarAudio(fm.id,null,e.target.files[0]);toast('Pista completa guardada');vFinal()};
 $('#audn').onchange=async e=>{const fl=[...e.target.files];const nums=fm.items.filter(i=>i.sec==='L').map(i=>i.n);let ok=0,no=[];for(const f of fl){const n=nombreANum(f.name);if(n!=null&&nums.includes(n)){await adjuntarAudio(fm.id,n,f);ok++}else no.push(f.name)}toast(`Audios asignados: ${ok}`);if(no.length)alert('Sin reactivo de auditiva que coincida:\n'+no.join('\n'));vFinal()};
 V.querySelectorAll('input.audi').forEach(i=>i.onchange=async e=>{await adjuntarAudio(fm.id,+i.dataset.n,e.target.files[0]);toast('Audio guardado');vFinal()});
 V.querySelectorAll('.qa').forEach(b=>b.onclick=async()=>{await idbDel(fKey(fm.id,+b.dataset.n));delete fm.aud[b.dataset.n];await guardarFormas();vFinal()});
 if($('#imprimir'))$('#imprimir').onclick=()=>imprimirForma(fm);
 if(esPDF){$('#verpdf').onclick=()=>verPDF(fm.id,$('#pdfbox'));
  $('#reppdf').onchange=async e=>{const f=e.target.files[0];if(!f)return;await idbSet(pKey(fm.id),{name:f.name,type:'application/pdf',blob:f});fm.pdf=f.name;await guardarFormas();toast('PDF reemplazado');vFinal()};
  const setK=async k=>{fm.items.forEach((i,j)=>i.k=k[j]);await guardarFormas();toast(`Clave guardada: ${k.filter(x=>x!=null).length} reactivos`);vFinal()};
  $('#gclv').onclick=()=>{const k=parseClave($('#clv').value,fm.items.length);if(!k.some(x=>x!=null)){alert('No se reconoció ninguna letra A–D.');return}setK(k)};
  $('#clvcsv').onchange=async e=>{const f=e.target.files[0];if(!f)return;const rows=parseCSV(await f.text());const k=Array(fm.items.length).fill(null);rows.forEach(r=>{const n=parseInt(r[0]),c=String(r[r.length-1]||'').trim().toUpperCase()[0];if(n>=1&&n<=k.length&&L.includes(c||'#'))k[n-1]=L.indexOf(c)});if(!k.some(x=>x!=null)){alert('El CSV no trae columnas n,clave reconocibles.');return}setK(k)};
  if($('#bclv'))$('#bclv').onclick=()=>{if(confirm('¿Borrar la clave de esta forma?'))setK(Array(fm.items.length).fill(null))}}
 V.querySelectorAll('[data-h]').forEach(b=>b.onclick=()=>calificarHoja(HOJAS().find(h=>h.id===b.dataset.h)));
 V.querySelectorAll('[data-hq]').forEach(b=>b.onclick=()=>{if(confirm('¿Quitar esta hoja pendiente?')){setHOJAS(HOJAS().filter(h=>h.id!==b.dataset.hq));vFinal()}});
 $('#qf').onclick=async()=>{if(!confirm('¿Quitar esta forma y sus audios de este dispositivo?'))return;for(const k of Object.keys(fm.aud||{}))await idbDel(fKey(fm.id,k==='forma'?null:k));if(fm.tipo==='pdf')await idbDel(pKey(fm.id));FORMAS=FORMAS.filter(f=>f!==fm);await guardarFormas();vFinal()};
 $('#go').onclick=()=>{localStorage.setItem('mb1_alc_nom',$('#nom').value.trim());
  if(esPDF){iniciarHoja(fm,$('#nom').value.trim());return}
  const its=sel.map(i=>Object.assign({},i,{id:'F'+fm.id+'-'+i.n,tipo:i.sec==='L'?'Comprensión auditiva':'Lectura y estructura',e:'',aud:!!aud[i.n]}));
  EX={fuente:'final',c:{forma:fm.id,fid:fm.id,titulo:fm.titulo,parte:FF.parte,tabla:FF.tabla,pista:!!aud.forma},modo:FF.modo,nom:$('#nom').value.trim(),its,i:0,r:its.map(()=>null),plays:its.map(()=>0),ini:Date.now()};go('examen')}}
function imprimirForma(fm){const its=fm.items;const w=window.open('','_blank');if(!w){alert('Permite ventanas emergentes para imprimir.');return}
 w.document.write(`<html><head><meta charset="utf-8"><title>${esc(fm.titulo)}</title><style>body{font-family:'Noto Sans',sans-serif;font-size:12px;margin:18mm}h1{font-size:16px}h2{font-size:14px}.it{break-inside:avoid;margin:0 0 8px}.k{columns:5}</style></head><body><h1>${esc(fm.titulo)}</h1><p>Uso interno · confidencial</p>${['L','R'].filter(s=>its.some(i=>i.sec===s)).map(s=>`<h2>${s==='L'?'Parte I · Comprensión auditiva':'Parte II · Lectura y estructura'}</h2>`+its.filter(i=>i.sec===s).map(i=>`<div class="it"><b>${i.n}.</b> ${esc(i.q)}<br>${i.o.map((o,j)=>`${'abcd'[j]}) ${esc(o)}`).join('<br>')}</div>`).join('')).join('')}<div style="page-break-before:always"></div><h1>Clave · ${esc(fm.titulo)}</h1><div class="k">${its.map(i=>`<div>${i.n}. ${i.k!=null?L[i.k]:'—'}</div>`).join('')}</div>${its.some(i=>i.s)?`<div style="page-break-before:always"></div><h1>Guiones de auditiva</h1>${its.filter(i=>i.s).map(i=>`<div class="it"><b>${i.n}.</b> ${esc(i.s).replace(/\n/g,'<br>')}</div>`).join('')}`:''}</body></html>`);w.document.close();w.print()}
/* ---------- formas originales en PDF + audio MP3 (v2.4) ---------- */
const pKey=fid=>'pdf|'+fid;
const HOJAS=()=>LS('mb1_alc_hojas',[]),setHOJAS=a=>SS('mb1_alc_hojas',a);
function itemsPDF(n,nL,clave){return Array.from({length:n},(_,j)=>({n:j+1,sec:j<nL?'L':'R',s:'',q:'',o:['','','',''],k:clave&&clave[j]!=null?clave[j]:null}))}
/* clave en texto: "ABCD…" o "1 A, 2 B …" o una letra por renglón */
function parseClave(t,n){t=String(t||'').toUpperCase();const k=Array(n).fill(null);
 if(/\d/.test(t)){const re=/(\d{1,3})\s*[\.\)\-:=]?\s*([A-D])/g;let m;while((m=re.exec(t))){const i=+m[1]-1;if(i>=0&&i<n)k[i]=L.indexOf(m[2])}}
 else{const ls=t.replace(/[^A-D\-_?]/g,'');[...ls].slice(0,n).forEach((c,i)=>{k[i]=c in{A:1,B:1,C:1,D:1}?L.indexOf(c):null})}return k}
const claveTxt=fm=>fm.items.map(i=>i.k==null?'-':L[i.k]).join('').replace(/(.{10})/g,'$1 ').trim();
async function guardarFormaPDF(){const t=$('#ptit').value.trim(),n=Math.max(1,Math.min(300,+$('#pn').value||100)),nL=Math.max(0,Math.min(n,+$('#pnl').value||0)),f=$('#ppdf').files[0];
 if(!f){alert('Elige el PDF de la forma.');return}if(!/pdf/i.test(f.type)&&!/\.pdf$/i.test(f.name)){alert('El archivo debe ser PDF.');return}
 const id=(t||f.name.replace(/\.[^.]+$/,'')).replace(/[|]/g,'-').slice(0,60);const prev=FORMAS.find(x=>x.id===id);
 if(prev&&!confirm(`Ya existe la forma «${id}». ¿Reemplazar su PDF y número de reactivos? (los audios se conservan)`))return;
 try{await idbSet(pKey(id),{name:f.name,type:'application/pdf',blob:f})}catch(x){alert('No se pudo guardar el PDF en el dispositivo: '+x.message);return}
 const clave=prev?prev.items.map(i=>i.k):null;const nf={id,titulo:t||('Forma '+id),tipo:'pdf',pdf:f.name,nL,items:itemsPDF(n,nL,clave),aud:prev?prev.aud:{},fecha:hoy()};
 if(prev)FORMAS[FORMAS.indexOf(prev)]=nf;else FORMAS.push(nf);await guardarFormas();if(navigator.storage&&navigator.storage.persist)navigator.storage.persist().catch(()=>{});FF.forma=id;toast('Forma PDF guardada');vFinal()}
/* visor PDF dentro de la app (pdf.js local; si falla, visor del navegador) */
let PDFJS=null;
async function pdfjs(){if(PDFJS)return PDFJS;const m=await import('./pdfjs/pdf.min.mjs');m.GlobalWorkerOptions.workerSrc=new URL('pdfjs/pdf.worker.min.mjs',location.href).href;return PDFJS=m}
async function verPDF(fid,box){box.innerHTML='<p class="muted">Abriendo PDF…</p>';const r=await idbGet(pKey(fid));if(!r){box.innerHTML='<p class="badt">No hay PDF guardado para esta forma.</p>';return}
 let z=+(localStorage.getItem('mb1_alc_pdfz')||1);
 box.innerHTML=`<div class="pdfbar"><button type="button" class="btn sm ghost" data-z="-">−</button><span class="mini pz">${Math.round(z*100)}%</span><button type="button" class="btn sm ghost" data-z="+">+</button><span class="mini pp"></span><a class="btn sm ghost" target="_blank" id="pdfab">Abrir aparte</a></div><div class="pdfv"></div>`;
 const u=URL.createObjectURL(r.blob);box.querySelector('#pdfab').href=u;const v=box.querySelector('.pdfv');
 try{const P=await pdfjs();const doc=await P.getDocument({data:new Uint8Array(await r.blob.arrayBuffer()),standardFontDataUrl:new URL('pdfjs/standard_fonts/',location.href).href}).promise;
  const draw=async()=>{v.innerHTML='';box.querySelector('.pz').textContent=Math.round(z*100)+'%';box.querySelector('.pp').textContent=` · ${doc.numPages} pág.`;const W=Math.max(280,v.clientWidth-4);
   for(let p=1;p<=doc.numPages;p++){const pg=await doc.getPage(p);const vp0=pg.getViewport({scale:1});const sc=W/vp0.width*z,dpr=Math.min(2,window.devicePixelRatio||1);const vp=pg.getViewport({scale:sc*dpr});
    const c=document.createElement('canvas');c.width=vp.width;c.height=vp.height;c.style.width=(vp.width/dpr)+'px';c.dataset.p=p;v.appendChild(c);await pg.render({canvasContext:c.getContext('2d'),viewport:vp}).promise;if(!document.body.contains(v))return}};
  box.querySelectorAll('[data-z]').forEach(b=>b.onclick=()=>{z=Math.max(.5,Math.min(3,z+(b.dataset.z==='+'?.25:-.25)));localStorage.setItem('mb1_alc_pdfz',z);draw()});await draw();box.dataset.ok='1'}
 catch(x){console.warn(x);v.innerHTML=`<iframe src="${u}" title="PDF" style="width:100%;height:70vh;border:0"></iframe><p class="mini">Visor del navegador (pdf.js no disponible: ${esc(x.message)}).</p>`}}
/* hoja de respuestas */
function iniciarHoja(fm,nom){const its=fm.items.filter(i=>!FF.parte||i.sec===FF.parte).map(i=>Object.assign({},i,{id:'F'+fm.id+'-'+i.n,tipo:i.sec==='L'?'Comprensión auditiva':'Lectura y estructura',e:'',q:`Reactivo ${i.n} (ver PDF)`}));
 EX={fuente:'final',hoja:true,c:{forma:fm.id,fid:fm.id,titulo:fm.titulo,parte:FF.parte,tabla:FF.tabla,pista:!!(fm.aud||{}).forma,pdf:true},modo:FF.modo,nom,its,i:0,r:its.map(()=>null),plays:its.map(()=>0),ini:Date.now()};go('examen')}
function vHoja(){const e=EX,fm=FORMAS.find(f=>f.id===e.c.fid)||{aud:{}},aud=fm.aud||{},prac=e.modo==='practica';const nr=e.r.filter(x=>x!==null).length;
 V.innerHTML=`<div class="card"><div class="hud"><span>${titulo(e)}</span><span id="cnt">${nr}/${e.its.length} contestados</span></div>${e.nom?`<p class="mini">${esc(e.nom)}</p>`:''}
 ${aud.forma?`<h3>Audio de la forma</h3><audio controls preload="auto" id="pista" style="width:100%"></audio>`:''}
 <details class="pdfd" open><summary><b>Forma (PDF)</b></summary><div id="pdfbox"></div></details></div>
 <div class="card"><h2>Hoja de respuestas</h2><p class="mini">Toca la letra de cada reactivo. ${prac?'En práctica ves si acertaste al momento.':'Al terminar, entrega la hoja.'}</p><div class="hoja">${e.its.map((it,j)=>`${j===0||e.its[j-1].sec!==it.sec?`<div class="hsec">${it.sec==='L'?'Parte I · Comprensión auditiva':'Parte II · Lectura y estructura'}</div>`:''}<div class="hr" data-j="${j}"><b>${it.n}</b>${L.split('').map((c,x)=>`<button type="button" data-x="${x}" class="${e.r[j]===x?'sel':''}${prac&&e.r[j]!==null&&it.k!=null?(x===it.k?' ok':(e.r[j]===x?' no':'')):''}">${c}</button>`).join('')}${it.sec==='L'&&aud[it.n]?`<button type="button" class="pa" data-n="${it.n}" title="Audio">▶</button>`:''}</div>`).join('')}</div>
 <button class="btn big" id="ent">Entregar hoja</button></div>`;
 if(aud.forma)audioURL(e.c.fid,null).then(u=>{const p=$('#pista');if(p&&u){p.src=u;PISTA={el:p}}});
 verPDF(e.c.fid,$('#pdfbox'));
 V.querySelectorAll('.hr').forEach(r=>r.onclick=ev=>{const b=ev.target.closest('button');if(!b)return;const j=+r.dataset.j;
  if(b.classList.contains('pa')){if(!prac&&e.plays[j]>=2){toast('Este audio ya se escuchó 2 veces');return}e.plays[j]++;tocar(e.c.fid,+b.dataset.n);return}
  const it=e.its[j];if(prac&&e.r[j]!==null&&it.k!=null)return;const x=+b.dataset.x;e.r[j]=e.r[j]===x&&!prac?null:x;
  r.querySelectorAll('button[data-x]').forEach(y=>{const yx=+y.dataset.x;y.className=(e.r[j]===yx?'sel':'')+(prac&&e.r[j]!==null&&it.k!=null?(yx===it.k?' ok':(e.r[j]===yx?' no':'')):'')});
  $('#cnt').textContent=`${e.r.filter(z=>z!==null).length}/${e.its.length} contestados`;if(prac&&it.k!=null&&e.r[j]!==null&&window.FX){if(e.r[j]===it.k)FX.ok(b);else FX.no()}});
 $('#ent').onclick=()=>{const sin=e.r.filter(x=>x===null).length;if(sin&&!confirm(`Hay ${sin} reactivos sin contestar. ¿Entregar de todos modos?`))return;entregarHoja()}}
function entregarHoja(){const e=EX;const conK=e.its.filter(i=>i.k!=null).length;
 if(conK){calificar();return}
 const h={id:Date.now().toString(36),fecha:new Date().toISOString(),nom:e.nom,fid:e.c.fid,titulo:e.c.titulo,parte:e.c.parte,tabla:e.c.tabla,modo:e.modo,ns:e.its.map(i=>i.n),r:e.r,min:Math.round((Date.now()-e.ini)/60000)};
 const a=HOJAS();a.push(h);setHOJAS(a);EX=null;if(AUD)AUD.pause();if(PISTA){PISTA.el.pause();PISTA=null}VIEW='final';nav();
 V.innerHTML=`<div class="card"><h1>Hoja guardada</h1><p class="muted">${esc(h.titulo)}${h.nom?' · '+esc(h.nom):''} · ${h.r.filter(x=>x!==null).length}/${h.r.length} contestados.</p><p>La forma aún no tiene clave. La hoja queda <b>pendiente</b> en este dispositivo; cuando captures la clave en «Examen final» podrás calificarla con la tabla de conversión.</p><a class="btn" href="#final">Volver a Examen final</a></div>`}
function calificarHoja(h){const fm=FORMAS.find(f=>f.id===h.fid);if(!fm){alert('La forma de esta hoja ya no está en el dispositivo.');return}
 const its=h.ns.map(n=>fm.items.find(i=>i.n===n)).filter(Boolean).map(i=>Object.assign({},i,{id:'F'+fm.id+'-'+i.n,tipo:i.sec==='L'?'Comprensión auditiva':'Lectura y estructura',e:'',q:`Reactivo ${i.n} (ver PDF)`}));
 if(!its.some(i=>i.k!=null)){alert('Primero captura la clave de la forma.');return}
 EX={fuente:'final',hoja:true,c:{forma:fm.id,fid:fm.id,titulo:fm.titulo,parte:h.parte,tabla:FF.tabla||h.tabla,pdf:true},modo:h.modo,nom:h.nom,its,i:0,r:h.r,plays:[],ini:Date.parse(h.fecha)-h.min*60000};
 setHOJAS(HOJAS().filter(x=>x.id!==h.id));calificar()}
function convertir(pts,tabla){const t=BANK&&BANK.conversion&&BANK.conversion[tabla];if(!t)return null;for(const [p,c] of t.t)if(pts>=p)return c;return null}
/* ---------- examen ---------- */
let EX=null,PISTA=null,AUD=null;
async function tocar(fid,n){if(AUD){try{AUD.pause();URL.revokeObjectURL(AUD.src)}catch(e){}}if(window.MB1AUD)MB1AUD.cancelar();const u=await audioURL(fid,n);if(!u){toast('No se encontró el audio');return}if(window.MB1AUD){try{AUD=await MB1AUD.playFile(u,{onFail:()=>toast('Toca de nuevo para reproducir')})}catch(e){toast('Toca de nuevo para reproducir')}return}AUD=new Audio(u);AUD.play().catch(()=>toast('Toca de nuevo para reproducir'))}
function iniciar(fuente,f,nom){const its=armar(f);if(!its.length){alert('No hay reactivos con esos filtros.');return}
 const c=curso(f.curso);EX={fuente,c:{alcance:f.alcance,curso:f.curso,cursoNom:c.nombre,par:f.alcance==='parcial'?f.par:'',acum:f.acum,forma:f.alcance==='forma'?f.forma:'',libro:f.alcance==='libro'?f.libro:'',lec:f.lec,libros:librosEval(f)},modo:f.modo,nom,its,i:0,r:its.map(()=>null),plays:its.map(()=>0),ini:Date.now()};go('examen')}
function evalTxt(e){return (e.modo==='practica'?'Práctica':'Simulacro')+(PT?' ALCPT':'')}
function titulo(e){return evalTxt(e)}
function vExamen(){if(!EX){go('inicio');return}if(EX.hoja){vHoja();return}const e=EX,it=e.its[e.i],ans=e.r[e.i],prac=e.modo==='practica',done=prac&&ans!==null&&it.k!=null;
 const parte=it.sec==='L'?'Parte I · Comprensión auditiva':'Parte II · Lectura y estructura';const ofi=it.sec==='L'&&!it.s&&!it.aud&&!it.mp3;
 V.innerHTML=`<div class="card"><div class="hud"><span>${titulo(e)}</span><span>${e.i+1} / ${e.its.length}</span></div><div class="pbar"><i style="width:${100*(e.i+1)/e.its.length}%"></i></div>
 <span class="tag">${parte}</span>
 ${e.fuente==='final'&&e.c.pista&&it.sec==='L'?`<div class="txt">🔊 <b>Pista completa</b> (el aplicador la controla)<audio controls preload="auto" id="pista" style="width:100%;margin-top:6px"></audio></div>`:''}${it.sec==='L'&&(it.s||it.aud||it.mp3)?`<div class="noprint"><button class="btn" id="play">▶ Escuchar${!prac?` (${2-e.plays[e.i]} restantes)`:''}</button></div>${done?`<div class="txt">${esc(it.s)}</div>`:''}`:ofi?`<div class="txt">🔊 <b>Audio:</b> escucha y elige la mejor respuesta.</div>`:it.s?`<div class="txt">${esc(it.s)}</div>`:''}
 ${it.img?`<div class="impmed"><img data-ref="${esc(it.img)}" alt="Imagen de la pregunta"></div>`:''}${it.vid?`<div class="impmed"><video controls data-ref="${esc(it.vid)}"></video></div>`:''}${it.pas?`<div class="txt">${esc(it.pas)}</div>`:''}${it.q?`<div class="q">${esc(it.q)}</div>`:''}
 ${it.o.map((o,j)=>`<button class="op ${ans===j?'sel':''} ${done&&j===it.k?'ok':''} ${done&&ans===j&&j!==it.k?'no':''}" data-j="${j}" ${done?'disabled':''}><b>${L[j]})</b>${esc(o)}</button>`).join('')}
 ${done?`<div class="fb ${ans===it.k?'ok':'no'}"><b>${ans===it.k?'Correcto':'Incorrecto · respuesta: '+L[it.k]}</b><br>${esc(limpioE(it.e))}</div>`:''}
 <div class="row" style="margin-top:10px"><button class="btn ghost" id="prev" ${e.i?'':'disabled'}>Anterior</button>${e.i<e.its.length-1?`<button class="btn" id="next">Siguiente</button>`:`<button class="btn" id="fin">Terminar</button>`}</div>
 <p class="mini">Respondidas: ${e.r.filter(x=>x!==null).length} de ${e.its.length}. <a href="#" id="abort">Cancelar</a></p></div>`;
 V.querySelectorAll('[data-ref]').forEach(m=>{if(window.IMPORTA)IMPORTA.url(m.dataset.ref).then(u=>{if(u)m.src=u})});
 V.querySelectorAll('.op').forEach(b=>b.onclick=()=>{e.r[e.i]=+b.dataset.j;vExamen();if(prac&&it.k!=null&&window.FX){if(e.r[e.i]===it.k)FX.ok(V.querySelector('.op.ok'));else FX.no()}});
 const ps=$('#pista');if(ps){if(PISTA&&PISTA.fid===e.c.fid){ps.replaceWith(PISTA.el);PISTA.el.id='pista'}else audioURL(e.c.fid,null).then(u=>{if(u){ps.src=u;PISTA={fid:e.c.fid,el:ps}}})}
 const p=$('#play');if(p)p.onclick=()=>{if(!prac&&e.plays[e.i]>=2){toast('Ya no quedan reproducciones');return}e.plays[e.i]++;if(it.aud)tocar(e.c.fid,it.n);else if(it.mp3)tocarMp3(it.mp3,it.s);else hablar(it.s);if(!prac)p.textContent=`▶ Escuchar (${2-e.plays[e.i]} restantes)`};
 $('#prev').onclick=()=>{e.i--;vExamen()};const n=$('#next');if(n)n.onclick=()=>{e.i++;vExamen()};
 const f=$('#fin');if(f)f.onclick=()=>{const pend=e.r.filter(x=>x===null).length;if(pend&&!confirm(`Faltan ${pend} sin responder (cuentan como error). ¿Terminar?`))return;calificar()};
 $('#abort').onclick=ev=>{ev.preventDefault();if(confirm('¿Cancelar?')){const mo=e.modo;EX=null;if(AUD)AUD.pause();if(PISTA)PISTA.el.pause();PISTA=null;speechSynthesis&&speechSynthesis.cancel();go(mo==='practica'?'practica':'simulacro')}}}
function calificar(){const e=EX,cfg=CFG();let ok=0;const por={};const its=e.its.filter(i=>i.k!=null),idx=e.its.map((it,j)=>j).filter(j=>e.its[j].k!=null);
 idx.forEach(j=>{const it=e.its[j],b=e.r[j]===it.k;ok+=b;const k=it.tipo;por[k]=por[k]||[0,0];por[k][0]+=b;por[k][1]++});
 const sec={L:[0,0],R:[0,0]};idx.forEach(j=>{const it=e.its[j];sec[it.sec][0]+=e.r[j]===it.k;sec[it.sec][1]++});
 const N=its.length||1,pct=Math.round(1000*ok/N)/10;let cal=Math.round(pct)/10,conv='';
 if(e.fuente==='final'&&e.c.tabla){const cc=convertir(ok,e.c.tabla);if(cc!=null){cal=cc;conv=`Conversión: ${BANK.conversion[e.c.tabla].nombre}`}else{conv=`${ok} puntos: debajo del mínimo de la tabla (${BANK.conversion[e.c.tabla].nombre}). No acreditado.`;cal=Math.min(5,cal)}}
 const res={fecha:new Date().toISOString(),nom:e.nom,fuente:e.fuente,esq:esqId(),curso:e.c.cursoNom||'',eval:evalTxt(e),sem:e.c.curso||'',par:e.c.par||'',forma:e.c.forma||'',modo:e.modo,n:its.length,sinClave:e.its.length-its.length,ok,pct,cal,L:sec.L,R:sec.R,min:Math.round((Date.now()-e.ini)/60000)};
 res.m=matDef()||'';if(e.mat)res.m=e.mat;if(!PIL()){const all=RES();all.push(res);setRES(all);try{window.MB1SYNC&&MB1SYNC.alc(res)}catch(er){}}
 const r=e.r,lst=e.its;const titu=titulo(e);EX=null;if(AUD)AUD.pause();if(PISTA){PISTA.el.pause();PISTA=null}VIEW='resultados';nav();
 V.innerHTML=`<div class="card"><h1>Resultado</h1><p class="muted">${titu}${res.nom?' · '+esc(res.nom):''}</p>
 <div class="row"><div><div class="big">${ok}/${its.length}</div><div class="muted">aciertos</div></div><div><div class="big">${pct}</div><div class="muted">porcentaje</div></div></div>
 <h3>Por sección</h3><p>${['L','R'].filter(s=>sec[s][1]).map(s=>`<span class="tag">${s==='L'?'Comprensión auditiva':'Lectura y estructura'}: ${sec[s][0]}/${sec[s][1]}</span>`).join('')}</p>
 <div class="row noprint"><button class="btn" onclick="print()">Imprimir</button><a class="btn ghost" href="#${e.modo==='practica'?'practica':'simulacro'}">Volver</a></div></div>
 ${!ADM()&&e.fuente==='final'&&e.modo==='examen'?'':`<div class="card"><h2>Revisión de errores</h2>${lst.map((it,j)=>it.k==null||r[j]===it.k?'':`<div style="border-bottom:1px solid var(--b);padding:8px 0"><b>${it.n?it.n:j+1}.</b> ${it.s?`<div class="txt">${esc(it.s)}</div>`:''}<div><b>${esc(it.q)}</b></div><div class="badt">Respuesta: ${r[j]===null?'(sin responder)':L[r[j]]+') '+esc(it.o[r[j]])}</div><div class="okt">Correcta: ${L[it.k]}) ${esc(it.o[it.k])}</div><div class="mini">${esc(limpioE(it.e))}</div></div>`).join('')||'<p>¡Sin errores!</p>'}</div>`}`;
 SS(UKEY,res);links();if(window.FX&&cal>=cfg.minima)FX.fin(cal>=9?200:130)}
/* ---------- calificación ---------- */
function vCalif(){if(!BANK){V.innerHTML=sinBanco();bindImp();return}const cfg=CFG(),u=LS('mb1_alc_ultimo',null),d=LS('mb1_alc_calc_'+esqId(),{}),np=parN(),sup=esqId()==='superioridad';
 const conv=BANK.conversion||{};
 V.innerHTML=`<div class="card">${selEsq()}</div><div class="card"><h1>Calificación del parcial</h1><p class="muted">Examen ${cfg.examen*100}% · portafolio de evidencias ${cfg.portafolio*100}% · participación ${cfg.participacion*100}% (escala 0–10).</p>
 <div class="row"><div><label class="f">Examen</label><input type="number" step="0.1" min="0" max="10" id="ex" value="${d.ex??(u&&u.fuente==='alc'?u.cal:'')}"></div><div><label class="f">Portafolio</label><input type="number" step="0.1" min="0" max="10" id="po" value="${d.po??''}"></div><div><label class="f">Participación</label><input type="number" step="0.1" min="0" max="10" id="pa" value="${d.pa??''}"></div></div>
 <p>Calificación del parcial: <b id="cp" class="big" style="font-size:1.6rem">—</b></p>${u?`<p class="mini">Último examen en este dispositivo: ${esc(u.eval)} · ${u.cal.toFixed(1)}</p>`:''}</div>
 <div class="card"><h1>Calificación final</h1><p class="muted">${sup?`Parciales ${cfg.parciales*100}% (10 % c/u) + final del semestre ${cfg.final*100}%.`:`Promedio de los ${np} parciales ${cfg.parciales*100}% + examen final ALCPT ${cfg.final*100}%.`} Mínima ${cfg.minima}.</p>
 <div class="row">${Array.from({length:np},(_,i)=>`<div><label class="f">Parcial ${i+1}</label><input type="number" step="0.1" id="p${i+1}" value="${d['p'+(i+1)]??''}"></div>`).join('')}
 <div><label class="f">${sup?'Final del semestre (0–10)':'ALCPT final (puntos)'}</label><input type="number" step="0.1" id="af" value="${d.af??''}"></div></div>
 ${sup?'':`<label class="f">Pasar los puntos ALCPT a calificación con</label><select id="tb"><option value="">Puntos de 0–100 ÷ 10</option>${Object.entries(conv).map(([k,t])=>`<option value="${k}" ${d.tb===k?'selected':''}>${esc(t.nombre)}</option>`).join('')}</select>`}
 <p>Promedio de parciales: <b id="pp">—</b> · ${sup?'':'ALCPT final: <b id="afc">—</b> · '}Calificación final: <b id="cf" class="big" style="font-size:1.6rem">—</b></p>
 <p class="mini">Si el examen final no se acredita, el cadete presenta el extraordinario con otra versión del ALCPT (pestaña «Final»); si lo aprueba, la calificación que se asienta es 6.0.</p></div>
 <div class="card"><h2>Ponderaciones (${esc(ESQ().nombre)})</h2><div class="row">${['examen','portafolio','participacion','parciales','final','minima'].map(k=>`<div><label class="f">${{examen:'Examen',portafolio:'Portafolio',participacion:'Participación',parciales:'Parciales',final:sup?'Final del semestre':'ALCPT final',minima:'Mínima aprobatoria'}[k]}</label><input type="number" step="0.05" data-cfg="${k}" value="${cfg[k]}"></div>`).join('')}</div></div>`;
 bindEsq(vCalif);
 const n=id=>{const e=$('#'+id);if(!e)return null;const v=parseFloat(e.value);return isNaN(v)?null:v};
 const calc=()=>{const c=CFG();const s={};['ex','po','pa','af','tb',...Array.from({length:np},(_,i)=>'p'+(i+1))].forEach(k=>{const e=$('#'+k);if(e)s[k]=e.value});SS('mb1_alc_calc_'+esqId(),s);
  const ex=n('ex'),po=n('po'),pa=n('pa');$('#cp').textContent=ex!==null&&po!==null&&pa!==null?(Math.round(10*(ex*c.examen+po*c.portafolio+pa*c.participacion))/10).toFixed(1):'—';
  const ps=Array.from({length:np},(_,i)=>n('p'+(i+1))).filter(x=>x!==null);const pr=ps.length?ps.reduce((a,b)=>a+b,0)/ps.length:null;$('#pp').textContent=pr===null?'—':pr.toFixed(1);
  let af=n('af');if(!sup&&af!==null){const tb=$('#tb').value;const cv=tb?convertir(af,tb):null;af=tb?(cv??Math.min(5,af/10)):af/10;$('#afc').textContent=af.toFixed(1)+(tb&&cv==null?' (no acreditado)':'')}
  const cf=pr!==null&&af!==null&&ps.length===np?Math.round(10*(pr*c.parciales+af*c.final))/10:null;const e=$('#cf');
  e.textContent=cf===null?'—':cf.toFixed(1)+(cf>=c.minima&&af>=c.minima?' · Aprobado':' · No aprobado'+(af<c.minima?' (final no acreditado → extraordinario)':''));e.className='big '+(cf===null?'':cf>=c.minima&&af>=c.minima?'okt':'badt')};
 V.querySelectorAll('input[id],select#tb').forEach(i=>i.oninput=i.onchange=calc);
 V.querySelectorAll('[data-cfg]').forEach(i=>i.onchange=()=>{const o=LS('mb1_alc_cfg_'+esqId(),{});o[i.dataset.cfg]=parseFloat(i.value);SS('mb1_alc_cfg_'+esqId(),o);vCalif()});calc()}
/* ---------- resultados ---------- */
function tipoRes(r){return (r.modo==='practica'?'Práctica':'Simulacro')+(PT?' ALCPT':'')}
function tablaRes(a){return `<div class="tw"><table><tr><th>Fecha</th><th>Cadete</th><th>Tipo</th><th>Aciertos</th><th>%</th></tr>${a.map(r=>`<tr><td>${fechaL(r.fecha)}</td><td>${esc(r.nom||'—')}</td><td>${tipoRes(r)}</td><td>${r.ok}/${r.n}</td><td>${r.pct}</td></tr>`).join('')}</table></div>`}
function vRes(){vRes0();if(!ADM())V.querySelectorAll('.adm').forEach(x=>x.remove())}
function vRes0(){const mm=matDef(),a=RES().filter(r=>ADM()||r.m===mm).slice().reverse();
 V.innerHTML=`<div class="card"><h1>Resultados</h1><p class="muted">${ADM()?'Se guardan en este dispositivo.':'Se guardan en este dispositivo.'}</p>${a.length?tablaRes(a):'<p>Aún no hay resultados.</p>'}
 <div class="row noprint"><button class="btn" id="csv" ${a.length?'':'disabled'}>Exportar CSV</button><button class="btn ghost" onclick="print()">Imprimir</button><button class="btn peligro adm" id="del" ${a.length?'':'disabled'}>Borrar resultados</button></div></div>
 ${a.length?`<div class="card"><h2>Promedios</h2>${resumen(a)}</div>`:''}`;
 $('#csv').onclick=()=>{const h=['Fecha','Cadete','Tipo','Aciertos','Porcentaje','Minutos'];
  const rows=RES().map(r=>[r.fecha,r.nom,tipoRes(r),r.ok,r.pct,r.min]);
  const csv='\uFEFF'+[h,...rows].map(x=>x.map(v=>'"'+String(v??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');const l=document.createElement('a');l.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));l.download='resultados_alcpt_alc_'+hoy()+'.csv';l.click()};
 $('#del').onclick=()=>{if(confirm('¿Borrar todos los resultados de este dispositivo?')){setRES([]);vRes()}}}
function resumen(a){const g={};a.forEach(r=>{const k=tipoRes(r);(g[k]=g[k]||[]).push(r.pct)});
 const ks=Object.keys(g).sort();return ks.length?`<div class="tw"><table><tr><th>Tipo</th><th>Ejercicios</th><th>Promedio %</th></tr>${ks.map(k=>{const v=g[k];return `<tr><td>${esc(k)}</td><td>${v.length}</td><td>${Math.round(v.reduce((x,y)=>x+y,0)/v.length)}</td></tr>`}).join('')}</table></div>`:'<p class="muted">Aún no hay resultados.</p>'}
/* ---------- banco ---------- */
function vBanco(){vBanco0();if(!ADM())V.querySelectorAll('.adm').forEach(x=>x.remove())}
function vBanco0(){const cnt=(src,f)=>pool(Object.assign({fuente:src,sec:'',tipo:''},f)).length;
 V.innerHTML=(BANK?`<div class="card"><h1>Banco</h1><p>Versión <b>${esc(BANK.version)}</b> (${esc(BANK.fecha)}) · ${BANK.alc.length} ALC · ${BANK.alcpt.length} ALCPT.</p>${selEsq()}
 <h3>ALC por curso y parcial</h3><div class="tw"><table><tr><th>Curso</th>${Array.from({length:parN()},(_,i)=>`<th>P${i+1}</th>`).join('')}<th>Total</th></tr>${cursos().map(c=>`<tr><td>${esc(c.nombre)}</td>${Array.from({length:parN()},(_,i)=>`<td>${cnt('alc',{alcance:'parcial',curso:c.id,par:i+1})}</td>`).join('')}<td>${cnt('alc',{alcance:'semestral',curso:c.id})}</td></tr>`).join('')}</table></div>
 <h3>ALC por libro</h3><p>${[...new Set(BANK.alc.map(i=>i.libro))].sort((a,b)=>a-b).map(b=>`<span class="tag">Book ${b}: ${BANK.alc.filter(i=>i.libro===b).length}</span>`).join('')}</p>
 <h3>ALCPT por curso y parcial</h3><div class="tw"><table><tr><th>Curso</th>${Array.from({length:parN()},(_,i)=>`<th>P${i+1}</th>`).join('')}<th>Total</th></tr>${cursos().map(c=>`<tr><td>${esc(c.nombre)}</td>${Array.from({length:parN()},(_,i)=>`<td>${cnt('alcpt',{alcance:'parcial',curso:c.id,par:i+1})}</td>`).join('')}<td>${cnt('alcpt',{alcance:'semestral',curso:c.id})}</td></tr>`).join('')}</table></div>
 <p class="mini">ALCPT por forma: ${[...new Set(BANK.alcpt.map(i=>i.forma))].sort().map(x=>`${x}: ${BANK.alcpt.filter(i=>i.forma===x).length}`).join(' · ')}</p>
 <label class="btn">Reemplazar banco<input type="file" class="imp" accept=".json,application/json" hidden></label><button class="btn peligro adm" id="qb">Quitar banco de este dispositivo</button></div>`:sinBanco())+
 `<div class="card"><h2>Final ALCPT</h2><p class="muted">${FORMAS.length?`${FORMAS.length} formas cargadas (${FORMAS.reduce((a,f)=>a+f.items.length,0)} reactivos).`:'Sin formas cargadas.'} Se cargan y administran en la pestaña «Final ALCPT».</p></div>
 <div class="card"><h2>Voz</h2><p class="muted">La comprensión auditiva usa la voz en inglés del dispositivo. En examen se puede escuchar cada audio 2 veces.</p><label class="f">Velocidad</label><select id="rate">${[[.8,'Lenta'],[.9,'Normal'],[1,'Rápida']].map(([v,t])=>`<option value="${v}" ${+(localStorage.getItem('mb1_alc_rate')||.9)===v?'selected':''}>${t}</option>`).join('')}</select><button class="btn ghost" id="prueba">Probar voz</button></div>
 <p class="mini">ALCPT y ALC por parciales v${VER} · Esc. Mil. Enfría. · No afiliada al DLIELC. El banco, las formas y los audios son confidenciales y no se publican.</p>`;
 bindImp();bindEsq(vBanco);const q=$('#qb');if(q)q.onclick=async()=>{if(confirm('¿Quitar el banco de este dispositivo? Tus resultados se conservan.')){await idbDel('bank');BASE=null;mezclar();vBanco()}};
 $('#rate').onchange=e=>localStorage.setItem('mb1_alc_rate',e.target.value);$('#prueba').onclick=()=>hablar('M: Good morning, Cadet. Where is the clinic?\nW: It is next to the main gate, sir.')}
/* ---------- arranque ---------- */
/* v2.16: preguntas importadas en Administración (importar.js) se suman al material de la Mesa; se guardan aparte (clave «imp») */
let BASE=null,IMP=null,PUBL=null;function mezclar(){const b0=BASE||(PUBL&&PUBL.base&&Array.isArray(PUBL.base.alcpt)?PUBL.base:null),ex=[IMP,PUBL].filter(x=>x&&((x.alcpt||[]).length||(x.alc||[]).length));if(ex.length){const b=b0||{tipo:'banco_alcpt_alc',version:'importado',fecha:'',alcpt:[],alc:[],semestres:[],importado:true},uni=a=>{const v=new Set();return a.filter(i=>i&&i.id!=null&&!v.has(i.id)&&v.add(i.id))};BANK=Object.assign({},b,{alcpt:uni((b.alcpt||[]).concat(...ex.map(x=>x.alcpt||[]))),alc:uni((b.alc||[]).concat(...ex.map(x=>x.alc||[]))),semestres:b.semestres||[]})}else BANK=b0}
let CARGA=null;function cargar(){if(CARGA)return CARGA;CARGA=(window.indexedDB?Promise.all([idbGet('bank'),idbGet('formas'),idbGet('imp'),idbGet('pub')]).then(([b,f,im,pb])=>{BASE=b&&b.alcpt?b:null;if(Array.isArray(f))FORMAS=f;IMP=im&&Array.isArray(im.alcpt)?im:null;PUBL=pb&&pb.v&&(Array.isArray(pb.alcpt)||pb.base)?pb:null;mezclar()}).catch(()=>{}):Promise.resolve());return CARGA}
function recargar(){CARGA=null;return cargar().then(()=>{if(V&&document.body.contains(V)&&!EX)render()})}
let SESK=null;function mount(el){CARGA=null;const sk=(()=>{const x=SES();return x?x.perfil+'|'+x.m:''})();if(sk!==SESK){SESK=sk;if(EX){EX=null;if(AUD)AUD.pause();if(PISTA){PISTA.el.pause();PISTA=null}}VIEW='inicio';VARG='';F={}}ROOT=el;el.innerHTML=`<div class="alc-tabs" id="alcnav"></div><div id="alcv" class="alc-v"><section class="card"><p class="mini">Cargando…</p></section></div>`;V=el.querySelector('#alcv');
 el.querySelector('#alcnav').onclick=ev=>{const b=ev.target.closest('button[data-v]');if(b)go(b.dataset.v)};cargar().then(()=>{if(ROOT===el)render()})}
function agregarRes(l){const all=RES(),k=r=>(r.m||'')+'|'+r.fecha,s=new Set(all.map(k));let n=0;(l||[]).forEach(r=>{if(!r||!r.fecha||s.has(k(r)))return;s.add(k(r));all.push(r);n++});if(n){all.sort((x,y)=>String(x.fecha).localeCompare(String(y.fecha)));setRES(all)}return n}
return {mount,VER,go,agregarRes,importarMaterial,recargar,tieneMaterial:()=>!!BANK,estado:()=>({bank:!!BANK,formas:FORMAS.length,view:VIEW,examen:!!EX}),conteoALC:()=>({alc:nAlc()}),conteoALCPT:()=>{const p=pubALCPT();return {app:p.length,appL:p.filter(i=>i.sec==='L').length,appR:p.filter(i=>i.sec==='R').length,dispositivo:BANK&&BANK.alcpt?BANK.alcpt.length:0}}};
}
window.ALCMOD=crear('alc');window.ALCPTMOD=crear('alcpt');
})();
