/* Misión: Obtener la Barra I · Vocabulario (v2.11)
   Flash cards y ejercicios de vocabulario con repetición espaciada (tipo SM-2), mazos ALCPT y ALC.
   El progreso se guarda SOLO en este dispositivo (localStorage «mb1_vocab_v1»), por matrícula.
   No modifica el estado principal de la app (mb1_estado_v2), salvo el contador de herramientas usadas. */
(function () {
  'use strict';
  const DATA = window.MB1VOCAB || { decks: [] };
  const KEY = 'mb1_vocab_v1';
  const NUEVAS_OPC = [5, 10, 15, 20, 30];
  const PASOS = [1, 10];          // minutos (aprendizaje)
  const REPASOS = [10];           // minutos (reaprendizaje tras olvidar)
  const ANIOS = { 1: [4, 5], 2: [6, 9], 3: [10, 13], 4: [14, 17] };
  const NOMG = { 1: 'Otra vez', 2: 'Difícil', 3: 'Bien', 4: 'Fácil' };
  const NOMEJ = { mc: 'Opción múltiple', escribe: 'Escribe la palabra', huecos: 'Completa la oración', empareja: 'Empareja' };
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const dia = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const inicioDia = (k = 0) => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate() + k).getTime(); };
  const mezcla = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const toast = m => { if (typeof window.toast === 'function') return window.toast(m); };
  const normal = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[’`]/g, "'").replace(/[^a-z0-9' -]/g, ' ').replace(/[-\s]+/g, ' ').trim();
  function lev(a, b) { const m = a.length, n = b.length; if (Math.abs(m - n) > 2) return 9; let p = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const c = [i]; for (let j = 1; j <= n; j++) c[j] = Math.min(p[j] + 1, c[j - 1] + 1, p[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); p = c; } return p[n]; }

  /* ---------- catálogo ---------- */
  const CARDS = {}, DECKS = {};
  DATA.decks.forEach(d => { DECKS[d.id] = d; d.cards.forEach((c, i) => { CARDS[c[0]] = { id: c[0], en: c[1], es: c[2], ex: c[3], ipa: c[4], d, ord: i }; }); });
  const total = m => DATA.decks.filter(d => !m || d.mazo === m).reduce((s, d) => s + d.cards.length, 0);

  /* ---------- integración con la app (solo lectura de la sesión) ---------- */
  const g = (f, d) => { try { return f(); } catch (e) { return d; } };
  const SES = () => g(() => S && S.sesion, null);
  const PERF = () => g(() => P(), null);
  const pil = () => g(() => !!REAL || esPiloto(), false);
  const consulta = () => { const s = SES(), p = PERF(); return !!(s && (s.vistaCadete || s.perfil === 'directora' || s.perfil === 'admin')) || !!(p && p.vistaSolo); };
  const sinGuardar = () => pil() || consulta();
  const mat = () => { const s = SES(); return s ? s.m : '_'; };

  /* ---------- almacenamiento ---------- */
  let MEM = {};
  function leer() { try { return JSON.parse(localStorage.getItem(KEY)) || { v: 1, p: {} }; } catch (e) { return { v: 1, p: {} }; } }
  function perfil() {
    const m = mat();
    if (sinGuardar()) return MEM[m] || (MEM[m] = { c: {}, d: {}, cfg: { nuevas: 10 } });
    const all = leer(); const x = all.p[m] || { c: {}, d: {}, cfg: { nuevas: 10 } }; x.c = x.c || {}; x.d = x.d || {}; x.cfg = x.cfg || { nuevas: 10 }; return x;
  }
  function guardar(x) { if (sinGuardar()) return; const all = leer(); all.p[mat()] = x; const lim = inicioDia(-60); Object.keys(x.d).forEach(k => { if (new Date(k + 'T12:00').getTime() < lim) delete x.d[k]; }); localStorage.setItem(KEY, JSON.stringify(all)); }
  const hoyD = x => x.d[dia()] || (x.d[dia()] = { n: 0, r: 0, ok: 0 });

  /* ---------- repetición espaciada (tipo SM-2 con pasos de aprendizaje) ---------- */
  // s: 0 nueva · 1 aprendiendo · 2 repaso · 3 reaprendiendo; i: intervalo (días); e: facilidad; due: ms
  function programar(c0, q, now = Date.now()) {
    const c = Object.assign({ s: 0, i: 0, e: 2.5, st: 0, n: 0, l: 0 }, c0 || {});
    c.n++; c.last = now;
    const dias = i => { c.i = Math.min(365, Math.max(1, Math.round(i))); c.due = inicioDia(c.i); };
    if (c.s === 0 || c.s === 1) {
      c.s = 1;
      if (q === 1) { c.st = 0; c.due = now + PASOS[0] * 6e4; }
      else if (q === 2) { c.due = now + (c.st === 0 ? 6 : PASOS[Math.min(c.st, PASOS.length - 1)]) * 6e4; }
      else if (q === 3) { c.st++; if (c.st >= PASOS.length) { c.s = 2; dias(1); } else c.due = now + PASOS[c.st] * 6e4; }
      else { c.s = 2; dias(4); }
    } else if (c.s === 3) {
      if (q <= 2) c.due = now + REPASOS[0] * 6e4;
      else { c.s = 2; dias(q === 4 ? 2 : 1); }
    } else {
      if (q === 1) { c.l++; c.e = Math.max(1.3, c.e - .2); c.s = 3; c.i = 1; c.due = now + REPASOS[0] * 6e4; }
      else if (q === 2) { c.e = Math.max(1.3, c.e - .15); dias(Math.max(c.i + 1, c.i * 1.2)); }
      else if (q === 3) dias(Math.max(c.i + 1, c.i * c.e));
      else { c.e = c.e + .15; dias(Math.max(c.i + 2, c.i * c.e * 1.3)); }
    }
    c.e = Math.round(c.e * 100) / 100;
    return c;
  }
  function etiqueta(c, now = Date.now()) { const ms = c.due - now; if (c.s === 1 || c.s === 3) return ms < 6e4 * 1.5 ? '<1 min' : Math.round(ms / 6e4) + ' min'; const d = c.i; return d < 30 ? d + ' d' : d < 365 ? Math.round(d / 30) + ' m' : '1 a'; }

  /* ---------- alcance (mazo / tema / libro) ---------- */
  let UI = { mazo: 'alcpt', k: 'todos', anio: '', vista: 'inicio' };
  function initAlcance() { const p = PERF(); if (UI._init === mat()) return; UI._init = mat(); UI.mazo = 'alcpt'; UI.k = 'todos'; UI.anio = p && ANIOS[p.anio] ? String(p.anio) : ''; }
  function decksAlcance() {
    if (UI.mazo === 'alcpt') return DATA.decks.filter(d => d.mazo === 'alcpt' && (UI.k === 'todos' || d.k === UI.k));
    return DATA.decks.filter(d => { if (d.mazo !== 'alc') return false; const b = +d.k; if (UI.k !== 'todos') return d.k === UI.k; if (UI.anio) { const [a, z] = ANIOS[UI.anio]; return b >= a && b <= z; } return true; });
  }
  const idsAlcance = () => decksAlcance().flatMap(d => d.cards.map(c => c[0]));
  function nombreAlcance() { if (UI.k !== 'todos') { const d = DECKS[UI.mazo + '-' + UI.k]; return d ? `${UI.mazo === 'alc' ? 'ALC' : 'ALCPT'} · ${d.t}${UI.mazo === 'alc' ? ' · ' + d.s : ''}` : ''; } if (UI.mazo === 'alc') return UI.anio ? `ALC · ${UI.anio}.º año (libros ${ANIOS[UI.anio][0]}–${ANIOS[UI.anio][1]})` : 'ALC · libros 4 a 17'; return 'ALCPT · todos los temas'; }
  function conteos(x, ids) {
    const fin = inicioDia(1), now = Date.now(); let pend = 0, nuevas = 0, apr = 0, dom = 0;
    ids.forEach(id => { const c = x.c[id]; if (!c || !c.s) { nuevas++; return; } if (c.due < fin) pend++; if (c.s === 2) { apr++; if (c.i >= 21) dom++; } });
    const cupo = Math.max(0, (x.cfg.nuevas || 10) - hoyD(x).n);
    return { pend, nuevas, apr, dom, cupo, total: ids.length, nuevasHoy: Math.min(cupo, nuevas) };
  }
  function cola(x, ids, max = 9999) {
    const fin = inicioDia(1);
    const due = ids.filter(id => x.c[id] && x.c[id].s && x.c[id].due < fin).sort((a, b) => x.c[a].due - x.c[b].due);
    const cupo = Math.max(0, (x.cfg.nuevas || 10) - hoyD(x).n);
    const nuevas = ids.filter(id => !x.c[id] || !x.c[id].s).slice(0, cupo);
    return due.concat(nuevas).slice(0, max);
  }
  // Para ejercicios: pendientes → aprendidas recientes → nuevas (cupo) → cualquiera del alcance
  function elegir(x, ids, n) {
    const fin = inicioDia(1), out = [], add = a => a.forEach(id => { if (out.length < n && !out.includes(id)) out.push(id); });
    add(mezcla(ids.filter(id => x.c[id] && x.c[id].s && x.c[id].due < fin)));
    add(ids.filter(id => x.c[id] && x.c[id].s).sort((a, b) => (x.c[a].i - x.c[b].i) || (x.c[a].last - x.c[b].last)));
    const cupo = Math.max(0, (x.cfg.nuevas || 10) - hoyD(x).n);
    add(ids.filter(id => !x.c[id] || !x.c[id].s).slice(0, cupo));
    if (out.length < n) add(mezcla(ids));
    return mezcla(out);
  }
  function calificar(id, q) {
    const x = perfil(), prev = x.c[id], nueva = !prev || !prev.s, d = hoyD(x);
    x.c[id] = programar(prev, q); if (nueva) d.n++; else d.r++; if (q >= 3) d.ok++;
    guardar(x); return x.c[id];
  }

  /* ---------- audio y pronunciación ---------- */
  function decir(t, lento) {
    if (!('speechSynthesis' in window)) return toast('Este equipo no tiene voz en inglés. Instálala en Ajustes › Texto a voz.');
    const rate = lento ? .6 : (window.MB1AUD ? MB1AUD.rateGuardada(.9) : .9);
    try { if (typeof pararAudio === 'function') pararAudio(); } catch (e) { }
    if (window.MB1AUD) return MB1AUD.speak(t, { rate });
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = rate; const v = speechSynthesis.getVoices().find(v => /^en[-_]US/i.test(v.lang)); if (v) u.voice = v; speechSynthesis.speak(u);
  }
  const REC = window.SpeechRecognition || window.webkitSpeechRecognition;
  function pronunciar(id, btn) {
    const c = CARDS[id]; if (!REC) return toast('Tu navegador no permite el micrófono aquí. Escucha y repite en voz alta.');
    const out = document.getElementById('vpron'); const r = new REC(); r.lang = 'en-US'; r.maxAlternatives = 3; r.interimResults = false;
    if (btn) btn.classList.add('rec'); if (out) out.textContent = 'Escuchando… di la palabra en inglés';
    r.onresult = e => { const alts = [...e.results[0]].map(a => a.transcript); const ok = alts.some(a => normal(a).includes(normal(c.en))); if (out) out.innerHTML = ok ? '✓ ¡Bien dicho!' : `Escuché: «${esc(alts[0] || '')}». Escucha y repite despacio.`; if (ok && window.FX) FX.ok(out); };
    r.onerror = () => { if (out) out.textContent = 'No se pudo usar el micrófono (requiere permiso y, a veces, internet).'; };
    r.onend = () => { if (btn) btn.classList.remove('rec'); };
    try { r.start(); } catch (e) { if (out) out.textContent = 'No se pudo iniciar el micrófono.'; }
  }

  /* ---------- registro de actividad (Hoja / servidor), igual que los demás ejercicios ---------- */
  let SES0 = null;
  function iniciarRegistro(tipo) { SES0 = { tipo, t0: Date.now(), n: 0, ok: 0, alc: nombreAlcance() }; if (!sinGuardar()) { try { usar(tipo === 'Flash cards' ? 'flash' : 'vocab'); } catch (e) { } } }
  function cerrarRegistro() {
    const r = SES0; SES0 = null; if (!r || !r.n || sinGuardar()) return;
    try { const p = P(); if (p && !p.piloto && (SRV || SHEET)) { enviar('api/actividad', { ts: tsLocal(), m: p.m, nombre: p.nombre, perfil: p.perfil, anio: p.anio, gp: p.gp, gi: p.gi, tipo: r.tipo, tema: r.alc, preguntas: r.n, aciertos: r.ok, duracion_s: Math.round((Date.now() - r.t0) / 1000), equipo: EQUIPO }); enviar('api/avance', payload(p)); } } catch (e) { }
  }
  const cuenta = ok => { if (SES0) { SES0.n++; if (ok) SES0.ok++; } };

  /* ---------- vistas ---------- */
  let ROOT = null, SK = null, FC = null, EJ = null;
  const $ = s => ROOT && ROOT.querySelector(s);
  function mount(el) {
    const sk = (() => { const s = SES(); return s ? s.perfil + '|' + s.m + '|' + (s.vistaCadete ? 1 : 0) : ''; })();
    if (sk !== SK) { SK = sk; FC = null; EJ = null; UI.vista = 'inicio'; UI._init = null; }
    ROOT = el; initAlcance(); pintar();
  }
  function pintar() { if (!ROOT) return; ROOT.innerHTML = UI.vista === 'fc' && FC ? vFlash() : UI.vista === 'ej' && EJ ? vEj() : UI.vista === 'lista' ? vLista() : UI.vista === 'fin' ? vFin() : vInicio(); enlazar(); }
  function chip(on, txt, act, extra = '') { return `<button class="vchip${on ? ' on' : ''}" data-act="${act}" ${extra}>${txt}</button>`; }
  function vInicio() {
    const x = perfil(), ids = idsAlcance(), k = conteos(x, ids), todos = conteos(x, Object.keys(CARDS));
    const aviso = consulta() ? `<div class="vaviso">Vista de consulta: puedes ver y practicar las tarjetas, pero aquí no se guarda avance.</div>` : pil() ? `<div class="vaviso">Usuario piloto: la práctica de vocabulario no se guarda.</div>` : '';
    const tiles = (UI.mazo === 'alcpt' ? DATA.decks.filter(d => d.mazo === 'alcpt') : decksAlcanceAnio()).map(d => {
      const ii = d.cards.map(c => c[0]), q = conteos(x, ii), pct = Math.round(100 * q.apr / q.total), on = UI.k === d.k;
      return `<button class="vtile${on ? ' on' : ''}" data-act="k" data-k="${esc(d.k)}" style="--c:${esc(d.c)}"><b>${esc(UI.mazo === 'alc' ? d.t : d.t)}</b><small>${esc(d.s)}</small><span class="vbar"><i style="width:${pct}%"></i></span><em>${q.apr}/${q.total}${q.pend ? ` · <u>${q.pend} hoy</u>` : ''}</em></button>`;
    }).join('');
    const anios = UI.mazo === 'alc' ? `<div class="vchips">${chip(!UI.anio, 'Todos (4–17)', 'anio', 'data-a=""')}${Object.entries(ANIOS).map(([a, [i, z]]) => chip(UI.anio === a, `${a}.º año · ${i}–${z}`, 'anio', `data-a="${a}"`)).join('')}</div>` : '';
    return `<section class="vhero"><div class="vh1"><div><h2>Vocabulario</h2><p>Flash cards con repetición espaciada: lo que dominas regresa en días; lo que fallas, hoy mismo.</p></div><div class="vring" style="--p:${Math.round(100 * todos.apr / Math.max(1, todos.total))}"><span>${todos.apr}<small>de ${todos.total}</small></span></div></div>
      <div class="vkpis"><div><b>${todos.pend}</b><span>para repasar hoy</span></div><div><b>${todos.cupo}</b><span>nuevas disponibles hoy</span></div><div><b>${todos.dom}</b><span>dominadas (21+ días)</span></div></div></section>${aviso}
      <div class="vseg">${chip(UI.mazo === 'alcpt', 'ALCPT', 'mazo', 'data-m="alcpt"')}${chip(UI.mazo === 'alc', 'ALC · por libro', 'mazo', 'data-m="alc"')}</div>${anios}
      <div class="vchips">${chip(UI.k === 'todos', UI.mazo === 'alc' ? 'Todos los libros del filtro' : 'Todos los temas', 'k', 'data-k="todos"')}</div>
      <div class="vtiles">${tiles}</div>
      <section class="card vgo"><p class="mini">Practicas: <b>${esc(nombreAlcance())}</b> · ${k.total} tarjetas</p>
        <button class="btn vbig" data-act="fc" ${k.pend + k.nuevasHoy ? '' : 'disabled'}>🃏 Repasar flash cards <span class="vpill">${k.pend} pendientes · ${k.nuevasHoy} nuevas</span></button>
        ${k.pend + k.nuevasHoy ? '' : '<p class="mini vcenter">¡Al día en este mazo! Haz ejercicios o elige otro tema.</p>'}
        <h3>Ejercicios de vocabulario</h3><div class="vej">${Object.entries(NOMEJ).map(([m, t]) => `<button class="vejb" data-act="ej" data-m="${m}"><i>${{ mc: '◉', escribe: '✎', huecos: '▭', empareja: '⇄' }[m]}</i>${t}</button>`).join('')}</div>
        <p class="mini">Todos los ejercicios alimentan el mismo calendario de repasos.</p>
        <div class="row sp"><button class="btn sm ghost" data-act="lista">Ver lista y escuchar</button><label class="mini">Nuevas por día <select id="vnuevas" ${sinGuardar() ? 'disabled' : ''}>${NUEVAS_OPC.map(n => `<option ${n === (x.cfg.nuevas || 10) ? 'selected' : ''}>${n}</option>`).join('')}</select></label></div></section>`;
  }
  function decksAlcanceAnio() { return DATA.decks.filter(d => { if (d.mazo !== 'alc') return false; if (!UI.anio) return true; const [a, z] = ANIOS[UI.anio], b = +d.k; return b >= a && b <= z; }); }
  function vLista() {
    const x = perfil(), ids = idsAlcance();
    return `<div class="vtop"><button class="ico" data-act="inicio">←</button><b>${esc(nombreAlcance())}</b></div><section class="card"><ul class="vlist">${ids.map(id => { const c = CARDS[id], st = x.c[id]; const est = !st || !st.s ? '<em class="n">nueva</em>' : st.s === 2 ? `<em class="a">${st.i} d</em>` : '<em class="l">aprendiendo</em>'; return `<li><button class="vsnd" data-act="say" data-t="${esc(c.en)}">🔊</button><div><b>${esc(c.en)}</b> <small>${esc(c.ipa)}</small><span>${esc(c.es)}</span></div>${est}</li>`; }).join('')}</ul></section>`;
  }
  function resaltar(ex, en) { const i = ex.toLowerCase().indexOf(en.toLowerCase()); return i < 0 ? esc(ex) : esc(ex.slice(0, i)) + '<mark>' + esc(ex.slice(i, i + en.length)) + '</mark>' + esc(ex.slice(i + en.length)); }

  /* flash cards */
  function iniciarFC() { const x = perfil(), q = cola(x, idsAlcance()); if (!q.length) return toast('No hay tarjetas pendientes en este mazo.'); FC = { q, cur: null, ver: false, n: 0, ok: 0, re: [] }; iniciarRegistro('Flash cards'); sigFC(); UI.vista = 'fc'; pintar(); }
  function sigFC() {
    const x = perfil(), now = Date.now();
    FC.re.sort((a, b) => x.c[a].due - x.c[b].due);
    if (FC.re.length && x.c[FC.re[0]].due <= now) FC.cur = FC.re.shift();
    else if (FC.q.length) FC.cur = FC.q.shift();
    else if (FC.re.length) FC.cur = FC.re.shift();
    else FC.cur = null;
    FC.ver = false;
  }
  function vFlash() {
    const c = CARDS[FC.cur], x = perfil(), st = x.c[c.id], tot = FC.n + FC.q.length + FC.re.length + 1;
    return `<div class="vtop"><button class="ico" data-act="salirfc" title="Terminar">✕</button><div class="vprog"><i style="width:${Math.round(100 * FC.n / tot)}%"></i></div><span class="mini">${FC.q.length + FC.re.length + 1} por ver</span></div>
    <div class="vscene"><div class="vcard${FC.ver ? ' flip' : ''}" data-act="flip" style="--c:${esc(c.d.c)}">
      <div class="vface vfront"><span class="vtag">${c.d.mazo === 'alc' ? 'ALC · ' + esc(c.d.t) : 'ALCPT · ' + esc(c.d.t)}${!st || !st.s ? ' · nueva' : ''}</span><h2>${esc(c.en)}</h2><p class="vipa">${esc(c.ipa)}</p><p class="mini">Toca la tarjeta para ver el significado</p></div>
      <div class="vface vback"><span class="vtag">${esc(c.en)} ${esc(c.ipa)}</span><h2 class="es">${esc(c.es)}</h2><p class="vex">${resaltar(c.ex, c.en)}</p></div></div></div>
    <div id="vfcctl">${ctlFC()}</div>`;
  }
  function ctlFC() {
    const c = CARDS[FC.cur], st = perfil().c[c.id], prev = [1, 2, 3, 4].map(q => etiqueta(programar(st, q)));
    return `<div class="vaudio"><button class="btn sm ghost" data-act="say" data-t="${esc(c.en)}">🔊 Escuchar</button><button class="btn sm ghost" data-act="slow" data-t="${esc(c.en)}">🐢 Lento</button>${FC.ver ? `<button class="btn sm ghost" data-act="say" data-t="${esc(c.ex)}">🔊 Ejemplo</button>` : ''}${REC ? `<button class="btn sm ghost" data-act="pron" data-id="${esc(c.id)}">🎙 Pronuncia</button>` : ''}</div><p id="vpron" class="mini vcenter"></p>
    ${FC.ver ? `<div class="vgrades">${[1, 2, 3, 4].map(q => `<button class="vg g${q}" data-act="grade" data-q="${q}"><b>${NOMG[q]}</b><small>${prev[q - 1]}</small></button>`).join('')}</div>` : `<button class="btn vbig" data-act="flip">Mostrar respuesta</button>`}`;
  }
  function voltear() { if (!FC || FC.ver) return; FC.ver = true; const k = $('.vcard'), ct = $('#vfcctl'); if (k && ct) { k.classList.add('flip'); ct.innerHTML = ctlFC(); } else pintar(); }
  function gradeFC(q) {
    const id = FC.cur, c = calificar(id, q); FC.n++; cuenta(q >= 3);
    if (c.s === 1 || c.s === 3) FC.re.push(id);
    if (q >= 3 && window.FX) FX.ok($('.vcard'));
    sigFC(); if (!FC.cur) return terminar('Flash cards'); pintar();
  }
  let FIN = null;
  function terminar(tipo) { const r = SES0 || { n: 0, ok: 0, t0: Date.now() }; FIN = { tipo, n: r.n, ok: r.ok, min: Math.max(1, Math.round((Date.now() - r.t0) / 6e4)) }; cerrarRegistro(); FC = null; EJ = null; UI.vista = 'fin'; pintar(); if (window.FX && FIN.n) FX.fin(80); }
  function vFin() { const x = perfil(), k = conteos(x, Object.keys(CARDS)), f = FIN || { n: 0, ok: 0, min: 0, tipo: '' };
    return `<section class="vhero vfin"><h2>¡Listo!</h2><p>${esc(f.tipo)} · ${esc(nombreAlcance())}</p><div class="vkpis"><div><b>${f.n}</b><span>respuestas</span></div><div><b>${f.n ? Math.round(100 * f.ok / f.n) : 0}%</b><span>bien o fácil</span></div><div><b>${f.min}</b><span>min</span></div></div></section>
    <section class="card"><p>Te quedan <b>${k.pend}</b> repasos para hoy en todos los mazos. Mañana vuelven las tarjetas que lo necesitan.</p><div class="row"><button class="btn" data-act="inicio">Volver a Vocabulario</button></div></section>`; }

  /* ejercicios */
  function iniciarEj(modo) {
    const x = perfil(), ids = idsAlcance(); if (ids.length < 5) return toast('Elige un mazo con más tarjetas.');
    const n = modo === 'empareja' ? 10 : 10, sel = elegir(x, ids, n);
    EJ = { modo, items: sel, i: 0, res: null, pista: false, pool: ids, ok: 0 };
    if (modo === 'empareja') EJ.rondas = [sel.slice(0, 5), sel.slice(5, 10)].filter(r => r.length >= 3);
    iniciarRegistro('Vocabulario: ' + NOMEJ[modo]); prepEj(); UI.vista = 'ej'; pintar();
  }
  function distractores(id, campo, n = 3) { const c = CARDS[id]; const mismo = c.d.cards.map(z => z[0]).filter(z => z !== id); let pool = mezcla(mismo); if (pool.length < n) pool = pool.concat(mezcla(EJ.pool.filter(z => z !== id && !mismo.includes(z)))); const out = [], vis = new Set([normal(c[campo])]); for (const z of pool) { const v = CARDS[z][campo]; if (!vis.has(normal(v))) { vis.add(normal(v)); out.push(z); } if (out.length >= n) break; } return out; }
  function prepEj() {
    EJ.res = null; EJ.pista = false;
    if (EJ.modo === 'mc') { const id = EJ.items[EJ.i]; EJ.dir = Math.random() < .5 ? 'en' : 'es'; EJ.ops = mezcla([id].concat(distractores(id, EJ.dir === 'en' ? 'es' : 'en'))); }
    if (EJ.modo === 'empareja') { const r = EJ.rondas[EJ.i]; EJ.izq = mezcla(r); EJ.der = mezcla(r); EJ.hechos = []; EJ.err = {}; EJ.selI = null; EJ.selD = null; }
  }
  const nEj = () => EJ.modo === 'empareja' ? EJ.rondas.length : EJ.items.length;
  function hueco(c) { const i = c.ex.toLowerCase().indexOf(c.en.toLowerCase()); const b = c.en.split(/(\s+)/).map(w => /\s/.test(w) ? ' ' : w.replace(/[A-Za-z]/g, '_')).join(''); return esc(c.ex.slice(0, i)) + `<span class="vblank">${EJ.pista ? esc(c.en[0]) + b.slice(1) : b}</span>` + esc(c.ex.slice(i + c.en.length)); }
  function vEj() {
    const tot = nEj(), head = `<div class="vtop"><button class="ico" data-act="salirej" title="Terminar">✕</button><div class="vprog"><i style="width:${Math.round(100 * EJ.i / tot)}%"></i></div><span class="mini">${EJ.i + 1}/${tot}</span></div><p class="vtit">${esc(NOMEJ[EJ.modo])}</p>`;
    if (EJ.modo === 'empareja') {
      const lado = (arr, k, campo) => arr.map(id => { const h = EJ.hechos.includes(id), s = (k === 'i' ? EJ.selI : EJ.selD) === id; return `<button class="vpair${h ? ' ok' : ''}${s ? ' sel' : ''}" data-act="par" data-l="${k}" data-id="${esc(id)}" ${h ? 'disabled' : ''}>${esc(CARDS[id][campo])}</button>`; }).join('');
      return head + `<p class="mini vcenter">Toca una palabra en inglés y su significado.</p><div class="vpairs"><div>${lado(EJ.izq, 'i', 'en')}</div><div>${lado(EJ.der, 'd', 'es')}</div></div>${EJ.hechos.length === EJ.izq.length ? `<button class="btn vbig" data-act="sigej">${EJ.i + 1 < tot ? 'Siguiente' : 'Terminar'}</button>` : ''}`;
    }
    const c = CARDS[EJ.items[EJ.i]], r = EJ.res;
    const fb = r ? `<div class="vfb ${r.q >= 3 ? 'ok' : r.q === 2 ? 'casi' : 'bad'}"><b>${r.q >= 3 ? '✓ ¡Correcto!' : r.q === 2 ? '≈ Casi' : '✗ La respuesta es:'}</b> ${esc(c.en)} <small>${esc(c.ipa)}</small> = ${esc(c.es)}<p>${resaltar(c.ex, c.en)}</p><span class="mini">Próximo repaso: ${esc(etiqueta(r.c))}</span></div><button class="btn vbig" data-act="sigej">${EJ.i + 1 < tot ? 'Siguiente' : 'Terminar'}</button>` : '';
    if (EJ.modo === 'mc') {
      const preg = EJ.dir === 'en' ? `<h2>${esc(c.en)}</h2><p class="vipa">${esc(c.ipa)}</p><p class="mini">¿Qué significa?</p>` : `<h2 class="es">${esc(c.es)}</h2><p class="mini">¿Cómo se dice en inglés?</p>`;
      const campo = EJ.dir === 'en' ? 'es' : 'en';
      return head + `<section class="vq" style="--c:${esc(c.d.c)}">${preg}<button class="btn sm ghost" data-act="say" data-t="${esc(c.en)}">🔊</button></section><div class="vops">${EJ.ops.map((id, j) => { let cl = ''; if (r) { if (id === c.id) cl = ' ok'; else if (r.pick === id) cl = ' bad'; } return `<button class="vop${cl}" data-act="op" data-id="${esc(id)}" ${r ? 'disabled' : ''}><i>${'ABCD'[j]}</i>${esc(CARDS[id][campo])}</button>`; }).join('')}</div>${fb}`;
    }
    const prompt = EJ.modo === 'escribe' ? `<h2 class="es">${esc(c.es)}</h2><p class="mini">Escribe la palabra o frase en inglés (${c.en.replace(/[^A-Za-z]/g, '').length} letras${/\s/.test(c.en) ? ', ' + c.en.split(/\s+/).length + ' palabras' : ''}).${EJ.pista ? ` Empieza con «${esc(c.en[0])}».` : ''}</p>` : `<p class="vsent">${hueco(c)}</p><p class="mini">Pista: ${esc(c.es)}</p>`;
    return head + `<section class="vq" style="--c:${esc(c.d.c)}">${prompt}</section>${r ? '' : `<input id="vin" class="vin" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Escribe en inglés"><div class="row"><button class="btn sm ghost" data-act="pista" ${EJ.pista ? 'disabled' : ''}>Pista</button><button class="btn" data-act="check">Revisar</button></div>`}${fb}`;
  }
  function responderEj(q, extra) { const id = EJ.items[EJ.i]; const c = calificar(id, q); EJ.res = Object.assign({ q, c }, extra || {}); cuenta(q >= 3); if (q >= 3 && window.FX) setTimeout(() => FX.ok($('.vfb')), 30); else if (q === 1 && window.FX) FX.no(); decir(CARDS[id].en); pintar(); }
  function revisar() {
    const v = normal(($('#vin') || {}).value || ''); if (!v) return toast('Escribe tu respuesta.');
    const c = CARDS[EJ.items[EJ.i]], ok = normal(c.en);
    let q = v === ok ? 3 : (ok.length >= 5 && lev(v, ok) <= 1) ? 2 : 1; if (EJ.pista && q === 3) q = 2;
    responderEj(q, { val: v });
  }
  function sigEj() { EJ.i++; if (EJ.i >= nEj()) return terminar(SES0 ? SES0.tipo : 'Vocabulario'); prepEj(); pintar(); const i = $('#vin'); if (i) i.focus(); }
  function par(l, id) {
    if (l === 'i') EJ.selI = id; else EJ.selD = id;
    if (EJ.selI && EJ.selD) {
      if (EJ.selI === EJ.selD) { const z = EJ.selI; EJ.hechos.push(z); const q = EJ.err[z] ? 1 : 3; calificar(z, q); cuenta(q >= 3); decir(CARDS[z].en); if (window.FX) FX.ok(); }
      else { EJ.err[EJ.selI] = 1; EJ.err[EJ.selD] = 1; if (window.FX) FX.no(); const b = ROOT.querySelectorAll('.vpair.sel'); b.forEach(e => e.classList.add('shake')); setTimeout(() => { EJ.selI = EJ.selD = null; pintar(); }, 380); return; }
      EJ.selI = EJ.selD = null;
    }
    pintar();
  }

  /* ---------- eventos ---------- */
  function enlazar() {
    const sel = $('#vnuevas'); if (sel) sel.onchange = () => { const x = perfil(); x.cfg.nuevas = +sel.value; guardar(x); pintar(); };
    const inp = $('#vin'); if (inp) { inp.onkeydown = e => { if (e.key === 'Enter') revisar(); }; setTimeout(() => inp.focus(), 50); }
    ROOT.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b || !ROOT.contains(b) || b.disabled) return; const a = b.dataset.act;
      if (a === 'mazo') { UI.mazo = b.dataset.m; UI.k = 'todos'; pintar(); }
      else if (a === 'anio') { UI.anio = b.dataset.a; UI.k = 'todos'; pintar(); }
      else if (a === 'k') { UI.k = UI.k === b.dataset.k ? 'todos' : b.dataset.k; pintar(); }
      else if (a === 'fc') iniciarFC();
      else if (a === 'ej') iniciarEj(b.dataset.m);
      else if (a === 'lista') { UI.vista = 'lista'; pintar(); scrollTo(0, 0); }
      else if (a === 'inicio') { UI.vista = 'inicio'; pintar(); scrollTo(0, 0); }
      else if (a === 'flip') voltear();
      else if (a === 'grade') gradeFC(+b.dataset.q);
      else if (a === 'say') { e.stopPropagation(); decir(b.dataset.t); }
      else if (a === 'slow') { e.stopPropagation(); decir(b.dataset.t, true); }
      else if (a === 'pron') pronunciar(b.dataset.id, b);
      else if (a === 'salirfc' || a === 'salirej') { if (SES0 && SES0.n) terminar(SES0.tipo); else { SES0 = null; FC = null; EJ = null; UI.vista = 'inicio'; pintar(); } }
      else if (a === 'op') { const c = EJ.items[EJ.i]; responderEj(b.dataset.id === c ? 3 : 1, { pick: b.dataset.id }); }
      else if (a === 'check') revisar();
      else if (a === 'pista') { EJ.pista = true; const v = ($('#vin') || {}).value; pintar(); if ($('#vin')) $('#vin').value = v || ''; }
      else if (a === 'sigej') sigEj();
      else if (a === 'par') par(b.dataset.l, b.dataset.id);
    };
  }
  document.addEventListener('keydown', e => {
    if (!ROOT || !document.body.contains(ROOT) || UI.vista !== 'fc' || !FC || /input|select|textarea/i.test((e.target.tagName || ''))) return;
    if ((e.key === ' ' || e.key === 'Enter') && !FC.ver) { e.preventDefault(); voltear(); }
    else if (FC.ver && /^[1-4]$/.test(e.key)) gradeFC(+e.key);
  });

  /* resumen para la pestaña Hoy */
  function resumen() { const x = perfil(), k = conteos(x, Object.keys(CARDS)); return { pend: k.pend, nuevas: k.cupo, aprendidas: k.apr, total: k.total }; }
  window.VOCAB = { mount, resumen, VER: '1.0', total, _programar: programar, _estado: () => ({ vista: UI.vista, ui: Object.assign({}, UI), fc: FC && { cur: FC.cur, q: FC.q.length, re: FC.re.length }, ej: EJ && { modo: EJ.modo, i: EJ.i, id: EJ.items[EJ.i], en: EJ.items[EJ.i] && CARDS[EJ.items[EJ.i]].en, ops: EJ.ops, dir: EJ.dir, ronda: EJ.izq } }) };
})();
