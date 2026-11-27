'use strict';
/* Misión: Obtener la Barra I — versión PWA (sin servidor). Datos solo en este dispositivo. */
const VER = '2.17.2';
// Firma: en el servidor de intranet la entrega /config.js (clave aleatoria por instalación, solo en la red local).
// En la versión pública no hay clave secreta: es una suma de verificación pública (detecta errores de copia, no falsificación).
const SECRET = window.MB1_FIRMA || 'MB1-PUBLICO-v2.3.1';
function sha256(m){const K=[],H=[],p=n=>{for(let f=2;f*f<=n;f++)if(n%f==0)return 0;return 1};for(let n=2,i=0;i<64;n++)if(p(n)){if(i<8)H[i]=Math.pow(n,1/2)*2**32|0;K[i++]=Math.pow(n,1/3)*2**32|0}
const b=unescape(encodeURIComponent(m)),l=b.length,w=[];for(let i=0;i<l;i++)w[i>>2]|=b.charCodeAt(i)<<(24-8*(i&3));w[l>>2]|=0x80<<(24-8*(l&3));const N=((l+8>>6)+1)*16;w[N-1]=l*8;for(let i=0;i<N;i++)w[i]|=0;
const r=(x,n)=>x>>>n|x<<(32-n);for(let j=0;j<N;j+=16){const W=w.slice(j,j+16);let[a,b2,c,d,e,f,g,h]=H;for(let i=0;i<64;i++){if(i>15){const x=W[i-15],y=W[i-2];W[i]=(W[i-16]+(r(x,7)^r(x,18)^x>>>3)+W[i-7]+(r(y,17)^r(y,19)^y>>>10))|0}
const t1=h+(r(e,6)^r(e,11)^r(e,25))+(e&f^~e&g)+K[i]+W[i]|0,t2=(r(a,2)^r(a,13)^r(a,22))+(a&b2^a&c^b2&c)|0;h=g;g=f;f=e;e=d+t1|0;d=c;c=b2;b2=a;a=t1+t2|0}
[a,b2,c,d,e,f,g,h].forEach((v,i)=>H[i]=H[i]+v|0)}return H.map(v=>(v>>>0).toString(16).padStart(8,'0')).join('')}
const SAL='9c0888d96e532cc3', hc = c => sha256('mb1:' + SAL + ':' + String(c).trim().toUpperCase()), esHash = v => /^[0-9a-f]{64}$/.test(v || '');
const ORIGEN = { admin: '935619901358c55989fbfdd1be55bb2d3759dda1916bc8bf0baf202dd4c7d2b4', planta: '9ad0cea5f4232e1ce55d5de046714bcffb278a0fd0f05439e086cc34a8f331ba', cadete: '12ac87b88c7d08ed8dee835cc672a37ed8aadcd4dab3f2ceb67d22ddf56242d0', directora: 'd83e14e1a7ad19fecc5fa7abf9123e981057191b3c67e46f34a1ad8f4999e018' };
const METAS = { 1: 42, 2: 48, 3: 54, 4: 60 };
const TEMAS = { tie: 'Tiempos verbales', est: 'Estructura', voc: 'Vocabulario', lec: 'Lectura', lir: 'Listening: respuestas', lic: 'Listening: comprensión', lin: 'Listening: datos', lrc: 'Listening: oraciones' };
const FORMAS = 'ABCDEFGHIJKLMNOP'.split('');
const DUR_Q = { 70: 100, 60: 86, 45: 64, 30: 42 };
const KEY = 'mb1_estado_v2';
const PISTA = { tie: 'Fíjate en las palabras de tiempo (yesterday, since, every day, already, by next…): ellas deciden el tiempo verbal.', est: 'Revisa la estructura: preposición, artículo, comparativo o conector que exige la oración.', voc: 'Busca el sinónimo o el significado en contexto; descarta las opciones que cambian el sentido.', lec: 'La respuesta está en el texto: vuelve a leer la oración que contiene la palabra clave de la pregunta.', lir: 'Responde a lo que se pregunta: Where → lugar, When → tiempo, Who → persona, How long → duración.', lic: 'Escucha la idea completa, no palabras sueltas: negaciones y "but" cambian el sentido.', lin: 'Anota mentalmente el dato (hora, número, día o lugar) y fíjate si después lo cambian.', lrc: 'Escucha la terminación del verbo (-ed, -s, -ing) y las palabras pequeñas.' };
const PILOTO = { m: 'PILOTO-EME', nombre: 'Usuario Piloto', ch: '44727d3d5aa08c84731a7dfaad5c5402db3508c7bcf4f655a9891ad6d0f6490e' };
const esAdmin = () => !!(S.sesion && S.sesion.perfil === 'admin');
const esDirectora = () => !!(S.sesion && S.sesion.perfil === 'directora');
const esMando = () => esAdmin() || esDirectora();
const soloLectura = () => esDirectora();
const bloquearEscritura = (msg) => { if (!soloLectura()) return false; toast(msg || 'Perfil Directora: solo consulta. No se puede modificar.'); return true; };
let REAL = null; // estado real guardado mientras corre el piloto (el piloto vive solo en memoria)
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function hash(str, seed = 0) { let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed; for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); } h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909); h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909); return 4294967296 * (2097151 & h2) + (h1 >>> 0); }
const B32 = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
function b32(n, len) { let s = ''; for (let i = 0; i < len; i++) { s += B32[n % 32]; n = Math.floor(n / 32); } return s; }
function rng(seed) { let s = hash(String(seed)) % 2147483647 || 1; return () => (s = s * 16807 % 2147483647) / 2147483647; }
function shuffle(a, r = Math.random) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const pad = n => String(n).padStart(2, '0');
const hoy = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const diasEntre = (a, b) => Math.round((new Date(b + 'T12:00') - new Date(a + 'T12:00')) / 864e5);
const lunes = (d = new Date()) => { const x = new Date(d); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return hoy(x); };
const norm = s => String(s || '').trim().toUpperCase();
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), 2600); }
function b64e(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
function b64d(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }

const BANCO = []; (() => { let pas = null, n = 0; for (const ln of window.BANCO_RAW.split('\n')) { const p = ln.split('|'); if (p.length < 2) continue; if (p[0] === 'P') { pas = p[1]; continue; } const [t, au, q, ...o] = p; BANCO.push({ id: t + (++n), t, au: au || '', q: q || '', o, pas: t === 'lec' ? pas : null, lis: t[0] === 'l' && t !== 'lec' }); }
  BANCO.filter(b => (b.t === 'tie' || b.t === 'est') && b.q.includes('___')).forEach(b => BANCO.push({ id: 'lrc' + b.id, t: 'lrc', lis: true, au: b.q.replace('___', b.o[0]), q: '', o: b.o.map(x => b.q.replace('___', x)) })); })();
const DIAS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const LUG = ['the clinic', 'room twelve', 'the main gate', 'the motor pool', 'the library', 'the dining hall', 'building C', 'the parade ground'];
function genLis(seed) {
  const r = rng(seed), k = Math.floor(r() * 4), id = 'lin' + seed;
  if (k === 0) { const h = 6 + Math.floor(r() * 12), m = [0, 15, 30, 45][Math.floor(r() * 4)]; const f = (H, M) => `${H}:${pad(M)}`; const say = m === 0 ? `${h} o'clock` : m === 15 ? `a quarter past ${h}` : m === 30 ? `half past ${h}` : `a quarter to ${h + 1}`; return { id, t: 'lin', lis: true, au: `The formation will be at ${say}. What time is the formation?`, q: '', o: [f(h, m), f(h + 1, m), f(h, (m + 30) % 60), f(h - 1, m === 0 ? 45 : m)] }; }
  if (k === 1) { const a = 13 + Math.floor(r() * 7); return { id, t: 'lin', lis: true, au: `There are ${a} cadets in the first group and ${a + 3} in the second. How many are in the second group?`, q: '', o: [String(a + 3), String(a), String(a * 10 + 3), String(a + 30)] }; }
  if (k === 2) { const d = Math.floor(r() * 7); return { id, t: 'lin', lis: true, au: `The exam was going to be on ${DIAS[d]}, but it was moved to the next day. When is the exam now?`, q: '', o: [DIAS[(d + 1) % 7], DIAS[d], DIAS[(d + 6) % 7], DIAS[(d + 2) % 7]] }; }
  const l = shuffle(LUG, r); return { id, t: 'lin', lis: true, au: `Don't go to ${l[0]}. Report to ${l[1]} instead. Where should you report?`, q: '', o: [l[1], l[0], l[2], l[3]] };
}
const byId = id => id.startsWith('lin') ? genLis(+id.slice(3)) : BANCO.find(b => b.id === id);
const POOL_L = () => BANCO.filter(b => b.lis), POOL_R = () => BANCO.filter(b => !b.lis);
function forma(letra, nq = 100, semilla = '') {
  const r = rng('forma' + letra), half = Math.floor(nq / 2);
  const L = shuffle(POOL_L(), r).slice(0, Math.min(half - 8, POOL_L().length)).map(b => b.id);
  let g = 0; while (L.length < half) L.push('lin' + ((FORMAS.indexOf(letra) * 12 + (g++)) % 200));
  const R = shuffle(POOL_R(), r).slice(0, nq - half).map(b => b.id);
  let ids = L.concat(R); if (semilla) { const rr = rng(semilla); ids = shuffle(L, rr).concat(shuffle(R, rr)); }
  return ids;
}
let S = load(); const migraCodes = () => { S.codes = S.codes || {}; for (const k in ORIGEN) if (!esHash(S.codes[k])) S.codes[k] = ORIGEN[k]; }; migraCodes(); if (S.perfiles && S.perfiles[PILOTO.m]) { delete S.perfiles[PILOTO.m]; if (S.sesion && S.sesion.m === PILOTO.m) S.sesion = null; }
function load() { try { return Object.assign(base(), JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { return base(); } }
function base() { return { codes: { ...ORIGEN }, sesion: null, perfiles: {}, resultados: [], pases: [], avances: {}, padron: [], registro: [], calif: [], califAdj: [], califCad: {}, califSombra: {}, sombraProg: null, sombraSesiones: [], pase: null, tema: 'claro' }; }
function save() { if (REAL) return; localStorage.setItem(KEY, JSON.stringify(S)); }
const P = () => S.sesion && S.perfiles[S.sesion.m];
const esPiloto = () => S.sesion && S.sesion.m === PILOTO.m;
const xp = p => (p.xpBase || 0) + p.ans.reduce((s, a) => s + (a[1] ? 10 : 2), 0);
function crearPiloto() { const p = nuevoPerfil({ m: PILOTO.m, nombre: PILOTO.nombre, perfil: 'cadete', anio: 4, gp: 'A', gi: '1', cia: '1/a.', piloto: true }); const now = Date.now(), r = rng('piloto');
  const ids = BANCO.filter(b => b.t !== 'lrc').map(b => b.id); const hist = {}; const curva = [44, 45, 45, 47, 48, 48, 50, 50, 51];
  for (let d = 8; d >= 0; d--) { const k = hoy(new Date(now - d * 864e5)); p.dias[k] = { q: 17, min: 12 }; hist[k] = curva[8 - d]; }
  for (let i = 0; i < 150; i++) { const it = byId(ids[Math.floor(r() * ids.length)]); const ok = i < 77; const t = p.tema[it.t] || (p.tema[it.t] = [0, 0]); t[0]++; if (ok) t[1]++; p.ans.push([it.id, ok ? 1 : 0, now - (150 - i) * 50 * 60000]); if (!ok && i % 3 === 0) p.err[it.id] = now; }
  p.ans = shuffle(p.ans, r).map((a, i) => [a[0], a[1], now - (150 - i) * 50 * 60000]); p.ini = 44; p.hist = hist; p.xpBase = 2460 - p.ans.reduce((s, a) => s + (a[1] ? 10 : 2), 0);
  p.tools = { mision: 9, tarjetas: 7, listening: 6, mixta: 4, tema: 5, corto: 2, dictado: 3 }; p.ins = { primera: hoy(), q100: hoy(), racha3: hoy(), racha7: hoy() }; p.ultAvance = now; return p; }
function nuevoPerfil(o) { return Object.assign({ creado: hoy(), ans: [], tema: {}, err: {}, dias: {}, tools: {}, cards: {}, meta: 10, sombra: null, comps: {}, ini: null, ins: {} }, o); }
function estimado(p) { const a = p.ans.slice(-150); if (a.length < 20) return null; return Math.round(100 * a.filter(x => x[1]).length / a.length); }
function semana(p, ini) { let q = 0, c = 0; p.ans.forEach(x => { const d = hoy(new Date(x[2])); if (d >= ini && diasEntre(ini, d) < 7) { q++; c += x[1] ? 1 : 0; } }); return [q, c]; }
function racha(p) { let n = 0, d = new Date(); if (!p.dias[hoy(d)]) d.setDate(d.getDate() - 1); while (p.dias[hoy(d)] && p.dias[hoy(d)].q) { n++; d.setDate(d.getDate() - 1); } return n; }
function registrar(p, it, ok) {
  const now = Date.now(), d = hoy(); const prev = p.ans.length ? p.ans[p.ans.length - 1][2] : 0;
  p.ans.push([it.id, ok ? 1 : 0, now]); if (p.ans.length > 1500) p.ans.splice(0, p.ans.length - 1500);
  const t = p.tema[it.t] || (p.tema[it.t] = [0, 0]); t[0]++; if (ok) t[1]++;
  if (ok) delete p.err[it.id]; else p.err[it.id] = now;
  const dd = p.dias[d] || (p.dias[d] = { q: 0, min: 0 }); dd.q++; dd.min += Math.min(2, (now - prev) / 60000 || 0.5);
  const e = estimado(p); if (p.ini == null && e != null) p.ini = e; if (e != null) { p.hist = p.hist || {}; p.hist[d] = e; }
}
function usar(tool) { const p = P(); if (!p) return; p.tools[tool] = (p.tools[tool] || 0) + 1; save(); }
const codNum = (fecha, F, min) => String(hash(`${SECRET}|EV|${fecha}|${F}|${min}`) % 10000).padStart(4, '0');
const codigoEval = (F, min, fecha = hoy()) => `${F}-${min}-${codNum(fecha, F, min)}`;
function validaEval(c) { const m = norm(c).match(/^([A-P])-(70|60|45|30)-(\d{4})$/); if (!m) return null; return codNum(hoy(), m[1], m[2]) === m[3] ? { F: m[1], min: +m[2], code: norm(c) } : null; }
const mmdd = (d = new Date()) => pad(d.getMonth() + 1) + pad(d.getDate());
const firmaPase = (mat, F, min, md, hh) => b32(hash(`${SECRET}|PA|${norm(mat)}|${F}|${min}|${md}|${hh}`), 4);
const generaPase = (mat, F, min, hh) => `${F}${min}-${mmdd()}-${pad(hh)}-${firmaPase(mat, F, min, mmdd(), pad(hh))}`;
function validaPase(c, mat) { const m = norm(c).match(/^([A-P])(70|60|45|30)-(\d{4})-(\d{2})-([2-9A-Z]{4})$/); if (!m) return 'Formato de pase no válido.'; if (m[3] !== mmdd()) return 'El pase no es de hoy.'; if (new Date().getHours() >= +m[4]) return 'El pase ya venció (hora límite).'; if (firmaPase(mat, m[1], m[2], m[3], m[4]) !== m[5]) return 'El pase no corresponde a tu matrícula.'; return { F: m[1], min: +m[2], hh: +m[4], code: norm(c), dia: hoy() }; }
const folio = (mat, code, pts, sal) => { const h = b32(hash(`${SECRET}|FO|${norm(mat)}|${norm(code)}|${pts}|${sal}`), 8); return h.slice(0, 4) + '-' + h.slice(4); };
function payload(p) {
  const s0 = lunes(), sp = new Date(s0 + 'T12:00'); sp.setDate(sp.getDate() - 7);
  const dias = {}; Object.keys(p.dias).sort().slice(-21).forEach(d => dias[d] = [p.dias[d].q, Math.round(p.dias[d].min)]);
  const ex = S.resultados.filter(r => r.m === p.m).slice(-6).map(r => [r.code, r.pts, r.sal, r.folio, r.fecha]);
  return { v: 2, n: p.nombre, m: p.m, pf: p.perfil, a: p.anio, gp: p.gp, gi: p.gi, cia: p.cia, ts: Date.now(), q: Object.values(p.tema).reduce((s, x) => s + x[0], 0), est: estimado(p), ini: p.ini, tema: p.tema, dias, tools: p.tools, w: semana(p, s0), pw: semana(p, hoy(sp)), ex, sm: p.sombra ? p.sombra.m : '', ins: Object.keys(p.ins).length, pr: (() => { try { const r = window.MB1PRACT ? Object.assign({}, MB1PRACT.resumenAvance()) : {}; try { const v = VOCAB.resumen(); r.va = v.aprendidas; r.vt = v.total; r.vp = v.pend; } catch (e) { } return Object.keys(r).length ? r : undefined; } catch (e) { return undefined; } })(), yo: p.yo ? { g: (p.yo.gustos || []).slice(0, 6), c: (p.yo.cuesta || []).slice(0, 4), t: String(p.yo.texto || '').slice(0, 200), f: p.yo.foto ? 1 : 0, e: p.yo.emoji || '', co: p.yo.color || '', fr: String(p.yo.frase || '').slice(0, 60) } : undefined };
}
function firmar(o) { const j = b64e(JSON.stringify(o)); return `MB1.${j}.${b32(hash(SECRET + '|AV|' + j), 6)}`; }
function codigoAvance(p) { return firmar(payload(p)); }
function leerCodigos(txt) { let ok = [], bad = 0; const re = /MB1\.([A-Za-z0-9_-]+)\.?([2-9A-Z]{0,6})/g; let m; while ((m = re.exec(txt))) { try { if (m[2].length !== 6 || b32(hash(SECRET + '|AV|' + m[1]), 6) !== m[2]) throw 0; const o = JSON.parse(b64d(m[1])); if (!o.m) throw 0; ok.push(o); } catch (e) { bad++; } } return { ok, bad }; }

/* ---------- servidor de intranet (opcional) ---------- */
let SRV = false, CLAVE = sessionStorage.getItem('mb1_k') || '';
const EQUIPO = localStorage.getItem('mb1_eq') || (() => { const e = 'EQ-' + b32(hash(String(Math.random()) + Date.now()), 5); localStorage.setItem('mb1_eq', e); return e; })();
const tsLocal = (d = new Date()) => `${hoy(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
async function api(path, data, method) { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 6000);
  try { const r = await fetch(path, { method: method || (data ? 'POST' : 'GET'), headers: { 'Content-Type': 'application/json', 'X-Clave': CLAVE }, body: data ? JSON.stringify(data) : undefined, signal: ctl.signal, cache: 'no-store' }); const j = await r.json().catch(() => ({})); if (!r.ok && r.status !== 403) throw new Error(j.error || r.status); return j; } finally { clearTimeout(t); } }
const SHEET = (window.SHEET_URL || '').trim();
/* v2.6 · registro automático en la Hoja: avance y actividad (script v2); con el script anterior se guardan en cola */
const NUEVOS_H = ['resultados', 'avance', 'alc', 'foto', 'dispositivo'];
const minVerH = t => t === 'dispositivo' || t === 'pulso' ? 5 : t === 'foto' ? 3 : 2;
let HV = (() => { try { return JSON.parse(localStorage.getItem('mb1_hv') || '{}') || {}; } catch (e) { return {}; } })();
async function verHoja(forzar) { if (!SHEET || SRV) return 1; if (!navigator.onLine) return HV.v || 1; if (!forzar && HV.t && Date.now() - HV.t < (HV.v >= 2 ? 864e5 : 18e5)) return HV.v || 1;
  try { const ctl = new AbortController(), tt = setTimeout(() => ctl.abort(), 8000); const r = await fetch(SHEET + '?hoja=version', { cache: 'no-store', signal: ctl.signal }).then(x => x.json()); clearTimeout(tt); HV = { v: (r && +r.v) || 1, t: Date.now(), fallo: false }; if (window.USO && !HV.fallo) USO.marcarSync(); }
  catch (e) { HV = { v: HV.v || 1, t: Date.now() - 15e5, fallo: true }; }
  localStorage.setItem('mb1_hv', JSON.stringify(HV)); if (HV.v >= 2) vaciarColaH2(); if (window.USO && !HV.fallo) setTimeout(() => USO.pulso(), 800); return HV.v; }
function encolarH2(t, d) { if (REAL) return; S.colaH2 = S.colaH2 || []; if (t === 'avance' || t === 'foto' || t === 'dispositivo') S.colaH2 = S.colaH2.filter(([x, y]) => !(x === t && (t === 'dispositivo' ? y.equipo === d.equipo && y.m === d.m : y.m === d.m))); S.colaH2.push([t, d]); if (S.colaH2.length > 800) S.colaH2.shift(); save(); }
function vaciarColaH2() { const c = S.colaH2 || []; if (!SHEET || REAL || !c.length || !navigator.onLine || !(HV.v >= 2)) return; S.colaH2 = []; save(); c.forEach(([t, d]) => hojaPost(t, d)); }
function hojaPost(tipoRegistro, datos) { if (!SHEET || REAL) return; const d = Object.assign({}, datos); delete d.codigo; if (NUEVOS_H.includes(tipoRegistro) && !(HV.v >= minVerH(tipoRegistro))) return encolarH2(tipoRegistro, d); fetch(SHEET, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ tipoRegistro, datos: d }) }).catch(() => { S.colaH = S.colaH || []; S.colaH.push([tipoRegistro, d]); if (S.colaH.length > 2000) S.colaH.shift(); save(); }); }
function vaciarColaH() { const c = S.colaH || []; if (!SHEET || !c.length || !navigator.onLine) return; S.colaH = []; save(); c.forEach(([t, d]) => hojaPost(t, d)); }
window.addEventListener('online', () => setTimeout(() => { vaciarColaH(); verHoja(true); }, 1500)); setTimeout(vaciarColaH, 4000); setTimeout(() => verHoja(), 2500);
function enviar(path, data) { if (esPiloto() || REAL) return; if (!SRV) { if (SHEET) { if (path === 'api/actividad') hojaPost('actividad', data); else if (path === 'api/avance') hojaPost('avance', filaAvance(data)); else if (path === 'api/resultado') hojaPost('resultados', filaRes(data)); } return; } api(path, data).catch(() => { S.cola = S.cola || []; S.cola.push([path, data]); if (S.cola.length > 2000) S.cola.shift(); save(); }); }
function filaAvance(o) { return { ts: o.ts, m: o.m, nombre: o.n, anio: o.a, gp: o.gp, gi: o.gi, q: o.q, est: o.est == null ? '' : o.est, equipo: EQUIPO, mb1: firmar(o) }; }
function filaRes(r) { return { ts: tsLocal(), m: r.m, nombre: r.n, perfil: r.tipo, anio: r.anio, gp: r.gp, gi: r.gi, code: r.code, forma: r.F, pts: r.pts, sal: r.sal, folio: r.folio, fecha: r.fecha, hora: r.hora, equipo: r.equipo || EQUIPO }; }
window.MB1SYNC = { alc(r) { try { if (!SHEET || SRV || REAL || esPiloto() || !r) return; const p = S.sesion && S.sesion.perfil === 'cadete' ? P() : null;
  hojaPost('alc', { ts: tsLocal(), m: r.m || (p ? p.m : ''), nombre: r.nom || (p ? p.nombre : ''), perfil: S.sesion ? S.sesion.perfil : '', anio: p ? p.anio : '', gp: p ? p.gp : '', gi: p ? p.gi : '', fuente: r.fuente, eval: r.eval, curso: r.curso, sem: r.sem, par: r.par, forma: r.forma, modo: r.modo, esq: r.esq, n: r.n, sinClave: r.sinClave || 0, ok: r.ok, pct: r.pct, cal: r.cal, L: (r.L || []).join('/'), R: (r.R || []).join('/'), min: r.min, fecha: r.fecha, equipo: EQUIPO }); } catch (e) { } } };
let HOJAD = { k: '', t: 0, n: null, err: '' };
const limpioH = a => (Array.isArray(a) ? a : []).filter(r => r && !/^TEST/i.test(String(r.m || '')) && !/^TEST/i.test(String(r.perfil || '')) && r.prueba !== 'sí');
async function cargarHojaDatos() { if (SRV || !SHEET || !S.sesion || !esMando()) return; const k = localStorage.getItem('mb1_hk') || '';
  if (!k) { HOJAD = Object.assign(HOJAD, { t: Date.now(), n: null, err: 'clave' }); return; }
  try { const v = await verHoja(true); if (v < 2) { HOJAD = Object.assign(HOJAD, { t: Date.now(), n: null, err: HV.fallo ? 'red' : 'v1' }); return; }
    const g = h => fetch(SHEET + '?hoja=' + h + '&clave=' + encodeURIComponent(k), { cache: 'no-store' }).then(r => r.json());
    const [av, fo, ca, so] = await Promise.all([g('avance'), v >= 3 ? g('fotos').catch(() => []) : Promise.resolve([]), v >= 4 ? g('calificaciones').catch(() => []) : Promise.resolve([]), v >= 4 ? g('sombras').catch(() => []) : Promise.resolve([])]); if (av && av.error) { HOJAD = Object.assign(HOJAD, { t: Date.now(), n: null, err: 'clave' }); return; }
    const A = limpioH(av);
    const nA = fusionarAvances(leerCodigos(A.map(r => r.mb1).join('\n')).ok, 'Hoja (automático)');
    if (Array.isArray(fo)) { S.fotoIdx = {}; fo.forEach(r => { if (r && r.m && r.hay) S.fotoIdx[r.m] = 1; }); }
    if (Array.isArray(ca) && window.CALIF) CALIF.fusionarDesdeHoja(ca);
    if (Array.isArray(so) && window.CALIF) CALIF.fusionarSombrasDesdeHoja(so);
    save(); HOJAD = Object.assign(HOJAD, { t: Date.now(), err: '', n: { a: nA, r: 0, l: 0, ta: A.length, tr: 0, tl: 0 } });
  } catch (e) { HOJAD = Object.assign(HOJAD, { t: Date.now(), n: null, err: 'red' }); } }
function actualizarHoja() { HOJAD.t = 0; HOJAD.err = 'cargando'; render(); cargarHojaDatos().then(() => { if (tab !== 'alc' && tab !== 'alcpt') render(); }); }
function avisoHoja() { if (SRV || !SHEET) return ''; const e = HOJAD.err, n = HOJAD.n, h = HOJAD.t ? new Date(HOJAD.t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
  const b = '<button class="btn sm ghost" onclick="actualizarHoja()">Actualizar</button>';
  if (e === 'clave') return `<section class="card aviso"><h3>Registro automático</h3><p>Captura la clave de lectura de la Hoja para ver el avance de cada cadete sin que envíen códigos.</p><button class="btn sm" onclick="claveHoja()">Capturar clave de lectura</button></section>`;
  if (e === 'v1') return `<section class="card aviso"><h3>Registro automático</h3><p>La Hoja de Google todavía usa el script anterior: llegan ingresos y ejercicios (pestaña Actividad). El avance completo se guarda en cada equipo y se enviará solo al actualizar el script.</p>${b}</section>`;
  if (e === 'red') return `<section class="card aviso"><h3>Registro automático</h3><p>No se pudo leer la Hoja (sin internet o clave incorrecta). Lo guardado en este equipo sigue disponible.</p>${b} <button class="btn sm ghost" onclick="claveHoja()">Clave</button></section>`;
  if (e === 'cargando' || !n) return `<section class="card"><p class="mini">Leyendo la Hoja de registro automático…</p></section>`;
  return `<section class="card"><div class="row sp"><p class="mini">Registro automático · Hoja: ${n.ta} cadete(s) con avance · actualizado ${h}${n.a ? ` · nuevos: ${n.a}` : ''}</p>${b}</div></section>`; }
async function vaciarCola() { const c = S.cola || []; if (!SRV || !c.length) return; S.cola = []; save(); for (const [p, d] of c) { try { await api(p, d); } catch (e) { S.cola.push([p, d]); } } save(); }
async function detectar() { if (!location.protocol.startsWith('http') || /github\.io$/.test(location.hostname)) return; try { const r = await api('api/ping'); SRV = !!(r && r.servidor); } catch (e) { SRV = false; } if (SRV) { document.body.classList.add('srv'); vaciarCola(); setInterval(vaciarCola, 60000); if (S.sesion && esAdmin()) cargarServidor(); else render(); } }
function actividad(q, tipo, tema, dur) { if (window.USO) USO.marcarUsoLocal(); const p = P(); if (!p || p.piloto || !(SRV || SHEET)) return; const ok = q.items.filter((x, i) => q.resp[i] === 0).length, n = Object.keys(q.resp).length;
  enviar('api/actividad', { ts: tsLocal(), m: p.m, nombre: p.nombre, perfil: p.perfil, anio: p.anio, gp: p.gp, gi: p.gi, tipo, tema, preguntas: n, aciertos: ok, duracion_s: Math.round(dur / 1000), equipo: EQUIPO }); enviar('api/avance', payload(p)); }
const nomModo = m => m.startsWith('tema:') ? 'Práctica por tema' : (m.startsWith('forma:') || m === 'simulacro') ? 'Simulacro' : m === 'nivel' ? 'Descubre tu nivel' : (NOMT[m] || m);
const temaModo = (m, q) => m.startsWith('tema:') ? TEMAS[m.slice(5)] : [...new Set(q.items.map(x => TEMAS[x.it.t]))].length === 1 ? TEMAS[q.items[0].it.t] : 'Mixto';
let SRVDATA = { act: [], ing: [], t: 0 };
async function cargarServidor() { if (!SRV) return; try { const [av, rs, pa] = await Promise.all([api('api/avances'), api('api/resultados'), api('api/pases')]);
  if (Array.isArray(av)) av.forEach(o => { if (o.m !== PILOTO.m && (!S.avances[o.m] || S.avances[o.m].ts <= o.ts)) S.avances[o.m] = o; });
  if (Array.isArray(rs)) rs.forEach(r => { if (!S.registro.some(x => x.m === r.m && x.code === r.code)) S.registro.push({ n: r.nombre, m: r.m, tipo: r.tipo, anio: +r.anio || r.anio, gp: r.gp, gi: r.gi, code: r.code, pts: r.pts, sal: r.sal, folio: r.folio, fecha: r.fecha, fuente: 'servidor', valido: folio(r.m, r.code, r.pts, r.sal) === r.folio }); });
  if (Array.isArray(pa)) pa.forEach(x => { const i = S.pases.findIndex(y => y.code === x.code); const o = { n: x.n, m: x.m, F: x.F, min: x.min, hh: x.hh, code: x.code, dia: x.dia, off: !!x.off }; i >= 0 ? S.pases[i] = o : S.pases.push(o); });
  save(); await cargarActividad(); } catch (e) { toast('No se pudo leer el servidor: ' + e.message); } render(); }
function campoH(r, ...ks) { for (const k of ks) if (r && r[k] != null && String(r[k]).trim() !== '') return r[k]; return ''; }
function filaActHoja(r) {
  const ts = String(campoH(r, 'ts', 'Fecha/hora', 'Fecha/Hora') || '');
  const m = normMat(campoH(r, 'm', 'Matrícula'));
  const nombre = String(campoH(r, 'nombre', 'Nombre') || '');
  const perfil = String(campoH(r, 'perfil', 'Perfil') || '');
  return {
    ts, m, nombre, perfil, anio: campoH(r, 'anio', 'Año'), gp: String(campoH(r, 'gp', 'Grupo', 'Grupo ped.') || ''),
    gi: String(campoH(r, 'gi', 'Grupo inglés') || ''), cia: String(campoH(r, 'cia', 'Compañía') || ''),
    tipo: String(campoH(r, 'tipo', 'Tipo') || ''), tema: String(campoH(r, 'tema', 'Detalle') || ''),
    preguntas: +campoH(r, 'preguntas', 'Total') || 0, aciertos: +campoH(r, 'aciertos', 'Aciertos') || 0,
    duracion_s: +campoH(r, 'duracion_s', 'Duración (s)') || 0, equipo: String(campoH(r, 'equipo', 'Equipo') || ''),
    ver: String(campoH(r, 'ver', 'Versión') || ''), modo: String(campoH(r, 'modo', 'Modo') || ''), ip: campoH(r, 'ip') || 'web',
    pct: campoH(r, 'pct', 'Porcentaje')
  };
}
async function cargarHoja() { const k = localStorage.getItem('mb1_hk') || ''; const g = h => fetch(SHEET + '?hoja=' + h + '&clave=' + encodeURIComponent(k), { cache: 'no-store' }).then(r => r.json());
  const [a, i] = await Promise.all([g('actividad'), g('ingresos')]); if (a && a.error) throw new Error('clave de lectura incorrecta');
  const rango = r => (!af.desde || String(r.ts).slice(0, 10) >= af.desde) && (!af.hasta || String(r.ts).slice(0, 10) <= af.hasta);
  SRVDATA = { act: limpioH((Array.isArray(a) ? a : []).map(filaActHoja)).filter(rango).reverse(), ing: limpioH((Array.isArray(i) ? i : []).map(filaActHoja)).filter(rango).reverse(), t: Date.now() }; }
function claveHoja() { const k = prompt('Clave de lectura de la Hoja de registro (está en tu archivo privado de códigos):', localStorage.getItem('mb1_hk') || ''); if (k == null) return; localStorage.setItem('mb1_hk', k.trim()); SRVDATA.t = 0; if (tab === 'actividad') actualizarAct(); actualizarHoja(); }
async function cargarActividad() { if (!SRV && SHEET) return cargarHoja(); const q = new URLSearchParams(); if (af.desde) q.set('desde', af.desde); if (af.hasta) q.set('hasta', af.hasta); const [a, i] = await Promise.all([api('api/actividad?' + q), api('api/ingresos?' + q)]); SRVDATA = { act: Array.isArray(a) ? a : [], ing: Array.isArray(i) ? i : [], t: Date.now() }; }

/* ---------- arranque / login ---------- */
function render() { if (S.sesion && esMando() && !SRV && SHEET) { const sk = S.sesion.m + '|' + S.sesion.nombre; if (HOJAD.k !== sk) { HOJAD.k = sk; HOJAD.n = null; HOJAD.err = 'cargando'; setTimeout(() => cargarHojaDatos().then(() => { if (S.sesion && esMando() && tab !== 'alc' && tab !== 'alcpt') render(); }), 300); } } render0(); const m = document.getElementById('alcmod'); if (m && window.ALCMOD) window.ALCMOD.mount(m); const pm = document.getElementById('alcptmod'); if (pm && window.ALCPTMOD) window.ALCPTMOD.mount(pm); if (document.getElementById('impest') && window.IMPORTA) IMPORTA.pintar(); const vm = document.getElementById('vocabmod'); if (vm && window.VOCAB) window.VOCAB.mount(vm); const em = document.getElementById('escmod'); if (em && window.ESCUCHA) window.ESCUCHA.mount(em); const cm = document.getElementById('compmod'); if (cm && window.COMPLETA) window.COMPLETA.mount(cm); if (!S.sesion && loginPerfil === 'cadete' && LG.paso === 'mat' && LG.m && $('#lprev')) prevMat(LG.m); if (window.FX) { FX.tema(S.tema); FX.vista((S.sesion ? S.sesion.perfil + '|' + S.sesion.m : 'login') + '|' + tab + '|' + loginPerfil); } }
function render0() { document.body.dataset.tema = S.tema; const app = $('#app'); if (!S.sesion) { app.innerHTML = vLogin(); return; } if (esMando()) { app.innerHTML = vMando(); return; } if (S.sesion.vistaCadete) { app.innerHTML = vUsuario(); if (window.MB1AUD) MB1AUD.bindAudioUI(app); return; } if (!P()) { S.sesion = null; return render0(); } app.innerHTML = vUsuario(); if (window.MB1AUD) MB1AUD.bindAudioUI(app); }
let loginPerfil = 'cadete';
/* v2.5: el perfil Planta ya no se ofrece. Si quedó una sesión de planta abierta, se cierra (sus datos se conservan sin cambios). */
if (S.sesion && S.sesion.perfil === 'planta') { S.sesion = null; save(); }
/* v2.12: entrada del cadete en dos pasos con autollenado por matrícula.
   1) Matrícula + código. 2) Se buscan sus datos: perfil ya existente en este equipo (entra a ese perfil; no se duplica),
   padrón cargado por Administración en este equipo, padrón de la versión privada (padron.js, nunca en la versión pública)
   o la Hoja de registro (script v3: pide el primer apellido para confirmar). Si no aparece, captura guiada con nombre y dos apellidos. */
const normMat = v => { const x = norm(v).replace(/\s+/g, ''); const m = x.match(/^([A-Z])-?(\d{6,9})$/); return m ? m[1] + '-' + m[2] : x; };
const sinAcento = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
let LG = { paso: 'mat', m: '', cod: '', dato: null, fuente: '', intentos: 0, buscando: false };
function padronTodo() { const L = (S.padron || []).map(c => ({ n: c.n, m: normMat(c.m), a: c.a, gp: c.gp, gi: c.gi, cia: c.cia, f: 'padrón de este equipo' })); (window.MB1PADRON || []).forEach(r => { const m = normMat(r[0]); if (m && !L.some(x => x.m === m)) L.push({ n: String(r[1] || '').trim(), m, a: parseInt(r[2]) || '', gp: norm(r[3]), gi: norm(r[4]), cia: String(r[5] || '').trim(), f: 'lista oficial (versión privada)' }); }); return L; }
function buscarLocal(m0) { const m = normMat(m0); if (!m) return {}; const pf = S.perfiles[m] || S.perfiles[norm(m0)]; const pd = padronTodo().find(x => x.m === m); return { perfil: pf && !pf.piloto && !pf.vistaSolo && pf.perfil === 'cadete' ? pf : null, padron: pd || null }; }
const anioTxt = a => a ? `${a}${a == 1 || a == 3 ? '/er.' : '/o.'} año` : '';
function fichaDatos(d) { return `<div class="lficha"><b>${esc(d.n)}</b><span>${esc(d.m)}${d.a ? ' · ' + anioTxt(d.a) : ''}${d.gp ? ' · grupo ' + esc(d.gp) : ''}${d.gi ? ' · inglés ' + esc(d.gi) : ''}${d.cia ? ' · ' + esc(d.cia) + ' cía.' : ''}</span></div>`; }
function prevMat(v) { const el = $('#lprev'); if (!el) return; LG.m = v; const r = buscarLocal(v); el.innerHTML = r.perfil ? `<div class="lprev ok">✓ Ya tienes perfil en este equipo. Entrarás a él.${fichaDatos({ n: r.perfil.nombre, m: r.perfil.m, a: r.perfil.anio, gp: r.perfil.gp, gi: r.perfil.gi, cia: r.perfil.cia })}</div>` : r.padron ? `<div class="lprev ok">✓ Encontramos tus datos en la lista:${fichaDatos(r.padron)}</div>` : (normMat(v).length >= 6 ? `<p class="mini">Al continuar buscaremos tus datos con tu matrícula.</p>` : ''); }
function vLoginCadete() {
  const P2 = LG.paso;
  if (P2 === 'confirma' && LG.dato) return `<section class="card lconf"><h3>¿Eres tú?</h3>${fichaDatos(LG.dato)}<p class="mini">Datos tomados de la ${esc(LG.fuente || 'lista oficial')}. Si algo está mal, avisa a la Mesa de Inglés.</p><button class="btn big" onclick="confirmarCadete()">Sí, soy yo · Entrar</button><button class="btn ghost" style="width:100%;margin-top:8px" onclick="noSoyYo()">No soy yo</button></section>`;
  if (P2 === 'apellido') return `<section class="card"><h3>Confirma tu identidad</h3><p class="mini">Matrícula <b>${esc(LG.m)}</b>. Escribe tu <b>primer apellido</b> para buscar tus datos en la lista oficial.</p><label>Primer apellido<input id="lap" autocomplete="family-name" autocapitalize="characters" placeholder="Ej. Hernandez" onkeydown="if(event.key==='Enter')buscarEnLinea()"></label><button class="btn big" onclick="buscarEnLinea()" ${LG.buscando ? 'disabled' : ''}>${LG.buscando ? 'Buscando…' : 'Buscar mis datos'}</button><div class="row"><button class="btn ghost" style="flex:1" onclick="LG.paso='mat';render()">← Cambiar matrícula</button>${LG.intentos >= 1 && !exigeLista() ? `<button class="btn ghost" style="flex:1" onclick="LG.paso='manual';render()">Capturar a mano</button>` : ''}</div></section>`;
  if (P2 === 'manual') { const est = exigeLista(); return est ? `<section class="card aviso"><h3>Matrícula no encontrada</h3><p>La matrícula <b>${esc(LG.m)}</b> no aparece en la lista de este equipo. Revisa que esté bien escrita o acude a la Mesa de Inglés para que te den de alta.</p><button class="btn" onclick="LG.paso='mat';render()">← Corregir matrícula</button></section>` :
    `<section class="card"><h3>Completa tus datos</h3><p class="mini">No encontramos la matrícula <b>${esc(LG.m)}</b> en la lista de este equipo. Escríbelos completos y tal cual la lista oficial; se guardan una sola vez con tu matrícula.</p>
    <label>Nombre(s)<input id="mnom" autocomplete="given-name" placeholder="Ej. Maria Fernanda"></label><div class="g2"><label>Primer apellido<input id="map1" autocomplete="family-name" placeholder="Ej. Lopez"></label><label>Segundo apellido<input id="map2" placeholder="Ej. Ramirez"></label></div>
    <label class="chk"><input type="checkbox" id="m1ap"> Solo tengo un apellido</label>
    <div class="g2"><label>Año<select id="lanio">${[1, 2, 3, 4].map(a => `<option value="${a}">${anioTxt(a)}</option>`).join('')}</select></label><label>Compañía<input id="lcia" placeholder="Ej. 1/a."></label></div>
    <div class="g2"><label>Grupo pedagógico<input id="lgp" placeholder="Ej. 2B"></label><label>Grupo de inglés<input id="lgi" placeholder="Ej. 3"></label></div>
    <button class="btn big" onclick="entrarManual()">Entrar</button><button class="btn ghost" style="width:100%;margin-top:8px" onclick="LG.paso='mat';render()">← Corregir matrícula</button></section>`; }
  return `<label>Matrícula<input id="lmat" autocapitalize="characters" autocomplete="username" placeholder="Ej. A-12345678" value="${esc(LG.m)}" oninput="prevMat(this.value)"></label><div id="lprev"></div>
  <label>Código de acceso<input id="lcod" type="password" autocapitalize="characters" onkeydown="if(event.key==='Enter')continuarCadete()"></label>
  <button class="btn big" onclick="continuarCadete()">Continuar</button>`;
}
function vLogin() {
  const c = loginPerfil === 'cadete';
  return `<div class="login"><div class="brand"><img src="icon.svg" alt=""><div><h1>Misión: Obtener la Barra I</h1><p>Mesa de Inglés · Esc. Mil. Enfría.</p></div></div>
  <div class="seg">${['cadete', 'directora', 'admin'].map(k => `<button class="${loginPerfil === k ? 'on' : ''}" onclick="loginPerfil='${k}';LG.paso='mat';render()">${{ cadete: 'Cadete', directora: 'Directora', planta: 'Planta', admin: 'Administración' }[k]}</button>`).join('')}</div>
  ${c ? vLoginCadete() : `<label>Nombre completo<input id="lnom" autocomplete="name" placeholder="Como aparece en la lista oficial"></label>
  <label>Matrícula<input id="lmat" autocapitalize="characters" placeholder="Ej. A-12345678"></label>
  <label>Código de acceso<input id="lcod" type="password" autocapitalize="characters" onkeydown="if(event.key==='Enter')entrar()"></label>
  <button class="btn big" onclick="entrar()">Entrar</button>`}
  <p class="mini" style="text-align:center;margin:0 0 10px"><a href="manual.html" target="_blank" rel="noopener">Manual del cadete: instálala, entra y descarga los bancos</a></p>
  <div class="row"><button class="btn ghost" style="flex:1" onclick="ayuda()">Instructivos</button><button class="btn ghost" style="flex:1" onclick="entrarPiloto()">Usuario piloto</button></div>
  <p class="mini">Tus datos se guardan solo en este dispositivo. Funciona sin internet una vez abierta.</p></div>`;
}
async function continuarCadete() {
  const m = normMat($('#lmat').value), cod = norm($('#lcod').value);
  if (!m) return toast('Escribe tu matrícula.'); if (!/^[A-Z0-9-]{5,20}$/.test(m)) return toast('Revisa tu matrícula: solo letras, números y guion.');
  if (!cod) return toast('Escribe el código de acceso.'); if (!SRV && hc(cod) !== S.codes.cadete) return toast('Código de acceso incorrecto.');
  LG.m = m; LG.cod = cod; LG.intentos = 0; const r = buscarLocal(m);
  if (r.perfil) { const pd = r.padron; return entrarCadete({ n: pd ? pd.n : r.perfil.nombre, m: r.perfil.m, a: pd ? pd.a : r.perfil.anio, gp: pd ? pd.gp : r.perfil.gp, gi: pd ? (pd.gi || r.perfil.gi) : r.perfil.gi, cia: pd ? (pd.cia || r.perfil.cia) : r.perfil.cia }); }
  if (r.padron) { LG.dato = r.padron; LG.fuente = r.padron.f; LG.paso = 'confirma'; return render(); }
  if (SRV) { try { const x = await api('api/padron?m=' + encodeURIComponent(m)); if (x && x.ok && x.n) { LG.dato = { n: x.n, m, a: x.a, gp: x.gp, gi: x.gi, cia: x.cia }; LG.fuente = 'lista del servidor de intranet'; LG.paso = 'confirma'; return render(); } } catch (e) { } }
  else if (SHEET && navigator.onLine) { toast('Buscando tus datos…'); const v = await verHoja(); if (v >= 3) { LG.paso = 'apellido'; return render(); } }
  LG.paso = 'manual'; render();
}
async function buscarEnLinea() {
  const ap = ($('#lap').value || '').trim(); if (ap.length < 2) return toast('Escribe tu primer apellido.');
  LG.buscando = true; render(); let x = null;
  try { const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 9000); x = await fetch(SHEET + '?hoja=matricula&m=' + encodeURIComponent(LG.m) + '&ap=' + encodeURIComponent(sinAcento(ap)), { cache: 'no-store', signal: ctl.signal }).then(r => r.json()); clearTimeout(t); } catch (e) { x = { red: true }; }
  LG.buscando = false; LG.intentos++;
  if (x && x.ok && x.n) { LG.dato = { n: String(x.n).trim(), m: LG.m, a: parseInt(x.a) || '', gp: norm(x.gp), gi: norm(x.gi), cia: String(x.cia || '').trim(), ap: ap }; LG.fuente = 'lista oficial (Hoja de la Mesa de Inglés)'; LG.paso = 'confirma'; return render(); }
  render(); toast(x && x.red ? 'Sin conexión con la lista. Puedes capturar tus datos a mano.' : 'No encontramos esa matrícula con ese apellido. Revisa ambos datos.');
}
function confirmarCadete() { if (LG.dato) entrarCadete(LG.dato); }
function noSoyYo() { LG.paso = 'mat'; LG.dato = null; render(); toast('Revisa tu matrícula. Si tus datos están mal en la lista, avisa a la Mesa de Inglés.'); }
function entrarManual() {
  const t = id => ($('#' + id).value || '').trim().replace(/\s+/g, ' '), nom = t('mnom'), a1 = t('map1'), a2 = t('map2'), uno = $('#m1ap').checked;
  if (nom.length < 2) return toast('Escribe tu nombre o nombres completos.'); if (a1.length < 2) return toast('Escribe tu primer apellido.'); if (!uno && a2.length < 2) return toast('Escribe tu segundo apellido (o marca «Solo tengo un apellido»).');
  if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' .-]+$/.test(nom + a1 + a2)) return toast('El nombre solo puede llevar letras.');
  if (!t('lgp')) return toast('Escribe tu grupo pedagógico.');
  entrarCadete({ n: [nom, a1, uno ? '' : a2].filter(Boolean).join(' '), m: LG.m, a: +$('#lanio').value, gp: t('lgp'), gi: t('lgi'), cia: t('lcia'), ap: a1, manual: true });
}
function entrarCadete(d) {
  const m = d.m, nombre = d.n, extra = { anio: parseInt(d.a) || '', gp: norm(d.gp), gi: norm(d.gi), cia: String(d.cia || '').trim() }; if (d.ap) extra.ap = String(d.ap).trim();
  if (SRV && !srvOk) { api('api/login', Object.assign({ perfil: 'cadete', nombre, m, codigo: LG.cod, equipo: EQUIPO }, extra)).then(r => { if (!r.ok) { LG.paso = 'mat'; render(); return toast(r.error || 'Código de acceso incorrecto.'); } srvOk = true; entrarCadete(d); srvOk = false; }).catch(() => { SRV = false; entrarCadete(d); }); return; }
  if (!srvOk && hc(LG.cod) !== S.codes.cadete) { LG.paso = 'mat'; render(); return toast('Código de acceso incorrecto.'); }
  const nuevo = !S.perfiles[m]; S.sesion = { perfil: 'cadete', nombre, m };
  S.perfiles[m] = Object.assign(S.perfiles[m] || nuevoPerfil({ m }), { nombre, perfil: 'cadete' }, extra, d.manual ? { datosManual: true } : { datosManual: false });
  if (!SRV && SHEET && !S.perfiles[m].piloto) { hojaPost('login', Object.assign({ ts: tsLocal(), perfil: 'cadete', nombre, m, anio: extra.anio || '', gp: extra.gp || '', gi: extra.gi || '', cia: extra.cia || '', equipo: EQUIPO }, window.USO ? USO.datosLoginExtra() : {})); hojaPost('avance', filaAvance(payload(S.perfiles[m]))); if (window.USO) setTimeout(() => USO.pulso(true), 500); }
  LG = { paso: 'mat', m: '', cod: '', dato: null, fuente: '', intentos: 0, buscando: false }; tab = 'hoy'; save(); render(); scrollTo(0, 0);
  toast(nuevo ? `¡Bienvenida/o, ${nombre.split(' ')[0]}! Personaliza tu perfil ✨` : `Hola de nuevo, ${nombre.split(' ')[0]}`);
}
let srvOk = false;
function entrar() {
  if (loginPerfil === 'cadete' && !$('#lnom')) return continuarCadete();
  const nombre = $('#lnom').value.trim(), m = norm($('#lmat').value), cod = norm($('#lcod').value);
  if (!nombre || !m) return toast('Escribe nombre y matrícula.');
  if (SRV && !srvOk) { const ex = loginPerfil === 'cadete' ? { anio: $('#lanio').value, gp: norm($('#lgp').value), gi: norm($('#lgi').value), cia: $('#lcia').value.trim() } : {};
    api('api/login', Object.assign({ perfil: loginPerfil, nombre, m, codigo: cod, equipo: EQUIPO }, ex)).then(r => { if (!r.ok) return toast(r.error || 'Código de acceso incorrecto.'); if (loginPerfil === 'admin') { CLAVE = cod; sessionStorage.setItem('mb1_k', cod); if (r.codes) S.codes = Object.fromEntries(Object.entries(r.codes).map(([k, v]) => [k, hc(v)])); } srvOk = true; entrar(); srvOk = false; if (loginPerfil === 'admin') cargarServidor(); }).catch(() => { SRV = false; entrar(); }); return; }
  if (!srvOk && hc(cod) !== S.codes[loginPerfil]) return toast('Código de acceso incorrecto.');
  S.sesion = { perfil: loginPerfil, nombre, m };
  if (loginPerfil === 'cadete' || loginPerfil === 'planta') {
    const extra = loginPerfil === 'cadete' ? { anio: +$('#lanio').value, gp: norm($('#lgp').value), gi: norm($('#lgi').value), cia: $('#lcia').value.trim() } : { anio: 0 };
    S.perfiles[m] = Object.assign(S.perfiles[m] || nuevoPerfil({ m }), { nombre, perfil: loginPerfil }, extra);
    if (!SRV && SHEET && !S.perfiles[m].piloto) { hojaPost('login', Object.assign({ ts: tsLocal(), perfil: loginPerfil, nombre, m, anio: extra.anio || '', gp: extra.gp || '', gi: extra.gi || '', cia: extra.cia || '', equipo: EQUIPO }, window.USO ? USO.datosLoginExtra() : {})); if (loginPerfil === 'cadete') hojaPost('avance', filaAvance(payload(S.perfiles[m]))); if (loginPerfil === 'cadete' && window.USO) setTimeout(() => USO.pulso(true), 500); }
  } else if (loginPerfil === 'directora' && !SRV && SHEET) {
    /* v2.9: el ingreso de la Directora se registra en «ingresos». v2.15: también versión, modo (con/sin internet) y pulso de dispositivo. */
    hojaPost('login', Object.assign({ ts: tsLocal(), perfil: 'directora', nombre: nombre || 'Directora', m, anio: '', gp: '', gi: '', cia: '', equipo: EQUIPO }, window.USO ? USO.datosLoginExtra() : {}));
    if (window.USO) setTimeout(() => USO.pulso(true), 500);
  }
  tab = (loginPerfil === 'admin' || loginPerfil === 'directora') ? 'avance' : 'hoy'; save(); render();
}
function entrarPiloto() { const c = prompt('Código del usuario piloto (lo da la Mesa de Inglés):'); if (c == null) return; if (hc(norm(c)) !== PILOTO.ch) return toast('Código de piloto incorrecto.');
  if (!REAL) { REAL = S; S = base(); S.codes = { ...REAL.codes }; S.tema = REAL.tema; } S.perfiles[PILOTO.m] = crearPiloto(); S.sesion = { perfil: 'cadete', nombre: PILOTO.nombre, m: PILOTO.m }; tab = 'hoy'; save(); render(); if (confirm('¿Activar el modo presentación (guion paso a paso)?')) presentar(0); }
function salir() { if (esPiloto()) { if (!confirm('¿Cerrar el usuario piloto? Su práctica de ejemplo se borra y el equipo queda en cero.')) return; salirSandbox(); render(); return; } if (!confirm('¿Cerrar sesión? Tu avance queda guardado en este dispositivo.')) return; S.sesion = null; save(); render(); }

let tab = 'hoy';
function vUsuario() {
  const p = P(), tabs = [['hoy', 'Hoy', '☀'], ['practicar', 'Practicar', '✎'], ['escucha', 'Listening', '🎧'], ['vocab', 'Vocab', '❖'], ['simulacro', 'Simulacro', '⏱'], ['sombra', 'Mi sombra', '⚑'], ['alcpt', 'ALCPT', '◎'], ['alc', 'ALC', '▤']];
  if (tab === 'ejercicio' || tab === 'aplicar') tab = 'simulacro';
  const body = { hoy: vHoy, practicar: vPracticar, tecnicas: vTecnicas, simulacro: vEjercicio, ejercicio: vEjercicio, sombra: vSombra, alc: vAlc, alcpt: vAlcpt, vocab: vVocab, escucha: vEscucha, completa: vCompleta, perfil: vPerfilTab, calif: vCalifTab }[tab] || vHoy;
  return `<header>${window.PERFIL ? `<button class="avbtn" onclick="tab='perfil';render();scrollTo(0,0)" title="Mi perfil">${PERFIL.avatar(p, 'sm')}</button>` : ''}<div><b>${esc(p.nombre)}</b><span>${S.sesion && S.sesion.vistaCadete ? 'Vista cadete · solo consulta' : (p.perfil === 'cadete' ? `${p.anio}° año · ${esc(p.gp || '')}` : 'Planta docente')}</span></div>${S.sesion && S.sesion.vistaCadete ? `<button class="ico" onclick="cerrarVistaCadete()" title="Volver al Centro de mando">←</button>` : ''}<button class="ico" onclick="ayuda()" title="Ayuda">?</button><button class="ico" onclick="tema()" title="Tema">◐</button><button class="ico" onclick="salir()" title="Cerrar sesión">⎋</button></header>
  ${p.piloto ? `<div class="pilotbar">Usuario piloto · demostración <button onclick="presentar(GUION_I||0)">Guion</button></div>` : ''}<main>${body(p)}</main><nav class="tabbar${tabs.length > 7 ? ' t7 t8' : tabs.length > 6 ? ' t7' : ''}">${tabs.map(([k, l, i]) => `<button class="${tab === k ? 'on' : ''}" onclick="tab='${k}';render();scrollTo(0,0)"><i>${i}</i>${l}</button>`).join('')}</nav>`;
}
/* v2.8: la pestaña ALC es solo práctica y simulacro (el material se guarda en el dispositivo; no se muestran formas ni bancos). */
/* v2.11: Vocabulario · flash cards y ejercicios con repetición espaciada (vocab.js). El progreso se guarda solo en este dispositivo. */
/* v2.12: Listening Lab y Completa la palabra (practica.js) y perfil del cadete (perfil.js). */
function vEscucha() { return '<div id="escmod">' + (window.ESCUCHA ? '' : '<section class="card"><p class="mini">Cargando Listening Lab…</p></section>') + '</div>'; }
function vCompleta() { return '<div id="compmod">' + (window.COMPLETA ? '' : '<section class="card"><p class="mini">Cargando ejercicios…</p></section>') + '</div>'; }
function vPerfilTab(p) { return window.PERFIL ? PERFIL.vPerfil(p) : '<section class="card"><p class="mini">Cargando perfil…</p></section>'; }
function vCalifTab(p) { return window.CALIF ? CALIF.vCadete(p) : '<section class="card"><p class="mini">Cargando calificaciones…</p></section>'; }
function escuchaHoy() { if (!window.ESCUCHA) return ''; let r; try { r = ESCUCHA.resumen(); } catch (e) { return ''; } return `<section class="card hoyvoc hoyesc" onclick="tab='escucha';render();scrollTo(0,0)"><div class="ic">🎧</div><div><h3>Listening Lab · tu área de oportunidad</h3><p class="mini">${r.hoy ? `<b>${r.hoy}</b> audios hoy · ` : 'Aún no entrenas el oído hoy · '}${r.pts.toLocaleString('es-MX')} pts · nivel ${r.nivel}. Dictado, diálogos, números y más.</p></div></section>`; }
function vVocab() { return '<div id="vocabmod">' + (window.VOCAB ? '' : '<section class="card"><p class="mini">Cargando vocabulario…</p></section>') + '</div>'; }
function vocabHoy() { if (!window.VOCAB) return ''; let r; try { r = VOCAB.resumen(); } catch (e) { return ''; } return `<section class="card hoyvoc" onclick="tab='vocab';render();scrollTo(0,0)"><div class="ic">❖</div><div><h3>Vocabulario · flash cards</h3><p class="mini">${r.pend ? `<b>${r.pend}</b> tarjeta(s) para repasar hoy` : 'Sin repasos pendientes'} · ${r.nuevas} nuevas disponibles · ALCPT y ALC</p></div></section>`; }
/* v2.16: vuelve la sección ALCPT (práctica y simulacro con reactivos originales tipo ALCPT; misma vista que ALC, alc.js). */
function vAlcpt() { return '<div id="alcptmod">' + (window.ALCPTMOD ? '' : '<section class="card"><p class="mini">Cargando la práctica ALCPT…</p></section>') + '</div>'; }
function vAlc() { return '<div id="alcmod">' + (window.ALCMOD ? '' : '<section class="card"><p class="mini">Cargando la práctica ALC…</p></section>') + '</div>'; }
function tema() { S.tema = S.tema === 'claro' ? 'oscuro' : 'claro'; save(); render(); }
const TECNICAS = [
  ['Bloque de concentración', 'Trabaja 25 min sin celular ni distracciones y descansa 5. Cuatro bloques = descanso largo. La app cuenta tus minutos.'],
  ['Tarjetas con repetición espaciada', 'Repasa vocabulario justo antes de olvidarlo: lo que sabes vuelve en días; lo que fallas, mañana. Usa la pestaña "Vocab" (ALCPT y ALC) y "Tarjetas" en Hoy.'],
  ['Técnica Feynman', 'Explica en voz alta, con palabras simples, una regla gramatical como si se la enseñaras a un compañero de 1/er. año.'],
  ['Anclas de memoria', 'Une cada palabra nueva a una imagen o situación del servicio: SPLINT = la férula que pusiste en práctica clínica.'],
  ['Dictado', 'Escucha un audio y escríbelo completo. Compara palabra por palabra: entrenas oído y ortografía a la vez. Pruébalo abajo.'],
  ['Repetir en eco', 'Repite el audio justo detrás del hablante, imitando ritmo y entonación. Mejora listening y pronunciación.'],
  ['Misión mixta', 'Mezclar temas obliga al cerebro a elegir la regla correcta, igual que en un simulacro. Rinde más que repetir un solo tema.'],
  ['Simulación', 'Presenta un simulacro completo con tiempo real, sin pausas. Acostumbra al cansancio y al ritmo del examen.'],
  ['Hábitos que rinden poco', 'Releer y subrayar sin practicar, estudiar todo la noche anterior y traducir palabra por palabra. Sustitúyelos por práctica activa.']];
const tecnicaHoy = () => TECNICAS[Math.floor(Date.now() / 864e5) % TECNICAS.length];
const INSIGNIAS = [['primera', 'Primera misión', p => p.tools.mision > 0], ['q100', '100 preguntas', p => p.ans.length >= 100], ['q500', '500 preguntas', p => p.ans.length >= 500], ['racha3', 'Racha de 3 días', p => racha(p) >= 3], ['racha7', 'Racha de 7 días', p => racha(p) >= 7], ['oido', 'Buen oído (50 listening)', p => ['lir', 'lic', 'lin'].reduce((s, t) => s + ((p.tema[t] || [])[1] || 0), 0) >= 50], ['forma', 'Simulacro completo', p => p.tools.forma > 0], ['meta', 'Meta del año alcanzada', p => p.anio && estimado(p) >= METAS[p.anio]], ['barra', 'Nivel Barra I', p => estimado(p) >= 60], ['sombra', 'Con sombra', p => !!p.sombra]];
function vHoy(p) {
  INSIGNIAS.forEach(([k, , f]) => { if (f(p) && !p.ins[k]) { p.ins[k] = hoy(); save(); } });
  const est = estimado(p), meta = METAS[p.anio] || 60, min = Math.round((p.dias[hoy()] || {}).min || 0), pct = Math.min(100, Math.round(100 * min / p.meta)), tec = tecnicaHoy();
  const hecha = (p.tools['mision:' + hoy()] || 0) > 0, w = semana(p, lunes()), ranking = rankingSemanal(p, 'anio').slice(0, 3);
  const sinEnviar = !p.piloto && p.perfil === 'cadete' && p.ans.length >= 10 && (!p.ultAvance || Date.now() - p.ultAvance > 3 * 864e5);
  return `${window.PERFIL ? PERFIL.hoyCard(p) : ''}${window.CALIF ? CALIF.hoyCard(p) : ''}${p.perfil === 'planta' ? cardPase(p) : ''}${sinEnviar ? `<section class="card aviso"><b>Tu coordinadora todavía no ve tu práctica.</b> <button class="btn sm" onclick="enviarAvance();document.querySelector('#avout').scrollIntoView()">Generar mi código de avance</button></section>` : ''}
  ${!p.ans.length ? `<section class="card aviso2"><h3>Descubre tu nivel</h3><p class="mini">12 preguntas, unos 8 minutos, sin calificación. Con ellas la app arma tu ruta.</p><button class="btn" onclick="iniciar('nivel')">Empezar</button></section>` : ''}
  <section class="kpis k3"><div><b>${xp(p).toLocaleString('es-MX')}</b><span>XP</span></div><div><b>${racha(p)}</b><span>Días seguidos</span></div><div><b>${est ?? '—'}</b><span>Puntaje estimado</span></div></section>
  <section class="card hero"><div class="ring" style="--p:${pct}"><b>${min}</b><span>de ${p.meta} min</span></div><div><h2>Meta diaria</h2><p>${pct >= 100 ? '¡Cumplida! 🎖' : 'Racha: ' + racha(p) + ' día(s)'}</p><button class="btn" onclick="iniciar('mision')">${hecha ? 'Repetir' : 'Iniciar'} Misión de hoy · 8</button></div></section>
  <section class="card"><h3>Puntaje estimado</h3>${est == null ? `<p class="mini">Responde al menos 20 preguntas para estimarlo (llevas ${p.ans.length}).</p>` :
      `<div class="score"><b>${est}</b><div class="bar"><i style="width:${est}%"></i><em style="left:${meta}%">${meta}</em><em class="gold" style="left:60%">60</em></div></div>
      <p>${p.perfil === 'cadete' ? (p.anio == 4 ? '' : (est >= meta ? `Ya alcanzas la meta de ${p.anio}° año (${meta}). ` : `Te faltan <b>${meta - est}</b> puntos para la meta de ${p.anio}° año. `)) : ''}${est >= 60 ? '¡Nivel Barra I!' : `Te faltan <b>${60 - est}</b> puntos para la Barra I.`}</p>${grafica(p)}`}</section>
  ${escuchaHoy()}${vocabHoy()}
  <section class="card"><h3>Técnica del día · ${esc(tec[0])}</h3><p>${esc(tec[1])}</p><button class="btn sm ghost" onclick="tab='tecnicas';render();scrollTo(0,0)">Ver todas las técnicas</button></section>
  <section class="row2"><button class="tile" onclick="iniciarTarjetas()"><b>Tarjetas</b><span>${tarjetasPendientes(p).length} por repasar</span></button><button class="tile" onclick="tab='sombra';render()"><b>Competencia</b><span>${ranking.length > 1 ? ranking.map((r, i) => `${i + 1}. ${esc(r.n.split(' ')[0])} ${r.w}`).join(' · ') : 'Esta semana: ' + w[1] + ' aciertos'}</span></button></section>
  <section class="card"><h3>Insignias</h3><div class="badges">${INSIGNIAS.map(([k, l]) => `<span class="${p.ins[k] ? 'on' : ''}">${p.ins[k] ? '🏅' : '○'} ${l}</span>`).join('')}</div></section>
  <section class="card" id="audio-cfg"><h3>Audio</h3>
  <p class="mini">Las preguntas de comprensión auditiva usan grabaciones. Si no hay grabación, se lee con la voz en inglés de este dispositivo. Si no se oye nada, revisa el volumen y, en iPad, el interruptor de silencio; luego oprime <b>Probar voz</b>. Cambiar la voz solo afecta las lecturas, no las grabaciones.</p>
  <label>Voz en inglés<select id="vozsel">${window.MB1AUD?MB1AUD.opcionesVoz():'<option value="">Voz del dispositivo</option>'}</select></label>
  <label>Velocidad<select id="ratesel">${[[.8,'Lenta'],[.9,'Normal'],[1,'Rápida']].map(([v,l])=>`<option value="${v}" ${window.MB1AUD&&MB1AUD.rateGuardada(.9)===v?'selected':''}>${l}</option>`).join('')}</select></label>
  <button class="btn ghost" type="button" id="probarvoz">Probar voz</button></section>
  <section class="card"><h3>Enviar mi avance</h3><p class="mini">Genera tu código y envíalo a la Mesa de Inglés (por WhatsApp). El más reciente reemplaza al anterior.</p>
  <div class="row"><button class="btn" id="btnav" onclick="enviarAvance()">Generar código</button><button class="btn ghost" onclick="salir()">Cerrar sesión</button></div><div id="avout"></div></section>`;
}
function grafica(p) { const h = Object.entries(p.hist || {}).sort().slice(-14); if (h.length < 2) return ''; const v = h.map(x => x[1]), mn = Math.min(...v, 40) - 2, mx = Math.max(...v, 60) + 2, W = 300, H = 90, X = i => 10 + i * (W - 20) / (h.length - 1), Y = y => H - 10 - (y - mn) * (H - 20) / (mx - mn);
  return `<svg class="graf" viewBox="0 0 ${W} ${H}"><line x1="0" x2="${W}" y1="${Y(60)}" y2="${Y(60)}" class="g60"/><text x="${W - 4}" y="${Y(60) - 3}" text-anchor="end">Barra I 60</text><polyline points="${v.map((y, i) => X(i) + ',' + Y(y)).join(' ')}"/>${v.map((y, i) => i === 0 || i === v.length - 1 ? `<circle cx="${X(i)}" cy="${Y(y)}" r="3.5"/><text x="${X(i)}" y="${Y(y) - 7}" text-anchor="middle">${y}</text>` : '').join('')}</svg><p class="mini">Tu avance: de ${v[0]} a ${v[v.length - 1]} puntos.</p>`; }
function enviarAvance() { if (esPiloto()) return toast('El usuario piloto no envía avance (solo demostración).'); if (S.sesion && (S.sesion.vistaCadete || (P() && P().vistaSolo))) return toast('Vista de consulta.'); P().ultAvance = Date.now(); usar('avance'); const p = P(), c = codigoAvance(p), txt = `Avance Misión Barra I — ${p.nombre} (${p.m})\n${c}`;
  $('#avout').innerHTML = `<textarea readonly class="code" id="avcode">${esc(c)}</textarea><div class="row"><button class="btn" onclick="copiar($('#avcode').value)">Copiar</button><a class="btn ghost" target="_blank" rel="noopener" href="https://wa.me/?text=${encodeURIComponent(txt)}">WhatsApp</a></div>`; }
function copiar(t) { const f = () => { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); toast('Copiado'); }; if (navigator.clipboard) navigator.clipboard.writeText(t).then(() => toast('Copiado'), f); else f(); }
function vPracticar(p) {
  const errs = Object.keys(p.err).length;
  return `<section class="card"><h3>Meta diaria</h3><div class="seg">${[5, 10, 15, 20].map(m => `<button class="${p.meta === m ? 'on' : ''}" onclick="P().meta=${m};save();render()">${m} min</button>`).join('')}</div></section>
  <section class="grid">
   <button class="tile" onclick="iniciar('mision')"><b>Misión de hoy</b><span>8 preguntas del día</span></button>
   <button class="tile" onclick="iniciar('errores')" ${errs ? '' : 'disabled'}><b>Repasar mis errores</b><span>${errs} pendientes</span></button>
   <button class="tile" onclick="iniciar('mixta')"><b>Misión mixta</b><span>15 de todos los temas</span></button>
   <button class="tile" onclick="iniciar('listening')"><b>Listening rápido</b><span>5 audios</span></button>
   <button class="tile" onclick="iniciar('debil')"><b>Mi tema más débil</b><span>${esc(TEMAS[temaDebil(p)] || '—')}</span></button>
   <button class="tile" onclick="iniciarTarjetas()"><b>Tarjetas</b><span>Repetición espaciada</span></button></section>
  <section class="grid g-new"><button class="tile tnew tesc" onclick="tab='escucha';render();scrollTo(0,0)"><b>🎧 Listening Lab</b><span>8 juegos · niveles y rachas</span></button><button class="tile tnew tcomp" onclick="tab='completa';render();scrollTo(0,0)"><b>🧩 Completa la palabra</b><span>Gramática, verbos y vocabulario</span></button><button class="tile tnew tverb" onclick="tab='vocab';render();scrollTo(0,0)"><b>⟳ Verbos</b><span>Regulares e irregulares en Vocab</span></button><button class="tile tnew" onclick="tab='tecnicas';render();scrollTo(0,0)"><b>★ Técnicas</b><span>Cómo estudiar mejor</span></button><button class="tile tnew" onclick="tab='calif';render();scrollTo(0,0)"><b>📊 Calificaciones</b><span>Historial oficial vs meta</span></button></section>
  <section class="card"><h3>Práctica por tema</h3>${Object.entries(TEMAS).map(([k, l]) => { const t = p.tema[k] || [0, 0]; const d = t[0] ? Math.round(100 * t[1] / t[0]) : 0; return `<button class="tema" onclick="iniciar('tema:${k}')"><span>${l}</span><div class="bar sm"><i style="width:${d}%"></i></div><small>${t[0] ? d + '%' : '—'}</small></button>`; }).join('')}</section>`;
}
function temaDebil(p) { let best = 'tie', v = 2; for (const k in TEMAS) { if (k === 'lin') continue; const t = p.tema[k]; const d = t && t[0] >= 3 ? t[1] / t[0] : 0.5; if (d < v) { v = d; best = k; } } return best; }
function vTecnicas() { return TECNICAS.map(([t, d], i) => `<section class="card"><h3>${i + 1}. ${esc(t)}</h3><p>${esc(d)}</p></section>`).join('') + `<section class="card"><h3>Dictado con audio</h3><p class="mini">Escucha, escribe y compara.</p><button class="btn" onclick="dictado()">Nuevo dictado</button><div id="dic"></div></section>`; }
let dicItem = null;
function dictado() { const L = BANCO.filter(b => b.t === 'lic'); dicItem = L[Math.floor(Math.random() * L.length)]; usar('dictado'); $('#dic').innerHTML = `<div class="row"><button class="btn ghost" onclick="hablar(dicItem.au,.85)">▶ Escuchar</button><button class="btn ghost" onclick="hablar(dicItem.au,.6)">▶ Lento</button></div><textarea id="dict" placeholder="Escribe lo que oyes"></textarea><button class="btn" onclick="compDict()">Comparar</button><div id="dicr"></div>`; hablar(dicItem.au, .85); }
function compDict() { const cl = s => s.toLowerCase().replace(/[^a-z' ]/g, '').split(/\s+/).filter(Boolean); const a = cl(dicItem.au), b = cl($('#dict').value); const ok = a.filter((w, i) => b[i] === w).length; $('#dicr').innerHTML = `<p><b>${Math.round(100 * ok / a.length)}%</b> · ${a.map((w, i) => b[i] === w ? w : `<mark>${w}</mark>`).join(' ')}</p>`; }
function vEjercicio(p) {
  const ult = p.formas && Object.values(p.formas).length ? Math.max(...Object.values(p.formas).map(Number).filter(x => !isNaN(x))) : null;
  return `<section class="card"><h3>Ejercicio corto</h3><p class="mini">20 preguntas · 15 min · con revisión al final.</p><button class="btn" onclick="iniciar('corto')">Comenzar</button></section>
  <section class="card"><h3>Simulacro</h3><p class="mini">100 preguntas (comprensión auditiva y lectura) · 70 min · con revisión al final. Es práctica: no es un resultado oficial.</p>
  ${ult != null ? `<p class="mini">Último resultado en este equipo: <b>${ult}%</b></p>` : ''}
  <button class="btn" onclick="iniciar('simulacro')">Iniciar simulacro</button></section>`;
}
function tablaRes(rs, full) { if (!rs.length) return '<p class="mini">Sin resultados.</p>'; return `<div class="tw"><table><tr>${full ? '<th>Evaluado</th><th>Tipo</th><th>Matrícula</th>' : ''}<th>Fecha</th><th>Código</th><th>Puntaje</th><th>Salidas</th><th>Folio</th></tr>${rs.slice().reverse().map(r => `<tr>${full ? `<td>${esc(r.n)}</td><td>${r.tipo}</td><td>${esc(r.m)}</td>` : ''}<td>${r.fecha}</td><td>${r.code}</td><td><b>${r.pts}</b></td><td>${r.sal}</td><td class="mono">${r.folio}</td></tr>`).join('')}</table></div>`; }
function rankingSemanal(p, por) { const me = payload(p), list = [me, ...Object.values(p.comps || {}).filter(c => c.m !== p.m)]; const k = { anio: 'a', grupo: 'gp', cia: 'cia', todos: null }[por]; return list.filter(c => !k || String(c[k]) === String(me[k])).map(c => { const fresh = c.ts && lunes(new Date(c.ts)) === lunes(); return { n: c.n, m: c.m, w: fresh ? (c.w || [0, 0])[1] : 0, yo: c.m === p.m }; }).sort((a, b) => b.w - a.w); }
let rankPor = 'anio';
function vSombra(p) {
  const ofic = (window.SOMBRA && SOMBRA.vistaCadete(p)) || '';
  const s = p.sombra, sc = s && p.comps[s.m], w = semana(p, lunes()), sw = sc && lunes(new Date(sc.ts)) === lunes() ? sc.w : [0, 0];
  const r = rankingSemanal(p, rankPor);
  return `${ofic}<section class="card"><h3>Mi sombra${ofic ? ' (pareja extra)' : ''}</h3>${s ? `<p>Pareja: <b>${esc(s.n)}</b> (${esc(s.m)}) · Meta semanal compartida: <b>${s.meta}</b> preguntas</p>
   <div class="duo"><div><span>Yo</span><b>${w[0]}</b></div><div><span>${esc(s.n.split(' ')[0])}</span><b>${sw[0]}</b></div><div><span>Juntos</span><b>${w[0] + sw[0]}/${s.meta}</b></div></div><div class="bar"><i style="width:${Math.min(100, 100 * (w[0] + sw[0]) / s.meta)}%"></i></div>
   <p class="mini">Para ver su avance, pega su código MB1 abajo (te lo manda por WhatsApp).</p><button class="btn ghost" onclick="P().sombra=null;save();render()">Quitar sombra</button>` :
      `<div class="g2"><input id="snom" placeholder="Nombre de tu pareja"><input id="smat" placeholder="Matrícula"></div><label>Meta semanal compartida<select id="smeta">${[100, 150, 200, 300].map(x => `<option>${x}</option>`).join('')}</select></label><button class="btn" onclick="ponerSombra()">Asignar sombra</button>`}</section>
  <section class="card"><h3>Competencia semanal</h3><div class="seg">${[['anio', 'Antigüedad'], ['grupo', 'Grupo'], ['cia', 'Compañía'], ['todos', 'Todos']].map(([k, l]) => `<button class="${rankPor === k ? 'on' : ''}" onclick="rankPor='${k}';render()">${l}</button>`).join('')}</div>
   <ol class="rank">${r.map(x => `<li class="${x.yo ? 'yo' : ''}"><span>${esc(x.n)}</span><b>${x.w}</b><small>aciertos</small></li>`).join('')}</ol>
   <p class="mini">Pega los códigos MB1 de tus compañeros (de tu grupo de WhatsApp) para competir con datos reales.</p><textarea id="compin" placeholder="Pega aquí uno o varios códigos MB1…"></textarea><button class="btn" onclick="importComps()">Agregar</button></section>`;
}
function ponerSombra() { const n = $('#snom').value.trim(), m = norm($('#smat').value); if (!n || !m) return toast('Nombre y matrícula de tu pareja.'); P().sombra = { n, m, meta: +$('#smeta').value }; usar('sombra'); save(); render(); }
function importComps() { if (S.sesion && (S.sesion.vistaCadete || (P() && P().vistaSolo))) return toast('Vista de consulta.'); const { ok, bad } = leerCodigos($('#compin').value), p = P(); ok.forEach(o => { if (!p.comps[o.m] || p.comps[o.m].ts < o.ts) p.comps[o.m] = { n: o.n, m: o.m, a: o.a, gp: o.gp, cia: o.cia, ts: o.ts, w: o.w }; }); save(); render(); toast(`${ok.length} agregado(s)${bad ? ', ' + bad + ' rechazado(s)' : ''}`); }
function paseActivo() { const a = S.pase; if (!a || !S.sesion || a.m !== S.sesion.m) return null; if (a.dia !== hoy() || new Date().getHours() >= a.hh) return null; return a; }
function cardPase() { const a = paseActivo(); return `<section class="card"><h3>¿Te habilitaron como aplicador?</h3>${a ? `<p>Pase activo: forma <b>${a.F}</b>, ${a.min} min, hasta las ${pad(a.hh)}:00. <button class="btn sm" onclick="tab='aplicar';render()">Ir a Aplicar</button></p>` : `<div class="row"><input id="pasein" placeholder="B70-1031-14-K3Q9" autocapitalize="characters"><button class="btn" onclick="activarPase()">Activar</button></div>`}</section>`; }
function activarPase() { const r = validaPase($('#pasein').value, S.sesion.m); if (typeof r === 'string') return toast(r);
  if (SRV && !activarPase._ok) { api('api/pase?code=' + encodeURIComponent(r.code)).then(x => { if (x.off) return toast('La Mesa de Inglés desactivó este pase.'); activarPase._ok = true; activarPase(); activarPase._ok = false; }).catch(() => { activarPase._ok = true; activarPase(); activarPase._ok = false; }); return; } S.pase = Object.assign(r, { m: S.sesion.m }); save(); tab = 'aplicar'; render(); toast('Pase activado'); }
function vAplicar() { const a = paseActivo(); if (!a) return '<section class="card"><p>Sin pase activo.</p></section>'; const c = codigoEval(a.F, a.min); return `<section class="card center"><h3>Código del examen</h3><div class="bigcode">${c}</div><p class="mini">Forma ${a.F} · ${a.min} min · ${DUR_Q[a.min]} preguntas · válido hoy</p><button class="btn ghost" onclick="copiar('${c}')">Copiar</button></section>
  <section class="card"><h3>Resultados de la forma ${a.F} en este equipo</h3>${tablaRes(S.resultados.filter(r => r.code === c), true)}</section>${vVerificar()}`; }

/* ---------- motor de preguntas ---------- */
let Q = null;
const akey = t => b32(hash(String(t).trim()), 8);
let AUD = null;
function pararAudio() { if (AUD) { try { AUD.pause(); AUD.removeAttribute('src'); } catch (e) { } AUD = null; } if (window.MB1AUD) MB1AUD.cancelar(); else if (window.speechSynthesis) speechSynthesis.cancel(); }
function hablarVoz(t, rate) { if (!('speechSynthesis' in window)) return toast('No hay audio para esta pregunta en este equipo.'); pararAudio(); if (window.MB1AUD) return MB1AUD.speak(t, { rate: rate == null ? MB1AUD.rateGuardada(.9) : rate }); speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = rate; const vs = speechSynthesis.getVoices(); const v = vs.find(v => /^en[-_]US/i.test(v.lang)) || vs.find(v => /^en/i.test(v.lang)); if (v) u.voice = v; speechSynthesis.speak(u); }
function hablar(t, rate) { const k = akey(t); const r = rate == null ? (window.MB1AUD ? MB1AUD.rateGuardada(.9) : .9) : rate; pararAudio();
  if (window.AUDIOS && window.AUDIOS[k] && window.MB1AUD) { MB1AUD.playFile('audio/' + k + '.mp3', { rate: r < .8 ? .72 : 1, onFail: () => hablarVoz(t, r) }).then(el => { AUD = el; }).catch(() => hablarVoz(t, r)); return; }
  if (window.AUDIOS && window.AUDIOS[k]) { AUD = new Audio('audio/' + k + '.mp3'); AUD.playbackRate = r < .8 ? .72 : 1; AUD.play().catch(() => hablarVoz(t, r)); return; } hablarVoz(t, r); }
function iniciar(modo) {
  if (S.sesion && (S.sesion.vistaCadete || (P() && P().vistaSolo))) return toast('Vista de consulta: no se guarda práctica.');
  const p = P(); let ids, opt = { modo, fb: true, tiempo: 0 };
  const all = BANCO.map(b => b.id);
  if (modo === 'mision') { const r = rng('mision' + hoy() + p.m), e = shuffle(Object.keys(p.err), r).slice(0, 2), d = shuffle(BANCO.filter(b => b.t === temaDebil(p)), r).slice(0, 2).map(b => b.id); ids = [...new Set(e.concat(d, shuffle(POOL_L(), r).slice(0, 3).map(b => b.id), shuffle(POOL_R(), r).slice(0, 4).map(b => b.id)))].slice(0, 8); }
  else if (modo === 'nivel') { const r = rng('nivel' + p.m); ids = shuffle(POOL_L(), r).slice(0, 4).map(b => b.id).concat(shuffle(POOL_R(), r).slice(0, 8).map(b => b.id)); }
  else if (modo === 'errores') ids = shuffle(Object.keys(p.err)).slice(0, 10);
  else if (modo === 'mixta') ids = shuffle(all).slice(0, 15);
  else if (modo === 'listening') ids = shuffle(POOL_L().map(b => b.id).concat(['lin' + Math.floor(Math.random() * 200)])).slice(0, 5);
  else if (modo === 'debil') ids = shuffle(BANCO.filter(b => b.t === temaDebil(p)).map(b => b.id)).slice(0, 10);
  else if (modo.startsWith('tema:')) { const t = modo.slice(5); ids = t === 'lin' ? Array.from({ length: 10 }, () => 'lin' + Math.floor(Math.random() * 200)) : shuffle(BANCO.filter(b => b.t === t).map(b => b.id)).slice(0, 10); }
  else if (modo === 'corto') { ids = shuffle(POOL_L()).slice(0, 10).map(b => b.id).concat(shuffle(POOL_R()).slice(0, 10).map(b => b.id)); Object.assign(opt, { tiempo: 15, fb: false, revision: true }); }
  else if (modo === 'simulacro' || modo.startsWith('forma:')) { const letra = modo.startsWith('forma:') ? modo.slice(6) : FORMAS[Math.floor(Math.random() * FORMAS.length)]; ids = forma(letra, 100); Object.assign(opt, { modo: 'simulacro', tiempo: 70, fb: false, revision: true, F: letra }); }
  if (modo === 'mision') p.tools['mision:' + hoy()] = 1;
  usar(modo.startsWith('forma:') ? 'simulacro' : modo.split(':')[0]); correr(ids, opt);
}
function iniciarOficial() { if (S.sesion && (S.sesion.vistaCadete || (P() && P().vistaSolo))) return toast('Vista de consulta: no se puede presentar evaluación.'); const v = validaEval($('#evcod').value); if (!v) return toast('Código no válido o no es de hoy.'); const p = P(); if (S.resultados.some(r => r.m === p.m && r.code === v.code)) return toast('Ya presentaste esta evaluación.'); const ids = forma(v.F, DUR_Q[v.min], p.m + v.code); usar('oficial'); correr(ids, { modo: 'oficial', fb: false, tiempo: v.min, oficial: true, code: v.code, F: v.F }); }
function correr(ids, opt) {
  const r = rng(Math.random());
  Q = Object.assign({ items: ids.map(byId).filter(Boolean).map(it => ({ it, ord: shuffle([0, 1, 2, 3], opt.oficial ? rng(S.sesion.m + it.id + opt.code) : r) })), i: 0, resp: {}, sal: 0, ini: Date.now(), plays: {} }, opt);
  if (!Q.items.length) { Q = null; return toast('No hay preguntas.'); }
  if (Q.oficial) { try { const fs = document.documentElement.requestFullscreen?.(); fs && fs.catch(() => { }); } catch (e) { } window.addEventListener('blur', salida); document.addEventListener('visibilitychange', visib); document.addEventListener('fullscreenchange', fsch); history.pushState({ q: 1 }, ''); }
  if (Q.tiempo) Q.timer = setInterval(tick, 1000);
  pintarQ();
}
function visib() { if (document.hidden) salida(); }
function fsch() { if (!document.fullscreenElement && Q && Q.oficial) salida(); }
function salida() { if (!Q || !Q.oficial) return; const now = Date.now(); if (Q._ls && now - Q._ls < 1500) return; Q._ls = now; Q.sal++; if (Q.sal >= 3) { toast('Tercera salida: la evaluación se entregó sola.'); return terminar(); } toast(`Salida registrada (${Q.sal}/3). A la tercera se entrega sola.`); pintarQ(); }
function tick() { if (!Q) return; const rest = Q.tiempo * 60 - Math.floor((Date.now() - Q.ini) / 1000); const el = $('#qt'); if (el) el.textContent = `${Math.floor(Math.max(0, rest) / 60)}:${pad(Math.max(0, rest) % 60)}`; if (rest <= 0) { toast('Tiempo terminado'); terminar(); } }
function pintarQ() {
  const { it, ord } = Q.items[Q.i], n = Q.items.length, sel = Q.resp[Q.i], lim = Q.oficial ? 2 : 99, pl = Q.plays[Q.i] || 0;
  $('#app').innerHTML = `<div class="quiz"><header><button class="ico" onclick="abandonar()">✕</button><div class="prog"><i style="width:${100 * (Q.i + 1) / n}%"></i></div><span>${Q.i + 1}/${n}</span>${Q.tiempo ? '<b id="qt"></b>' : ''}${Q.oficial ? `<em>Salidas: ${Q.sal}/3</em>` : ''}</header>
  <main><small class="tag">${TEMAS[it.t]}</small>${it.pas ? `<div class="pas">${esc(it.pas)}</div>` : ''}
  ${it.lis ? `<div class="audio"><button class="btn big" onclick="play()" ${pl >= lim ? 'disabled' : ''}>▶ Escuchar${Q.oficial ? ` (${lim - pl})` : ''}</button>${Q.oficial ? '' : '<button class="btn ghost" onclick="hablar(Q.items[Q.i].it.au,.6)">Lento</button>'}</div>` : ''}
  ${it.q ? `<p class="q">${esc(it.q).replace('___', '<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>')}</p>` : it.lis ? `<p class="q mini">${it.t === 'lrc' ? '¿Qué oración escuchaste?' : 'Escucha y elige la mejor respuesta.'}</p>` : ''}
  <div class="opts">${ord.map((o, k) => { let c = ''; if (Q.fb && sel != null) c = o === 0 ? 'ok' : (sel === o ? 'bad' : ''); else if (sel === o) c = 'sel'; return `<button class="${c}" onclick="responder(${o})" ${Q.fb && sel != null ? 'disabled' : ''}><b>${'ABCD'[k]}</b>${esc(it.o[o])}</button>`; }).join('')}</div>
  ${Q.fb && sel != null ? `<div class="pista"><b>${sel === 0 ? '✔ Correcto.' : '✘ Respuesta correcta: ' + esc(it.o[0])}</b>${it.lis ? `<br>Audio: “${esc(it.au)}”` : ''}<br>${PISTA[it.t] || ''}</div>` : ''}</main>
  <footer><button class="btn ghost" onclick="mover(-1)" ${Q.i ? '' : 'disabled'}>Anterior</button>${Q.i < n - 1 ? `<button class="btn" onclick="mover(1)">Siguiente</button>` : `<button class="btn" id="entregar" onclick="if(confirm('¿Entregar?'))terminar()">Entregar</button>`}</footer></div>`;
  if (Q.tiempo) tick();
  if (it.lis && pl === 0 && sel == null && !Q.oficial && window.MB1AUD && MB1AUD.listo()) play();
}
function play() { const pl = Q.plays[Q.i] || 0; if (Q.oficial && pl >= 2) return; Q.plays[Q.i] = pl + 1; hablar(Q.items[Q.i].it.au); if (Q.oficial) pintarQ(); }
function responder(o) { if (Q.fb && Q.resp[Q.i] != null) return; Q.resp[Q.i] = o; if (Q.fb) { registrar(P(), Q.items[Q.i].it, o === 0); save(); } pintarQ(); if (Q.fb && window.FX) { if (o === 0) FX.ok(); else FX.no(); } if (!Q.fb && Q.i < Q.items.length - 1) setTimeout(() => { if (Q) mover(1); }, 220); }
function mover(d) { Q.i = Math.max(0, Math.min(Q.items.length - 1, Q.i + d)); pararAudio(); pintarQ(); }
function limpiarQ() { clearInterval(Q.timer); window.removeEventListener('blur', salida); document.removeEventListener('visibilitychange', visib); document.removeEventListener('fullscreenchange', fsch); if (document.fullscreenElement) document.exitFullscreen().catch(() => { }); pararAudio(); }
function abandonar() { if (Q.oficial) { if (!confirm('Salir entrega la evaluación tal como está. ¿Entregar?')) return; return terminar(); } if (Object.keys(Q.resp).length && !Q.fb && !confirm('¿Salir sin entregar?')) return; limpiarQ(); if (Q.fb && Object.keys(Q.resp).length) actividad(Q, nomModo(Q.modo) + ' (incompleta)', temaModo(Q.modo, Q), Date.now() - Q.ini); Q = null; render(); }
function terminar() {
  const q = Q, of = q.oficial; q.oficial = false; limpiarQ(); const p = P(); let ok = 0;
  q.items.forEach((x, i) => { const r = q.resp[i] === 0; if (r) ok++; if (!q.fb && !of) registrar(p, x.it, r); });
  const pts = Math.round(100 * ok / q.items.length); let extra = '';
  if (of) { const fo = folio(p.m, q.code, pts, q.sal); S.resultados.push({ n: p.nombre, m: p.m, tipo: p.piloto ? 'Piloto' : p.perfil, anio: p.anio, gp: p.gp, gi: p.gi, code: q.code, F: q.F, pts, sal: q.sal, folio: fo, fecha: hoy(), hora: new Date().toTimeString().slice(0, 5) }); enviar('api/resultado', Object.assign({ equipo: EQUIPO }, S.resultados[S.resultados.length - 1]));
    extra = `<div class="bigcode" id="fpts">${pts}</div><p>Puntaje</p><div class="bigcode sm mono" id="ffolio">${fo}</div><p>Folio · Salidas: ${q.sal}</p><p class="mini">Muestra esta pantalla al aplicador. Las respuestas correctas no se muestran para proteger las preguntas.</p>`; }
  else { if (q.F) { p.formas = p.formas || {}; p.formas[q.F] = pts; } extra = `<div class="bigcode">${ok}/${q.items.length}</div><p>${pts}% de aciertos</p>`; }
  actividad(q, nomModo(q.modo), temaModo(q.modo, q), Date.now() - q.ini); save(); Q = null;
  const rev = q.revision ? `<section class="card"><h3>Revisión</h3>${q.items.map((x, i) => q.resp[i] === 0 ? '' : `<div class="rev"><small>${i + 1}. ${TEMAS[x.it.t]}</small><p>${esc(x.it.q || x.it.au)}</p><p class="okt">✔ ${esc(x.it.o[0])}</p>${q.resp[i] != null ? `<p class="badt">✘ ${esc(x.it.o[q.resp[i]])}</p>` : '<p class="mini">Sin responder</p>'}</div>`).join('') || '<p>¡Todo correcto!</p>'}</section>` : '';
  $('#app').innerHTML = `<main class="fin"><section class="card center"><h2>${of ? 'Evaluación entregada' : '¡Misión cumplida!'}</h2>${extra}<button class="btn big" onclick="render()">Continuar</button></section>${rev}</main>`; if (window.FX) FX.fin(pts >= 60 ? 200 : 110);
}
function tarjetasPendientes(p) { const now = Date.now(); const ids = BANCO.filter(b => b.t === 'voc').map(b => b.id).concat(Object.keys(p.err).filter(i => !i.startsWith('lin'))); return [...new Set(ids)].filter(id => !p.cards[id] || p.cards[id].due <= now).slice(0, 12); }
let TC = null;
let TC0 = 0;
function iniciarTarjetas() { if (S.sesion && (S.sesion.vistaCadete || (P() && P().vistaSolo))) return toast('Vista de consulta: no se guardan tarjetas.'); TC0 = Date.now(); const ids = tarjetasPendientes(P()); if (!ids.length) return toast('No tienes tarjetas pendientes hoy.'); usar('tarjetas'); TC = { ids, i: 0, ver: false }; pintarT(); }
function pintarT() { if (TC.i >= TC.ids.length) { const p = P(); if ((SRV || SHEET) && p && !p.piloto) enviar('api/actividad', { ts: tsLocal(), m: p.m, nombre: p.nombre, perfil: p.perfil, anio: p.anio, gp: p.gp, gi: p.gi, tipo: 'Tarjetas', tema: 'Repaso', preguntas: TC.ids.length, aciertos: TC.ok || 0, duracion_s: Math.round((Date.now() - TC0) / 1000), equipo: EQUIPO }); if (p && !p.piloto) enviar('api/avance', payload(p)); TC = null; toast('Tarjetas terminadas'); return render(); } const it = byId(TC.ids[TC.i]);
  $('#app').innerHTML = `<div class="quiz"><header><button class="ico" onclick="TC=null;render()">✕</button><div class="prog"><i style="width:${100 * TC.i / TC.ids.length}%"></i></div><span>${TC.i + 1}/${TC.ids.length}</span></header><main><div class="flash" onclick="TC.ver=true;pintarT()">${it.pas ? `<small>${esc(it.pas.slice(0, 140))}…</small>` : ''}<p>${esc(it.q || it.au)}</p>${TC.ver ? `<h2>${esc(it.o[0])}</h2>` : '<span class="mini">Toca para ver la respuesta</span>'}</div>
  ${it.lis ? `<button class="btn ghost" onclick="hablar(byId(TC.ids[TC.i]).au)">▶ Escuchar</button>` : ''}${TC.ver ? `<div class="row"><button class="btn ghost" onclick="calif(0)">Repasar mañana</button><button class="btn" onclick="calif(1)">Lo sabía</button></div>` : ''}</main></div>`; }
function calif(ok) { const p = P(), id = TC.ids[TC.i], c = p.cards[id] || { box: 0 }; c.box = ok ? Math.min(5, c.box + 1) : 0; c.due = Date.now() + [1, 1, 3, 7, 14, 30][c.box] * 864e5 - 36e5; p.cards[id] = c; if (ok) TC.ok = (TC.ok || 0) + 1; save(); TC.i++; TC.ver = false; pintarT(); if (ok && window.FX) FX.ok(document.querySelector('.flash')); }

/* ---------- Centro de mando ---------- */
let fil = { anio: '', gp: '', gi: '', dia: '' }, grupoPor = 'gp';
function vMando() {
  let tabs = [['mando', 'Mando'], ['avance', 'Avance'], ['calif', 'Calificaciones'], ['antig', 'Antigüedad'], ['estad', 'Estadística'], ['areas', 'Áreas'], ['riesgo', 'En riesgo'], ['actividad', 'Actividad'], ['alcpt', 'ALCPT'], ['alc', 'ALC'], ['vista', 'Vista cadete']];
  if (esAdmin()) tabs.push(['ajustes', 'Ajustes']);
  if (soloLectura() && tab === 'ajustes') tab = 'mando';
  if (tab === 'eval' || tab === 'aplic' || tab === 'aplicadm') tab = 'mando';
  const body = { alc: vAlc, alcpt: vAlcpt, actividad: mActividad, avance: mAvance, calif: vCalifMando, antig: mAntig, estad: mEstad, areas: mAreas, riesgo: mRiesgo, ajustes: mAjustes, mando: mMando, vista: mVistaCadete }[tab] || mAvance;
  const rol = esDirectora() ? 'Directora · solo consulta' : 'Administración';
  const ban = soloLectura() ? `<section class="card aviso"><b>Modo consulta.</b> Puedes ver todas las secciones; no puedes cambiar ajustes, importar, borrar ni editar datos. El control total lo tiene Administración.</section>` : '';
  return `<header><div><b>Centro de mando</b><span>${esc(S.sesion.nombre)} · ${rol}</span></div><button class="ico" onclick="ayuda()" title="Instructivos">?</button><button class="ico" onclick="tema()" title="Tema">◐</button><button class="ico" onclick="salir()" title="Cerrar sesión">⎋</button></header>
  <nav class="tabs">${tabs.map(([k, l]) => `<button class="${tab === k || (k === 'aplic' && tab === 'aplicadm') ? 'on' : ''}" data-tab="${k}" onclick="tab='${k}';render()">${l}</button>`).join('')}</nav><main class="wide">${ban}${body()}</main>`;
}

function vCalifMando() { return window.CALIF ? CALIF.vMando() : '<section class="card"><p class="mini">Cargando calificaciones…</p></section>'; }
function mVistaCadete() {
  return `<section class="card"><h3>Vista de la pantalla del cadete</h3><p class="mini">Consulta cómo se ve la app para el cadete (Hoy, Practicar, Técnicas, Simulacro, Mi sombra, ALC). En modo Directora no se guarda práctica ni se envía nada.</p>
  <button class="btn" onclick="abrirVistaCadete()">Abrir vista cadete (solo lectura)</button></section>`;
}
function abrirVistaCadete() {
  if (!esMando()) return;
  const m = 'DIR-VISTA';
  S.perfiles[m] = Object.assign(nuevoPerfil({ m, nombre: S.sesion.nombre + ' (vista)', perfil: 'cadete', anio: 4, gp: 'A', gi: '1', cia: '1/a.' }), { vistaSolo: true });
  S.sesion = Object.assign({}, S.sesion, { vistaCadete: true, mPrev: S.sesion.m, perfilPrev: S.sesion.perfil, m, perfil: 'cadete' });
  tab = 'hoy'; save(); render();
}
function cerrarVistaCadete() {
  if (!S.sesion || !S.sesion.vistaCadete) return;
  const prevM = S.sesion.mPrev, prevP = S.sesion.perfilPrev || 'directora';
  if (S.perfiles['DIR-VISTA']) delete S.perfiles['DIR-VISTA'];
  S.sesion = { perfil: prevP, nombre: S.sesion.nombre.replace(/ \(vista\)$/, ''), m: prevM || S.sesion.m };
  tab = 'vista'; save(); render();
}
function exigeLista() { return S.padronEstricto !== false && padronTodo().length > 0; }
function fotoDe(m) { if (!m) return ''; if (S.fotos && S.fotos[m]) return S.fotos[m]; try { if (window.PERFIL && PERFIL.fotoDe) return PERFIL.fotoDe(m) || ''; } catch (e) { } try { return localStorage.getItem('mb1_foto_' + m) || ''; } catch (e) { return ''; } }
function avatarAv(a, tam) { const f = fotoDe(a.m), yo = a.yo || {}, c = yo.co || yo.color || '#6366f1', n = a.n || a.nombre || ''; const ini = (n.trim().split(/\s+/).filter(Boolean).map((w, i, arr) => i === 0 || i === arr.length - 2 ? w[0] : '').join('') || '?').toUpperCase(); return `<span class="pav ${tam || 'sm'}" style="--pc:${esc(c)}">${f ? `<img src="${f}" alt="">` : yo.e || yo.emoji ? `<b class="emo">${esc(yo.e || yo.emoji)}</b>` : `<b>${esc(ini)}</b>`}</span>`; }
function enviarFoto(m, nombre, dataUrl) {
  if (!m) return; S.fotos = S.fotos || {}; if (dataUrl) S.fotos[m] = dataUrl; else delete S.fotos[m]; save();
  if (REAL) return; const d = { ts: tsLocal(), m, nombre: nombre || '', foto: dataUrl || '', equipo: EQUIPO };
  if (SHEET && !SRV) hojaPost('foto', d); else if (SRV) enviar('api/foto', d);
}
function datoCadete(m) {
  const a = S.avances[m], p = S.perfiles[m];
  const o = a ? Object.assign({}, a) : (p && p.perfil === 'cadete' && !p.piloto && !p.vistaSolo ? payload(p) : null);
  if (!o) return null; o.n = (p && p.nombre) || o.n; o.a = (p && p.anio) || o.a; o.gp = (p && p.gp) || o.gp; o.gi = (p && p.gi) || o.gi; o.cia = (p && p.cia) || o.cia;
  if (p && p.yo) o.yo = { g: (p.yo.gustos || []).slice(), c: (p.yo.cuesta || []).slice(), t: p.yo.texto || '', f: p.yo.foto ? 1 : 0, e: p.yo.emoji, co: p.yo.color, fr: p.yo.frase };
  o._local = !!p; o._foto = fotoDe(m); return o;
}
function AV() {
  const seen = new Set(), out = [];
  Object.values(S.avances).forEach(a => { if (a && a.pf !== 'planta' && a.m !== PILOTO.m) { out.push(a); seen.add(a.m); } });
  Object.values(S.perfiles || {}).forEach(p => { if (p && p.perfil === 'cadete' && !p.piloto && !p.vistaSolo && p.m && !seen.has(p.m)) { try { out.push(payload(p)); seen.add(p.m); } catch (e) { } } });
  return out;
}
let FICHA = null;
function abrirFicha(m, modo) { FICHA = { m, modo: modo || 'ver' }; if (tab !== 'avance') tab = 'avance'; render(); scrollTo(0, 0); if (FICHA.modo === 'ver') pedirFoto(m); }
function cerrarFicha() { FICHA = null; render(); }
async function pedirFoto(m) {
  if (fotoDe(m)) return; const k = localStorage.getItem('mb1_hk') || '';
  if (!SHEET || !k || SRV || !navigator.onLine) return;
  try { const r = await fetch(SHEET + '?hoja=foto&m=' + encodeURIComponent(m) + '&clave=' + encodeURIComponent(k), { cache: 'no-store' }).then(x => x.json());
    if (r && r.ok && r.foto && r.foto.indexOf('data:image') === 0) { S.fotos = S.fotos || {}; S.fotos[m] = r.foto; save(); if (FICHA && FICHA.m === m) render(); } } catch (e) { }
}
function vFicha() {
  if (!FICHA) return ''; const a = datoCadete(FICHA.m); if (!a) { FICHA = null; return ''; }
  if (FICHA.modo === 'editar') return vEditarCadete(a);
  if (FICHA.modo === 'fusionar') return vFusionarCadete(a);
  const pr = a.pr || {}, yo = a.yo || {}, sl = soloLectura();
  const act = ((SRVDATA && SRVDATA.act) || []).filter(r => normMat(r.m) === normMat(a.m)).slice(0, 12);
  const chips = (arr) => (arr || []).length ? `<div class="pchips">${arr.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : '<p class="mini">—</p>';
  return `<section class="card ficha" id="fichaCadete"><div class="row sp"><h3>Ficha del cadete</h3><button class="btn sm ghost" onclick="cerrarFicha()">Cerrar</button></div>
    <div class="ficha-top">${avatarAv(a, 'xl')}<div><h2>${esc(a.n)}</h2><p class="mini">${esc(a.m)} · ${a.a ? a.a + '° año' : ''}${a.gp ? ' · grupo ' + esc(a.gp) : ''}${a.gi ? ' · inglés ' + esc(a.gi) : ''}${a.cia ? ' · ' + esc(a.cia) : ''}${a._local ? ' · en este equipo' : ''}</p>${yo.fr ? `<p class="pfrase">“${esc(yo.fr)}”</p>` : ''}</div></div>
    <div class="kpis k4"><div><b>${a.q || 0}</b><span>Preguntas</span></div><div><b>${a.est ?? '—'}</b><span>Estimado</span></div><div><b>${pr.lp ?? '—'}</b><span>Pts listening</span></div><div><b>${pr.cn ? pr.co + '/' + pr.cn : '—'}</b><span>Completa</span></div></div>
    <div class="g2"><section class="card"><h3>Gustos</h3>${chips(yo.g)}</section><section class="card pcuesta"><h3>Le cuesta</h3>${chips(yo.c)}${yo.t ? `<blockquote>${esc(yo.t)}</blockquote>` : ''}</section></div>
    <section class="card"><h3>Práctica</h3><p class="mini">Listening: ${pr.ln ? `${pr.lo}/${pr.ln} aciertos · ${pr.lp} pts` : 'sin datos'} · Completa la oración: ${pr.cn ? `${pr.co}/${pr.cn} · ${pr.cp} pts` : 'sin datos'} · Vocabulario: ${pr.va != null ? `${pr.va} palabras dominadas` + (pr.vt ? ' de ' + pr.vt : '') + (pr.vp ? ' · ' + pr.vp + ' para hoy' : '') : 'sin datos en este resumen'}.</p>
      ${a.tools && Object.keys(a.tools).length ? `<p class="mini">Herramientas: ${Object.entries(a.tools).filter(([k]) => !k.includes(':')).map(([k, v]) => `${esc(NOMT[k] || k)} (${v})`).join(' · ')}</p>` : ''}</section>
    ${window.CALIF ? `<section class="card"><div class="row sp"><h3>Calificaciones oficiales</h3><button class="btn sm ghost" onclick="tab='calif';render()">Abrir sección</button></div>${CALIF.fichaResumen(a.m)}</section>` : ''}${act.length ? `<section class="card"><h3>Actividad reciente (Hoja)</h3><div class="tw"><table><tr><th>Fecha</th><th>Ejercicio</th><th>Tema</th><th>Preg.</th><th>Aciertos</th></tr>${act.map(r => `<tr><td>${esc(r.ts)}</td><td>${esc(r.tipo)}</td><td>${esc(r.tema)}</td><td>${r.preguntas}</td><td>${r.aciertos}</td></tr>`).join('')}</table></div></section>` : ''}
    ${a._foto ? '' : (yo.f ? '<p class="mini">Tiene foto en la Hoja; se cargará si hay clave de lectura e internet.</p>' : '<p class="mini">Este cadete no ha compartido foto (puede usar un avatar).</p>')}
    <div class="row">${sl ? '<p class="mini">Directora: solo consulta. Administración puede editar, fusionar o quitar este registro.</p>' : `<button class="btn" onclick='abrirFicha(${JSON.stringify(a.m)},"editar")'>✏️ Editar datos</button><button class="btn ghost" onclick='abrirFicha(${JSON.stringify(a.m)},"fusionar")'>Fusionar duplicado</button><button class="btn ghost" onclick='delAv(${JSON.stringify(a.m)})'>Quitar del mando</button>`}</div></section>`;
}
function vEditarCadete(a) {
  return `<section class="card ficha" id="fichaCadete"><div class="row sp"><h3>Editar datos del cadete</h3><button class="btn sm ghost" onclick='abrirFicha(${JSON.stringify(a.m)})'>Cancelar</button></div>
    <p class="mini">Corrige el nombre (tal cual la lista oficial, sin agregar acentos), la matrícula, el año y los grupos. Si cambias la matrícula, el historial de este equipo se mueve con ella.</p>
    <label>Nombre completo<input id="fenom" value="${esc(a.n)}"></label>
    <label>Matrícula<input id="femat" autocapitalize="characters" value="${esc(a.m)}"></label>
    <div class="g2"><label>Año<select id="feanio">${[1, 2, 3, 4].map(n => `<option value="${n}" ${+a.a === n ? 'selected' : ''}>${anioTxt(n)}</option>`).join('')}</select></label><label>Compañía<input id="fecia" value="${esc(a.cia || '')}"></label></div>
    <div class="g2"><label>Grupo pedagógico<input id="fegp" value="${esc(a.gp || '')}"></label><label>Grupo de inglés<input id="fegi" value="${esc(a.gi || '')}"></label></div>
    <button class="btn big" onclick="guardarEdicionCadete()">Guardar cambios</button></section>`;
}
function vFusionarCadete(a) {
  const otros = AV().filter(x => x.m !== a.m);
  const dups = otros.filter(x => sinAcento(x.n) === sinAcento(a.n));
  const opts = (dups.length ? dups : otros).map(x => `<option value="${esc(x.m)}">${esc(x.n)} · ${esc(x.m)}${sinAcento(x.n) === sinAcento(a.n) ? ' (mismo nombre)' : ''}</option>`).join('');
  return `<section class="card ficha" id="fichaCadete"><div class="row sp"><h3>Fusionar duplicado</h3><button class="btn sm ghost" onclick='abrirFicha(${JSON.stringify(a.m)})'>Cancelar</button></div>
    <p class="mini">Se conservan los datos de <b>${esc(a.n)}</b> (${esc(a.m)}) y se une el registro que elijas. El otro se quita. No se puede deshacer en este equipo.</p>
    ${opts ? `<label>Unir con<select id="feorig">${opts}</select></label><button class="btn" onclick='hacerFusion(${JSON.stringify(a.m)})'>Fusionar</button>` : '<p class="mini">No hay otros cadetes en el Centro de mando para unir.</p>'}</section>`;
}
function guardarEdicionCadete() {
  if (bloquearEscritura()) return; if (!FICHA) return;
  const old = FICHA.m, n = ($('#fenom').value || '').trim(), m = normMat($('#femat').value);
  const extra = { a: parseInt($('#feanio').value) || '', gp: norm($('#fegp').value), gi: norm($('#fegi').value), cia: ($('#fecia').value || '').trim() };
  if (!n || n.split(/\s+/).length < 2) return toast('Escribe el nombre completo (nombre y apellidos).');
  if (!m || !/^[A-Z0-9-]{5,20}$/.test(m)) return toast('Revisa la matrícula.');
  if (m !== old && (S.avances[m] || (S.perfiles[m] && S.perfiles[m].perfil === 'cadete'))) {
    if (!confirm('Ya hay un cadete con la matrícula ' + m + '. ¿Fusionar este registro en esa matrícula?')) return;
    moverCadete(old, m, { n, ...extra }); hacerFusion(m, old); return;
  }
  moverCadete(old, m, { n, ...extra }); FICHA = { m, modo: 'ver' }; save(); render(); toast('Datos actualizados.');
}
function moverCadete(old, m, d) {
  const ap = (obj, key) => { if (!obj[old]) return; const x = obj[old]; if (m !== old) { delete obj[old]; } x.m = m; if (d.n) { if (key === 'av') x.n = d.n; else x.nombre = d.n; } if (d.a !== undefined) { if (key === 'av') x.a = d.a; else x.anio = d.a; } if (d.gp !== undefined) x.gp = d.gp; if (d.gi !== undefined) x.gi = d.gi; if (d.cia !== undefined) x.cia = d.cia; obj[m] = x; };
  ap(S.avances, 'av'); if (S.perfiles[old] || S.perfiles[m]) ap(S.perfiles, 'pf');
  if (S.fotos && S.fotos[old]) { if (m !== old) { S.fotos[m] = S.fotos[old]; delete S.fotos[old]; } }
  try { if (m !== old) { const f = localStorage.getItem('mb1_foto_' + old); if (f) { localStorage.setItem('mb1_foto_' + m, f); localStorage.removeItem('mb1_foto_' + old); } } } catch (e) { }
  const i = (S.padron || []).findIndex(x => normMat(x.m) === normMat(old)); if (i >= 0) S.padron[i] = Object.assign({}, S.padron[i], { m, n: d.n, a: d.a, gp: d.gp, gi: d.gi, cia: d.cia });
  (S.calif || []).forEach(r => { if (normMat(r.m) === normMat(old)) { r.m = m; if (d.n) r.n = d.n; if (d.a !== undefined && d.a !== '') r.a = d.a; if (d.gp !== undefined) r.gp = d.gp; if (d.gi !== undefined) r.gi = d.gi; } });
}
function hacerFusion(dest, orig) {
  if (bloquearEscritura()) return; orig = orig || ($('#feorig') && $('#feorig').value); if (!dest || !orig || dest === orig) return toast('Elige el registro a unir.');
  if (!confirm('¿Unir ' + orig + ' en ' + dest + '? El registro ' + orig + ' se quitará.')) return;
  const d = S.avances[dest] || (S.perfiles[dest] ? payload(S.perfiles[dest]) : null);
  const o = S.avances[orig] || (S.perfiles[orig] ? payload(S.perfiles[orig]) : null);
  if (!d && !o) return toast('No hay datos para unir.');
  const base = (d && o) ? ((d.ts || 0) >= (o.ts || 0) ? d : o) : (d || o);
  const other = base === d ? o : d;
  const merged = Object.assign({}, base, { m: dest, n: (d && d.n) || base.n, a: (d && d.a) || base.a, gp: (d && d.gp) || base.gp, gi: (d && d.gi) || base.gi, cia: (d && d.cia) || base.cia });
  merged.dias = Object.assign({}, (other && other.dias) || {}, base.dias || {});
  merged.tools = {}; [other && other.tools, base.tools].forEach(t => { if (t) Object.entries(t).forEach(([k, v]) => { merged.tools[k] = (merged.tools[k] || 0) + v; }); });
  merged.yo = (d && d.yo && ((d.yo.t) || (d.yo.c || []).length || d.yo.f)) ? d.yo : ((o && o.yo) || (d && d.yo));
  S.avances[dest] = merged; delete S.avances[orig];
  if (S.perfiles[orig]) { if (!S.perfiles[dest]) { S.perfiles[dest] = S.perfiles[orig]; S.perfiles[dest].m = dest; } delete S.perfiles[orig]; }
  if (S.fotos && S.fotos[orig]) { if (!S.fotos[dest]) S.fotos[dest] = S.fotos[orig]; delete S.fotos[orig]; }
  try { const f = localStorage.getItem('mb1_foto_' + orig); if (f && !localStorage.getItem('mb1_foto_' + dest)) localStorage.setItem('mb1_foto_' + dest, f); localStorage.removeItem('mb1_foto_' + orig); } catch (e) { }
  S.padron = (S.padron || []).filter(x => normMat(x.m) !== normMat(orig));
  (S.calif || []).forEach(r => { if (normMat(r.m) === normMat(orig)) { r.m = dest; if (merged.n) r.n = merged.n; } });
  FICHA = { m: dest, modo: 'ver' }; save(); render(); toast('Registros unidos en ' + dest + '.');
}
function posiblesDuplicados(L) {
  const byN = {}, out = []; L.forEach(a => { const k = sinAcento(a.n); (byN[k] = byN[k] || []).push(a); });
  Object.values(byN).forEach(g => { if (g.length > 1) out.push(g); }); return out;
}
function cardDuplicados(L) {
  const d = posiblesDuplicados(L); if (!d.length) return '';
  return `<section class="card aviso" id="duplicados"><h3>Posibles duplicados (${d.length} nombre${d.length > 1 ? 's' : ''})</h3><p class="mini">Mismo nombre con distinta matrícula. Revisa y, si son la misma persona, ábrela y usa «Fusionar duplicado».</p>
    ${d.map(g => `<p class="mini">${g.map(a => `<button class="btn sm ghost" onclick='abrirFicha(${JSON.stringify(a.m)})'>${esc(a.n)} · ${esc(a.m)}</button>`).join(' ')}</p>`).join('')}</section>`;
}

function filtrar(list) { return list.filter(a => (!fil.anio || String(a.a) === fil.anio) && (!fil.gp || a.gp === fil.gp) && (!fil.gi || a.gi === fil.gi) && (!fil.dia || (a.dias && a.dias[fil.dia]))); }
function filtros(conDia = true) { const all = AV().concat(S.padron), opts = k => [...new Set(all.map(a => a[k]).filter(Boolean))].sort();
  return `<div class="filtros"><select onchange="fil.anio=this.value;render()"><option value="">Todos los años</option>${[1, 2, 3, 4].map(a => `<option ${fil.anio == a ? 'selected' : ''} value="${a}">${a}° año</option>`).join('')}</select>
  <select onchange="fil.gp=this.value;render()"><option value="">Grupo pedagógico</option>${opts('gp').map(g => `<option ${fil.gp === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>
  <select onchange="fil.gi=this.value;render()"><option value="">Grupo de inglés</option>${opts('gi').map(g => `<option ${fil.gi === g ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>
  ${conDia ? `<input type="date" value="${fil.dia}" onchange="fil.dia=this.value;render()">` : ''}${fil.anio || fil.gp || fil.gi || fil.dia ? `<button class="btn sm ghost" onclick="fil={anio:'',gp:'',gi:'',dia:''};render()">Limpiar</button>` : ''}</div>`; }
const vacio = msg => `<section class="card center"><p>${msg}</p><button class="btn" onclick="tab='avance';render()">Ir a importar códigos de avance</button></section>`;
function barras(obj, max) { const e = Object.entries(obj); if (!e.length) return '<p class="mini">Sin datos.</p>'; max = max || Math.max(...e.map(x => x[1]), 1); return `<div class="bars">${e.map(([k, v]) => `<div><span>${esc(k)}</span><div class="bar"><i style="width:${100 * v / max}%"></i></div><b>${v}</b></div>`).join('')}</div>`; }
const NOMT = { mision: 'Misión de hoy', errores: 'Repasar errores', mixta: 'Misión mixta', listening: 'Listening rápido', tema: 'Práctica por tema', corto: 'Ejercicio corto', forma: 'Simulacro', simulacro: 'Simulacro', tarjetas: 'Tarjetas', flash: 'Flash cards (vocabulario)', vocab: 'Ejercicios de vocabulario', dictado: 'Dictado', sombra: 'Mi sombra', escucha: 'Listening Lab', completa: 'Completa la palabra', perfil: 'Perfil personalizado', avance: 'Envío de avance', debil: 'Tema débil' };
function dominio(L) { const t = {}; L.forEach(a => Object.entries(a.tema || {}).forEach(([k, v]) => { t[k] = t[k] || [0, 0]; t[k][0] += v[0]; t[k][1] += v[1]; })); return Object.fromEntries(Object.entries(TEMAS).filter(([k]) => t[k] && t[k][0]).map(([k, l]) => [l, Math.round(100 * t[k][1] / t[k][0])])); }
const ultimo = a => Object.keys(a.dias || {}).filter(d => (a.dias[d] || [0])[0] > 0).sort().pop() || '';
function mAvance() {
  const L = filtrar(AV()), act7 = L.filter(a => { const u = ultimo(a); return u && diasEntre(u, hoy()) < 7; }).length, q = L.reduce((s, a) => s + (a.q || 0), 0), e = prom(L.map(a => a.est));
  const acc = {}; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); const k = hoy(d); acc[k.slice(8) + '/' + k.slice(5, 7)] = L.filter(a => a.dias && a.dias[k]).length; }
  const tools = {}; L.forEach(a => Object.entries(a.tools || {}).forEach(([k, v]) => { if (!k.includes(':')) { const n = NOMT[k] || k; tools[n] = (tools[n] || 0) + v; } }));
  return `${avisoHoja()}${FICHA ? vFicha() : ''}${soloLectura() ? '' : `<section class="card"><h3>Importar códigos de avance <small class="mini">(respaldo opcional)</small></h3><textarea id="impin" placeholder="Pega aquí los mensajes con códigos MB1… (puedes pegar un chat completo)"></textarea><div class="row"><button class="btn" id="btnimp" onclick="importar()">Importar</button><label class="btn ghost">Chat exportado (.txt)<input type="file" accept=".txt,text/plain" hidden onchange="importArchivo(this)"></label></div></section>`}
  ${filtros()}<section class="kpis"><div><b id="kpi-cad">${L.length}</b><span>Cadetes con avance</span></div><div><b>${act7}</b><span>Activos en 7 días</span></div><div><b>${q}</b><span>Preguntas respondidas</span></div><div><b>${e ?? '—'}</b><span>Promedio estimado</span></div></section>
  <section class="card"><h3>Accesos por día (14 días)</h3>${barras(acc)}</section><div class="cols"><section class="card"><h3>Herramientas más usadas</h3>${barras(Object.fromEntries(Object.entries(tools).sort((a, b) => b[1] - a[1]).slice(0, 8)))}</section><section class="card"><h3>Aciertos por tema (%)</h3>${barras(dominio(L), 100)}</section></div>${cuestaResumen(L)}${cardDuplicados(L)}
  <section class="card"><div class="row sp"><h3>Detalle por cadete</h3><div class="row"><button class="btn sm ghost" onclick="expAvance('xlsx')">Excel</button><button class="btn sm ghost" onclick="expAvance('csv')">CSV</button></div></div>${tablaAv(L)}</section>`;
}
function cuestaResumen(L) { const c = {}; let n = 0; L.forEach(a => { const k = (a.yo && a.yo.c) || []; if (k.length) n++; k.forEach(x => { const t = x.replace(/^\S+\s/, ''); c[t] = (c[t] || 0) + 1; }); }); if (!n) return ''; return `<section class="card"><h3>Lo que más les cuesta (según su perfil · ${n} cadete(s))</h3>${barras(Object.fromEntries(Object.entries(c).sort((a, b) => b[1] - a[1])))}<p class="mini">El detalle y el texto de cada cadete está en la tabla y en el Excel.</p></section>`; }
function filaAv(a) { const pr = a.pr || {}, yo = a.yo || {}; return { Nombre: a.n, Matrícula: a.m, Año: a.a, 'Grupo ped.': a.gp, 'Grupo inglés': a.gi, Compañía: a.cia, Preguntas: a.q, 'Listening (pts)': pr.lp ?? '', 'Listening (aciertos)': pr.ln ? `${pr.lo}/${pr.ln}` : '', 'Completa (aciertos)': pr.cn ? `${pr.co}/${pr.cn}` : '', 'Le cuesta': (yo.c || []).map(x => x.replace(/^\S+\s/, '')).join(', '), 'En sus palabras': yo.t || '', Gustos: (yo.g || []).map(x => x.replace(/^\S+\s/, '')).join(', '), Foto: (yo.f || fotoDe(a.m)) ? 'Sí' : '', 'Puntaje inicio': a.ini ?? '', 'Puntaje estimado': a.est ?? '', 'Meta año': METAS[a.a] || '', 'Última práctica': ultimo(a), 'Semana preguntas': (a.w || [])[0] || 0, 'Semana aciertos': (a.w || [])[1] || 0, ...dominio([a]), 'Código recibido': new Date(a.ts).toLocaleString('es-MX') }; }
function tablaAv(L) { if (!L.length) return '<p class="mini">Aún no hay avances importados.</p>'; return `<div class="tw"><table><tr><th></th><th>Nombre</th><th>Año</th><th>Grupo</th><th>Preg.</th><th>🎧</th><th>Inicio</th><th>Estimado</th><th>Última</th><th></th></tr>${L.sort((a, b) => (a.a - b.a) || a.n.localeCompare(b.n)).map(a => `<tr class="crow${FICHA && FICHA.m === a.m ? ' on' : ''}" onclick='abrirFicha(${JSON.stringify(a.m)})'><td>${avatarAv(a, 'sm')}</td><td>${esc(a.n)}<small>${esc(a.m)}${(a.yo && a.yo.f) || fotoDe(a.m) ? ' · 📷' : ''}</small>${a.yo && ((a.yo.c || []).length || a.yo.t) ? `<small class="cuesta" title="${esc(a.yo.t || '')}">Le cuesta: ${esc((a.yo.c || []).map(x => x.replace(/^\S+\s/, '')).join(', ') || '—')}${a.yo.t ? ' · “' + esc(a.yo.t.slice(0, 60)) + (a.yo.t.length > 60 ? '…' : '') + '”' : ''}</small>` : ''}</td><td>${a.a}°</td><td>${esc(a.gp)}${a.gi ? ' / ' + esc(a.gi) : ''}</td><td>${a.q}</td><td>${a.pr && a.pr.ln ? `${a.pr.lp}<small>${Math.round(100 * a.pr.lo / a.pr.ln)}%</small>` : '—'}</td><td>${a.ini ?? '—'}</td><td><b class="${a.est >= METAS[a.a] ? 'okt' : ''}">${a.est ?? '—'}</b></td><td>${ultimo(a)}</td><td>${soloLectura() ? `<button class="btn sm ghost" onclick='event.stopPropagation();abrirFicha(${JSON.stringify(a.m)})'>Ver</button>` : `<button class="btn sm ghost" onclick='event.stopPropagation();abrirFicha(${JSON.stringify(a.m)})'>Ficha</button><button class="btn sm ghost" onclick='event.stopPropagation();delAv(${JSON.stringify(a.m)})'>✕</button>`}</td></tr>`).join('')}</table></div>`; }
function delAv(m) { if (bloquearEscritura()) return; if (confirm('¿Quitar este avance del Centro de mando?')) { delete S.avances[m]; if (S.fotos) delete S.fotos[m]; if (FICHA && FICHA.m === m) FICHA = null; save(); render(); } }
function fusionarAvances(ok, fuente) { let n = 0;
  ok.filter(o => o.m !== PILOTO.m).forEach(o => { const prev = S.avances[o.m]; if (!prev || prev.ts < o.ts || (prev.ts === o.ts && fuente === 'código de avance')) { S.avances[o.m] = o; n++; } (o.ex || []).forEach(e => { if (!S.registro.some(r => r.m === o.m && r.code === e[0])) S.registro.push({ n: o.n, m: o.m, tipo: o.pf, anio: o.a, gp: o.gp, gi: o.gi, code: e[0], pts: e[1], sal: e[2], folio: e[3], fecha: e[4], fuente, valido: folio(o.m, e[0], e[1], e[2]) === e[3] }); }); });
  return n; }
function importar(txt) { if (bloquearEscritura()) return { n: 0, bad: 0 }; const { ok, bad } = leerCodigos(txt ?? $('#impin').value); const n = fusionarAvances(ok, 'código de avance');
  save(); render(); const msg = `Entraron ${n} código(s)${ok.length - n ? `; ${ok.length - n} más antiguo(s) que el guardado` : ''}${bad ? `; rechazados: ${bad} (incompletos o alterados)` : ''}.`; toast(msg); return { n, bad }; }
function importArchivo(inp) { const f = inp.files[0]; if (f) f.text().then(t => importar(t)); }
const prom = arr => { const v = arr.filter(x => x != null && x !== ''); return v.length ? Math.round(v.reduce((a, b) => a + +b, 0) / v.length) : null; };
function mAntig() { const L = AV(); if (!L.length) return vacio('Sin avances importados todavía. Esta pestaña se calcula con los códigos reales de los cadetes.');
  return `<section class="card"><h3>Puntaje por antigüedad</h3><div class="tw"><table><tr><th>Año</th><th>Cadetes</th><th>Inicio</th><th>Actual</th><th>Meta</th><th>Avance</th><th>Alcanzan meta</th></tr>${[1, 2, 3, 4].map(y => { const g = L.filter(a => a.a == y), i = prom(g.map(a => a.ini)), c = prom(g.map(a => a.est)), al = g.filter(a => a.est >= METAS[y]).length; return `<tr><td>${y}° año</td><td>${g.length}</td><td>${i ?? '—'}</td><td><b>${c ?? '—'}</b></td><td>${METAS[y]}</td><td>${i != null && c != null ? (c - i >= 0 ? '+' : '') + (c - i) : '—'}</td><td>${g.length ? al + ' (' + Math.round(100 * al / g.length) + '%)' : '—'}</td></tr>`; }).join('')}</table></div>
  <div class="ant">${[1, 2, 3, 4].map(y => { const g = L.filter(a => a.a == y), c = prom(g.map(a => a.est)), i = prom(g.map(a => a.ini)); return `<div><span>${y}°</span><div class="bar"><i class="ini" style="width:${i || 0}%"></i><i class="cur" style="width:${c || 0}%"></i><em style="left:${METAS[y]}%">${METAS[y]}</em></div></div>`; }).join('')}</div><p class="mini">Barra clara: inicio · barra fuerte: actual · marca: meta del año.</p></section>`; }
function todosRes() { const all = S.resultados.map(r => ({ ...r, fuente: 'este equipo', valido: folio(r.m, r.code, r.pts, r.sal) === r.folio })).concat(S.registro); const seen = {}; return all.filter(r => { const k = r.m + '|' + r.code; if (seen[k]) return false; return seen[k] = true; }); }
function mEstad() { const L = filtrar(AV());
  const grupos = {}; L.forEach(a => { const k = `${a.a}°|${a[grupoPor] || 's/g'}`; (grupos[k] = grupos[k] || []).push(a); });
  return `${filtros(false)}<section class="card"><div class="row sp"><h3>Práctica por grupo</h3><div class="seg sm"><button class="${grupoPor === 'gp' ? 'on' : ''}" onclick="grupoPor='gp';render()">Pedagógico</button><button class="${grupoPor === 'gi' ? 'on' : ''}" onclick="grupoPor='gi';render()">Inglés</button></div></div>
  ${L.length ? `<div class="tw"><table><tr><th>Año</th><th>Grupo</th><th>Cadetes</th><th>Promedio estimado</th><th>Mín.</th><th>Máx.</th><th>% meta año</th><th>% Barra I</th></tr>${Object.entries(grupos).sort().map(([k, g]) => { const [y, gr] = k.split('|'), v = g.map(a => a.est).filter(x => x != null), mt = METAS[parseInt(y)] || 60; return `<tr><td>${y}</td><td>${esc(gr)}</td><td>${g.length}</td><td><b>${prom(v) ?? '—'}</b></td><td>${v.length ? Math.min(...v) : '—'}</td><td>${v.length ? Math.max(...v) : '—'}</td><td>${v.length ? Math.round(100 * v.filter(x => x >= mt).length / v.length) + '%' : '—'}</td><td>${v.length ? Math.round(100 * v.filter(x => x >= 60).length / v.length) + '%' : '—'}</td></tr>`; }).join('')}</table></div>
  <div class="row"><button class="btn sm ghost" onclick="expAvance('xlsx')">Excel</button><button class="btn sm ghost" onclick="expAvance('csv')">CSV</button></div>` : '<p class="mini">Sin avances importados todavía. Esta pestaña se calcula con la práctica de los cadetes (códigos de avance o registro automático).</p>'}</section>`; }
function mAreas() { const L = filtrar(AV()); if (!L.length) return filtros() + vacio('Sin avances para estos filtros.'); const d = dominio(L);
  return `${filtros()}<section class="card"><h3>Dominio promedio por tema</h3>${barras(d, 100)}<p class="mini">${L.length} cadete(s). Tema más débil: <b>${Object.entries(d).sort((a, b) => a[1] - b[1])[0]?.[0] || '—'}</b>.</p></section>
  <section class="card"><h3>Por año</h3><div class="tw"><table><tr><th>Tema</th>${[1, 2, 3, 4].map(y => `<th>${y}°</th>`).join('')}</tr>${Object.values(TEMAS).map(t => `<tr><td>${t}</td>${[1, 2, 3, 4].map(y => { const v = dominio(L.filter(a => a.a == y))[t]; return `<td class="${v < 50 ? 'badt' : ''}">${v != null ? v + '%' : '—'}</td>`; }).join('')}</tr>`).join('')}</table></div></section>`; }
function riesgos() { const L = AV(), out = [], tiene = new Set(L.map(a => a.m));
  S.padron.filter(c => !tiene.has(c.m)).forEach(c => out.push({ ...c, est: null, motivo: 'Sin avance' }));
  L.forEach(a => { const m = []; if (a.a == 4 && a.est != null && a.est < 60) m.push(`4/o. año con ${a.est} (< 60)`); const u = ultimo(a); if (!u) m.push('No ha practicado'); else if (diasEntre(u, hoy()) >= 3) m.push(`${diasEntre(u, hoy())} días sin practicar`);
    const w = a.w || [0, 0], pw = a.pw || [0, 0], fresh = lunes(new Date(a.ts)) === lunes(); if (fresh && pw[0] >= 10 && (w[0] < pw[0] / 2 || (w[0] >= 10 && w[1] / w[0] < pw[1] / pw[0] - 0.1))) m.push('Baja semanal');
    if (m.length) out.push({ ...a, motivo: m.join(' · ') }); });
  return out.filter(r => (!fil.anio || String(r.a) === fil.anio) && (!fil.gp || r.gp === fil.gp) && (!fil.gi || r.gi === fil.gi)); }
function mRiesgo() { const R = riesgos(); return `${filtros(false)}<section class="card"><div class="row sp"><h3>Cadetes en riesgo (${R.length})</h3><button class="btn sm ghost" onclick="expRiesgo()">Excel</button></div>
  ${R.length ? `<div class="tw"><table><tr><th>Nombre</th><th>Año</th><th>Grupo</th><th>Estimado</th><th>Motivo</th></tr>${R.map(r => `<tr><td>${esc(r.n)}<small>${esc(r.m)}</small></td><td>${r.a}°</td><td>${esc(r.gp || '')}</td><td>${r.est ?? '—'}</td><td class="badt">${esc(r.motivo)}</td></tr>`).join('')}</table></div>` : `<p class="mini">${AV().length || S.padron.length ? 'Nadie en riesgo con estos filtros.' : 'Importa avances y el padrón para calcular esta pestaña.'}</p>`}</section>
  <section class="card"><h3>Padrón de cadetes (${S.padron.length})</h3><p class="mini">Sirve para detectar a quien no ha enviado avance. Pega columnas (de Excel) o sube un Excel/CSV con: Nombre, Matrícula, Año, Grupo pedagógico, Grupo de inglés, Compañía. Los nombres se guardan tal cual.</p>${soloLectura() ? `<p class="mini">Solo Administración puede cargar o vaciar el padrón.</p>` : `<textarea id="padin" placeholder="NOMBRE	MATRICULA	AÑO	GRUPO	GRUPO INGLES	COMPAÑIA"></textarea><div class="row"><button class="btn" onclick="cargaPadron($('#padin').value)">Cargar</button><label class="btn ghost">Excel / CSV<input type="file" hidden accept=".xlsx,.xls,.csv" onchange="padronArchivo(this)"></label>${S.padron.length ? `<button class="btn ghost" onclick="if(confirm('¿Vaciar el padrón?')){S.padron=[];save();render()}">Vaciar</button>` : ''}</div>`}</section>
  <section class="card"><h3>Sugerir sombras</h3><p class="mini">Empareja dentro de cada año al cadete con mejor puntaje estimado con el más bajo.</p><button class="btn" onclick="sugerirSombras()">Generar parejas (Excel)</button></section>`; }
function cargaPadron(txt) { if (bloquearEscritura()) return; const rows = txt.split(/\r?\n/).map(l => l.split(l.includes('\t') ? '\t' : /[,;]/).map(x => x.trim())).filter(r => r.length >= 2 && r[1] && !/matr/i.test(r[1])); filasPadron(rows); }
function filasPadron(rows) { if (bloquearEscritura()) return; let n = 0; rows.forEach(r => { const m = normMat(r[1]); if (!m) return; const o = { n: String(r[0] || '').trim(), m, a: parseInt(r[2]) || '', gp: norm(r[3]), gi: norm(r[4]), cia: String(r[5] || '').trim() }; const i = S.padron.findIndex(x => normMat(x.m) === m); i >= 0 ? S.padron[i] = o : S.padron.push(o); n++; }); save(); render(); toast(`${n} cadete(s) en el padrón`); }
function padronArchivo(inp) { if (bloquearEscritura()) return; const f = inp.files[0]; if (!f) return; f.arrayBuffer().then(b => { const wb = XLSX.read(b), rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, raw: false }); filasPadron(rows.filter(r => r[1] && !/matr/i.test(r[1]))); }); }
function sugerirSombras() { const out = []; [1, 2, 3, 4].forEach(y => { const g = AV().filter(a => a.a == y && a.est != null).sort((a, b) => b.est - a.est); while (g.length > 1) { const a = g.shift(), b = g.pop(); out.push({ Año: y, 'Cadete A': a.n, 'Matrícula A': a.m, 'Estimado A': a.est, 'Cadete B': b.n, 'Matrícula B': b.m, 'Estimado B': b.est }); } if (g.length) out.push({ Año: y, 'Cadete A': g[0].n, 'Matrícula A': g[0].m, 'Estimado A': g[0].est, 'Cadete B': '(sin pareja)', 'Matrícula B': '', 'Estimado B': '' }); }); if (!out.length) return toast('Se necesitan avances con puntaje estimado.'); exportar(out, 'Sombras_sugeridas', 'xlsx'); }
function vVerificar() { return `<section class="card"><h3>Verifica un folio</h3><div class="g2"><input id="vm" placeholder="Matrícula"><input id="vc" placeholder="Código B-70-1234"><input id="vp" type="number" placeholder="Puntaje"><input id="vs" type="number" placeholder="Salidas"><input id="vf" placeholder="Folio 1A2B-3C4D"></div><div class="row"><button class="btn" onclick="verificar()">Verificar</button>${S.sesion.perfil === 'admin' ? '<button class="btn ghost" onclick="verificar(true)">Verificar y registrar</button>' : ''}</div><div id="vout"></div></section>`; }
function verificar(reg) { const m = norm($('#vm').value), c = norm($('#vc').value), p = +$('#vp').value, s = +$('#vs').value, f = norm($('#vf').value), ok = folio(m, c, p, s) === f;
  $('#vout').innerHTML = `<p class="${ok ? 'okt' : 'badt'}"><b>${ok ? '✔ Folio válido: el resultado no fue alterado.' : '✘ El folio no coincide: el resultado fue alterado o se capturó mal.'}</b></p>`;
  if (ok && reg) { if (bloquearEscritura('Solo Administración puede registrar folios.')) return; if (S.registro.some(r => r.m === m && r.code === c)) return toast('Ya estaba registrado.'); const pa = S.padron.find(x => x.m === m) || S.avances[m] || {}; const n = pa.n || prompt('Nombre del evaluado (tal cual la lista):') || m; const anio = pa.a || parseInt(prompt('Año (1-4):')) || ''; S.registro.push({ n, m, tipo: 'cadete', anio, gp: pa.gp || '', gi: pa.gi || '', code: c, pts: p, sal: s, folio: f, fecha: hoy(), fuente: 'registro del aplicador', valido: true }); save(); toast('Registrado en Estadística'); } }
let evF = 'A', evMin = 70;
function mEval() { const c = codigoEval(evF, evMin), R = todosRes();
  return `<section class="card"><h3>Código de evaluación del día</h3><div class="g2"><label>Forma<select onchange="evF=this.value;render()">${FORMAS.map(f => `<option ${f === evF ? 'selected' : ''}>${f}</option>`).join('')}</select></label><label>Duración<select onchange="evMin=+this.value;render()">${[70, 60, 45, 30].map(m => `<option value="${m}" ${m === evMin ? 'selected' : ''}>${m} min · ${DUR_Q[m]} preg.</option>`).join('')}</select></label></div>
  <div id="evc" class="bigcode hide">${c}</div><div class="row">${esAdmin() ? `<button class="btn" id="btngen" onclick="$('#evc').classList.remove('hide')">Generar código</button><button class="btn ghost" onclick="copiar('${c}')">Copiar</button>` : `<p class="mini">Solo Administración puede generar y dictar el código del día.</p>`}</div><p class="mini">Vigente solo hoy (${hoy()}). Cada evaluado recibe preguntas y opciones en distinto orden.</p></section>
  <section class="card"><div class="row sp"><h3>Resultados (${R.length})</h3><div class="row"><button class="btn sm ghost" onclick="expRes('xlsx')">Excel</button><button class="btn sm ghost" onclick="expRes('csv')">CSV</button></div></div><p class="mini">De este equipo, de los códigos de avance y del registro del aplicador.</p>
  ${R.length ? `<div class="tw"><table><tr><th>Evaluado</th><th>Tipo</th><th>Matrícula</th><th>Forma</th><th>Fecha</th><th>Puntaje</th><th>Salidas</th><th>Folio</th><th>Fuente</th></tr>${R.slice().reverse().map(r => `<tr><td>${esc(r.n)}</td><td>${r.tipo === 'Piloto' ? '<span class="tagp">Piloto</span>' : r.tipo}</td><td>${esc(r.m)}</td><td>${r.code}</td><td>${r.fecha}</td><td><b>${r.pts}</b></td><td>${r.sal}</td><td class="mono ${r.valido ? '' : 'badt'}">${r.folio}${r.valido ? '' : ' ⚠'}</td><td><small>${r.fuente}</small></td></tr>`).join('')}</table></div>` : '<p class="mini">Sin resultados.</p>'}</section>${vVerificar()}`; }
function mAplic() { const now = new Date(), hs = []; for (let h = now.getHours() + 1; h <= 23; h++) hs.push(h);
  return `<section class="card"><h3>Emitir pase de aplicador</h3><div class="g2"><input id="apn" placeholder="Grado y nombre del docente"><input id="apm" placeholder="Matrícula del docente"></div><div class="g3"><label>Forma<select id="apf">${FORMAS.map(f => `<option>${f}</option>`).join('')}</select></label><label>Duración<select id="apd">${[70, 60, 45, 30].map(m => `<option>${m}</option>`).join('')}</select></label><label>Válido hoy hasta<select id="aph">${hs.map(h => `<option value="${h}" ${h === Math.min(23, now.getHours() + 3) ? 'selected' : ''}>${pad(h)}:00</option>`).join('')}</select></label></div>${soloLectura() ? '<p class="mini">Solo Administración puede emitir pases de aplicador.</p>' : (hs.length ? '<button class="btn" id="btnpase" onclick="emitirPase()">Generar pase</button>' : '<p class="mini">Ya no quedan horas hoy para emitir pases.</p>')}<div id="apout"></div></section>
  <section class="card"><h3>Pases emitidos en este equipo</h3>${S.pases.length ? `<div class="tw"><table><tr><th>Docente</th><th>Matrícula</th><th>Pase</th><th>Estado</th><th></th></tr>${S.pases.map((p, i) => [p, i]).reverse().map(([p, i]) => { const st = p.off ? 'Desactivado' : (p.dia !== hoy() || now.getHours() >= p.hh) ? 'Vencido' : 'Activo'; return `<tr><td>${esc(p.n)}</td><td>${esc(p.m)}</td><td class="mono">${p.code}</td><td class="${st === 'Activo' ? 'okt' : 'mini'}">${st}</td><td>${st === 'Activo' && esAdmin() ? `<button class="btn sm" onclick="verAplicar(${i})">Aplicar</button> <button class="btn sm ghost" onclick="desPase(${i})">Desactivar</button>` : (st === 'Activo' && soloLectura() ? '<span class="mini">solo consulta</span>' : '')}</td></tr>`; }).join('')}</table></div>` : '<p class="mini">Ninguno.</p>'}<p class="mini">${SRV ? 'Con servidor: desactivar aplica en todos los equipos al activar o abrir Aplicar.' : 'Sin servidor, desactivar solo surte efecto en este equipo; en el del docente el pase vence a la hora indicada.'}</p></section>`; }
let APL = null;
/* v2.5: la vista «Aplicar» (código del examen, resultados de esa forma y verificación de folio) se abre desde Administración › Aplicadores con un pase activo. */
function verAplicar(i) { if (bloquearEscritura('Solo Administración puede abrir Aplicar.')) return; APL = S.pases[i] ? Object.assign({}, S.pases[i]) : null; tab = 'aplicadm'; render(); scrollTo(0, 0); }
function mAplicar() { const a = APL; if (!a) { tab = 'aplic'; return mAplic(); } const st = a.off ? 'Desactivado' : (a.dia !== hoy() || new Date().getHours() >= a.hh) ? 'Vencido' : 'Activo', c = codigoEval(a.F, a.min);
  return `<section class="card"><button class="btn sm ghost" onclick="APL=null;tab='aplic';render()">← Aplicadores</button></section><section class="card center"><h3>Código del examen</h3>${st === 'Activo' ? `<div class="bigcode">${c}</div><p class="mini">Pase de ${esc(a.n)} · forma ${a.F} · ${a.min} min · ${DUR_Q[a.min]} preguntas · válido hoy hasta las ${pad(a.hh)}:00</p><button class="btn ghost" onclick="copiar('${c}')">Copiar</button>` : `<p class="badt">Pase ${st.toLowerCase()}.</p>`}</section>
  <section class="card"><h3>Resultados de la forma ${a.F} en este equipo</h3>${tablaRes(S.resultados.filter(r => r.code === c), true)}</section>${vVerificar()}`; }
function desPase(i) { if (bloquearEscritura()) return; S.pases[i].off = true; enviar('api/pases', S.pases[i]); save(); render(); }
function emitirPase() { if (bloquearEscritura('Solo Administración puede generar pases.')) return; const n = $('#apn').value.trim(), m = norm($('#apm').value); if (!n || !m) return toast('Grado, nombre y matrícula del docente.'); const F = $('#apf').value, min = +$('#apd').value, hh = +$('#aph').value, code = generaPase(m, F, min, hh); S.pases.push({ n, m, F, min, hh, code, dia: hoy() }); enviar('api/pases', S.pases[S.pases.length - 1]); save(); render(); $('#apout').innerHTML = `<div class="bigcode sm mono" id="pasecode">${code}</div><button class="btn ghost" onclick="copiar('${code}')">Copiar</button>`; }
function plantillaPadron() { descargar(new Blob(['\ufeffNombre completo,Matrícula,Año,Grupo pedagógico,Grupo de inglés,Compañía\n'], { type: 'text/csv;charset=utf-8' }), 'Plantilla_padron_Mision_Barra_I.csv'); }
function cardPadron() { const L = padronTodo(), por = [1, 2, 3, 4].map(a => [a, L.filter(x => +x.a === a).length]), dupN = new Set(), nom = {}; L.forEach(x => { const k = sinAcento(x.n); if (nom[k]) dupN.add(k); nom[k] = 1; });
  return `<section class="card" id="autollenado"><h3>Autollenado por matrícula</h3><p class="mini">Cuando el cadete escribe su matrícula, la app completa su nombre, año y grupos con esta lista y entra a su perfil si ya existe (evita registros dobles y nombres incompletos). La lista se guarda <b>solo en este equipo</b>; no se publica.</p>
  <div class="kpis k4">${por.map(([a, n]) => `<div><b>${n}</b><span>${a}° año</span></div>`).join('')}</div>
  <p class="mini">${L.length ? `${L.length} cadete(s) en la lista de este equipo${(window.MB1PADRON || []).length ? ' (incluye la lista de la versión privada)' : ''}.${dupN.size ? ` <b class="badt">${dupN.size} nombre(s) repetido(s)</b>: revisa matrículas.` : ''}` : 'Aún no hay lista en este equipo.'} Columnas: Nombre completo, Matrícula, Año, Grupo pedagógico, Grupo de inglés, Compañía (los nombres se guardan tal cual).</p>
  <div class="row"><label class="btn">Cargar lista (Excel o CSV)<input type="file" hidden accept=".xlsx,.xls,.csv" onchange="padronArchivo(this)"></label><button class="btn ghost" onclick="plantillaPadron()">Descargar plantilla CSV</button>${S.padron.length ? `<button class="btn ghost" onclick="if(confirm('¿Vaciar la lista de este equipo?')){S.padron=[];save();render()}">Vaciar</button>` : ''}</div>
  <label class="chk"><input type="checkbox" ${S.padronEstricto !== false ? 'checked' : ''} onchange="S.padronEstricto=this.checked;save();toast(this.checked?'Solo entran matrículas de la lista de este equipo':'Se permite captura guiada si la matrícula no está')"> Exigir que la matrícula esté en la lista (si no está, no se permite capturar a mano)</label>
  <p class="mini">Esta opción viene <b>activada</b> cuando hay una lista en este equipo (o en la versión privada). Si no hay lista cargada aquí, la captura guiada sigue disponible para no bloquear a quien aún no aparece. En los celulares de los cadetes: la lista también puede consultarse en línea desde la Hoja de registro (script v3/v4, pide el primer apellido para confirmar) o incluirse en la versión privada (archivo padron.js). Estado de la Hoja: ${SRV ? 'servidor de intranet' : SHEET ? (HV.v >= 5 ? '<b class="okt">matrícula, fotos, calificaciones y uso de dispositivos activos (v5)</b>' : HV.v >= 4 ? '<b class="okt">matrícula, fotos y calificaciones activos (v4; actualiza a v5 para ver si los cadetes usan la app con o sin internet)</b>' : HV.v >= 3 ? '<b class="okt">consulta de matrícula activa (v3; actualiza a v5 para calificaciones y uso de dispositivos)</b>' : 'script sin consulta de matrícula (actualízalo a v5; los pasos están en el instructivo y en el archivo privado)') : 'sin Hoja'}.</p></section>`; }
function mAjustes() { return `${cardPadron()}<section class="card"><h3>Cambio de códigos de acceso</h3><p class="mini">Escribe solo los que vas a cambiar. 6 a 24 caracteres: letras sin acento, números o guiones. Sin servidor, aplica solo en este equipo.</p>
  <label>Cadetes<input id="kc" placeholder="••••••"></label><label>Administración<input id="ka" placeholder="••••••"></label><div class="row"><button class="btn" onclick="guardarCodigos()">Guardar cambios</button><button class="btn ghost" onclick="if(soloLectura()){bloquearEscritura()}else if(confirm('¿Volver a los códigos iniciales?')){S.codes={...ORIGEN};save();toast('Códigos iniciales restaurados')}">Restaurar códigos iniciales</button></div></section>
  <section class="card"><h3>Material de práctica ALC</h3><p class="mini">Carga en este dispositivo el archivo que entrega la Mesa de Inglés para que los cadetes practiquen y hagan simulacros. Se guarda solo aquí; no se publica. No se muestran detalles de su contenido.</p>
  <p class="mini" id="matest">${window.ALCMOD && ALCMOD.tieneMaterial && ALCMOD.tieneMaterial() ? 'Material listo en este dispositivo.' : 'Aún no hay material de práctica ALC en este dispositivo.'}</p>
  <div class="row"><label class="btn">Cargar material (.json)<input type="file" hidden accept=".json,application/json" onchange="cargarMaterialALC(this)"></label></div></section>
  ${window.IMPORTA ? IMPORTA.card() : ''}
  ${window.BANCOS ? BANCOS.cardAdmin() : ''}
  <section class="card"><h3>Respaldo</h3><p class="mini">Guarda el avance, el padrón y los ajustes en un archivo JSON. Úsalo para pasar los datos a otro equipo o a la computadora de la Mesa.</p><div class="row"><button class="btn" onclick="respaldo()">Descargar respaldo</button><label class="btn ghost">Restaurar respaldo<input type="file" hidden accept=".json,application/json" onchange="restaurar(this)"></label></div></section>
  ${window.USO && esAdmin() ? USO.cardAjustes() : ''}
  <section class="card"><h3>Este dispositivo</h3><p class="mini">Versión ${VER} · ${navigator.onLine ? 'en línea' : 'sin internet'} · ${'serviceWorker' in navigator && navigator.serviceWorker.controller ? 'lista para usarse sin internet ✔' : 'ábrela una vez con internet para usarla sin conexión'} · ${SRV ? '<b class="okt">Servidor de intranet conectado</b>' : SHEET ? '<b class="okt">Hoja de actividad conectada</b>' : 'sin servidor'} · equipo ${EQUIPO}${(S.cola || []).length ? ' · ' + S.cola.length + ' envío(s) pendientes' : ''}</p></section>`; }
function cargarMaterialALC(inp) { if (bloquearEscritura('Solo Administración puede cargar el material de práctica.')) { inp.value = ''; return; } const f = inp.files && inp.files[0]; if (!f) return; if (window.ALCMOD && ALCMOD.importarMaterial) ALCMOD.importarMaterial(f).then(() => { inp.value = ''; render(); }).catch(() => toast('No se pudo cargar el material.')); else toast('La práctica ALC aún no está lista en esta pantalla.'); }
function guardarCodigos() { if (bloquearEscritura('Solo Administración puede cambiar códigos.')) return; const ch = { cadete: $('#kc').value, planta: '', admin: $('#ka').value }; let n = 0; for (const k in ch) { const v = ch[k].trim(); if (v && !/^[A-Za-z0-9-]{6,24}$/.test(v)) return toast(`Código de ${k} no válido (6 a 24: letras sin acento, números o guiones).`); } for (const k in ch) { const v = ch[k].trim(); if (v) { S.codes[k] = hc(v); n++; } } if (!n) return toast('No escribiste ningún código nuevo.'); save(); render();
  if (SRV) api('api/codigos', ch).then(r => { if (r.ok) { if (ch.admin.trim()) { CLAVE = ch.admin.trim().toUpperCase(); sessionStorage.setItem('mb1_k', CLAVE); } toast('Códigos actualizados en todos los equipos'); } else toast(r.error || 'El servidor no aceptó el cambio.'); }).catch(() => toast('Códigos actualizados solo en este equipo (sin servidor).')); else toast('Códigos actualizados'); }
function mMando() { const L = AV(), R = riesgos(), hoyAct = L.filter(a => a.dias && a.dias[hoy()]).length;
  return `${avisoHoja()}<section class="kpis"><div><b>${L.length}${S.padron.length ? '/' + S.padron.length : ''}</b><span>Con avance${S.padron.length ? ' / padrón' : ''}</span></div><div><b>${hoyAct}</b><span>Practicaron hoy</span></div><div><b class="badt">${R.length}</b><span>En riesgo</span></div><div><b>${L.reduce((s, a) => s + (a.q || 0), 0)}</b><span>Preguntas practicadas</span></div></section>
  <section class="card"><h3>Metas de egreso</h3><div class="tw"><table><tr><th>Año</th><th>Meta</th><th>Promedio actual</th><th>Faltan</th></tr>${[1, 2, 3, 4].map(y => { const c = prom(L.filter(a => a.a == y).map(a => a.est)); return `<tr><td>${y}° año${y === 4 ? ' (Barra I)' : ''}</td><td>${METAS[y]}</td><td>${c ?? '—'}</td><td>${c != null ? Math.max(0, METAS[y] - c) : '—'}</td></tr>`; }).join('')}</table></div></section>
  <section class="card"><h3>Descargas</h3><div class="row"><button class="btn" onclick="expTodo()">Libro de Excel completo</button><button class="btn ghost" onclick="respaldo()">Respaldo JSON</button></div></section>
  <section class="card"><h3>Pendientes sugeridos</h3><ul>${[R.length && `${R.length} cadete(s) en riesgo: revisa la pestaña En riesgo.`, !S.padron.length && 'Carga el padrón (En riesgo) para saber quién no ha enviado avance.', !L.length && 'Pide a los cadetes su código de avance por WhatsApp e impórtalos en Avance.'].filter(Boolean).map(x => `<li>${x}</li>`).join('') || '<li>Sin pendientes.</li>'}</ul></section>`; }

/* ---------- exportar / respaldo ---------- */
function descargar(blob, nombre) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); }
function hoja(rows) { const ws = XLSX.utils.json_to_sheet(rows), keys = Object.keys(rows[0] || {}); ws['!cols'] = keys.map(k => ({ wch: Math.min(45, Math.max(10, k.length + 2, ...rows.map(r => String(r[k] ?? '').length + 1))) }));
  const rg = XLSX.utils.decode_range(ws['!ref']); for (let r = rg.s.r; r <= rg.e.r; r++) for (let c = rg.s.c; c <= rg.e.c; c++) { const cell = ws[XLSX.utils.encode_cell({ r, c })]; if (!cell) continue; cell.s = r === 0 ? { font: { bold: true, name: 'Noto Sans', sz: 10, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1F4E3D' } }, alignment: { horizontal: 'center', vertical: 'center', wrapText: true } } : { font: { name: 'Noto Sans', sz: 10 } }; } return ws; }
function exportar(rows, nombre, fmt, extra) { if (!rows.length) return toast('No hay datos para exportar.'); const f = `${nombre}_${hoy()}`;
  if (fmt === 'csv' || typeof XLSX === 'undefined') { const k = Object.keys(rows[0]); const csv = '\ufeff' + [k.join(',')].concat(rows.map(r => k.map(x => `"${String(r[x] ?? '').replace(/"/g, '""')}"`).join(','))).join('\r\n'); return descargar(new Blob([csv], { type: 'text/csv;charset=utf-8' }), f + '.csv'); }
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, hoja(rows), nombre.slice(0, 31)); (extra || []).forEach(([n, r]) => r.length && XLSX.utils.book_append_sheet(wb, hoja(r), n)); XLSX.writeFile(wb, f + '.xlsx'); }
const filasRes = () => todosRes().filter(r => r.tipo !== 'Piloto').map(r => ({ Evaluado: r.n, Tipo: r.tipo, Matrícula: r.m, Año: r.anio, 'Grupo ped.': r.gp, 'Grupo inglés': r.gi, Código: r.code, Fecha: r.fecha, Puntaje: r.pts, Salidas: r.sal, Folio: r.folio, 'Folio válido': r.valido ? 'Sí' : 'No', Fuente: r.fuente }));
const filasRiesgo = () => riesgos().map(r => ({ Nombre: r.n, Matrícula: r.m, Año: r.a, Grupo: r.gp, Estimado: r.est ?? '', Motivo: r.motivo }));
function expAvance(fmt) { exportar(filtrar(AV()).map(filaAv), 'Avance', fmt); }
function expRes(fmt) { exportar(filasRes(), 'Resultados', fmt); }
function expRiesgo() { exportar(filasRiesgo(), 'En_riesgo', 'xlsx'); }
function expTodo() { const av = AV().map(filaAv); exportar(av.length ? av : [{ Aviso: 'Sin avances importados' }], 'Avance', 'xlsx', [['En riesgo', filasRiesgo()], ['Padrón', S.padron.map(c => ({ Nombre: c.n, Matrícula: c.m, Año: c.a, 'Grupo ped.': c.gp, 'Grupo inglés': c.gi, Compañía: c.cia }))]]); }
function respaldo() { const d = { ...S, sesion: null, _app: 'mision-barra-1', _ver: VER, _fecha: new Date().toISOString() }; descargar(new Blob([JSON.stringify(d)], { type: 'application/json' }), `Respaldo_MisionBarraI_${hoy()}.json`); }
function restaurar(inp) { if (bloquearEscritura('Solo Administración puede restaurar respaldos.')) return; const f = inp.files[0]; if (!f) return; f.text().then(t => { const d = JSON.parse(t); if (d._app !== 'mision-barra-1') return toast('El archivo no es un respaldo de esta app.'); if (!confirm('Se combinarán los datos del respaldo con los de este equipo. ¿Continuar?')) return; for (const m in d.avances || {}) if (!S.avances[m] || S.avances[m].ts < d.avances[m].ts) S.avances[m] = d.avances[m]; for (const m in d.perfiles || {}) if (!S.perfiles[m]) S.perfiles[m] = d.perfiles[m]; ['resultados', 'registro', 'pases'].forEach(k => (d[k] || []).forEach(x => { if (!S[k].some(y => JSON.stringify(y) === JSON.stringify(x))) S[k].push(x); })); (d.padron || []).forEach(c => { if (!S.padron.some(x => x.m === c.m)) S.padron.push(c); }); (d.calif || []).forEach(r => { S.calif = S.calif || []; if (!S.calif.some(x => x.id === r.id)) S.calif.push(r); }); (d.califAdj || []).forEach(a => { S.califAdj = S.califAdj || []; if (!S.califAdj.some(x => x.id === a.id)) S.califAdj.push(a); }); S.califCad = Object.assign({}, S.califCad || {}, d.califCad || {}); S.califSombra = Object.assign({}, S.califSombra || {}, d.califSombra || {}); if (d.sombraProg) S.sombraProg = d.sombraProg; (d.sombraSesiones || []).forEach(x => { S.sombraSesiones = S.sombraSesiones || []; if (!S.sombraSesiones.some(y => y.ts === x.ts && y.m === x.m)) S.sombraSesiones.push(x); }); if (d.codes) { S.codes = d.codes; migraCodes(); } save(); render(); toast('Respaldo restaurado'); }).catch(() => toast('No se pudo leer el archivo.')); }

window.addEventListener('popstate', () => { if (Q && Q.oficial) { history.pushState({ q: 1 }, ''); salida(); } });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js');
if (window.MB1AUD) MB1AUD.cargarVoces(); else if (window.speechSynthesis) speechSynthesis.getVoices();
window.__mb1 = { byId, akey, S: () => S, codigoEval, generaPase, validaPase, folio, codigoAvance, leerCodigos, forma, BANCO, importar, iniciar, P };
render();

/* ---------- modo presentación (usuario piloto) ---------- */
const GUION = [
  ['hoy', 'Entrada y pantalla Hoy', 'Dos perfiles (cadete y administración), cada uno con su código. En Hoy: 2,460 XP, 9 días seguidos, puntaje estimado de 51, “Te faltan 9 puntos para la Barra I”, meta diaria, gráfica de 44 a 51 e insignias.', 'El cadete sabe cada día cuánto le falta para egresar.'],
  ['practicar', 'Practicar', 'Abrir Misión de hoy: pregunta con audio (Escuchar y Lento), respuesta correcta y pista en español al responder. Mostrar Listening rápido y práctica por tema.', 'Retroalimentación inmediata en cada pregunta; prioriza el tema más débil y los errores.'],
  ['tecnicas', 'Técnicas', 'Nueve técnicas de estudio y el dictado con audio que marca las palabras falladas.', 'La aplicación enseña a estudiar, no solo a responder.'],
  ['simulacro', 'Simulacro', 'Ejercicio corto (20 preguntas, 15 min) o simulacro completo (100 preguntas, 70 min), con revisión al final.', 'Práctica en condiciones de tiempo real.'],
  ['sombra', 'Mi sombra', 'Pareja de estudio con meta semanal compartida y competencia semanal por antigüedad, grupo y compañía.', 'Compromiso entre compañeros.'],
  ['fin', 'Centro de mando', 'Cerrar el usuario piloto (el equipo queda en cero) y entrar como Administración: Mando, Avance, Antigüedad, Estadística, Áreas, En riesgo y Actividad.', 'Seguimiento por cadete, grupo y año sin captura en papel.']];
let GUION_I = null;
function presentar(i) { GUION_I = Math.max(0, Math.min(GUION.length - 1, i)); const g = GUION[GUION_I]; if (g[0] !== 'fin' && S.sesion && esPiloto()) { tab = g[0]; render(); }
  let el = $('#guion'); if (!el) { el = document.createElement('div'); el.id = 'guion'; document.body.appendChild(el); }
  el.innerHTML = `<div class="gh"><b>Paso ${GUION_I + 1} de ${GUION.length} · ${g[1]}</b><button onclick="cerrarGuion()">✕</button></div><p>${g[2]}</p><p class="mini"><b>Ventaja:</b> ${g[3]}</p><div class="row"><button class="btn sm ghost" onclick="presentar(GUION_I-1)" ${GUION_I ? '' : 'disabled'}>Anterior</button>${g[0] === 'fin' ? `<button class="btn sm" onclick="finPiloto()">Cerrar piloto e ir a Administración</button>` : `<button class="btn sm" onclick="presentar(GUION_I+1)">Siguiente</button>`}</div>`; }
function cerrarGuion() { GUION_I = null; $('#guion')?.remove(); }
function salirSandbox() { if (REAL) { S = REAL; REAL = null; } if (S.perfiles[PILOTO.m]) { delete S.perfiles[PILOTO.m]; } if (S.sesion && S.sesion.m === PILOTO.m) S.sesion = null; save(); }
function finPiloto() { if (esPiloto() || REAL) salirSandbox(); cerrarGuion(); loginPerfil = 'admin'; render(); toast('Piloto cerrado. Entra con la clave de administración.'); }

/* ---------- ayuda: instructivos por perfil ---------- */
const AYUDA = {
  cadete: ['Cadete', `<h3>Entrada</h3><ol><li>Abre el enlace de la aplicación que comparte tu docente.</li><li>Elige <b>Cadete</b>, escribe tu <b>matrícula</b> y el código de acceso que te dio la Mesa de Inglés. Oprime <b>Continuar</b>.</li><li>La app busca tus datos con tu matrícula: si ya tienes perfil en ese equipo entras directo; si apareces en la lista, confirma «Sí, soy yo». Si te pide tu primer apellido, escríbelo para buscarte en la lista oficial.</li><li>Si no apareces y tu equipo no exige que estés en la lista, escribe tu nombre y tus dos apellidos completos, año y grupos. Se guardan una sola vez con tu matrícula.</li></ol><p class="mini">Usa siempre el mismo equipo y navegador: tu práctica se guarda ahí. Instálala: Android › menú ⋮ › Agregar a pantalla principal; iPhone › Compartir › Agregar a inicio. Después funciona sin internet.</p>
  <h3>Primer día</h3><p>En Hoy oprime <b>Descubre tu nivel</b> (12 preguntas, unos 8 min, sin calificación). Con 20 respuestas aparece tu puntaje estimado. Metas de egreso: 1/er. año 42 · 2/o. 48 · 3/er. 54 · 4/o. 60 (Barra I). El estimado no es un resultado oficial.</p>
  <h3>Uso diario (10 a 15 min)</h3><ol><li>Hoy › <b>Misión de hoy</b>: 8 preguntas con tu tema más débil y tus errores.</li><li>Hoy › <b>Tarjetas</b>: unos 5 minutos de repaso.</li><li>Practicar › <b>Listening rápido</b>: 5 audios. El listening vale la mitad del simulacro.</li><li><b>Vocab</b>: tus flash cards pendientes del día (unos 5 minutos).</li></ol><p class="mini">Escuchar reproduce la grabación de la pregunta (si no hay grabación, la voz en inglés de este dispositivo). Lento lo repite despacio. En Hoy puedes cambiar la voz de las lecturas (no cambia las grabaciones). Usa audífonos.</p>
  <h3>Simulacro</h3><ol><li>En <b>Simulacro</b> puedes hacer un ejercicio corto (20 preguntas, 15 min) o un simulacro completo (100 preguntas, 70 min).</li><li>Al terminar ves tu porcentaje y puedes revisar. Es práctica: no es un resultado oficial.</li></ol>
  <h3>Envío de tu avance</h3><p>La coordinación no ve tu práctica hasta que envías tu código de avance (empieza con “MB1.”). Si aparece el recuadro naranja “Tu coordinadora todavía no ve tu práctica”, oprime <b>Generar mi código de avance</b> › Copiar o WhatsApp y envíalo completo. El más reciente reemplaza al anterior.</p>
  <h3>Programa Sombra</h3><p>Es un programa de tutoría entre pares de la Mesa de Inglés, a partir del último ALCPT (noviembre de 2026), sin importar el año. <b>Senior shadow</b> es quien obtuvo <b>70 o más</b>; <b>Junior shadow</b>, quien obtuvo <b>menos de 70</b>. A cada senior se le asignan juniors en cantidades lo más iguales posible y al menos uno de los de menor puntaje. El senior ve a sus juniors en <b>Mi sombra</b>; el junior ve quién es su senior.</p>
  <p>La dinámica es breve, pensada para poco tiempo: <b>dos sesiones de 20 minutos por semana</b> (si no se puede, al menos una de 25 a 30 min). En cada sesión: 4 min de vocabulario (flash cards), 12 min de eje (semanas impares: Listening Lab, 10 audios; semanas pares: Completa la palabra y gramática/lectura) y 4 min para anotar 3 errores y registrar la sesión en Mi sombra. Puntos de control: registro semanal de sesiones; cada 3 semanas, un simulacro corto de 20 preguntas (práctica, no oficial); y el <b>próximo ALCPT</b> oficial. El senior cuyos juniors sumen más avance en porcentaje en ese examen (respecto de noviembre de 2026) obtendrá un <b>beneficio</b>.</p>
  <h3>Mi sombra y competencia</h3><p>Además del programa oficial, puedes registrar una pareja de estudio con su nombre y matrícula y una meta semanal compartida. Pega los códigos MB1 de tus compañeros para ver la competencia semanal por antigüedad, grupo o compañía.</p>
  <h3>Listening, Completa y tu perfil</h3><p>La pestaña <b>Listening</b> (🎧) tiene 8 juegos para entrenar el oído; en <b>Practicar</b> está <b>Completa la palabra</b>; toca tu foto o tus iniciales arriba a la izquierda para abrir <b>Mi perfil</b>. Consulta sus instructivos en las pestañas de esta ventana.</p>
  <h3>Problemas frecuentes</h3><ul><li>“Código de acceso incorrecto”: revisa que elegiste Cadete; pide el código a tu docente.</li><li>“No soy yo” o datos equivocados en la lista: revisa tu matrícula; si sigue mal, avisa a la Mesa de Inglés.</li><li>Tu práctica aparece en cero: entraste desde otro equipo o se borraron los datos del navegador.</li><li>No se oye el audio: sube el volumen; si tu equipo no tiene voz en inglés, instálala en Ajustes › Texto a voz.</li></ul>`],
  vocab: ['Vocabulario', `<h3>Qué es</h3><p>La pestaña <b>Vocab</b> tiene flash cards y ejercicios de vocabulario con <b>repetición espaciada</b>: cada palabra regresa justo antes de que la olvides. Hay tres mazos: <b>ALCPT · temas</b> (militar, aviación, médico y enfermería, vida diaria, números, horas y fechas, direcciones, preposiciones, verbos frasales, adjetivos y opuestos, ropa y equipo, teléfono, conectores y sentimientos), <b>ALC</b> por libro (4 a 17), con filtro por año: 1.º año 4–5 · 2.º 6–9 · 3.º 10–13 · 4.º 14–17, y <b>Verbos</b> (regulares por regla de escritura e irregulares por patrón: base · pasado · participio, significado, ejemplo y audio). En total más de 1,000 tarjetas.</p>
  <h3>Flash cards</h3><ol><li>Elige ALCPT o ALC, y un tema o libro (o todos).</li><li>Oprime <b>Repasar flash cards</b>. El frente está en inglés: <b>Escuchar</b>, <b>Lento</b> y, si tu navegador lo permite, <b>Pronuncia</b> (te escucha por el micrófono).</li><li>Toca la tarjeta: ves el significado en español y una oración de ejemplo.</li><li>Califícate con honestidad: <b>Otra vez</b> (no la sabías; vuelve en minutos), <b>Difícil</b>, <b>Bien</b> o <b>Fácil</b>. Cada botón muestra cuándo volverá la tarjeta.</li></ol>
  <h3>Ejercicios</h3><ul><li><b>Opción múltiple</b>: significado o palabra en inglés.</li><li><b>Escribe la palabra</b> a partir del significado (con pista opcional).</li><li><b>Completa la oración</b> con la palabra que falta.</li><li><b>Empareja</b> inglés y español.</li><li>En el mazo Verbos: <b>Pasado y participio</b> (escribe las dos formas).</li></ul><p>Todos alimentan el mismo calendario: acertar aleja el próximo repaso; fallar lo acerca.</p>
  <h3>Cuántas al día</h3><p>Arriba ves cuántas tarjetas tienes <b>para repasar hoy</b> y cuántas <b>nuevas</b> quedan (por defecto 10 nuevas al día; cámbialo en «Nuevas por día»). Lo ideal: termina primero los repasos del día.</p>
  <p class="mini">Tu avance de vocabulario se guarda solo en este equipo y navegador, con tu matrícula. La coordinación solo ve que practicaste (tipo de ejercicio, número de tarjetas y aciertos).</p>`],
  escucha: ['Listening', `<h3>Listening Lab 🎧</h3><p>El listening es la mitad del examen. En la pestaña <b>Listening</b> hay 8 juegos: <b>Escucha y elige la imagen</b>, <b>Dictado</b> (escribe lo que oyes; se marcan en verde, amarillo y rojo las palabras), <b>Diálogos cortos</b> (dos voces y una pregunta), <b>Respuesta rápida</b>, <b>¿Cuál escuchaste?</b> (ship / sheep, thirteen / thirty), <b>Números, horas y deletreo</b>, <b>Oído para verbos</b> (go · went · gone) y <b>Mezcla sorpresa</b>.</p>
  <h3>Cómo se juega</h3><ol><li>Elige nivel (1 Inicial, 2 Intermedio, 3 Avanzado; se desbloquean con puntos), velocidad (🐢 Lenta, Normal, 🚀 Rápida) y modo: 10 audios o ⏱ contrarreloj de 90 segundos.</li><li>El audio suena solo. Usa <b>Repetir</b> o <b>Lento</b> cuando lo necesites (cada repetición extra resta 2 puntos).</li><li>Al responder ves si acertaste, la transcripción y un consejo. Escúchalo de nuevo leyendo el texto.</li></ol>
  <p>Puntos: 10 por acierto + bono de racha 🔥 (hasta +10) + bono por responder rápido + bono por nivel. Tu récord y tu mejor racha se guardan.</p>
  <h3>Completa la palabra 🧩</h3><p>En <b>Practicar › Completa la palabra</b>: oraciones con una palabra faltante (preposiciones, tiempos verbales, artículos, comparativos, modales, condicionales, voz pasiva, conectores, preguntas, verbos en pasado y vocabulario en contexto). Elige entre opciones o escríbela (+4 puntos). Al responder ves la explicación en español y escuchas la oración completa.</p>
  <p class="mini">Usa audífonos. La voz es la de tu dispositivo en inglés (cámbiala en Hoy › Audio). Tu progreso se guarda solo en este equipo; la coordinación ve qué ejercicio hiciste, cuántas preguntas y aciertos.</p>`],
  calif: ['Calificaciones', `<h3>Calificaciones oficiales 📊</h3><p><b>Cadetes (solo consulta):</b> en Hoy › <b>Calificaciones oficiales</b> (o desde tu perfil) ves tus resultados oficiales de ALCPT, ALC y parciales, tu gráfica de progreso y cuánto te falta para tu meta. No puedes editarlas ni ver las de otros cadetes.</p><p><b>Administración:</b> en el Centro de mando › <b>Calificaciones</b> carga archivos Excel/CSV, PDF, Word (.docx) o imágenes; revisa el mapeo de columnas y el enlace automático con el padrón antes de guardar. Filtra por año, grupo, cadete, tipo, fechas o rango de calificación (aprobados/reprobados) y exporta exactamente lo filtrado a Excel.</p><p><b>Directora:</b> consulta todo sin poder cargar, editar ni borrar.</p>`],
  perfil: ['Mi perfil', `<h3>Personaliza tu perfil ✨</h3><ol><li>Toca tu foto o tus iniciales (arriba a la izquierda) › <b>Personalizar mi perfil</b>.</li><li><b>📷 Tomar foto</b> o <b>🖼️ Elegir de la galería</b>. Si no quieres foto, elige un avatar y el color de tu tarjeta.</li><li>Elige hasta 6 cosas que te gustan y escribe tu frase.</li><li>En <b>Lo que más me cuesta aprender</b> marca hasta 4 opciones y cuéntalo con tus palabras (200 caracteres).</li><li>Oprime <b>Guardar mi perfil</b>.</li></ol>
  <p class="mini">Si compartes tu foto, Administración de la Mesa de Inglés puede verla (se envía comprimida a la Hoja de registro). Tus gustos y lo que te cuesta también los ve tu docente, para apoyarte. Si prefieres no compartir la foto, usa un avatar: se queda solo en este equipo.</p>`],
  alcpt: ['ALCPT', `<h3>Qué contiene</h3><ul><li><b>Práctica</b>: eliges la parte del examen (comprensión auditiva, gramática, vocabulario o lectura) y ves de inmediato si acertaste.</li><li><b>Simulacro</b>: Parte I, comprensión auditiva, y Parte II, lectura y estructura, con revisión al final. Cada audio se escucha hasta 2 veces.</li><li><b>Resultados</b>: tus prácticas y simulacros ALCPT en este dispositivo.</li></ul>
  <h3>De dónde salen los reactivos</h3><p>Son reactivos <b>originales</b> con el formato del ALCPT, no reactivos oficiales del examen. Si Administración cargó en el equipo el material de la Mesa de Inglés, también puedes elegirlo como banco. Es práctica: no es un resultado oficial.</p>`],
  alc: ['ALC', `<h3>Qué contiene</h3><ul><li><b>Práctica</b>: reactivos con retroalimentación inmediata.</li><li><b>Simulacro</b>: un ejercicio más largo, con el tiempo y la revisión al final.</li></ul>
  <p>La pestaña ALC solo usa reactivos ALC; los reactivos ALCPT están en su propia pestaña.</p>
  <h3>Primera vez en un equipo</h3><p>Administración carga el material de práctica en <b>Ajustes</b>, con el archivo que entrega la Mesa de Inglés. Se guarda solo en ese dispositivo. Las pruebas que sí cuentan se presentan en la otra aplicación de la Mesa, no aquí.</p>`],
  sombra: ['Programa Sombra', (window.SOMBRA && SOMBRA.AYUDA_HTML) || '<p>El Programa Sombra es la tutoría entre pares de la Mesa de Inglés.</p>'],
  ajustes: ['Ajustes', `<h3>Uso de la app (con o sin internet)</h3><p>Solo Administración ve este apartado, en <b>Ajustes</b>. Cada dispositivo de cadete (y el de la Directora) reporta si está usando la app <b>sin internet</b> (datos guardados en ese equipo) o <b>con internet</b> (sincronizada con la Hoja): modo, último sync y versión. También aparecen los ingresos de la Directora (fecha y hora, dispositivo y modo). Si la Hoja aún no está en script v5, el recuadro te indica que hay que actualizarlo.</p>`]
};
let ayudaK = 'cadete';
function ayuda(k) { if (k) ayudaK = k; let el = $('#ayuda'); if (!el) { el = document.createElement('div'); el.id = 'ayuda'; document.body.appendChild(el); }
  el.innerHTML = `<div class="ayc"><div class="gh"><b>Instructivos</b><button onclick="$('#ayuda').remove()">✕</button></div><p class="mini" style="margin:0 0 8px"><a href="manual.html" target="_blank" rel="noopener">Abrir el manual completo del cadete (instalación, bancos y Programa Sombra)</a></p><div class="seg">${Object.entries(AYUDA).map(([k, v]) => `<button class="${ayudaK === k ? 'on' : ''}" onclick="ayuda('${k}')">${v[0]}</button>`).join('')}</div><div class="ayb">${AYUDA[ayudaK][1]}</div><p class="mini">El instructivo de administración se entrega por separado a la Mesa de Inglés.</p></div>`; }

/* ---------- Actividad (requiere servidor) ---------- */
let af = { desde: '', hasta: '', anio: '', gp: '', txt: '', vista: 'act' };
function mActividad() {
  if (!SRV && SHEET && !localStorage.getItem('mb1_hk')) return `<section class="card"><h3>Actividad (Hoja de Google)</h3><p>La versión pública registra cada ingreso y cada ejercicio en la Hoja de actividad de la Mesa de Inglés. No se envían códigos.</p><button class="btn" onclick="claveHoja()">Capturar clave de lectura</button></section>`;
  if (!SRV && SHEET && !SRVDATA.t) { setTimeout(actualizarAct, 50); return `<section class="card"><h3>Actividad</h3><p>Cargando la Hoja de actividad…</p><button class="btn sm ghost" onclick="claveHoja()">Cambiar clave de lectura</button></section>`; }
  if (!SRV && !SHEET) return `<section class="card"><h3>Actividad</h3><p>El registro automático de ingresos y ejercicios necesita el <b>servidor de intranet</b> de la escuela. En esta versión web pública la actividad llega por los códigos de avance (pestaña Avance).</p><p class="mini">Abre la aplicación desde la dirección del servidor (por ejemplo http://10.x.x.x:8080/) para ver esta pestaña con datos.</p></section>`;
  const f = r => (!af.anio || String(r.anio) === af.anio) && (!af.gp || norm(r.gp) === norm(af.gp)) && (!af.txt || (r.nombre + ' ' + r.m).toUpperCase().includes(norm(af.txt)));
  const A = SRVDATA.act.filter(f), I = SRVDATA.ing.filter(f), pr = A.reduce((s, r) => s + r.preguntas, 0), ac = A.reduce((s, r) => s + r.aciertos, 0), mins = Math.round(A.reduce((s, r) => s + r.duracion_s, 0) / 60), dist = new Set(A.map(r => r.m).concat(I.map(r => r.m))).size;
  const tabla = af.vista === 'act' ? `<table><tr><th>Fecha y hora</th><th>Nombre</th><th>Año</th><th>Grupo</th><th>Ejercicio</th><th>Tema</th><th>Preg.</th><th>Aciertos</th><th>Duración</th></tr>${A.slice(0, 500).map(r => `<tr><td>${r.ts}</td><td>${esc(r.nombre)}<small>${esc(r.m)}</small></td><td>${esc(r.anio)}</td><td>${esc(r.gp)}${r.gi ? ' / ' + esc(r.gi) : ''}</td><td>${esc(r.tipo)}</td><td>${esc(r.tema)}</td><td>${r.preguntas}</td><td>${r.aciertos}${r.preguntas ? ' (' + Math.round(100 * r.aciertos / r.preguntas) + '%)' : ''}</td><td>${Math.floor(r.duracion_s / 60)}:${pad(r.duracion_s % 60)}</td></tr>`).join('')}</table>`
    : `<table><tr><th>Fecha y hora</th><th>Perfil</th><th>Nombre</th><th>Matrícula</th><th>Año</th><th>Grupo</th><th>Grupo inglés</th><th>Equipo</th><th>Modo</th><th>Versión</th></tr>${I.slice(0, 500).map(r => `<tr><td>${esc(r.ts)}</td><td>${esc(r.perfil)}</td><td>${esc(r.nombre)}</td><td>${esc(r.m)}</td><td>${esc(r.anio)}</td><td>${esc(r.gp)}</td><td>${esc(r.gi)}</td><td><small>${esc(r.equipo)}</small></td><td>${esc(r.modo || '—')}</td><td>${esc(r.ver || '—')}</td></tr>`).join('')}</table>`;
  return `<div class="filtros"><input type="date" value="${af.desde}" onchange="af.desde=this.value;actualizarAct()" title="Desde"><input type="date" value="${af.hasta}" onchange="af.hasta=this.value;actualizarAct()" title="Hasta">
  <select onchange="af.anio=this.value;render()"><option value="">Todos los años</option>${[1, 2, 3, 4].map(a => `<option ${af.anio == a ? 'selected' : ''} value="${a}">${a}° año</option>`).join('')}</select><input placeholder="Grupo" value="${esc(af.gp)}" onchange="af.gp=this.value;render()"><input placeholder="Nombre o matrícula" value="${esc(af.txt)}" onchange="af.txt=this.value;render()"><button class="btn sm ghost" onclick="actualizarAct()">Actualizar</button>${!SRV && SHEET ? '<button class="btn sm ghost" onclick="claveHoja()">Clave</button>' : ''}</div>
  <section class="kpis"><div><b>${I.length}</b><span>Ingresos</span></div><div><b>${dist}</b><span>Personas distintas</span></div><div><b>${A.length}</b><span>Ejercicios · ${pr} preguntas</span></div><div><b>${pr ? Math.round(100 * ac / pr) + '%' : '—'}</b><span>Aciertos · ${mins} min</span></div></section>
  <section class="card"><div class="row sp"><div class="seg sm"><button class="${af.vista === 'act' ? 'on' : ''}" onclick="af.vista='act';render()">Ejercicios (${A.length})</button><button class="${af.vista === 'ing' ? 'on' : ''}" onclick="af.vista='ing';render()">Ingresos (${I.length})</button></div><button class="btn sm ghost" onclick="expAct()">Excel</button></div>
  <div class="tw">${tabla}</div>${(af.vista === 'act' ? A : I).length > 500 ? '<p class="mini">Se muestran 500; el Excel trae todos.</p>' : ''}<p class="mini">Actualizado: ${SRVDATA.t ? new Date(SRVDATA.t).toLocaleTimeString('es-MX') : '—'}. El usuario piloto no se registra.</p></section>`; }
function actualizarAct() { cargarActividad().then(render).catch(e => { if (!SRV && SHEET) SRVDATA.t = Date.now(); toast('No se pudo leer ' + (SRV ? 'el servidor' : 'la Hoja') + ': ' + e.message); render(); }); }
function expAct() { const f = r => (!af.anio || String(r.anio) === af.anio) && (!af.gp || norm(r.gp) === norm(af.gp)) && (!af.txt || (r.nombre + ' ' + r.m).toUpperCase().includes(norm(af.txt)));
  const A = SRVDATA.act.filter(f).map(r => ({ 'Fecha y hora': r.ts, Nombre: r.nombre, Matrícula: r.m, Perfil: r.perfil, Año: r.anio, 'Grupo ped.': r.gp, 'Grupo inglés': r.gi, Ejercicio: r.tipo, Tema: r.tema, Preguntas: r.preguntas, Aciertos: r.aciertos, '% aciertos': r.preguntas ? Math.round(100 * r.aciertos / r.preguntas) : '', 'Duración (min)': Math.round(r.duracion_s / 6) / 10, Equipo: r.equipo }));
  const I = SRVDATA.ing.filter(f).map(r => ({ 'Fecha y hora': r.ts, Perfil: r.perfil, Nombre: r.nombre, Matrícula: r.m, Año: r.anio, 'Grupo ped.': r.gp, 'Grupo inglés': r.gi, Compañía: r.cia, Equipo: r.equipo, Modo: r.modo || '', Versión: r.ver || '' }));
  exportar(A.length ? A : [{ Aviso: 'Sin ejercicios en el periodo' }], 'Actividad', 'xlsx', [['Ingresos', I]]); }
detectar();
