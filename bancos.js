/* Bancos para cadetes · v2.17 · Misión: Obtener la Barra I
   Administración publica en su Hoja privada (script v6) los bancos que tiene en su equipo: el material de la Mesa y lo importado
   (preguntas ALCPT y ALC, con sus MP3 e imágenes). Los paquetes salen del navegador YA CIFRADOS (AES-256-GCM) y el script los
   guarda como archivos en una carpeta privada de su Drive. La clave solo la entrega el script a quien inicia sesión con una
   matrícula del padrón (más primer apellido o grupo pedagógico). Nada de esto vive en el repositorio público.
   El cadete descarga una vez las preguntas (pocos MB) y después los audios en segundo plano; todo queda en este dispositivo
   (IndexedDB) para usarse sin internet. Si Administración publica otra versión, se baja solo lo que cambió. ALC y ALCPT van separados. */
(function () {
  'use strict';
  const MAXP = 2500000, CADA = 6 * 3600 * 1000;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = m => { try { window.toast ? window.toast(m) : alert(m); } catch (e) { } };
  const G = (f, d) => { try { return f(); } catch (e) { return d; } };
  const URLH = () => G(() => SHEET, '') || '', SRVX = () => G(() => SRV, false), sesion = () => G(() => S.sesion, null), perfil = () => G(() => P(), null);
  const adm = () => G(() => esAdmin() && !soloLectura(), false), hk = () => localStorage.getItem('mb1_hk') || '';
  const verH = f => G(() => verHoja(f), Promise.resolve(G(() => HV.v, 1)));
  /* ---------- IndexedDB (mismo almacén que el material ALC) ---------- */
  function idb() { return new Promise((ok, ko) => { const r = indexedDB.open('mb1_alc', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }); }
  async function get(k) { const d = await idb(); return new Promise((ok, ko) => { const r = d.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }); }
  async function put(k, v) { const d = await idb(); return new Promise((ok, ko) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => ok(); t.onerror = () => ko(t.error); }); }
  async function del(k) { const d = await idb(); return new Promise(ok => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = () => ok(); }); }
  /* ---------- utilidades binarias y cifrado ---------- */
  const b64e = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  const b64d = s => { const b = atob(s), u = new Uint8Array(b.length); for (let i = 0; i < b.length; i++) u[i] = b.charCodeAt(i); return u; };
  const unir = arr => { const n = arr.reduce((s, a) => s + a.length, 0), u = new Uint8Array(n); let o = 0; arr.forEach(a => { u.set(a, o); o += a.length; }); return u; };
  async function sha(u8) { const h = new Uint8Array(await crypto.subtle.digest('SHA-256', u8)); return Array.from(h.slice(0, 20), x => x.toString(16).padStart(2, '0')).join(''); }
  const llave = k => crypto.subtle.importKey('raw', b64d(k), 'AES-GCM', false, ['encrypt', 'decrypt']);
  async function cifrar(key, u8) { const iv = crypto.getRandomValues(new Uint8Array(12)); return unir([iv, new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, u8))]); }
  async function descifrar(key, u8) { return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: u8.subarray(0, 12) }, key, u8.subarray(12))); }
  const hayZ = () => typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';
  const gz = async u8 => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const gunz = async u8 => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  const hnum = s => { let h = 0; s = String(s); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  /* ---------- red (Apps Script) ---------- */
  async function getJ(q, ms) { const c = new AbortController(), t = setTimeout(() => c.abort(), ms || 60000); try { const r = await fetch(URLH() + '?' + new URLSearchParams(q), { cache: 'no-store', signal: c.signal }); return await r.json(); } finally { clearTimeout(t); } }
  async function post(tipo, datos, ms) { const c = new AbortController(), t = setTimeout(() => c.abort(), ms || 180000); try { const r = await fetch(URLH(), { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ tipoRegistro: tipo, clave: hk(), datos }), signal: c.signal }); return await r.json(); } finally { clearTimeout(t); } }
  async function reintentar(fn, n) { let e; for (let i = 0; i < (n || 4); i++) { try { return await fn(); } catch (x) { e = x; await new Promise(r => setTimeout(r, 1500 * (i + 1))); } } throw e; }
  /* ---------- Administración: publicar ---------- */
  let PROG = null; // { fase, i, n, txt }
  const pinta = () => { const el = document.getElementById('pubprog'); if (el) el.innerHTML = PROG ? `<div class="pbar"><i style="width:${PROG.n ? Math.round(100 * PROG.i / PROG.n) : 5}%"></i></div><p class="mini">${esc(PROG.txt)}</p>` : ''; const c = document.getElementById('pubcad'); if (c) pintarCadete(c); };
  async function armar() {
    const base = await get('bank').catch(() => null), imp = (await get('imp').catch(() => null)) || { alcpt: [], alc: [] };
    const B = base && Array.isArray(base.alcpt) ? base : null;
    const nPT = (B ? B.alcpt.length : 0) + imp.alcpt.length, nA = (B ? (B.alc || []).length : 0) + imp.alc.length;
    if (!nPT && !nA) return null;
    const refs = new Set(); imp.alcpt.concat(imp.alc).forEach(i => ['mp3', 'img', 'vid'].forEach(f => { if (i[f] && /^idb:/.test(i[f])) refs.add(i[f].slice(4)); }));
    const cub = {};
    for (const k of [...refs].sort()) { const r = await get(k).catch(() => null); if (!r || !r.blob) continue; const c = hnum(k) % 48; (cub[c] = cub[c] || []).push({ k, r }); }
    const grupos = [];
    Object.keys(cub).sort((a, b) => a - b).forEach(c => { let g = [], s = 0; cub[c].forEach(x => { if (s && s + x.r.blob.size > MAXP) { grupos.push(g); g = []; s = 0; } g.push(x); s += x.r.blob.size; }); if (g.length) grupos.push(g); });
    const medios = {}, packs = [];
    for (const g of grupos) {
      const partes = []; let o = 0; const ent = [];
      for (const x of g) { const u = new Uint8Array(await x.r.blob.arrayBuffer()); partes.push(u); ent.push([x.k, { o, l: u.length, m: x.r.mime || '', t: x.r.tipo || '', n: x.r.nombre || '' }]); o += u.length; }
      const id = 'm' + await sha(unir(partes)); ent.forEach(([k, e]) => { e.p = id; medios[k] = e; }); packs.push({ id, t: 'm', b: o, g });
    }
    const z = hayZ();
    let q = new TextEncoder().encode(JSON.stringify({ f: 'mb1-bancos', base: B, alcpt: imp.alcpt, alc: imp.alc, medios }));
    if (z) q = await gz(q);
    const qp = []; for (let i = 0; i < q.length; i += MAXP) { const u = q.subarray(i, i + MAXP); qp.push({ id: 'q' + await sha(u), t: 'q', b: u.length, u }); }
    const todos = qp.concat(packs), v = (await sha(new TextEncoder().encode(todos.map(p => p.id).join(',')))).slice(0, 12);
    return { v, z, n: { alcpt: nPT, alc: nA, medios: Object.keys(medios).length }, packs: todos, mb: Math.round(todos.reduce((s, p) => s + p.b, 0) / 1e5) / 10 };
  }
  async function publicar() {
    if (!adm()) return toast('Solo Administración puede publicar bancos.');
    if (!URLH() || SRVX()) return toast('Esta función usa la Hoja de registro (versión pública de la app).');
    if (!hk()) return toast('Primero captura la clave de lectura de la Hoja.');
    if (!navigator.onLine) return toast('Necesitas internet para publicar.');
    if (PROG) return;
    try {
      PROG = { i: 0, n: 0, txt: 'Comprobando la Hoja…' }; pinta();
      const v = await verH(true); if (!(v >= 6)) { PROG = null; pinta(); return toast('Actualiza el script de la Hoja a la versión 6 (ver documento de pasos).'); }
      PROG.txt = 'Preparando los bancos de este equipo…'; pinta();
      const A = await armar(); if (!A) { PROG = null; pinta(); return toast('No hay bancos en este equipo: carga el material o importa bancos primero.'); }
      const kr = await getJ({ hoja: 'banco_clave', clave: hk() }); if (!kr || !kr.ok || !kr.k) throw new Error('la Hoja no entregó la clave (¿clave de lectura correcta?)');
      const key = await llave(kr.k);
      const ya = await post('banco_tiene', { ids: A.packs.map(p => p.id) }); if (!ya || !ya.ok) throw new Error(ya && ya.error === 'clave' ? 'clave de lectura incorrecta' : 'la Hoja no respondió');
      const hay = new Set(ya.tiene || []), falta = A.packs.filter(p => !hay.has(p.id));
      PROG = { i: 0, n: falta.length, txt: `Subiendo ${falta.length} de ${A.packs.length} paquetes cifrados (${A.mb} MB en total)…` }; pinta();
      for (const p of falta) {
        const u = p.u || unir(await Promise.all(p.g.map(async x => new Uint8Array(await x.r.blob.arrayBuffer()))));
        const c = await cifrar(key, u), b64 = b64e(c);
        await reintentar(async () => { const r = await post('banco_parte', { id: p.id, b64 }); if (!r || !r.ok) throw new Error((r && r.error) || 'sin respuesta'); });
        PROG.i++; PROG.txt = `Subiendo paquetes cifrados: ${PROG.i} de ${PROG.n}…`; pinta();
      }
      const man = { v: A.v, fecha: new Date().toISOString(), n: A.n, mb: A.mb, z: A.z ? 1 : 0, packs: A.packs.map(p => ({ id: p.id, t: p.t, b: p.b })) };
      const r = await post('banco_publicar', { man }); if (!r || !r.ok) throw new Error(r && r.error === 'faltan' ? `faltan ${r.faltan.length} paquetes; vuelve a publicar` : 'no se pudo publicar');
      PROG = null; ESTADO = { t: Date.now(), man }; pinta(); pintarAdmin();
      toast(`Bancos publicados: versión ${A.v} · ALCPT ${A.n.alcpt} · ALC ${A.n.alc} · ${A.n.medios} audios/imágenes.`);
      return man;
    } catch (e) { PROG = null; pinta(); toast('No se pudo publicar: ' + (e.message || e)); }
  }
  async function retirar() {
    if (!adm()) return; if (!confirm('¿Retirar los bancos publicados? Los cadetes los quitarán de sus equipos la próxima vez que se conecten.')) return;
    try { const r = await post('banco_retirar', {}); if (!r || !r.ok) throw new Error('la Hoja no aceptó'); ESTADO = { t: Date.now(), man: null }; pintarAdmin(); toast('Bancos retirados.'); } catch (e) { toast('No se pudo retirar: ' + (e.message || e)); }
  }
  let ESTADO = null;
  async function estadoAdmin(forzar) {
    if (!forzar && ESTADO && Date.now() - ESTADO.t < 60000) return ESTADO;
    if (!URLH() || !hk() || !navigator.onLine) return (ESTADO = { t: Date.now(), err: !hk() ? 'clave' : 'red' });
    try { const v = await verH(); if (!(v >= 6)) return (ESTADO = { t: Date.now(), err: 'v6' }); const r = await getJ({ hoja: 'banco_estado', clave: hk() }, 20000); return (ESTADO = r && r.ok ? { t: Date.now(), man: r.man } : { t: Date.now(), err: 'clave' }); } catch (e) { return (ESTADO = { t: Date.now(), err: 'red' }); }
  }
  const fechaL = s => { const d = new Date(s); return isNaN(d) ? '' : d.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }); };
  function cardAdmin() {
    if (!adm()) return '';
    return `<section class="card" id="pubadm"><h3>Bancos para cadetes</h3><p class="mini">Publica en tu Hoja privada (script v6) los bancos que tienes en este equipo: el material de la Mesa y lo importado (ALCPT y ALC, con sus audios). Se suben <b>cifrados</b> a una carpeta privada de tu Drive. Cada cadete los descarga una vez al entrar con su matrícula y los usa sin internet. ALC y ALCPT siguen separados.</p>
    <div id="pubest" class="mini">Consultando la Hoja…</div><div id="pubprog"></div>
    <div class="row"><button class="btn" type="button" onclick="BANCOS.publicar()">Publicar bancos a cadetes</button><button class="btn ghost" type="button" onclick="BANCOS.retirar()">Retirar bancos</button><button class="btn ghost" type="button" onclick="BANCOS.pintarAdmin(true)">Actualizar estado</button></div></section>`;
  }
  async function pintarAdmin(forzar) {
    const el = document.getElementById('pubest'); if (!el) return;
    const e = await estadoAdmin(forzar === true), m = e.man;
    el.innerHTML = e.err === 'clave' ? 'Captura la clave de lectura de la Hoja para publicar.' : e.err === 'v6' ? '<b class="badt">La Hoja aún no tiene el script versión 6.</b> Sigue el documento de pasos para pegar la v6 y publicar una nueva versión.' : e.err === 'red' ? 'Sin conexión con la Hoja.' :
      m ? `<p>Publicado: <b>versión ${esc(m.v)}</b> · ${esc(fechaL(m.fecha))}<br>ALCPT: <b>${m.n.alcpt}</b> preguntas · ALC: <b>${m.n.alc}</b> preguntas · ${m.n.medios || 0} audios/imágenes · ${m.mb} MB en ${m.packs.length} paquetes</p>` : '<p>No hay bancos publicados para los cadetes.</p>';
    pinta();
  }
  /* ---------- cadete: descargar y actualizar ---------- */
  let SYNC = null, CAD = { est: '', i: 0, n: 0 };
  async function bajar(id, pase, key) {
    const r = await reintentar(async () => { const x = await getJ({ hoja: 'banco_parte', id, pase }, 120000); if (!x || !x.ok) { const er = new Error((x && x.error) || 'sin respuesta'); if (x && x.error === 'pase') er.fatal = true; throw er; } return x; }, 6);
    const u = await descifrar(key, b64d(r.b64));
    if ((id[0] + await sha(u)) !== id) throw new Error('paquete dañado');
    return u;
  }
  async function quitarPub() { const p = await get('pub').catch(() => null); if (p && p.medios) for (const k of Object.keys(p.medios)) await del(k); await del('pub'); await recargar(); }
  function recargar() { return Promise.all(['ALCMOD', 'ALCPTMOD'].map(k => { try { return window[k] && window[k].recargar ? Promise.resolve(window[k].recargar()).catch(() => { }) : null; } catch (e) { return null; } })); }
  function cadeteOk() { const s = sesion(), p = perfil(); return !!(s && s.perfil === 'cadete' && p && !p.piloto && !G(() => esPiloto(), false) && URLH() && !SRVX()); }
  function sincronizar(forzar) {
    if (SYNC) return SYNC;
    SYNC = (async () => {
      if (!cadeteOk() || !navigator.onLine) return;
      const pub = await get('pub').catch(() => null), completo = pub && pub.v && (pub.hechos || []).length >= Object.values(pub.medios || {}).reduce((s, e) => s.add(e.p), new Set()).size;
      if (!forzar && completo && Date.now() - Number(localStorage.getItem('mb1_pub_chk') || 0) < CADA) return;
      const v = await verH(); if (!(v >= 6)) return;
      const p = perfil();
      CAD = { est: 'buscando', i: 0, n: 0 }; pinta();
      const meta = await getJ({ hoja: 'banco_meta', m: p.m, ap: p.ap || '', gp: p.gp || '' }, 30000);
      localStorage.setItem('mb1_pub_chk', String(Date.now()));
      if (!meta || !meta.ok) { CAD = { est: meta && meta.espera ? 'espera' : 'acceso' }; pinta(); return; }
      if (meta.vacio) { if (pub) await quitarPub(); CAD = { est: 'vacio' }; pinta(); return; }
      const key = await llave(meta.k);
      let cur = pub && pub.v === meta.v ? pub : null;
      if (!cur) {
        CAD = { est: 'preguntas', i: 0, n: 1 }; pinta();
        const qs = meta.packs.filter(x => x.t === 'q'), partes = [];
        for (const q of qs) partes.push(await bajar(q.id, meta.pase, key));
        let u = unir(partes); if (meta.z) u = await gunz(u);
        const d = JSON.parse(new TextDecoder().decode(u));
        const ids = new Set(meta.packs.map(x => x.id));
        cur = { v: meta.v, fecha: meta.fecha, n: meta.n, base: d.base || null, alcpt: d.alcpt || [], alc: d.alc || [], medios: d.medios || {}, hechos: pub ? (pub.hechos || []).filter(id => ids.has(id)) : [] };
        await put('pub', cur);
        if (pub && pub.medios) for (const k of Object.keys(pub.medios)) if (!cur.medios[k] || !cur.hechos.includes(cur.medios[k].p)) await del(k);
        await recargar();
      }
      const mp = meta.packs.filter(x => x.t === 'm' && !cur.hechos.includes(x.id));
      CAD = { est: 'audios', i: 0, n: mp.length }; pinta();
      for (const x of mp) {
        const u = await bajar(x.id, meta.pase, key);
        for (const [k, e] of Object.entries(cur.medios)) if (e.p === x.id) await put(k, { nombre: e.n, mime: e.m, tipo: e.t, blob: new Blob([u.slice(e.o, e.o + e.l)], { type: e.m || 'application/octet-stream' }), uso: 'pub' });
        cur.hechos.push(x.id); await put('pub', cur);
        CAD.i++; pinta();
      }
      CAD = { est: 'listo' }; pinta();
    })().catch(e => { CAD = { est: 'error', msg: String(e && e.message || e) }; pinta(); }).finally(() => { SYNC = null; });
    return SYNC;
  }
  async function resumenCadete() { const p = await get('pub').catch(() => null); if (!p) return null; const packs = new Set(Object.values(p.medios || {}).map(e => e.p)); return { v: p.v, fecha: p.fecha, alcpt: (p.base ? p.base.alcpt.length : 0) + p.alcpt.length, alc: (p.base ? (p.base.alc || []).length : 0) + p.alc.length, audios: Object.keys(p.medios || {}).length, packs: packs.size, hechos: (p.hechos || []).length }; }
  async function pintarCadete(el) {
    if (!el) return; if (!cadeteOk() && !(sesion() && sesion().perfil === 'cadete')) { el.innerHTML = ''; return; }
    const r = await resumenCadete(), c = CAD;
    const prog = c.est === 'preguntas' ? 'Descargando preguntas…' : c.est === 'audios' ? `Descargando audios: ${c.i} de ${c.n} paquetes…` : c.est === 'buscando' ? 'Buscando bancos de la Mesa…' : c.est === 'acceso' ? 'No se pudo comprobar tu matrícula en el padrón; avisa a Administración.' : c.est === 'espera' ? 'Demasiados intentos; prueba en unos minutos.' : c.est === 'error' ? 'La descarga se interrumpió; se reanuda sola con internet.' : c.est === 'vacio' && !r ? 'Administración aún no publica bancos.' : '';
    el.innerHTML = `<div class="card pubcad"><h2>Bancos de la Mesa</h2>${r ? `<p class="muted">Versión ${esc(r.v)} · ${esc(fechaL(r.fecha))}<br>ALCPT: <b>${r.alcpt}</b> preguntas · ALC: <b>${r.alc}</b> preguntas · audios e imágenes: ${r.hechos >= r.packs ? `<b>${r.audios}</b> listos sin internet` : `${r.hechos} de ${r.packs} paquetes (mientras, se usa la voz del equipo)`}</p>` : '<p class="muted">Se descargan solos cuando entras con internet; después funcionan sin conexión.</p>'}
      ${c.est === 'audios' ? `<div class="pbar"><i style="width:${c.n ? Math.round(100 * c.i / c.n) : 0}%"></i></div>` : ''}${prog ? `<p class="mini">${esc(prog)}</p>` : ''}
      <button class="btn ghost" type="button" data-pubsync>Buscar actualización</button></div>`;
    const b = el.querySelector('[data-pubsync]'); if (b) b.onclick = () => { if (!navigator.onLine) return toast('Sin internet.'); sincronizar(true); };
  }
  function enRender() { const a = document.getElementById('pubest'); if (a && !a.dataset.ok) { a.dataset.ok = '1'; pintarAdmin(); } document.querySelectorAll('[data-pubcad]').forEach(el => { el.id = 'pubcad'; pintarCadete(el); }); }
  try { new MutationObserver(() => { const a = document.getElementById('pubest'); if (a && !a.dataset.ok) { a.dataset.ok = '1'; pintarAdmin(); } document.querySelectorAll('[data-pubcad]:not([data-p])').forEach(el => { el.dataset.p = '1'; el.id = 'pubcad'; pintarCadete(el); }); }).observe(document.documentElement, { childList: true, subtree: true }); } catch (e) { }
  setTimeout(() => sincronizar(false), 3500);
  setInterval(() => sincronizar(false), 60000);
  window.addEventListener('online', () => setTimeout(() => sincronizar(false), 2000));
  window.BANCOS = { publicar, retirar, cardAdmin, pintarAdmin, sincronizar, pintarCadete, resumenCadete, enRender, estadoAdmin, _armar: armar };
})();
