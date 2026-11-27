/* Importador de bancos de preguntas, respaldos y archivos · v2.16 · Misión: Obtener la Barra I
   Todo se procesa EN ESTE DISPOSITIVO, en el navegador: nada se sube a internet ni al repositorio.
   Formatos: ZIP, Excel (xlsx/xls/xlsm/ods), CSV/TSV, Word (.docx), PDF con texto, JSON, TXT, imágenes, audio (MP3…) y video (MP4…).
   · Preguntas: se extraen de Excel/CSV, Word, JSON, TXT y PDF con texto (y de esos mismos archivos dentro de un ZIP).
   · Audios e imágenes dentro de un ZIP se ligan a la pregunta cuyo nombre de archivo coincide.
   · Lo que no se puede convertir en preguntas (imagen, PDF escaneado, video, audio suelto) se guarda como RECURSO; no se inventan preguntas.
   · Respaldos de la app (.json) y el material de la Mesa siguen entrando por su procedimiento de siempre. */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = m => { try { window.toast ? window.toast(m) : alert(m); } catch (e) { } };
  /* ---------- almacenamiento (IndexedDB «mb1_alc», almacén kv; el mismo del material ALC) ---------- */
  function idb() { return new Promise((ok, ko) => { const r = indexedDB.open('mb1_alc', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }); }
  async function get(k) { const d = await idb(); return new Promise((ok, ko) => { const r = d.transaction('kv').objectStore('kv').get(k); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); }); }
  async function put(k, v) { const d = await idb(); return new Promise((ok, ko) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => ok(); t.onerror = () => ko(t.error); }); }
  async function del(k) { const d = await idb(); return new Promise(ok => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = () => ok(); }); }
  /* ---------- tipos de archivo ---------- */
  const ext = n => (String(n).toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
  const base = n => String(n).split(/[\\/]/).pop().replace(/\.[^.]+$/, '').trim().toLowerCase();
  const G = {
    audio: ['mp3', 'm4a', 'wav', 'ogg', 'oga', 'aac', 'opus', 'flac', 'weba'], video: ['mp4', 'm4v', 'webm', 'mov', 'ogv', 'avi', 'mkv', '3gp'],
    imagen: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'heic', 'heif', 'tif', 'tiff'], tabla: ['xlsx', 'xls', 'xlsm', 'xlsb', 'ods', 'csv', 'tsv'],
    word: ['docx', 'docm'], pdf: ['pdf'], json: ['json'], texto: ['txt', 'md', 'text'], zip: ['zip']
  };
  const clase = n => { const e = ext(n); for (const k in G) if (G[k].includes(e)) return k; if (e === 'doc' || e === 'rtf' || e === 'odt') return 'doc'; if (e === 'pptx' || e === 'ppt' || e === 'odp') return 'pres'; return 'otro'; };
  const MIME = { mp3: 'audio/mpeg', m4a: 'audio/mp4', wav: 'audio/wav', ogg: 'audio/ogg', oga: 'audio/ogg', aac: 'audio/aac', opus: 'audio/ogg', flac: 'audio/flac', weba: 'audio/webm', mp4: 'video/mp4', m4v: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime', ogv: 'video/ogg', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', bmp: 'image/bmp', svg: 'image/svg+xml', pdf: 'application/pdf', json: 'application/json', txt: 'text/plain', csv: 'text/csv', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', zip: 'application/zip' };
  const mimeDe = n => MIME[ext(n)] || 'application/octet-stream';
  const TIPO_TXT = { audio: 'Audio', video: 'Video', imagen: 'Imagen', tabla: 'Excel / CSV', word: 'Word', pdf: 'PDF', json: 'JSON', texto: 'Texto', zip: 'ZIP', doc: 'Documento', pres: 'Presentación', otro: 'Archivo' };
  function hash(s) { let h1 = 0x811c9dc5, h2 = 0; s = String(s); for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619); h2 = (h2 * 31 + c) | 0; } return ((h1 >>> 0).toString(36) + (h2 >>> 0).toString(36)).toUpperCase(); }
  /* ---------- ZIP (lector propio; deflate con DecompressionStream) ---------- */
  async function unzip(buf) {
    const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    let eocd = -1; for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65558); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw new Error('El ZIP no es válido o está dañado.');
    const n = dv.getUint16(eocd + 10, true), off = dv.getUint32(eocd + 16, true); if (off === 0xffffffff) throw new Error('ZIP64 no compatible: comprime en partes más pequeñas.');
    const out = [], u = new TextDecoder('utf-8'); let p = off;
    for (let i = 0; i < n && p + 46 <= u8.length; i++) {
      if (dv.getUint32(p, true) !== 0x02014b50) break;
      const m = dv.getUint16(p + 10, true), cs = dv.getUint32(p + 20, true), fl = dv.getUint16(p + 28, true), xl = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      const name = u.decode(u8.subarray(p + 46, p + 46 + fl)); p += 46 + fl + xl + cl;
      if (/\/$/.test(name) || /(^|\/)(__MACOSX|\.DS_Store|Thumbs\.db)/i.test(name)) continue;
      out.push({ name, m, cs, lo });
    }
    return Promise.all(out.map(async e => {
      const a = e.lo + 30 + dv.getUint16(e.lo + 26, true) + dv.getUint16(e.lo + 28, true), c = u8.subarray(a, a + e.cs);
      let data; if (e.m === 0) data = c; else if (e.m === 8) { if (typeof DecompressionStream === 'undefined') throw new Error('Este navegador no puede abrir ZIP; actualízalo.'); data = new Uint8Array(await new Response(new Blob([c]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); } else data = null;
      return { name: e.name, data };
    }));
  }
  /* ---------- lectores ---------- */
  const txtDe = u8 => { let t = new TextDecoder('utf-8').decode(u8); if (t.includes('\uFFFD')) t = new TextDecoder('windows-1252').decode(u8); return t.replace(/^\uFEFF/, ''); };
  function tablas(u8, nombre) {
    const e = ext(nombre);
    if (window.XLSX) { const wb = (e === 'csv' || e === 'tsv') ? XLSX.read(txtDe(u8), { type: 'string', raw: true, FS: e === 'tsv' ? '\t' : undefined }) : XLSX.read(u8, { type: 'array' }); return wb.SheetNames.map(s => ({ hoja: s, filas: XLSX.utils.sheet_to_json(wb.Sheets[s], { header: 1, defval: '', raw: false, blankrows: false }) })); }
    if (e === 'csv' || e === 'tsv') { const sep = e === 'tsv' ? '\t' : (txtDe(u8).split('\n')[0].split(';').length > txtDe(u8).split('\n')[0].split(',').length ? ';' : ','); return [{ hoja: '', filas: csv(txtDe(u8), sep) }]; }
    throw new Error('El lector de Excel aún no carga; intenta de nuevo en unos segundos.');
  }
  function csv(t, sep) { const R = []; let row = [], f = '', q = false; for (let i = 0; i < t.length; i++) { const c = t[i]; if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === sep) { row.push(f); f = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); R.push(row); row = []; f = ''; } else f += c; } if (f || row.length) { row.push(f); R.push(row); } return R.filter(r => r.some(x => String(x).trim())); }
  async function docx(u8) {
    const z = await unzip(u8), d = z.find(x => x.name === 'word/document.xml'); if (!d || !d.data) throw new Error('No se encontró el contenido del Word.');
    const dom = new DOMParser().parseFromString(new TextDecoder().decode(d.data), 'application/xml'), all = n => Array.from(dom.getElementsByTagName('*')).filter(x => x.localName === n);
    const tx = el => Array.from(el.getElementsByTagName('*')).filter(x => x.localName === 't' || x.localName === 'tab' || x.localName === 'br').map(x => x.localName === 't' ? x.textContent : ' ').join('').replace(/\s+/g, ' ').trim();
    const tbls = all('tbl').map(t => Array.from(t.getElementsByTagName('*')).filter(x => x.localName === 'tr' && x.closest && true).map(tr => Array.from(tr.children).filter(c => c.localName === 'tc').map(tx))).filter(r => r.length >= 2);
    const enTabla = p => { let x = p.parentNode; while (x) { if (x.localName === 'tbl') return true; x = x.parentNode; } return false; };
    const lineas = all('p').filter(p => !enTabla(p)).map(tx).filter(Boolean);
    const medios = z.filter(x => /^word\/media\//.test(x.name) && x.data);
    return { tbls, lineas, medios };
  }
  let PDFJS = null;
  async function pdfjs() { if (PDFJS) return PDFJS; const m = await import(new URL('pdfjs/pdf.min.mjs', location.href).href); m.GlobalWorkerOptions.workerSrc = new URL('pdfjs/pdf.worker.min.mjs', location.href).href; return (PDFJS = m); }
  async function pdfLineas(u8) {
    const P = await pdfjs(), doc = await P.getDocument({ data: new Uint8Array(u8), standardFontDataUrl: new URL('pdfjs/standard_fonts/', location.href).href }).promise, L = [];
    for (let n = 1; n <= doc.numPages; n++) {
      const tc = await (await doc.getPage(n)).getTextContent(), rows = new Map();
      tc.items.forEach(it => { if (!it.str) return; const y = Math.round(it.transform[5] / 3) * 3; if (!rows.has(y)) rows.set(y, []); rows.get(y).push([it.transform[4], it.str]); });
      [...rows.keys()].sort((a, b) => b - a).forEach(y => { const t = rows.get(y).sort((a, b) => a[0] - b[0]).map(x => x[1]).join(' ').replace(/\s+/g, ' ').trim(); if (t) L.push(t); });
    }
    return { lineas: L, paginas: doc.numPages };
  }
  /* ---------- de filas (Excel/CSV/tablas de Word) a preguntas ---------- */
  const nh = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  function mapear(h) {
    const M = { o: [] };
    h.forEach((c, i) => {
      const x = nh(c); if (!x) return;
      let m = x.match(/^(?:opcion|option|inciso|respuesta|resp|alternativa|choice|o)?\s*([a-d1-4])$/); if (m) { M.o[/\d/.test(m[1]) ? +m[1] - 1 : 'abcd'.indexOf(m[1])] = i; return; }
      if (/^(distractor|incorrecta|wrong|d)\s*[1-3]?$/.test(x)) { (M.dis = M.dis || []).push(i); return; }
      if (M.q == null && /(pregunta|question|reactivo|enunciado|stem|item|prompt)/.test(x) && !/(num|no|id|tipo)$/.test(x)) { M.q = i; return; }
      if (M.k == null && /(correct|clave|answer|key|solucion|respuesta)/.test(x)) { M.k = i; return; }
      if (M.s == null && /(script|guion|transcrip|texto del audio|dialog|locucion)/.test(x)) { M.s = i; return; }
      if (M.au == null && /(audio|mp3|sonido|grabacion)/.test(x)) { M.au = i; return; }
      if (M.img == null && /(imagen|image|foto|img|figura)/.test(x)) { M.img = i; return; }
      if (M.sec == null && /^(seccion|section|parte|part|sec|habilidad|skill)$/.test(x)) { M.sec = i; return; }
      if (M.pas == null && /(lectura|pasaje|passage|texto|reading)/.test(x)) { M.pas = i; return; }
      if (M.e == null && /(explica|retro|feedback|justif|nota)/.test(x)) { M.e = i; return; }
      if (M.tipo == null && /(tema|tipo|categoria|topic|area|leccion|libro)/.test(x)) { M.tipo = i; return; }
      if (M.n == null && /^(no|num|numero|n|id|#)$/.test(x)) { M.n = i; return; }
    });
    M.o = M.o.filter(v => v != null);
    return M;
  }
  const secDe = (v, s, au) => { const x = nh(v); if (/^(l|listening|escucha|auditiva|comprension auditiva|parte i|part i|1|i)$/.test(x) || /listen|auditiv|escucha/.test(x)) return 'L'; if (x) return 'R'; return s || au ? 'L' : 'R'; };
  function claveDe(v, o) {
    const s = String(v ?? '').trim(); if (!s) return null;
    let m = s.match(/^\(?([A-Da-d])\)?[\.\):]?$/); if (m) return 'abcd'.indexOf(m[1].toLowerCase());
    m = s.match(/^([1-4])$/); if (m) return +m[1] - 1;
    const i = o.findIndex(x => nh(x) === nh(s)); return i >= 0 ? i : null;
  }
  function filasAItems(filas, ctx) {
    const R = { items: [], sinClave: 0 }; if (!filas || !filas.length) return R;
    let hi = -1, M = null;
    for (let i = 0; i < Math.min(12, filas.length); i++) { const m = mapear(filas[i]); if (m.q != null && (m.o.length >= 2 || (m.k != null && m.dis))) { hi = i; M = m; break; } }
    const pipe = filas.every(r => r.filter(x => String(x).trim()).length <= 1);
    if (hi < 0) {
      if (pipe) return Object.assign(textoAItems(filas.map(r => String(r.find(x => String(x).trim()) || '')), ctx), {});
      // sin encabezado: Pregunta, A, B, C, D, Respuesta
      const ok = filas.filter(r => r.filter(x => String(x).trim()).length >= 6);
      if (ok.length >= Math.max(1, filas.length * .6)) { hi = -1; M = { q: 0, o: [1, 2, 3, 4], k: 5 }; } else return textoAItems(filas.map(r => r.filter(x => String(x).trim()).join(' ')), ctx);
    }
    let pas = '';
    filas.slice(hi + 1).forEach((r, j) => {
      const g = i => i == null ? '' : String(r[i] ?? '').trim();
      let o, k;
      if (M.dis && !M.o.length) { o = [g(M.k)].concat(M.dis.map(g)).filter(Boolean); k = o.length >= 2 ? 0 : null; }
      else { o = M.o.map(g).filter(Boolean); k = claveDe(g(M.k), M.o.map(g)); if (k != null) { const full = M.o.map(g); const sel = full[k]; k = o.indexOf(sel); if (k < 0) k = null; } }
      if (M.pas != null && g(M.pas)) pas = g(M.pas);
      const q = g(M.q), s = g(M.s), au = g(M.au);
      if (!q && !s && !au) return; if (o.length < 2) return;
      if (k == null) { R.sinClave++; return; }
      R.items.push({ q, o, k, s, au, img: g(M.img), sec: secDe(g(M.sec), s, au), e: g(M.e), tipo: g(M.tipo), pas: M.pas != null ? g(M.pas) : '', n: g(M.n) || String(j + 1), mezclar: !!M.dis && !M.o.length });
    });
    return R;
  }
  /* ---------- de texto (Word, PDF, TXT) a preguntas ---------- */
  function textoAItems(lineas, ctx) {
    const R = { items: [], sinClave: 0 }; lineas = lineas.map(l => String(l).replace(/\s+/g, ' ').trim()).filter(Boolean);
    // clave de respuestas al final («Clave», «Answer key», «Respuestas»)
    const KEY = {}; let fin = lineas.length;
    const kh = lineas.findIndex(l => /^(clave(s)?( de respuestas)?|answer key|answers|respuestas|hoja de respuestas|key)\s*:?\s*$/i.test(l) || /^(clave de respuestas|answer key)\b/i.test(l));
    if (kh >= 0) { fin = kh; lineas.slice(kh).join(' ').replace(/(\d{1,3})\s*[\.\-\):=]?\s*\(?([A-Da-d])\)?(?![A-Za-z])/g, (_, n, l) => { KEY[+n] = 'abcd'.indexOf(l.toLowerCase()); return ''; }); }
    let cur = null, libre = [], pas = '', sec = '';
    const QRE = /^(?:(?:pregunta|question|item|reactivo|no\.?)\s*)?(\d{1,3})\s*[\.\)\-:]\s*(.*)$/i, ORE = /^[\(\[]?([A-Da-d])\s*[\)\.\]:\-]\s*(.+)$/;
    const marca = t => /^\*|\*$|\(correct[ao]?\)|✓|✔/i.test(t), limpia = t => t.replace(/^\*\s*|\s*\*$/g, '').replace(/\s*\(correct[ao]?\)\s*/ig, ' ').replace(/[✓✔]/g, '').trim();
    const cerrar = () => {
      if (!cur) return; const c = cur; cur = null;
      if (c.k == null && c.num != null && KEY[c.num] != null) c.k = KEY[c.num];
      if (c.kt != null && c.k == null) { const i = c.o.findIndex(x => nh(x) === nh(c.kt)); if (i >= 0) c.k = i; }
      if (c.o.length < 2) { if (c.q && c.q.length > 120) libre.push(c.q); return; }
      if (c.k == null || c.k >= c.o.length) { R.sinClave++; return; }
      R.items.push({ q: c.q, o: c.o, k: c.k, s: c.s || '', au: c.au || '', img: c.img || '', sec: c.sec || (c.s || c.au ? 'L' : sec || 'R'), e: c.e || '', tipo: c.tipo || '', pas: c.sec === 'L' ? '' : c.pas || '', n: c.num != null ? String(c.num) : '' });
    };
    const nuevo = (num, q) => { cerrar(); const lp = libre.join(' ').trim(); if (lp.length > 120) pas = lp; libre = []; cur = { num, q: q || '', o: [], k: null, sec: sec === 'L' ? 'L' : '', pas }; };
    for (let i = 0; i < fin; i++) {
      const l = lineas[i]; let m;
      if (l.split('|').length >= 6) { cerrar(); const p = l.split('|').map(x => x.trim()); const lis = /^l/.test(p[0]) && p[0] !== 'lec'; R.items.push({ q: p[2], o: p.slice(3).filter(Boolean), k: 0, s: lis ? p[1] : '', au: '', img: '', sec: lis ? 'L' : 'R', e: '', tipo: p[0], pas: '', n: '', mezclar: true }); continue; }
      if (/^P\|/.test(l)) { pas = l.slice(2); continue; }
      if ((m = l.match(/^(?:secci[oó]n|section|parte|part)\s*[:\-]?\s*(.+)$/i))) { cerrar(); sec = /listen|auditiv|escucha|^i\b|^1\b|^one/i.test(m[1]) ? 'L' : 'R'; pas = ''; continue; }
      if ((m = l.match(/^(?:respuesta(?:\s+correcta)?|answer|clave|key|correct(?:a| answer)?)\s*[:\.\-=]\s*(.+)$/i)) && cur) { const v = m[1].trim(), k = claveDe(v.replace(/[\)\.]$/, ''), cur.o); if (k != null) cur.k = k; else cur.kt = v; continue; }
      if ((m = l.match(/^(?:script|gui[oó]n|transcripci[oó]n|transcript|audio script|texto del audio)\s*[:\-]\s*(.+)$/i))) { if (!cur) nuevo(null, ''); cur.s = m[1]; cur.sec = 'L'; continue; }
      if ((m = l.match(/^(?:audio|archivo de audio|mp3)\s*[:\-]\s*(.+\.(?:mp3|m4a|wav|ogg|aac|opus))\s*$/i))) { if (!cur) nuevo(null, ''); cur.au = m[1]; cur.sec = 'L'; continue; }
      if ((m = l.match(/^(?:imagen|image|img|figura)\s*[:\-]\s*(.+\.(?:png|jpe?g|gif|webp|bmp))\s*$/i))) { if (!cur) nuevo(null, ''); cur.img = m[1]; continue; }
      if ((m = l.match(/^(?:explicaci[oó]n|explanation|retro(?:alimentaci[oó]n)?|feedback)\s*[:\-]\s*(.+)$/i)) && cur) { cur.e = m[1]; continue; }
      // opciones en una sola línea: A) uno B) dos C) tres D) cuatro
      const inl = [...l.matchAll(/(?:^|\s)[\(\[]?([A-D])[\)\.\]]\s+/g)];
      if (inl.length >= 2 && inl[0].index === 0 && inl.map(x => x[1]).join('') === 'ABCD'.slice(0, inl.length) && cur) {
        inl.forEach((x, j) => { const a = x.index + x[0].length, b = j + 1 < inl.length ? inl[j + 1].index : l.length; const t = l.slice(a, b).trim(); if (marca(t)) cur.k = cur.o.length; cur.o.push(limpia(t)); }); continue;
      }
      if ((m = l.match(ORE)) && (cur ? cur.o.length === 'abcd'.indexOf(m[1].toLowerCase()) : libre.length && m[1].toLowerCase() === 'a')) {
        if (!cur) { const q = libre.pop(); nuevo(null, q); }
        const t = m[2].trim(); if (marca(t)) cur.k = cur.o.length; cur.o.push(limpia(t)); continue;
      }
      if ((m = l.match(QRE)) && !(cur && cur.o.length === 0 && !cur.q)) { nuevo(+m[1], m[2]); continue; }
      if (cur && !cur.o.length) { cur.q = (cur.q ? cur.q + ' ' : '') + l; continue; }
      if (cur && cur.o.length) cerrar();
      libre.push(l);
    }
    cerrar();
    return R;
  }
  function jsonAItems(d) {
    const arr = Array.isArray(d) ? d : (d && (d.preguntas || d.items || d.questions || d.reactivos || d.banco)) || null; const R = { items: [], sinClave: 0 };
    if (!Array.isArray(arr)) return R;
    arr.forEach(x => {
      if (!x || typeof x !== 'object') return; const o = (x.o || x.opciones || x.options || x.choices || ['a', 'b', 'c', 'd'].map(l => x[l] ?? x[l.toUpperCase()]).filter(v => v != null)).map(String).filter(Boolean);
      const q = String(x.q ?? x.pregunta ?? x.question ?? x.enunciado ?? ''), s = String(x.s ?? x.script ?? x.guion ?? ''), au = String(x.audio ?? x.au ?? '');
      let k = x.k ?? x.correcta ?? x.respuesta ?? x.answer ?? x.key; k = typeof k === 'number' ? (k >= 0 && k < o.length ? k : null) : claveDe(k, o);
      if (o.length < 2) return; if (k == null) { R.sinClave++; return; }
      R.items.push({ q, o, k, s, au, img: String(x.imagen ?? x.img ?? x.image ?? ''), sec: x.sec === 'L' || x.sec === 'R' ? x.sec : secDe(x.seccion ?? x.section ?? '', s, au), e: String(x.e ?? x.explicacion ?? x.explanation ?? ''), tipo: String(x.tipo ?? x.tema ?? x.topic ?? ''), pas: String(x.pas ?? x.pasaje ?? x.passage ?? ''), n: String(x.n ?? x.num ?? '') });
    });
    return R;
  }
  /* ---------- análisis (vista previa; no guarda nada) ---------- */
  async function analizar(files) {
    const A = { archivos: [], items: [], medios: [], recursos: [], respaldos: [], materiales: [] };
    const fuentes = []; // grupos de preguntas por archivo (para ligar medios del ZIP)
    async function uno(nombre, u8, blob, zipDe) {
      const c = clase(nombre), fila = { nombre: (zipDe ? zipDe + ' › ' : '') + nombre, tipo: TIPO_TXT[c], preguntas: 0, L: 0, R: 0, sinClave: 0, medios: 0, recurso: false, nota: '' };
      A.archivos.push(fila);
      const recurso = nota => { fila.recurso = true; fila.nota = nota; A.recursos.push({ nombre, mime: mimeDe(nombre), blob: blob || new Blob([u8], { type: mimeDe(nombre) }), tipo: c, nota, fila, zipDe }); };
      const conItems = (R, nota) => { const g = { zipDe, items: R.items.map(it => Object.assign(it, { archivo: nombre })) , fila }; fuentes.push(g); fila.preguntas = R.items.length; fila.sinClave = R.sinClave; fila.L = R.items.filter(i => i.sec === 'L').length; fila.R = fila.preguntas - fila.L; A.items.push(...g.items); fila.nota = nota || ''; if (R.sinClave) fila.nota += (fila.nota ? ' ' : '') + `${R.sinClave} pregunta(s) sin respuesta correcta identificable: no se importan.`; };
      try {
        if (c === 'zip') { const z = await unzip(u8); fila.nota = `${z.length} archivo(s) dentro.`; fila.contenedor = true; for (const e of z) if (e.data) await uno(e.name.split('/').pop(), e.data, null, nombre); else A.archivos.push({ nombre: nombre + ' › ' + e.name, tipo: 'Archivo', preguntas: 0, nota: 'Compresión no compatible; se omite.' }); return; }
        if (c === 'json') {
          let d; try { d = JSON.parse(txtDe(u8)); } catch (e) { return recurso('JSON no válido: se guarda como recurso.'); }
          if (d && d._app === 'mision-barra-1') { fila.respaldo = true; fila.nota = 'Respaldo de la app: se restaura con el procedimiento de siempre (combina datos).'; A.respaldos.push(new File([u8], nombre, { type: 'application/json' })); return; }
          if (d && d.tipo === 'banco_alcpt_alc') { fila.material = true; fila.nota = 'Material de práctica de la Mesa: se carga como siempre (reemplaza al material anterior).'; A.materiales.push(new File([u8], nombre, { type: 'application/json' })); return; }
          const R = jsonAItems(d); if (R.items.length || R.sinClave) return conItems(R); return recurso('JSON sin preguntas reconocibles: se guarda como recurso.');
        }
        if (c === 'tabla') { const T = tablas(u8, nombre), R = { items: [], sinClave: 0 }; T.forEach(t => { const r = filasAItems(t.filas, {}); R.items.push(...r.items); R.sinClave += r.sinClave; }); if (R.items.length || R.sinClave) return conItems(R, T.length > 1 ? `${T.length} hojas.` : ''); return recurso('No se encontraron columnas de pregunta, opciones y respuesta: se guarda como recurso.'); }
        if (c === 'word') { const d = await docx(u8), R = textoAItems(d.lineas, {}); d.tbls.forEach(t => { const r = filasAItems(t, {}); R.items.push(...r.items); R.sinClave += r.sinClave; }); if (R.items.length || R.sinClave) return conItems(R); return recurso('No se encontraron preguntas con opciones y respuesta: el Word se guarda como recurso.'); }
        if (c === 'pdf') { const d = await pdfLineas(u8), chars = d.lineas.join('').replace(/\s/g, '').length; if (chars < 30) return recurso(`PDF escaneado o sin texto (${d.paginas} pág.): no se pueden extraer preguntas; se guarda como recurso.`); const R = textoAItems(d.lineas, {}); if (R.items.length || R.sinClave) return conItems(R, `${d.paginas} pág. con texto.`); return recurso(`PDF con texto (${d.paginas} pág.) pero sin preguntas con opciones y respuesta: se guarda como recurso.`); }
        if (c === 'texto') { const R = textoAItems(txtDe(u8).split(/\r?\n/), {}); if (R.items.length || R.sinClave) return conItems(R); return recurso('Texto sin preguntas reconocibles: se guarda como recurso.'); }
        if (c === 'audio' || c === 'imagen' || c === 'video') { fila.pendiente = { nombre, u8, blob, c, zipDe }; return; }
        if (c === 'doc') return recurso('Formato antiguo (.doc/.rtf/.odt): se guarda como recurso. Para extraer preguntas, guárdalo como .docx.');
        return recurso('Formato sin lector de preguntas: se guarda como recurso.');
      } catch (e) { fila.error = true; fila.nota = 'No se pudo leer: ' + (e && e.message || e); }
    }
    for (const f of files) await uno(f.name, new Uint8Array(await f.arrayBuffer()), f, null);
    // ligar audios / imágenes / videos a preguntas (mismo ZIP o misma selección) por nombre de archivo o por número
    const pend = A.archivos.filter(f => f.pendiente);
    pend.forEach(f => {
      const p = f.pendiente, b = base(p.nombre), grupos = fuentes.filter(g => g.zipDe === p.zipDe); let lig = [];
      grupos.forEach(g => g.items.forEach(it => { const ref = p.c === 'audio' ? it.au : p.c === 'imagen' ? it.img : (it.vid || ''); if (ref && base(ref) === b) lig.push(it); }));
      if (!lig.length && grupos.length === 1) { const m = b.match(/^(?:q|p|item|pregunta|question|reactivo|audio|img|imagen)?[\s_\-]*0*(\d{1,3})$/); if (m) grupos[0].items.forEach(it => { if (it.n && +it.n === +m[1] && !(p.c === 'audio' ? it.mp3k : it.imgk)) lig.push(it); }); }
      if (lig.length) {
        const key = 'med:' + hash(p.nombre + '|' + p.u8.length + '|' + (p.zipDe || '')); A.medios.push({ key, nombre: p.nombre, mime: mimeDe(p.nombre), blob: p.blob || new Blob([p.u8], { type: mimeDe(p.nombre) }), tipo: p.c });
        lig.forEach(it => { if (p.c === 'audio') { it.mp3k = key; it.sec = 'L'; } else if (p.c === 'imagen') it.imgk = key; else it.vidk = key; });
        f.medios = lig.length; f.nota = `Ligado a ${lig.length} pregunta(s).`; delete f.pendiente;
      } else {
        delete f.pendiente; f.recurso = true; f.nota = p.c === 'imagen' ? 'Imagen: no se extraen preguntas de imágenes (sin reconocimiento de texto); se guarda como recurso.' : p.c === 'audio' ? 'Audio sin pregunta que lo nombre: se guarda como recurso para escuchar.' : 'Video: se guarda como recurso para ver.';
        A.recursos.push({ nombre: p.nombre, mime: mimeDe(p.nombre), blob: p.blob || new Blob([p.u8], { type: mimeDe(p.nombre) }), tipo: p.c, nota: f.nota, zipDe: p.zipDe });
      }
    });
    // re-cuenta L/R por archivo después de ligar audios
    fuentes.forEach(g => { g.fila.L = g.items.filter(i => i.sec === 'L').length; g.fila.R = g.items.length - g.fila.L; });
    // preguntas de listening sin audio ni guion: no se pueden presentar
    const sinAud = A.items.filter(i => i.sec === 'L' && !i.s && !i.mp3k); if (sinAud.length) A.avisoL = `${sinAud.length} pregunta(s) de comprensión auditiva no traen audio ni guion: se importan, pero sin «Escuchar».`;
    return A;
  }
  function aItem(it) {
    let o = it.o.slice(), k = it.k;
    if (it.mezclar) { const c = o[k], ord = o.map((x, i) => i).sort((a, b) => hash(it.q + a).localeCompare(hash(it.q + b))); o = ord.map(i => it.o[i]); k = o.indexOf(c); }
    const id = 'IMP-' + hash((it.s || '') + '|' + it.q + '|' + it.o.join('|'));
    const r = { id, sec: it.sec, q: it.q || (it.sec === 'L' && !it.q ? 'Choose the best response.' : ''), o, k, s: it.s || '', e: it.e || '', tipo: it.tipo || (it.sec === 'L' ? 'Comprensión auditiva' : 'Lectura y estructura'), origen: 'imp', archivo: it.archivo };
    if (it.pas) r.pas = it.pas; if (it.mp3k) r.mp3 = 'idb:' + it.mp3k; if (it.imgk) r.img = 'idb:' + it.imgk; if (it.vidk) r.vid = 'idb:' + it.vidk;
    return r;
  }
  /* ---------- guardar ---------- */
  async function guardar(A, destino) {
    const imp = (await get('imp')) || { alcpt: [], alc: [] }, ya = new Set(imp.alcpt.concat(imp.alc).map(x => x.id)); let nuevas = 0, dup = 0;
    A.items.map(aItem).forEach(it => { if (ya.has(it.id)) { dup++; return; } ya.add(it.id); imp[destino].push(it); nuevas++; });
    for (const m of A.medios) await put(m.key, { nombre: m.nombre, mime: m.mime, blob: m.blob, tipo: m.tipo, uso: 'pregunta' });
    const idx = (await get('recursos')) || [];
    for (const r of A.recursos) { const id = 'rec:' + hash(r.nombre + '|' + r.blob.size + '|' + (r.zipDe || '')); if (idx.some(x => x.id === id)) continue; await put(id, { nombre: r.nombre, mime: r.mime, blob: r.blob, tipo: r.tipo }); idx.push({ id, nombre: r.nombre, mime: r.mime, tipo: r.tipo, nota: r.nota, tam: r.blob.size, fecha: new Date().toISOString(), zip: r.zipDe || '' }); }
    imp.fecha = new Date().toISOString(); await put('imp', imp); await put('recursos', idx);
    return { nuevas, dup, medios: A.medios.length, recursos: A.recursos.length };
  }
  async function resumen() { const imp = (await get('imp').catch(() => null)) || { alcpt: [], alc: [] }, rec = (await get('recursos').catch(() => null)) || []; return { alcpt: imp.alcpt.length, alc: imp.alc.length, recursos: rec, fecha: imp.fecha || '' }; }
  const URLS = {};
  async function url(ref) { const k = String(ref || '').replace(/^idb:/, ''); if (!k) return ''; if (URLS[k]) return URLS[k]; const r = await get(k).catch(() => null); if (!r || !r.blob) return ''; return (URLS[k] = URL.createObjectURL(r.blob)); }
  async function abrir(id) { const u = await url(id); if (!u) return toast('No se encontró el archivo en este dispositivo.'); const r = await get(id), w = document.createElement('div'); w.id = 'impver';
    const t = r.tipo === 'imagen' ? `<img src="${u}" alt="${esc(r.nombre)}" style="max-width:100%">` : r.tipo === 'audio' ? `<audio controls autoplay src="${u}" style="width:100%"></audio>` : r.tipo === 'video' ? `<video controls src="${u}" style="max-width:100%;max-height:70vh"></video>` : /pdf/.test(r.mime) ? `<iframe src="${u}" style="width:100%;height:70vh;border:0"></iframe>` : `<p class="mini">Este tipo de archivo se abre con su programa.</p>`;
    w.innerHTML = `<div class="card impbox"><div class="row sp"><b>${esc(r.nombre)}</b><button class="btn sm ghost" id="impcerrar">Cerrar</button></div>${t}<p><a class="btn sm ghost" href="${u}" download="${esc(r.nombre)}">Descargar</a></p></div>`;
    document.body.appendChild(w); w.querySelector('#impcerrar').onclick = () => w.remove(); w.onclick = e => { if (e.target === w) w.remove(); }; }
  async function borrarRec(id) { if (!esAdm()) return; if (!confirm('¿Quitar este recurso de este dispositivo?')) return; const idx = ((await get('recursos')) || []).filter(x => x.id !== id); await del(id); await put('recursos', idx); pintar(); }
  async function borrarPreg() { if (!esAdm()) return; if (!confirm('¿Quitar de este dispositivo todas las preguntas importadas (y sus audios e imágenes)? El material de la Mesa y los recursos se conservan.')) return; const imp = (await get('imp')) || { alcpt: [], alc: [] }; const ks = new Set(); imp.alcpt.concat(imp.alc).forEach(i => ['mp3', 'img', 'vid'].forEach(f => { if (i[f]) ks.add(i[f].replace(/^idb:/, '')); })); for (const k of ks) await del(k); await del('imp'); recargarModulos(); pintar(); toast('Preguntas importadas quitadas.'); }
  const esAdm = () => { try { return typeof esAdmin === 'function' ? esAdmin() && !(typeof soloLectura === 'function' && soloLectura()) : false; } catch (e) { return false; } };
  function recargarModulos() { ['ALCMOD', 'ALCPTMOD'].forEach(k => { try { window[k] && window[k].recargar && window[k].recargar(); } catch (e) { } }); }
  /* ---------- interfaz ---------- */
  const ACEPTA = '.zip,.xlsx,.xls,.xlsm,.xlsb,.ods,.csv,.tsv,.pdf,.docx,.docm,.doc,.rtf,.odt,.json,.txt,.md,.mp3,.m4a,.wav,.ogg,.aac,.opus,.flac,.mp4,.m4v,.webm,.mov,.png,.jpg,.jpeg,.gif,.webp,.bmp,.svg,.heic,audio/*,video/*,image/*';
  function card() {
    return `<section class="card" id="impcard"><h3>Bancos de preguntas, respaldos y archivos</h3><p class="mini">Carga uno o varios archivos: ZIP, Excel (xlsx/xls/csv), Word (.docx), PDF, JSON, TXT, imágenes, audio (MP3…) y video (MP4…). Todo se procesa y se guarda <b>solo en este dispositivo</b>; nada se sube a internet. Antes de guardar verás una vista previa con el conteo.</p>
    <p class="mini">De Excel/CSV, Word, JSON, TXT y PDF con texto se extraen las preguntas (pregunta, opciones A–D y respuesta correcta). Dentro de un ZIP, los audios e imágenes se ligan a la pregunta cuyo nombre de archivo coincide. Las imágenes, los PDF escaneados, los videos y los audios sueltos se guardan como <b>recursos</b>: no se inventan preguntas. Los respaldos de la app (.json) se restauran como siempre.</p>
    <div class="row"><label class="btn">Elegir archivos<input type="file" id="impfile" hidden multiple accept="${ACEPTA}" onchange="IMPORTA.elegir(this)"></label><button class="btn ghost" type="button" onclick="IMPORTA.plantilla()">Descargar plantilla (CSV)</button></div>
    <div id="impest" class="mini">Cargando estado…</div></section>`;
  }
  async function pintar() {
    const el = document.getElementById('impest'); if (!el) return; const r = await resumen(), adm = esAdm();
    el.innerHTML = `<p>Preguntas importadas en este dispositivo: <b>${r.alcpt}</b> en ALCPT · <b>${r.alc}</b> en ALC${r.alcpt + r.alc && adm ? ` <button class="btn sm ghost" type="button" id="impborrar">Quitar preguntas importadas</button>` : ''}</p>
    <p>Recursos guardados: <b>${r.recursos.length}</b></p>${r.recursos.length ? `<div class="tw"><table><tr><th>Archivo</th><th>Tipo</th><th>Nota</th><th></th></tr>${r.recursos.map(x => `<tr><td>${esc(x.nombre)}${x.zip ? `<br><span class="mini">${esc(x.zip)}</span>` : ''}</td><td>${esc(TIPO_TXT[x.tipo] || x.tipo)}</td><td class="mini">${esc(x.nota)}</td><td><button class="btn sm ghost" type="button" data-ver="${x.id}">Ver</button>${adm ? `<button class="btn sm ghost" type="button" data-del="${x.id}">Quitar</button>` : ''}</td></tr>`).join('')}</table></div>` : ''}`;
    const b = el.querySelector('#impborrar'); if (b) b.onclick = borrarPreg;
    el.querySelectorAll('[data-ver]').forEach(x => x.onclick = () => abrir(x.dataset.ver)); el.querySelectorAll('[data-del]').forEach(x => x.onclick = () => borrarRec(x.dataset.del));
  }
  async function recursosCadete(el) {
    if (!el) return; const r = await resumen(); if (!r.recursos.length) { el.innerHTML = ''; return; }
    el.innerHTML = `<div class="card"><h2>Recursos de la Mesa en este dispositivo</h2><p class="muted">Audios, imágenes, videos y documentos para practicar.</p><div class="row">${r.recursos.map(x => `<button class="btn ghost" type="button" data-ver="${x.id}">${{ audio: '🔊', video: '🎬', imagen: '🖼', pdf: '📄' }[x.tipo] || '📎'} ${esc(x.nombre)}</button>`).join('')}</div></div>`;
    el.querySelectorAll('[data-ver]').forEach(x => x.onclick = () => abrir(x.dataset.ver));
  }
  let A = null;
  async function elegir(inp) {
    if (!esAdm()) { toast('Solo Administración puede cargar bancos y archivos.'); if (inp) inp.value = ''; return; }
    const files = Array.from((inp && inp.files) || []); if (inp) inp.value = ''; if (!files.length) return;
    const w = modal(`<p>Analizando ${files.length} archivo(s) en este dispositivo…</p>`);
    try { A = await analizar(files); } catch (e) { w.querySelector('.impcuerpo').innerHTML = `<p class="badt">No se pudo analizar: ${esc(e.message || e)}</p>`; return; }
    vistaPrevia(w);
    return A;
  }
  function modal(html) { let w = document.getElementById('impprev'); if (w) w.remove(); w = document.createElement('div'); w.id = 'impprev'; w.innerHTML = `<div class="card impbox"><div class="row sp"><h3>Vista previa de la importación</h3><button class="btn sm ghost" type="button" id="impx">Cerrar</button></div><div class="impcuerpo">${html}</div></div>`; document.body.appendChild(w); w.querySelector('#impx').onclick = () => { A = null; w.remove(); }; return w; }
  function vistaPrevia(w) {
    const n = A.items.length, L = A.items.filter(i => i.sec === 'L').length, sk = A.archivos.reduce((s, f) => s + (f.sinClave || 0), 0);
    const ej = A.items.slice(0, 3).map(i => `<li>${i.s ? `<span class="mini">🔊 ${esc(i.s.slice(0, 90))}</span><br>` : ''}${i.mp3k ? '<span class="mini">🔊 audio ligado</span><br>' : ''}<b>${esc(i.q || '(elige la mejor respuesta)')}</b><br>${i.o.map((o, j) => `<span class="${j === i.k ? 'okt' : ''}">${'ABCD'[j] || j + 1}) ${esc(o)}${j === i.k ? ' ✔' : ''}</span>`).join(' · ')}</li>`).join('');
    w.querySelector('.impcuerpo').innerHTML = `<div class="kpis impk"><div><b id="impn">${n}</b><span>preguntas</span></div><div><b>${L}</b><span>auditivas (L)</span></div><div><b>${n - L}</b><span>lectura y estructura (R)</span></div><div><b>${A.medios.length}</b><span>audios/imágenes ligados</span></div><div><b id="imprec">${A.recursos.length}</b><span>recursos</span></div></div>
    ${sk ? `<p class="aviso mini">${sk} pregunta(s) no traen respuesta correcta identificable y no se importan (no se inventan respuestas).</p>` : ''}${A.avisoL ? `<p class="mini">${esc(A.avisoL)}</p>` : ''}
    ${A.respaldos.length ? `<p class="mini"><b>${A.respaldos.length} respaldo(s) de la app</b>: se restaurarán con el procedimiento de siempre (te pedirá confirmar).</p>` : ''}${A.materiales.length ? `<p class="mini"><b>Material de práctica de la Mesa</b>: se cargará como siempre.</p>` : ''}
    <div class="tw"><table id="imptab"><tr><th>Archivo</th><th>Tipo</th><th>Preguntas</th><th>Resultado</th></tr>${A.archivos.map(f => `<tr><td>${esc(f.nombre)}</td><td>${esc(f.tipo)}</td><td>${f.contenedor ? '—' : f.preguntas || 0}${f.preguntas ? ` <span class="mini">(L ${f.L} · R ${f.R})</span>` : ''}</td><td class="mini ${f.error ? 'badt' : ''}">${f.respaldo ? 'Respaldo · ' : f.material ? 'Material · ' : f.recurso ? 'Recurso · ' : f.medios ? 'Medio ligado · ' : ''}${esc(f.nota || (f.preguntas ? 'Preguntas listas.' : ''))}</td></tr>`).join('')}</table></div>
    ${n ? `<h3>Ejemplos</h3><ol class="mini">${ej}</ol><label class="f">Agregar las preguntas a</label><select id="impdest"><option value="alcpt">ALCPT (práctica y simulacro ALCPT)</option><option value="alc">ALC (práctica y simulacro ALC)</option></select>` : ''}
    <div class="row"><button class="btn" type="button" id="impok" ${n || A.recursos.length || A.respaldos.length || A.materiales.length ? '' : 'disabled'}>Importar</button><button class="btn ghost" type="button" id="impno">Cancelar</button></div>`;
    w.querySelector('#impno').onclick = () => { A = null; w.remove(); };
    w.querySelector('#impok').onclick = async () => {
      const d = (w.querySelector('#impdest') || {}).value || 'alcpt', B = A; A = null; w.querySelector('#impok').disabled = true;
      try {
        const r = await guardar(B, d);
        for (const f of B.materiales) { try { await window.ALCMOD.importarMaterial(f); } catch (e) { } }
        for (const f of B.respaldos) { try { window.restaurar && window.restaurar({ files: [f], value: '' }); } catch (e) { } }
        recargarModulos(); w.remove();
        toast(`Importado: ${r.nuevas} pregunta(s)${r.dup ? ` (${r.dup} repetida(s) omitida(s))` : ''}, ${r.medios} medio(s) ligado(s), ${r.recursos} recurso(s).`);
        ULT = r; pintar(); try { window.render && window.render(); } catch (e) { }
      } catch (e) { toast('No se pudo guardar en el dispositivo: ' + (e.message || e)); }
    };
  }
  let ULT = null;
  function plantilla() { const t = 'Numero,Seccion,Pregunta,A,B,C,D,Respuesta,Audio,Guion,Imagen,Explicacion,Tema\n1,Listening,Where is the man going?,To the clinic,To the gate,To the gym,To the store,A,1.mp3,"M: I\'m going to the clinic now.",,,Comprensión\n2,Reading,She ___ to work every day.,go,goes,going,gone,B,,,,Third person singular,Gramática\n'; const b = new Blob(['\uFEFF' + t], { type: 'text/csv' }), a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'Plantilla_banco_preguntas.csv'; document.body.appendChild(a); a.click(); a.remove(); }
  async function preguntas() { return (await get('imp').catch(() => null)) || null; }
  window.IMPORTA = { card, pintar, elegir, analizar, guardar, resumen, url, abrir, preguntas, recursosCadete, plantilla, ultimo: () => ULT, _texto: textoAItems, _filas: filasAItems };
})();
