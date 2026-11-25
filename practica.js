/* Misión: Obtener la Barra I · v2.12
   Laboratorio de Listening (juegos de comprensión auditiva con niveles, rachas, puntos y contrarreloj)
   y «Completa la palabra que falta» (gramática, verbos y vocabulario en contexto, con retroalimentación inmediata).
   Audio con la voz en inglés del dispositivo (speechSynthesis, en-US). Contenido original; no incluye material oficial.
   El progreso se guarda SOLO en este dispositivo (localStorage «mb1_practica_v1»), por matrícula. */
(function () {
  'use strict';
  const D = window.MB1PRAC || { completa: [], dial: [], resp: [], dict: [], img: [], pares: [] };
  const KEY = 'mb1_practica_v1';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = m => { if (typeof window.toast === 'function') window.toast(m); };
  const mezcla = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const azar = a => a[Math.floor(Math.random() * a.length)];
  const ent = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pad = n => String(n).padStart(2, '0');
  const dia = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const normal = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’`]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
  function lev(a, b) { const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }

  /* ---------- integración con la app (solo lectura de la sesión) ---------- */
  const g = (f, d) => { try { return f(); } catch (e) { return d; } };
  const SES = () => g(() => S && S.sesion, null);
  const PERF = () => g(() => P(), null);
  const pil = () => g(() => !!REAL || esPiloto(), false);
  const consulta = () => { const s = SES(), p = PERF(); return !!(s && (s.vistaCadete || s.perfil === 'directora' || s.perfil === 'admin')) || !!(p && p.vistaSolo); };
  const sinGuardar = () => pil() || consulta();
  const mat = () => { const s = SES(); return s ? s.m : '_'; };
  let MEM = {};
  const vacio = () => ({ esc: { pts: 0, best: 0, rmax: 0, n: 0, ok: 0, modos: {}, dias: {} }, comp: { pts: 0, n: 0, ok: 0, temas: {}, rmax: 0 } });
  function leer() { try { return JSON.parse(localStorage.getItem(KEY)) || { v: 1, p: {} }; } catch (e) { return { v: 1, p: {} }; } }
  function datos() { const m = mat(); if (sinGuardar()) return MEM[m] || (MEM[m] = vacio()); const all = leer(), x = all.p[m] || vacio(); const v = vacio(); x.esc = Object.assign(v.esc, x.esc || {}); x.comp = Object.assign(v.comp, x.comp || {}); return x; }
  function guardar(x) { if (sinGuardar()) return; const all = leer(); all.p[mat()] = x; const ks = Object.keys(x.esc.dias || {}).sort(); while (ks.length > 60) delete x.esc.dias[ks.shift()]; try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { toast('No hay espacio en este dispositivo para guardar el progreso.'); } }
  function registrar(tipo, tema, n, ok, t0, toolKey) {
    if (sinGuardar() || !n) return;
    try { usar(toolKey); } catch (e) { }
    try { const p = P(); if (p && !p.piloto && (SRV || SHEET)) { enviar('api/actividad', { ts: tsLocal(), m: p.m, nombre: p.nombre, perfil: p.perfil, anio: p.anio, gp: p.gp, gi: p.gi, tipo, tema, preguntas: n, aciertos: ok, duracion_s: Math.round((Date.now() - t0) / 1000), equipo: EQUIPO }); enviar('api/avance', payload(p)); } } catch (e) { }
  }

  /* ---------- audio ---------- */
  const VEL = { lenta: .7, normal: .9, rapida: 1.05 };
  const velGuardada = () => { const v = localStorage.getItem('mb1_esc_vel'); return VEL[v] ? v : 'normal'; };
  function parar() { try { if (typeof pararAudio === 'function') pararAudio(); else if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { } }
  function voces() { const vs = window.MB1AUD ? MB1AUD.vocesEN() : (window.speechSynthesis ? speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang)) : []); const us = vs.filter(v => /en[-_]US/i.test(v.lang)); return us.length >= 2 ? us : vs; }
  function hablar(txt, opts) {
    opts = opts || {}; if (!('speechSynthesis' in window)) { toast('Este equipo no tiene voz en inglés. Instálala en Ajustes › Texto a voz.'); if (opts.onEnd) setTimeout(opts.onEnd, 50); return; }
    parar(); const rate = opts.rate || VEL[UI.vel] || .9;
    let lines = null;
    if (Array.isArray(txt)) { const vs = voces(), vA = window.MB1AUD ? MB1AUD.vozElegida() : vs[0], vB = vs.find(v => v !== vA && v.name !== (vA && vA.name)) || vA; lines = txt.map(([sp, t]) => ({ t, voice: sp === 'B' ? vB : vA, pitch: sp === 'B' && vB === vA ? 1.35 : 1 })); }
    if (window.MB1AUD) return MB1AUD.speak(lines ? '' : String(txt), { rate, lines: lines || undefined, onEnd: opts.onEnd });
    speechSynthesis.cancel(); (lines || [{ t: String(txt) }]).forEach((l, i, a) => { const u = new SpeechSynthesisUtterance(l.t); u.lang = 'en-US'; u.rate = rate; if (l.voice) u.voice = l.voice; if (l.pitch) u.pitch = l.pitch; if (i === a.length - 1 && opts.onEnd) u.onend = opts.onEnd; speechSynthesis.speak(u); });
  }

  /* ---------- datos derivados ---------- */
  const VCARDS = () => (window.VOCAB && VOCAB.CARDS) ? Object.values(VOCAB.CARDS) : [];
  const VERBOS = () => VCARDS().filter(c => c.p);
  const alts = v => String(v || '').split(' / ').map(x => x.trim()).filter(Boolean);
  function enEj(ex, t) { const e = ex.toLowerCase(), w = t.toLowerCase(); let i = e.indexOf(w); while (i >= 0) { const a = e[i - 1] || ' ', b = e[i + w.length] || ' '; if (!/[a-z]/.test(a) && !/[a-z]/.test(b)) return i; i = e.indexOf(w, i + 1); } return -1; }

  /* =====================================================================
     LISTENING
     ===================================================================== */
  const NIVELES = { 1: ['Inicial', 0], 2: ['Intermedio', 200], 3: ['Avanzado', 600] };
  const MODOS = {
    img: ['🖼️', 'Escucha y elige la imagen', 'Oyes una palabra o frase y tocas el dibujo correcto.'],
    dict: ['✍️', 'Dictado', 'Escucha y escribe la oración completa. Se marcan las palabras que faltan.'],
    dial: ['💬', 'Diálogos cortos', 'Dos voces conversan; responde la pregunta.'],
    resp: ['⚡', 'Respuesta rápida', 'Oyes una pregunta y eliges la mejor respuesta.'],
    pares: ['👂', '¿Cuál escuchaste?', 'Palabras que suenan casi igual: ship / sheep, thirteen / thirty.'],
    num: ['🔢', 'Números, horas y deletreo', 'Datos exactos: horas, precios, fechas, teléfonos y nombres deletreados.'],
    verbo: ['⏪', 'Oído para verbos', 'Escucha la forma del verbo (go, went, gone) y elige cuál fue.'],
    mezcla: ['🎲', 'Mezcla sorpresa', 'Un poco de todo, como en el examen.']
  };
  let UI = { vista: 'inicio', nivel: 1, vel: velGuardada(), reloj: false, _m: null };
  let G = null, FINE = null, TMR = null;
  const nivelMax = x => sinGuardar() ? 3 : x.esc.pts >= NIVELES[3][1] ? 3 : x.esc.pts >= NIVELES[2][1] ? 2 : 1;

  // ---- generadores (devuelven { audio, q, ops, ok, trans, tip, tipo }) ----
  function opcionesDe(ok, ds) { const o = mezcla([ok].concat(ds.slice(0, 3))); return { ops: o, ok: o.indexOf(ok) }; }
  function genImg(n) {
    const t = azar(D.img), mismos = D.img.filter(x => x[2] === t[2] && x !== t), otros = D.img.filter(x => x[2] !== t[2]);
    const ds = mezcla(n === 1 ? otros : mismos.length >= 3 ? mismos : otros).slice(0, 3);
    const frases = ['Point to the {w}.', 'I need the {w}, please.', 'Can you see the {w}?', 'Where is the {w}?'];
    const audio = n === 3 ? azar(frases).replace('{w}', t[1]) : n === 2 ? 'The ' + t[1] + '.' : t[1];
    const o = mezcla([t].concat(ds)); return { tipo: 'img', audio, q: '¿Qué escuchaste?', ops: o.map(x => x[0]), opsTxt: o.map(x => x[1]), ok: o.indexOf(t), trans: audio, tip: `${t[0]} = ${t[1]}`, grande: true };
  }
  function genDict(n) { const L = D.dict.filter(x => x[0] === n); const t = azar(L.length ? L : D.dict); return { tipo: 'dict', audio: t[1], q: 'Escribe lo que escuchas', answer: t[1], trans: t[1], tip: 'Escucha primero completo; en la segunda vez escribe; en la tercera revisa terminaciones (-s, -ed) y palabras pequeñas (a, the, to).' }; }
  function genDial(n) { const L = D.dial.filter(x => x[0] === n); const t = azar(L.length ? L : D.dial); const o = opcionesDe(t[3], t[4]); return { tipo: 'dial', audio: t[1].concat([['A', 'Question. ' + t[2]]]), q: t[2], ops: o.ops, ok: o.ok, trans: t[1].map(([s, x]) => `${s}: ${x}`).join('\n'), tip: 'Ubica primero qué pide la pregunta (Who, Where, When, How many…). Atención a los cambios: "but", "instead", "moved", "not yet".' }; }
  function genResp(n) { const L = D.resp.filter(x => x[0] === n); const t = azar(L.length ? L : D.resp); const o = opcionesDe(t[2], t[3]); return { tipo: 'resp', audio: t[1], q: 'Elige la mejor respuesta', ops: o.ops, ok: o.ok, trans: t[1], tip: 'Responde a la palabra de pregunta: How long → duración, How often → frecuencia, Where → lugar, Why → razón.' }; }
  function genPares(n) { const t = azar(D.pares), k = Math.random() < .5 ? 0 : 1, w = t[k]; const frase = n === 3 ? `The word is ${w}.` : w; const ops = mezcla([t[0], t[1]]); return { tipo: 'pares', audio: frase, q: '¿Cuál palabra escuchaste?', ops, ok: ops.indexOf(w), trans: frase, tip: `${t[0]} / ${t[1]}: ${t[2]}`, dos: true, decirAmbas: `${t[0]}. ${t[1]}.` }; }
  const MESES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const ORD = n => n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th');
  const APELL = ['RUIZ', 'TORRES', 'VEGA', 'SOTO', 'LUNA', 'MEZA', 'ROJAS', 'PENA', 'CRUZ', 'LARA', 'BRAVO', 'SALAS', 'NAVA', 'REYES', 'CANO'];
  function genNum(n) {
    const k = ent(0, n === 1 ? 2 : n === 2 ? 4 : 5);
    if (k === 0) { const b = ent(1, 9), pair = Math.random() < .5 ? [b + 10, b * 10] : [b * 10, b + 10]; const w = b === 1 ? (Math.random() < .5 ? 11 : 10) : pair[0]; const ds = [...new Set([b * 10, b + 10, w + 1, w + 2, b * 10 + 1].filter(x => x !== w))].slice(0, 3); const o = opcionesDe(String(w), ds.map(String)); return { tipo: 'num', audio: `The number is ${w}.`, q: '¿Qué número escuchaste?', ops: o.ops, ok: o.ok, trans: `The number is ${w}.`, tip: '-teen (13–19) lleva el acento al final: thirTEEN. -ty (30, 40…) al inicio: THIRty.' }; }
    if (k === 1) { const h = ent(5, 11), m = azar([0, 15, 30, 45, 10, 20, 40, 50]); const f = (H, M) => `${H}:${pad(M)}`; const say = m === 0 ? `${h} o'clock` : m === 15 ? `a quarter past ${h}` : m === 30 ? `half past ${h}` : m === 45 ? `a quarter to ${h + 1}` : `${h} ${m}`; const ok = f(h, m); const ds = [...new Set([f(h + 1, m), f(h, (m + 30) % 60), m === 45 ? f(h, 15) : f(h - 1, m), f(h, m === 0 ? 30 : 0)].filter(x => x !== ok))].slice(0, 3); const o = opcionesDe(ok, ds); return { tipo: 'num', audio: `The bus leaves at ${say}.`, q: '¿A qué hora sale el autobús?', ops: o.ops, ok: o.ok, trans: `The bus leaves at ${say}.`, tip: 'Half past 7 = 7:30 · A quarter past 7 = 7:15 · A quarter to 8 = 7:45.' }; }
    if (k === 2) { const L = azar(APELL), sp = L.split('').join(', '); const dist = [...new Set([L.replace(/Z$/, 'S'), (L[0] === 'R' ? 'L' + L.slice(1) : L[0] === 'L' ? 'R' + L.slice(1) : L.replace(/E/, 'I')), L.slice(0, -1) + 'E', L.replace(/A/, 'E'), L.replace(/O/, 'U')].filter(x => x !== L))].slice(0, 3); while (dist.length < 3) dist.push(L + 'S'.repeat(dist.length + 1)); const o = opcionesDe(L, dist); return { tipo: 'num', audio: `My last name is ${L[0] + L.slice(1).toLowerCase()}. That's ${sp}.`, q: '¿Cómo se escribe el apellido?', ops: o.ops, ok: o.ok, trans: `That's ${sp}.`, tip: 'Letras que confunden: E (/i/), I (/ai/), A (/ei/), G (/yi/), J (/yei/), R (/ar/).' }; }
    if (k === 3) { const p = ent(2, 19) * 10 + azar([0, 5]), sale = Math.random() < .5; const ok = sale ? p / 2 : p; const ds = [...new Set([sale ? p : p / 2, p + 10, p * 2, p - 5].filter(x => x !== ok && x > 0))].slice(0, 3); const o = opcionesDe('$' + ok, ds.map(x => '$' + x)); const au = sale ? `These boots were ${p} dollars, but today they're half price.` : `The jacket costs ${p} dollars.`; return { tipo: 'num', audio: au, q: '¿Cuánto cuesta hoy?', ops: o.ops, ok: o.ok, trans: au, tip: 'Escucha hasta el final: "but", "half price" o "on sale" cambian la cifra.' }; }
    if (k === 4) { const mm = ent(0, 11), dd = ent(1, 28); const ok = `${MESES[mm]} ${dd}`; const ds = [...new Set([`${MESES[mm]} ${dd + 1}`, `${MESES[(mm + 1) % 12]} ${dd}`, `${MESES[mm]} ${dd > 9 ? dd - 10 : dd + 10}`].filter(x => x !== ok))].slice(0, 3); const o = opcionesDe(ok, ds); const au = `The course starts on ${MESES[mm]} ${ORD(dd)}.`; return { tipo: 'num', audio: au, q: '¿Cuándo empieza el curso?', ops: o.ops, ok: o.ok, trans: au, tip: 'Las fechas se dicen con ordinales: May fifth, June twenty-second.' }; }
    const a = ent(12, 40), b = ent(3, 9), first = Math.random() < .5; const ok = String(first ? a - b : a + b); const ds = [...new Set([String(a), String(b), String(first ? a + b : a - b), String(a + b + 10)].filter(x => x !== ok))].slice(0, 3); const o = opcionesDe(ok, ds); const au = first ? `We had ${a} chairs, but ${b} were broken. How many chairs can we use?` : `There were ${a} cadets in the room, and ${b} more arrived. How many are there now?`; return { tipo: 'num', audio: au, q: au.split('. ').pop(), ops: o.ops, ok: o.ok, trans: au, tip: 'Anota mentalmente cada cifra y fíjate si suman (more, arrived) o restan (broken, left).' };
  }
  function genVerbo(n) {
    const V = VERBOS(); if (V.length < 8) return genPares(n);
    const c = azar(n === 1 ? V.filter(v => v.d.k[0] === 'r') : V.filter(v => v.d.k[0] === 'i')), forma = n === 3 ? alts(c.pp)[0] : n === 2 ? alts(c.p)[0] : (Math.random() < .5 ? c.en : alts(c.p)[0]);
    const pool = new Set([c.en, ...alts(c.p), ...alts(c.pp)]); const otros = mezcla(V.filter(v => v !== c && v.en[0] === c.en[0])).concat(mezcla(V)).flatMap(v => [v.en, ...alts(v.p), ...alts(v.pp)]);
    const ds = []; [...pool].concat(otros).forEach(w => { if (w !== forma && !ds.includes(w) && ds.length < 3) ds.push(w); });
    const o = opcionesDe(forma, ds); return { tipo: 'verbo', audio: forma, q: '¿Qué forma del verbo escuchaste?', ops: o.ops, ok: o.ok, trans: `${c.en} · ${c.p} · ${c.pp} = ${c.es}`, tip: `Ejemplo: ${c.ex}`, ex: c.ex };
  }
  const GEN = { img: genImg, dict: genDict, dial: genDial, resp: genResp, pares: genPares, num: genNum, verbo: genVerbo };
  function generar(modo, n) { const m = modo === 'mezcla' ? azar(['img', 'dial', 'resp', 'pares', 'num', 'verbo', 'dict', 'dial', 'resp']) : modo; for (let k = 0; k < 6; k++) { const it = GEN[m](n); if (!G || !G.vistos.has(it.trans)) return it; } return GEN[m](n); }

  // ---- sesión ----
  function iniciar(modo) {
    const x = datos(), nmax = nivelMax(x); if (UI.nivel > nmax) UI.nivel = nmax;
    G = { modo, nivel: UI.nivel, reloj: UI.reloj, total: UI.reloj ? 0 : (modo === 'dict' ? 6 : 10), i: 0, pts: 0, racha: 0, rmax: 0, ok: 0, n: 0, t0: Date.now(), fin: UI.reloj ? Date.now() + 90e3 : 0, vistos: new Set(), item: null, res: null, rep: 0 };
    sig(); UI.vista = 'juego'; pintar(); if (G.reloj) { clearInterval(TMR); TMR = setInterval(tic, 250); }
  }
  function tic() { if (!G || !G.reloj) { clearInterval(TMR); return; } const r = Math.max(0, G.fin - Date.now()); const el = ROOT && ROOT.querySelector('#ereloj'); if (el) { el.textContent = Math.ceil(r / 1000) + ' s'; el.classList.toggle('poco', r < 15e3); } if (r <= 0) { clearInterval(TMR); terminar(); } }
  function sig() { G.item = generar(G.modo, G.nivel); G.vistos.add(G.item.trans); G.res = null; G.rep = 0; G.tq = Date.now(); setTimeout(() => tocar(false), 350); }
  function tocar(lento) { if (!G || !G.item) return; if (G.res == null) G.rep++; hablar(G.item.audio, lento ? { rate: .65 } : {}); const b = ROOT && ROOT.querySelector('.eplay'); if (b) { b.classList.remove('pulso'); void b.offsetWidth; b.classList.add('pulso'); } }
  function puntos(ok, frac) { if (!ok) return 0; const base = Math.round(10 * (frac == null ? 1 : frac)), extra = Math.max(0, G.rep - 1) * 2, vel = (Date.now() - G.tq) < 9000 ? 2 : 0; return Math.max(2, base - extra) + Math.min(10, G.racha * 2) + vel + (G.nivel - 1) * 3; }
  function responder(k) {
    if (!G || G.res) return; const it = G.item, ok = k === it.ok; G.n++;
    if (ok) { G.racha++; G.ok++; } else G.racha = 0; G.rmax = Math.max(G.rmax, G.racha);
    const p = puntos(ok); G.pts += p; G.res = { ok, k, p };
    if (window.FX) { if (ok) setTimeout(() => FX.ok(ROOT.querySelector('.efb')), 30); else FX.no(); }
    pintar(); if (G.reloj && Date.now() >= G.fin) terminar();
  }
  function compararDict(esper, dado) {
    const A = normal(esper).split(' '), B = normal(dado).split(' ').filter(Boolean); const n = A.length, m = B.length;
    const L = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0)); const igual = (a, b) => a === b || (a.length >= 5 && lev(a, b) <= 1);
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = igual(A[i], B[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const marca = []; let i = 0, j = 0; while (i < n) { if (j < m && igual(A[i], B[j])) { marca.push([A[i], A[i] === B[j] ? 'ok' : 'casi']); i++; j++; } else if (j < m && L[i][j + 1] >= L[i + 1][j]) j++; else { marca.push([A[i], 'falta']); i++; } }
    const bien = marca.filter(x => x[1] !== 'falta').length; return { marca, frac: bien / n, extra: Math.max(0, m - bien) };
  }
  function revisarDict() {
    if (!G || G.res) return; const v = (ROOT.querySelector('#edict') || {}).value || ''; if (!v.trim()) return toast('Escribe lo que escuchaste.');
    const r = compararDict(G.item.answer, v), ok = r.frac >= .9 && r.extra <= 1; G.n++; if (ok) { G.racha++; G.ok++; } else G.racha = 0; G.rmax = Math.max(G.rmax, G.racha);
    const p = ok ? puntos(true, 1) : Math.round(6 * r.frac); G.pts += p; G.res = { ok, p, dict: r, val: v };
    if (window.FX) { if (ok) setTimeout(() => FX.ok(ROOT.querySelector('.efb')), 30); else FX.no(); } pintar();
  }
  function siguiente() { if (!G) return; if (G.reloj ? Date.now() >= G.fin : G.n >= G.total) return terminar(); G.i++; sig(); pintar(); const i = ROOT.querySelector('#edict'); if (i) i.focus(); }
  function terminar() {
    clearInterval(TMR); parar(); if (!G) return; const x = datos(), antes = nivelMax(x), e = x.esc;
    e.pts += G.pts; e.n += G.n; e.ok += G.ok; e.rmax = Math.max(e.rmax, G.rmax); const rec = G.pts > (e.best || 0) && G.n > 0; if (rec) e.best = G.pts;
    const md = e.modos[G.modo] || (e.modos[G.modo] = [0, 0, 0]); md[0] += G.n; md[1] += G.ok; md[2] = Math.max(md[2], G.pts);
    const d = e.dias[dia()] || (e.dias[dia()] = [0, 0]); d[0] += G.n; d[1] += G.pts; guardar(x);
    registrar('Listening: ' + MODOS[G.modo][1], `Nivel ${G.nivel}${G.reloj ? ' · contrarreloj' : ''}`, G.n, G.ok, G.t0, 'escucha');
    FINE = { modo: G.modo, nivel: G.nivel, pts: G.pts, n: G.n, ok: G.ok, rmax: G.rmax, rec, sube: nivelMax(x) > antes ? nivelMax(x) : 0, min: Math.max(1, Math.round((Date.now() - G.t0) / 6e4)) };
    G = null; UI.vista = 'fin'; pintar(); if (window.FX && FINE.n) FX.fin(FINE.rec || FINE.sube ? 140 : 70);
  }

  // ---- vistas ----
  let ROOT = null, SK = null;
  function mount(el) { const s = SES(), sk = s ? s.perfil + '|' + s.m + '|' + (s.vistaCadete ? 1 : 0) : ''; if (sk !== SK) { SK = sk; G = null; UI.vista = 'inicio'; clearInterval(TMR); } ROOT = el; const x = datos(); if (UI._m !== mat()) { UI._m = mat(); UI.nivel = Math.min(nivelMax(x), Math.max(1, +(localStorage.getItem('mb1_esc_niv_' + mat()) || 1))); } pintar(); }
  function pintar() { if (!ROOT || !document.body.contains(ROOT)) { clearInterval(TMR); return; } ROOT.innerHTML = UI.vista === 'juego' && G ? vJuego() : UI.vista === 'fin' ? vFin() : vInicio(); enlazar(); }
  function vInicio() {
    const x = datos(), e = x.esc, nmax = nivelMax(x), sig = nmax < 3 ? NIVELES[nmax + 1][1] : null, pct = sig ? Math.round(100 * (e.pts - NIVELES[nmax][1]) / (sig - NIVELES[nmax][1])) : 100, hoyd = e.dias[dia()] || [0, 0];
    const aviso = consulta() ? '<div class="vaviso">Vista de consulta: puedes jugar, pero aquí no se guarda avance.</div>' : pil() ? '<div class="vaviso">Usuario piloto: el listening no se guarda.</div>' : '';
    return `<section class="ehero"><div class="eh1"><div class="eico">🎧</div><div><h2>Listening Lab</h2><p>Tu oído es tu mejor arma para el examen. Juega, suma puntos y sube de nivel.</p></div></div>
      <div class="vkpis"><div><b>${e.pts.toLocaleString('es-MX')}</b><span>puntos</span></div><div><b>${e.rmax}</b><span>mejor racha</span></div><div><b>${hoyd[0]}</b><span>audios hoy</span></div></div>
      <div class="elvl"><span>Nivel ${nmax} · ${NIVELES[nmax][0]}</span><div class="ebar"><i style="width:${pct}%"></i></div><small>${sig ? `${Math.max(0, sig - e.pts)} pts para nivel ${nmax + 1}` : 'Nivel máximo desbloqueado 🏆'}</small></div></section>${aviso}
      <section class="card ecfg"><div class="erow"><b>Nivel</b><div class="vchips">${[1, 2, 3].map(n => `<button class="vchip${UI.nivel === n ? ' on' : ''}" data-act="niv" data-n="${n}" ${n > nmax ? 'disabled title="Se desbloquea con puntos"' : ''}>${n > nmax ? '🔒 ' : ''}${n} · ${NIVELES[n][0]}</button>`).join('')}</div></div>
        <div class="erow"><b>Velocidad</b><div class="vchips">${[['lenta', '🐢 Lenta'], ['normal', '🙂 Normal'], ['rapida', '🚀 Rápida']].map(([k, l]) => `<button class="vchip${UI.vel === k ? ' on' : ''}" data-act="vel" data-v="${k}">${l}</button>`).join('')}</div></div>
        <div class="erow"><b>Modo</b><div class="vchips"><button class="vchip${!UI.reloj ? ' on' : ''}" data-act="reloj" data-v="0">10 audios</button><button class="vchip${UI.reloj ? ' on' : ''}" data-act="reloj" data-v="1">⏱ Contrarreloj 90 s</button></div></div></section>
      <div class="egrid">${Object.entries(MODOS).map(([k, [i, t, d]]) => { const md = e.modos[k]; return `<button class="egame" data-act="jugar" data-m="${k}"><i>${i}</i><b>${t}</b><small>${d}</small>${md && md[0] ? `<em>${Math.round(100 * md[1] / md[0])}% · récord ${md[2]}</em>` : '<em class="nuevo">¡Pruébalo!</em>'}</button>`; }).join('')}</div>
      <section class="card"><h3>Consejos para escuchar mejor</h3><ul class="mini etips"><li>Primero lee la pregunta; luego escucha buscando ese dato.</li><li>Repite el audio las veces que necesites; cada repetición extra resta 2 puntos, pero aprendes más.</li><li>Usa 🐢 Lenta para entender y después vuelve a Normal.</li><li>Después de responder, lee la transcripción y escucha otra vez: así entrenas el oído.</li></ul>
      <p class="mini">Voz en inglés del dispositivo. Si no se oye, revisa el volumen o instala la voz en inglés (Ajustes › Texto a voz). Cambia la voz en Hoy › Audio.</p></section>`;
  }
  function cabeza() { const tot = G.reloj ? '' : `<span class="mini">${Math.min(G.n + (G.res ? 0 : 1), G.total)}/${G.total}</span>`; return `<div class="vtop"><button class="ico" data-act="salir" title="Terminar">✕</button>${G.reloj ? `<span id="ereloj" class="ereloj">${Math.ceil(Math.max(0, G.fin - Date.now()) / 1000)} s</span>` : `<div class="vprog"><i style="width:${Math.round(100 * G.n / G.total)}%"></i></div>`}${tot}</div>
    <div class="estat"><span>⭐ ${G.pts}</span><span class="${G.racha >= 3 ? 'fuego' : ''}">🔥 ${G.racha}</span><span>${MODOS[G.modo][0]} ${esc(MODOS[G.modo][1])}</span><span>Nivel ${G.nivel}</span></div>`; }
  function vJuego() {
    const it = G.item, r = G.res;
    const ctl = `<div class="eaudio"><button class="eplay" data-act="play" title="Escuchar">▶</button><div class="ebtns"><button class="btn sm ghost" data-act="play">🔁 Repetir</button><button class="btn sm ghost" data-act="lento">🐢 Lento</button>${it.dos && r ? `<button class="btn sm ghost" data-act="ambas">🔊 Las dos</button>` : ''}</div><small class="mini">Escuchado ${G.rep} ${G.rep === 1 ? 'vez' : 'veces'}</small></div>`;
    let cuerpo = '';
    if (it.tipo === 'dict') {
      cuerpo = r ? '' : `<textarea id="edict" class="edict" rows="3" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe aquí lo que oyes…"></textarea><button class="btn vbig" data-act="dict">Revisar</button>`;
    } else {
      cuerpo = `<div class="eops${it.grande ? ' img' : ''}${it.dos ? ' dos' : ''}">${it.ops.map((o, j) => { let cl = ''; if (r) { if (j === it.ok) cl = ' ok'; else if (r.k === j) cl = ' bad'; } return `<button class="eop${cl}" data-act="op" data-k="${j}" ${r ? 'disabled' : ''}>${it.grande ? `<span class="emo">${o}</span>${r ? `<small>${esc(it.opsTxt[j])}</small>` : ''}` : `<i>${'ABCD'[j]}</i>${esc(o)}`}</button>`; }).join('')}</div>`;
    }
    let fb = '';
    if (r) {
      const tr = it.tipo === 'dict' ? `<p class="edif">${r.dict.marca.map(([w, s]) => `<span class="${s}">${esc(w)}</span>`).join(' ')}</p><p class="mini">Escribiste: ${esc(r.val)}</p><p class="mini">Correcto ${Math.round(100 * r.dict.frac)}% · <span class="ok">verde</span> = bien · <span class="casi">amarillo</span> = casi · <span class="falta">rojo</span> = faltó</p>` : `<p class="etrans">${esc(it.trans).replace(/\n/g, '<br>')}</p>`;
      fb = `<div class="efb ${r.ok ? 'ok' : 'bad'}"><b>${r.ok ? `✓ ¡Bien! +${r.p} pts${G.racha >= 3 ? ` · racha ${G.racha} 🔥` : ''}` : `✗ ${it.tipo === 'dict' ? 'Revisa las palabras en rojo' : 'Era: ' + esc(it.grande ? it.opsTxt[it.ok] : it.ops[it.ok])}${r.p ? ` · +${r.p} pts` : ''}`}</b>${tr}<p class="mini">💡 ${esc(it.tip)}</p></div>
      <div class="row"><button class="btn ghost" data-act="play">🔊 Escuchar de nuevo</button><button class="btn" data-act="sig" style="flex:1">${(G.reloj ? Date.now() >= G.fin : G.n >= G.total) ? 'Ver resultado' : 'Siguiente →'}</button></div>`;
    }
    return cabeza() + `<section class="ecard"><p class="eq">${esc(it.q)}</p>${ctl}</section>${cuerpo}${fb}`;
  }
  function vFin() {
    const f = FINE || { pts: 0, n: 0, ok: 0, rmax: 0, min: 0, modo: 'mezcla', nivel: 1 }, x = datos();
    const msg = !f.n ? 'Sin respuestas esta vez.' : f.ok / f.n >= .9 ? '¡Oído de élite! 🎯' : f.ok / f.n >= .7 ? '¡Muy bien! Sigue así 💪' : f.ok / f.n >= .5 ? 'Vas mejorando. Repite en 🐢 Lenta y vuelve a Normal.' : 'Practica este juego en nivel 1 y lee cada transcripción.';
    return `<section class="ehero efin"><div class="eico">${f.rec ? '🏆' : '🎧'}</div><h2>${f.rec ? '¡Nuevo récord!' : '¡Listo!'}</h2><p>${esc(MODOS[f.modo][1])} · Nivel ${f.nivel}</p>
      <div class="vkpis"><div><b>${f.pts}</b><span>puntos</span></div><div><b>${f.n ? Math.round(100 * f.ok / f.n) : 0}%</b><span>${f.ok}/${f.n} correctas</span></div><div><b>${f.rmax}</b><span>mejor racha</span></div></div></section>
      ${f.sube ? `<section class="card eup">🔓 <b>¡Desbloqueaste el nivel ${f.sube} · ${NIVELES[f.sube][0]}!</b></section>` : ''}
      <section class="card"><p>${msg}</p><p class="mini">Total acumulado: ${x.esc.pts.toLocaleString('es-MX')} puntos.</p><div class="row"><button class="btn" data-act="jugar" data-m="${f.modo}">Jugar otra vez</button><button class="btn ghost" data-act="inicio">Elegir otro juego</button></div></section>`;
  }
  function enlazar() {
    const ta = ROOT.querySelector('#edict'); if (ta) { ta.onkeydown = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); revisarDict(); } }; }
    ROOT.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b || !ROOT.contains(b) || b.disabled) return; const a = b.dataset.act;
      if (a === 'jugar') iniciar(b.dataset.m);
      else if (a === 'niv') { UI.nivel = +b.dataset.n; try { localStorage.setItem('mb1_esc_niv_' + mat(), UI.nivel); } catch (er) { } pintar(); }
      else if (a === 'vel') { UI.vel = b.dataset.v; try { localStorage.setItem('mb1_esc_vel', UI.vel); } catch (er) { } pintar(); hablar('This is the ' + (UI.vel === 'rapida' ? 'fast' : UI.vel === 'lenta' ? 'slow' : 'normal') + ' speed.'); }
      else if (a === 'reloj') { UI.reloj = b.dataset.v === '1'; pintar(); }
      else if (a === 'play') tocar(false);
      else if (a === 'lento') tocar(true);
      else if (a === 'ambas') hablar(G.item.decirAmbas);
      else if (a === 'op') responder(+b.dataset.k);
      else if (a === 'dict') revisarDict();
      else if (a === 'sig') siguiente();
      else if (a === 'salir') { if (G && G.n) terminar(); else { clearInterval(TMR); parar(); G = null; UI.vista = 'inicio'; pintar(); } }
      else if (a === 'inicio') { UI.vista = 'inicio'; pintar(); scrollTo(0, 0); }
    };
  }
  function resumen() { const x = datos(); return { pts: x.esc.pts, nivel: nivelMax(x), hoy: (x.esc.dias[dia()] || [0])[0], rmax: x.esc.rmax }; }
  window.ESCUCHA = { mount, resumen, MODOS, _gen: GEN, _comparar: compararDict, _estado: () => ({ vista: UI.vista, G: G && { modo: G.modo, n: G.n, ok: G.ok, pts: G.pts, item: G.item } }) };

  /* =====================================================================
     COMPLETA LA PALABRA QUE FALTA
     ===================================================================== */
  const TEMAS_C = { prep: 'Preposiciones', tie: 'Tiempos verbales', art: 'Artículos', comp: 'Comparativos', cuant: 'Cantidades (much / many…)', pron: 'Pronombres y relativos', modal: 'Modales', cond: 'Condicionales', inf: 'Infinitivo o -ing', pas: 'Voz pasiva', con: 'Conectores', preg: 'Preguntas', voc: 'Expresiones (make / do / take…)', verbos: 'Verbos en pasado', vocab: 'Vocabulario en contexto' };
  let CU = { vista: 'inicio', tema: 'mix', estilo: 'elige' }, C = null, CFIN = null, CROOT = null, CSK = null;
  function itemsVerbos() { return VERBOS().map(c => { const p = alts(c.p).find(f => enEj(c.ex, f) >= 0 && normal(f) !== normal(c.en)); if (!p) return null; const i = enEj(c.ex, p); const o = c.ex.slice(0, i) + '___' + c.ex.slice(i + p.length) + ` (${c.en})`; const ds = [...new Set([c.en, ...alts(c.pp), c.en.replace(/e$/, '') + 'ed', c.en + 's', c.en + 'ing'].filter(w => normal(w) !== normal(p) && !alts(c.p).includes(w)))].slice(0, 3); return ['verbos', o, p, ds, `${c.en} → ${c.p} → ${c.pp} (${c.d.k[0] === 'r' ? 'regular' : 'irregular'}) = ${c.es}`, c.ex]; }).filter(Boolean); }
  function itemsVocab() { const V = VCARDS().filter(c => !c.p && c.d.mazo !== 'verbos'); return V.map(c => { const i = enEj(c.ex, c.en); if (i < 0) return null; const o = c.ex.slice(0, i) + '___' + c.ex.slice(i + c.en.length); const ds = mezcla(c.d.cards.map(z => z[1]).filter(w => normal(w) !== normal(c.en))).slice(0, 3); if (ds.length < 3) return null; return ['vocab', o, c.en, ds, `${c.en} = ${c.es}`, c.ex]; }).filter(Boolean); }
  function banco(tema) { const base = D.completa.map(x => x.concat([x[1].replace('___', x[2] === '—' ? '' : x[2]).replace(/\s+/g, ' ')])); if (tema === 'verbos') return itemsVerbos(); if (tema === 'vocab') return itemsVocab(); if (tema === 'mix') return base.concat(mezcla(itemsVerbos()).slice(0, 25)).concat(mezcla(itemsVocab()).slice(0, 25)); return base.filter(x => x[0] === tema); }
  function cIniciar() {
    let L = banco(CU.tema); if (CU.estilo === 'escribe') L = L.filter(x => x[2] !== '—'); if (L.length < 4) return toast('No hay suficientes ejercicios en este tema.');
    const x = datos(), peso = it => { const t = x.comp.temas[it[0]]; return t && t[0] >= 4 ? 1 - t[1] / t[0] : .5; };
    const orden = mezcla(L).sort((a, b) => peso(b) - peso(a) + (Math.random() - .5) * .6).slice(0, 10);
    C = { items: mezcla(orden), i: 0, res: null, pts: 0, racha: 0, rmax: 0, ok: 0, n: 0, t0: Date.now(), estilo: CU.estilo, tema: CU.tema };
    cPrep(); CU.vista = 'juego'; cPintar();
  }
  function cPrep() { const it = C.items[C.i]; C.ops = mezcla([it[2]].concat(it[3])); C.res = null; C.pista = false; }
  function cResponder(val) {
    if (!C || C.res) return; const it = C.items[C.i]; const ok = normal(val) === normal(it[2]) || (it[2] === '—' && (val === '—' || !normal(val)));
    const casi = !ok && C.estilo === 'escribe' && normal(it[2]).length >= 5 && lev(normal(val), normal(it[2])) <= 1;
    C.n++; if (ok || casi) { C.ok++; C.racha++; } else C.racha = 0; C.rmax = Math.max(C.rmax, C.racha);
    const p = ok ? 10 + Math.min(10, C.racha * 2) - (C.pista ? 4 : 0) + (C.estilo === 'escribe' ? 4 : 0) : casi ? 6 : 0; C.pts += Math.max(0, p);
    const x = datos(), t = x.comp.temas[it[0]] || (x.comp.temas[it[0]] = [0, 0]); t[0]++; if (ok || casi) t[1]++; guardar(x);
    C.res = { ok, casi, val, p: Math.max(0, p) }; if (window.FX) { if (ok || casi) setTimeout(() => FX.ok(CROOT.querySelector('.efb')), 30); else FX.no(); }
    cPintar(); hablar(it[5], { rate: .9 });
  }
  function cSig() { C.i++; if (C.i >= C.items.length) return cTerminar(); cPrep(); cPintar(); const i = CROOT.querySelector('#cin'); if (i) i.focus(); }
  function cTerminar() {
    parar(); if (!C) return; const x = datos(); x.comp.pts += C.pts; x.comp.n += C.n; x.comp.ok += C.ok; x.comp.rmax = Math.max(x.comp.rmax, C.rmax); guardar(x);
    registrar('Completa la palabra', TEMAS_C[C.tema] || 'Mezcla', C.n, C.ok, C.t0, 'completa');
    CFIN = { pts: C.pts, n: C.n, ok: C.ok, rmax: C.rmax, tema: C.tema }; C = null; CU.vista = 'fin'; cPintar(); if (window.FX && CFIN.n) FX.fin(70);
  }
  function cMount(el) { const s = SES(), sk = s ? s.perfil + '|' + s.m + '|' + (s.vistaCadete ? 1 : 0) : ''; if (sk !== CSK) { CSK = sk; C = null; CU.vista = 'inicio'; } CROOT = el; cPintar(); }
  function cPintar() { if (!CROOT || !document.body.contains(CROOT)) return; CROOT.innerHTML = CU.vista === 'juego' && C ? cJuego() : CU.vista === 'fin' ? cFin() : cInicio(); cEnlazar(); }
  function cInicio() {
    const x = datos(), c = x.comp, deb = Object.entries(c.temas).filter(([, t]) => t[0] >= 4).sort((a, b) => a[1][1] / a[1][0] - b[1][1] / b[1][0])[0];
    const cnt = k => banco(k).length;
    const aviso = consulta() ? '<div class="vaviso">Vista de consulta: puedes practicar, pero aquí no se guarda avance.</div>' : pil() ? '<div class="vaviso">Usuario piloto: no se guarda.</div>' : '';
    return `<div class="vtop"><button class="ico" data-act="volver" title="Volver a Practicar">←</button><b>Completa la palabra que falta</b></div>
      <section class="ehero chero"><div class="eh1"><div class="eico">🧩</div><div><h2>Completa la oración</h2><p>Elige o escribe la palabra que falta. Al responder ves la explicación y escuchas la oración completa.</p></div></div>
      <div class="vkpis"><div><b>${c.pts.toLocaleString('es-MX')}</b><span>puntos</span></div><div><b>${c.n ? Math.round(100 * c.ok / c.n) + '%' : '—'}</b><span>aciertos</span></div><div><b>${c.rmax}</b><span>mejor racha</span></div></div></section>${aviso}
      ${deb ? `<section class="card aviso2"><b>Tu tema para reforzar:</b> ${esc(TEMAS_C[deb[0]] || deb[0])} (${Math.round(100 * deb[1][1] / deb[1][0])}% de aciertos). <button class="btn sm" data-act="tema" data-t="${esc(deb[0])}">Practicarlo</button></section>` : ''}
      <section class="card"><h3>Cómo quieres responder</h3><div class="vchips"><button class="vchip${CU.estilo === 'elige' ? ' on' : ''}" data-act="estilo" data-v="elige">◉ Elegir entre opciones</button><button class="vchip${CU.estilo === 'escribe' ? ' on' : ''}" data-act="estilo" data-v="escribe">✎ Escribirla (+4 pts)</button></div>
      <h3 style="margin-top:12px">Tema</h3><div class="ctemas"><button class="ctema${CU.tema === 'mix' ? ' on' : ''}" data-act="tema" data-t="mix"><b>🎲 Mezcla</b><small>${cnt('mix')} ejercicios</small></button>${Object.entries(TEMAS_C).map(([k, l]) => { const t = c.temas[k]; return `<button class="ctema${CU.tema === k ? ' on' : ''}" data-act="tema" data-t="${k}"><b>${esc(l)}</b><small>${cnt(k)} ejercicios${t && t[0] ? ` · ${Math.round(100 * t[1] / t[0])}%` : ''}</small></button>`; }).join('')}</div>
      <button class="btn vbig" data-act="empezar" style="margin-top:12px">Empezar · 10 oraciones</button></section>`;
  }
  function cJuego() {
    const it = C.items[C.i], r = C.res, partes = it[1].split('___');
    const hueco = r ? `<span class="cblank ${r.ok ? 'ok' : r.casi ? 'casi' : 'bad'}">${esc(it[2] === '—' ? '∅' : it[2])}</span>` : `<span class="cblank">${C.pista && it[2] !== '—' ? esc(it[2][0]) + '…' : '_____'}</span>`;
    const head = `<div class="vtop"><button class="ico" data-act="csalir" title="Terminar">✕</button><div class="vprog"><i style="width:${Math.round(100 * C.i / C.items.length)}%"></i></div><span class="mini">${C.i + 1}/${C.items.length}</span></div><div class="estat"><span>⭐ ${C.pts}</span><span class="${C.racha >= 3 ? 'fuego' : ''}">🔥 ${C.racha}</span><span>${esc(TEMAS_C[it[0]] || '')}</span></div>`;
    const resp = r ? '' : C.estilo === 'elige' ? `<div class="vops">${C.ops.map((o, j) => `<button class="vop" data-act="cop" data-v="${esc(o)}"><i>${'ABCD'[j]}</i>${esc(o === '—' ? '(sin palabra)' : o)}</button>`).join('')}</div>` : `<input id="cin" class="vin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe la palabra que falta"><div class="row"><button class="btn sm ghost" data-act="cpista" ${C.pista ? 'disabled' : ''}>Pista (−4)</button><button class="btn" data-act="crev">Revisar</button></div>`;
    const fb = r ? `<div class="efb ${r.ok || r.casi ? 'ok' : 'bad'}"><b>${r.ok ? `✓ ¡Correcto! +${r.p}` : r.casi ? `≈ Casi (revisa la ortografía) +${r.p}` : `✗ La respuesta es: ${esc(it[2] === '—' ? 'sin palabra (∅)' : it[2])}`}</b>${!r.ok && C.estilo === 'escribe' ? `<p class="mini">Escribiste: ${esc(r.val)}</p>` : ''}<p>💡 ${esc(it[4])}</p></div><div class="row"><button class="btn ghost" data-act="cplay">🔊 Escuchar la oración</button><button class="btn" data-act="csig" style="flex:1">${C.i + 1 < C.items.length ? 'Siguiente →' : 'Ver resultado'}</button></div>` : '';
    return head + `<section class="vq csent"><p class="vsent">${esc(partes[0])}${hueco}${esc(partes.slice(1).join('___'))}</p></section>${resp}${fb}`;
  }
  function cFin() { const f = CFIN || { pts: 0, n: 0, ok: 0, rmax: 0, tema: 'mix' }; return `<section class="ehero efin chero"><div class="eico">🧩</div><h2>¡Listo!</h2><p>${esc(TEMAS_C[f.tema] || 'Mezcla')}</p><div class="vkpis"><div><b>${f.pts}</b><span>puntos</span></div><div><b>${f.n ? Math.round(100 * f.ok / f.n) : 0}%</b><span>${f.ok}/${f.n} correctas</span></div><div><b>${f.rmax}</b><span>mejor racha</span></div></div></section>
    <section class="card"><div class="row"><button class="btn" data-act="empezar">Otra ronda</button><button class="btn ghost" data-act="cinicio">Cambiar tema</button><button class="btn ghost" data-act="volver">Volver a Practicar</button></div></section>`; }
  function cEnlazar() {
    const i = CROOT.querySelector('#cin'); if (i) { i.onkeydown = e => { if (e.key === 'Enter') cResponder(i.value); }; setTimeout(() => i.focus(), 50); }
    CROOT.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b || !CROOT.contains(b) || b.disabled) return; const a = b.dataset.act;
      if (a === 'tema') { CU.tema = b.dataset.t; if (CU.vista !== 'inicio') CU.vista = 'inicio'; cPintar(); }
      else if (a === 'estilo') { CU.estilo = b.dataset.v; cPintar(); }
      else if (a === 'empezar') cIniciar();
      else if (a === 'cop') cResponder(b.dataset.v);
      else if (a === 'crev') { const v = (CROOT.querySelector('#cin') || {}).value || ''; if (!v.trim()) return toast('Escribe la palabra.'); cResponder(v); }
      else if (a === 'cpista') { C.pista = true; const v = (CROOT.querySelector('#cin') || {}).value; cPintar(); const n = CROOT.querySelector('#cin'); if (n) n.value = v || ''; }
      else if (a === 'cplay') hablar(C.items[C.i][5], { rate: .9 });
      else if (a === 'csig') cSig();
      else if (a === 'csalir') { if (C && C.n) cTerminar(); else { C = null; CU.vista = 'inicio'; cPintar(); } }
      else if (a === 'cinicio') { CU.vista = 'inicio'; cPintar(); }
      else if (a === 'volver') { try { tab = 'practicar'; render(); scrollTo(0, 0); } catch (er) { } }
    };
  }
  function cResumen() { const x = datos(); return { pts: x.comp.pts, n: x.comp.n, ok: x.comp.ok, total: banco('mix').length, temas: Object.keys(TEMAS_C).length }; }
  window.COMPLETA = { mount: cMount, resumen: cResumen, TEMAS: TEMAS_C, banco, _estado: () => ({ vista: CU.vista, C: C && { i: C.i, n: C.n, ok: C.ok, item: C.items[C.i], ops: C.ops } }) };
  window.MB1PRACT = { resumenAvance: () => { const x = datos(); return { lp: x.esc.pts, ln: x.esc.n, lo: x.esc.ok, cp: x.comp.pts, cn: x.comp.n, co: x.comp.ok }; } };
})();
