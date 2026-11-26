/* Misión: Obtener la Barra I · v2.15 · Calificaciones oficiales y Programa Sombra
   Administración: carga Excel/CSV, PDF, Word (.docx), imagen o paquete JSON con detección de tipo/fecha ("TIPO MES AÑO"),
   mapeo de columnas, enlace al padrón y revisión; filtros (año, grupo, cadete, tipo, etiqueta, fechas, rango, Programa Sombra);
   seguimiento del Programa Sombra entre exámenes y exportación a Excel (Noto Sans 10).
   Cadete: solo consulta (historial, gráfica de progreso y comparación con su meta).
   Directora: solo consulta de todo. */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const g = (f, d) => { try { return f(); } catch (e) { return d; } };
  const toast = m => { if (typeof window.toast === 'function') window.toast(m); };
  const TIPOS = ['ALCPT', 'ALC', 'Diagnóstico', 'Parcial', 'Final', 'Simulacro', 'Otro'];
  const MESES_3 = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];
  const MESES_ES = { ENERO: 1, ENE: 1, FEBRERO: 2, FEB: 2, MARZO: 3, MAR: 3, ABRIL: 4, ABR: 4, MAYO: 5, MAY: 5, JUNIO: 6, JUN: 6, JULIO: 7, JUL: 7, AGOSTO: 8, AGO: 8, SEPTIEMBRE: 9, SETIEMBRE: 9, SEP: 9, SEPT: 9, OCTUBRE: 10, OCT: 10, NOVIEMBRE: 11, NOV: 11, DICIEMBRE: 12, DIC: 12 };
  const CAMPOS = [['', '— Ignorar —'], ['m', 'Matrícula'], ['n', 'Nombre completo'], ['cal', 'Calificación / puntaje'], ['eval', 'Examen / evaluación'], ['tipo', 'Tipo (ALCPT / ALC / Parcial)'], ['fecha', 'Fecha'], ['a', 'Año'], ['gp', 'Grupo pedagógico'], ['gi', 'Grupo de inglés'], ['obs', 'Observaciones']];
  const REG_COL = {
    m: /matr[ií]c|folio\s*cad|clave\s*cad|^mat$/i,
    n: /nombre|discent|cadete|alumn|evaluad/i,
    cal: /^calif\.?$|^examen$|puntaj|nota\b|score|alcpt|pts\b|resultado|promedio/i,
    eval: /evaluaci[oó]n|prueba|forma\b|libro|concepto/i,
    tipo: /^tipo|modalidad/i,
    fecha: /fecha|date|aplicaci/i,
    a: /^a[ñn]o$|grado/i,
    gp: /grupo\s*ped|^grupo$|^gp$/i,
    gi: /grupo\s*ing|^gi$/i,
    obs: /obs|coment/i
  };

  let CF = { anio: '', gp: '', txt: '', tipo: '', etiqueta: '', desde: '', hasta: '', rango: '', min: '', max: '', sombra: false };
  let IMP = null;
  let EDIT = null;
  let VERADJ = null;
  let SYNC_CAD = { m: '', cargando: false, err: '', tried: false };

  const store = () => {
    S.calif = Array.isArray(S.calif) ? S.calif : [];
    S.califAdj = Array.isArray(S.califAdj) ? S.califAdj : [];
    S.califCad = S.califCad && typeof S.califCad === 'object' ? S.califCad : {};
    S.califSombra = S.califSombra && typeof S.califSombra === 'object' ? S.califSombra : {};
    return S;
  };
  const soloVer = () => g(() => soloLectura(), false);
  const sinAc = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9Ñ ]/g, ' ').replace(/\s+/g, ' ').trim();
  const normMat0 = v => { const x = String(v || '').toUpperCase().replace(/\s+/g, '').replace(/[^A-Z0-9-]/g, ''); const m = x.match(/^([A-Z])-?(\d{6,9})$/); return m ? m[1] + '-' + m[2] : x; };
  const limpiaNom = n => String(n || '').replace(/\u00a0/g, ' ').replace(/\s*\([^)]*\)\s*/g, ' ').replace(/\s+/g, ' ').replace(/[. ]+$/, '').trim();
  const fechaHoy = () => g(() => hoy(), new Date().toISOString().slice(0, 10));
  const sombraKey = (m, n) => normMat0(m) || sinAc(n);

  const normFecha = v => {
    if (!v) return '';
    if (v instanceof Date && !isNaN(v)) return v.toISOString().slice(0, 10);
    const s = String(v).trim();
    let m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    const u = sinAc(s);
    // Ej. "SEPTIEMBRE 21 2026" o "21 DE SEPTIEMBRE DE 2026" o "NOV 2026"
    m = u.match(/\b(ENERO|ENE|FEBRERO|FEB|MARZO|MAR|ABRIL|ABR|MAYO|MAY|JUNIO|JUN|JULIO|JUL|AGOSTO|AGO|SEPTIEMBRE|SETIEMBRE|SEP|SEPT|OCTUBRE|OCT|NOVIEMBRE|NOV|DICIEMBRE|DIC)\s+(?:DE\s+)?(\d{1,2})?\s*(?:DE\s+)?(20\d{2})\b/);
    if (m && MESES_ES[m[1]]) return `${m[3]}-${String(MESES_ES[m[1]]).padStart(2, '0')}-${String(m[2] || '01').padStart(2, '0')}`;
    m = u.match(/\b(\d{1,2})\s+(?:DE\s+)?(ENERO|ENE|FEBRERO|FEB|MARZO|MAR|ABRIL|ABR|MAYO|MAY|JUNIO|JUN|JULIO|JUL|AGOSTO|AGO|SEPTIEMBRE|SETIEMBRE|SEP|SEPT|OCTUBRE|OCT|NOVIEMBRE|NOV|DICIEMBRE|DIC)\s+(?:DE\s+)?(20\d{2})\b/);
    if (m && MESES_ES[m[2]]) return `${m[3]}-${String(MESES_ES[m[2]]).padStart(2, '0')}-${String(m[1]).padStart(2, '0')}`;
    return '';
  };

  const buildEtiqueta = (tipo, fecha) => {
    const t = sinAc(tipo || 'OTRO') || 'OTRO';
    const f = normFecha(fecha);
    if (!f) return t;
    const [y, mm] = f.split('-');
    const mes = MESES_3[(parseInt(mm, 10) || 1) - 1] || 'MES';
    return `${t} ${mes} ${y}`.trim();
  };

  const normNum = v => { const s = String(v ?? '').replace(',', '.').match(/\d+(?:\.\d+)?/); if (!s) return NaN; const n = parseFloat(s[0]); return n >= 0 && n <= 100 ? Math.round(n * 10) / 10 : NaN; };
  const normTipo = v => {
    const s = sinAc(v);
    if (!s) return '';
    if (/ALCPT/.test(s)) return 'ALCPT';
    if (/\bALC\b|LIBRO|BOOK/.test(s)) return 'ALC';
    if (/DIAGN/.test(s)) return 'Diagnóstico';
    if (/PARCIAL/.test(s)) return 'Parcial';
    if (/SIMUL/.test(s)) return 'Simulacro';
    if (/FINAL/.test(s)) return 'Final';
    return 'Otro';
  };
  const uid = () => 'CAL-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();

  /* ---------- IndexedDB para archivos adjuntos (offline) ---------- */
  function openDB() {
    return new Promise((res, rej) => {
      if (!window.indexedDB) return rej(new Error('no-idb'));
      const req = indexedDB.open('mb1_calif_db', 1);
      req.onupgradeneeded = () => { const db = req.result; if (!db.objectStoreNames.contains('adj')) db.createObjectStore('adj', { keyPath: 'id' }); };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }
  async function saveAdj(rec) { try { const db = await openDB(); return await new Promise((res, rej) => { const tx = db.transaction('adj', 'readwrite'); tx.objectStore('adj').put(rec); tx.oncomplete = () => res(true); tx.onerror = () => rej(tx.error); }); } catch (e) { return false; } }
  async function getAdj(id) { try { const db = await openDB(); return await new Promise((res, rej) => { const tx = db.transaction('adj', 'readonly'); const rq = tx.objectStore('adj').get(id); rq.onsuccess = () => res(rq.result || null); rq.onerror = () => rej(rq.error); }); } catch (e) { return null; } }
  async function delAdj(id) { try { const db = await openDB(); return await new Promise((res) => { const tx = db.transaction('adj', 'readwrite'); tx.objectStore('adj').delete(id); tx.oncomplete = () => res(true); tx.onerror = () => res(false); }); } catch (e) { return false; } }

  /* ---------- Enlace con el padrón (matrícula, nombre exacto, prefijo o similitud) ---------- */
  function listaPadron() {
    const L = g(() => padronTodo(), []).slice();
    const seen = new Set(L.map(x => normMat0(x.m)));
    Object.values(g(() => S.perfiles, {}) || {}).forEach(p => {
      if (p && p.perfil === 'cadete' && !p.piloto && !p.vistaSolo && p.m && !seen.has(normMat0(p.m))) {
        seen.add(normMat0(p.m)); L.push({ n: p.nombre, m: normMat0(p.m), a: p.anio, gp: p.gp, gi: p.gi });
      }
    });
    return L;
  }
  function lev(a, b) {
    if (a === b) return 0;
    const m = a.length, n = b.length;
    if (Math.abs(m - n) > 3) return 99;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] : 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]);
      }
      prev = cur;
    }
    return prev[n];
  }
  function enlazarCadete(rawMat, rawNom, hintAnio, hintGp) {
    const L = listaPadron();
    const m = normMat0(rawMat);
    if (m && /^[A-Z]-\d{6,9}$/.test(m)) {
      const hit = L.find(c => normMat0(c.m) === m);
      if (hit) return { m: hit.m, n: hit.n, a: hit.a || '', gp: hit.gp || '', gi: hit.gi || '', via: 'matrícula' };
      return { m, n: limpiaNom(rawNom), a: hintAnio || '', gp: hintGp || '', gi: '', via: rawNom ? 'matrícula' : 'sin_padron' };
    }
    const nl = limpiaNom(rawNom), k1 = sinAc(nl), tk = k1.split(' ').filter(w => w.length > 1);
    if (tk.length >= 2 && L.length) {
      const k2 = tk.slice().sort().join(' ');
      let pool = L;
      if (hintGp) { const p1 = pool.filter(c => sinAc(c.gp) === sinAc(hintGp)); if (p1.length) pool = p1; }
      else if (hintAnio) { const p1 = pool.filter(c => String(c.a) === String(hintAnio)); if (p1.length) pool = p1; }
      const buscar = arr => {
        let hit = arr.find(c => sinAc(c.n) === k1);
        if (hit) return hit;
        const mult = arr.filter(c => sinAc(c.n).split(' ').filter(w => w.length > 1).sort().join(' ') === k2);
        if (mult.length === 1) return mult[0];
        if (k1.length >= 15) {
          const pref = arr.filter(c => sinAc(c.n).startsWith(k1));
          if (pref.length === 1) return pref[0];
        }
        if (tk.length >= 3) {
          const sub = arr.filter(c => { const cw = sinAc(c.n).split(' '); return tk.every(w => cw.includes(w)); });
          if (sub.length === 1) return sub[0];
        }
        // Tolerancia 1-2 letras (ej. Marisas/Marisa, Montserrat/Monserrat, Vásquez/Vázquez)
        const cerca = arr.filter(c => lev(sinAc(c.n), k1) <= 2);
        if (cerca.length === 1) return cerca[0];
        return null;
      };
      const hit = buscar(pool) || (pool !== L ? buscar(L) : null);
      if (hit) return { m: hit.m, n: hit.n, a: hit.a || '', gp: hit.gp || '', gi: hit.gi || '', via: 'nombre' };
    }
    return { m: m || '', n: nl, a: hintAnio || '', gp: hintGp || '', gi: '', via: 'sin_padron' };
  }

  /* ---------- Sincronización con la Hoja (v4) ---------- */
  function pushCalifHoja(items) {
    if (REAL || SRV || !SHEET || !(HV.v >= 4)) return;
    const k = localStorage.getItem('mb1_hk') || '';
    if (!k) return;
    fetch(SHEET, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ tipoRegistro: 'calif_lote', clave: k, datos: { items: items.map(r => ({ id: r.id, m: r.m, n: r.n, a: r.a, gp: r.gp, gi: r.gi, tipo: r.tipo, eval: r.eval, etiqueta: r.etiqueta || buildEtiqueta(r.tipo, r.fecha), fecha: r.fecha, cal: r.cal, archivo: r.archivo || '', obs: r.obs || '', ts: r.ts || Date.now() })) } }) }).catch(() => { });
  }
  function pushBorrarHoja(id) {
    if (REAL || SRV || !SHEET || !(HV.v >= 4)) return;
    const k = localStorage.getItem('mb1_hk') || '';
    if (!k) return;
    fetch(SHEET, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ tipoRegistro: 'calif_borrar', clave: k, datos: { id } }) }).catch(() => { });
  }
  function pushSombrasHoja(items) {
    if (REAL || SRV || !SHEET || !(HV.v >= 4)) return;
    const k = localStorage.getItem('mb1_hk') || '';
    if (!k) return;
    fetch(SHEET, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ tipoRegistro: 'sombra_lote', clave: k, datos: { items } }) }).catch(() => { });
  }
  function fusionarDesdeHoja(rows) {
    if (!Array.isArray(rows)) return 0;
    store();
    const idx = Object.fromEntries(S.calif.map((x, i) => [x.id, i]));
    let n = 0;
    rows.forEach(r => {
      if (!r || !r.id || r.cal === '' || r.cal == null) return;
      const tipo = normTipo(r.tipo) || 'Otro';
      const fecha = normFecha(r.fecha) || '';
      const o = { id: String(r.id), m: normMat0(r.m), n: String(r.n || r.nombre || '').trim(), a: parseInt(r.a || r.anio) || '', gp: String(r.gp || '').trim(), gi: String(r.gi || '').trim(), tipo, eval: String(r.eval || '').trim(), etiqueta: String(r.etiqueta || r.eval || buildEtiqueta(tipo, fecha)).trim(), fecha, cal: Number(r.cal), archivo: String(r.archivo || '').trim(), obs: String(r.obs || '').trim(), ts: Number(r.ts) || 0 };
      if (isNaN(o.cal)) return;
      const i = idx[o.id];
      if (i == null) { S.calif.push(o); idx[o.id] = S.calif.length - 1; n++; }
      else if ((o.ts || 0) > (S.calif[i].ts || 0)) { S.calif[i] = Object.assign({}, S.calif[i], o); n++; }
    });
    return n;
  }
  function fusionarSombrasDesdeHoja(rows) {
    if (!Array.isArray(rows)) return 0;
    store(); let n = 0;
    rows.forEach(r => {
      const k = sombraKey(r.m, r.n); if (!k) return;
      if (r.activo) { S.califSombra[k] = { key: k, m: normMat0(r.m), n: String(r.n || '').trim(), pareja: String(r.pareja || ''), nota: String(r.nota || ''), activo: true, ts: Number(r.ts) || Date.now(), rol: String(r.rol || ''), seniorMat: String(r.seniorMat || r.SeniorMat || ''), seniorNom: String(r.seniorNom || ''), a: r.a || r.anio || '', gp: String(r.gp || r.Grupo || ''), calBase: r.calBase != null ? Number(r.calBase) : (r.CalifBase != null ? Number(r.CalifBase) : undefined), etiquetaBase: String(r.etiquetaBase || r.EtiquetaBase || '') }; n++; }
      else if (S.califSombra[k] && (Number(r.ts) || 0) > (S.califSombra[k].ts || 0)) delete S.califSombra[k];
    });
    return n;
  }

  /* ---------- Parsers de archivos (Excel/CSV, Word .docx, PDF, Imagen, JSON) ---------- */
  function detectarCabecera(rows) {
    let bestRow = 0, bestScore = -1, bestMap = {};
    const lim = Math.min(30, rows.length);
    for (let i = 0; i < lim; i++) {
      const r = rows[i] || [], map = {}, hits = new Set();
      r.forEach((cell, j) => {
        const t = String(cell ?? '').replace(/\s+/g, ' ').trim();
        if (!t || t.length > 45 || /INTERVALO|CLASIF/i.test(t)) return;
        for (const [k, re] of Object.entries(REG_COL)) {
          if (map[k] == null && re.test(t)) { map[k] = j; hits.add(k); break; }
        }
      });
      // fallback si viene "CALIFICACIONES" sin columna EXAMEN/CALIF
      if (map.cal == null) {
        r.forEach((cell, j) => {
          const t = String(cell ?? '').replace(/\s+/g, ' ').trim();
          if (/calif/i.test(t) && !/intervalo/i.test(t) && map.cal == null) { map.cal = j; hits.add('cal'); }
        });
      }
      const sc = hits.size + (map.cal != null ? 2 : 0) + (map.m != null || map.n != null ? 2 : 0);
      if (hits.size >= 2 && (map.n != null || map.m != null) && sc > bestScore) { bestScore = sc; bestRow = i; bestMap = map; }
    }
    const hayCab = bestScore >= 3;
    if (!hayCab) {
      bestRow = 0; bestMap = {};
      const r0 = rows.find(r => (r || []).some(c => String(c || '').trim())) || [];
      r0.forEach((c, j) => {
        const s = String(c ?? '').trim();
        if (bestMap.m == null && /^[A-Z]-?\d{6,9}$/i.test(s)) bestMap.m = j;
        else if (bestMap.cal == null && /^\d{1,3}(?:[.,]\d+)?$/.test(s) && +s.replace(',', '.') <= 100 && +s.replace(',', '.') >= 10) bestMap.cal = j;
        else if (bestMap.n == null && /[A-Za-zÁÉÍÓÚÑáéíóúñ]{3,}\s+[A-Za-zÁÉÍÓÚÑáéíóúñ]{2,}/.test(s)) bestMap.n = j;
      });
    }
    return { headerRow: bestRow, hasHeader: hayCab, map: bestMap };
  }

  function guessMeta(nombreArchivo, rows, headerRow, sheetName) {
    const topRows = (rows || []).slice(0, Math.max(headerRow || 0, 15));
    const headTxt = sinAc((sheetName || '') + ' ' + topRows.map(r => (r || []).join(' ')).join(' '));
    const fullTxt = sinAc(nombreArchivo) + ' ' + headTxt;

    let tipo = '', tipoDetectado = true;
    if (/ALCPT/.test(fullTxt)) tipo = 'ALCPT';
    else if (/\bALC\b|BOOK|LIBRO/.test(fullTxt)) tipo = 'ALC';
    else if (/DIAGN/.test(fullTxt)) tipo = 'Diagnóstico';
    else if (/PARCIAL/.test(fullTxt)) tipo = 'Parcial';
    else if (/SIMUL/.test(fullTxt)) tipo = 'Simulacro';
    else if (/FINAL/.test(fullTxt)) tipo = 'Final';
    else { tipo = 'ALCPT'; tipoDetectado = false; }

    let fecha = '', fechaDetectada = true;
    const rawJoin = [nombreArchivo, sheetName || '', ...topRows.map(r => (r || []).join(' '))].join(' | ');
    const candFechas = rawJoin.split('|');
    for (const seg of candFechas) {
      const f = normFecha(seg);
      if (f) { fecha = f; break; }
    }
    if (!fecha) {
      // Buscar dentro del texto completo con regex
      const mIso = rawJoin.match(/(20\d{2})[-/](\d{1,2})[-/](\d{1,2})/);
      const mDmy = rawJoin.match(/(\d{1,2})[-/](\d{1,2})[-/](20\d{2})/);
      const mEs1 = sinAc(rawJoin).match(/\b(ENERO|ENE|FEBRERO|FEB|MARZO|MAR|ABRIL|ABR|MAYO|MAY|JUNIO|JUN|JULIO|JUL|AGOSTO|AGO|SEPTIEMBRE|SETIEMBRE|SEP|SEPT|OCTUBRE|OCT|NOVIEMBRE|NOV|DICIEMBRE|DIC)\s+(?:DE\s+)?(\d{1,2})?\s*(?:DE\s+)?(20\d{2})\b/);
      const mEs2 = sinAc(rawJoin).match(/\b(\d{1,2})\s+(?:DE\s+)?(ENERO|ENE|FEBRERO|FEB|MARZO|MAR|ABRIL|ABR|MAYO|MAY|JUNIO|JUN|JULIO|JUL|AGOSTO|AGO|SEPTIEMBRE|SETIEMBRE|SEP|SEPT|OCTUBRE|OCT|NOVIEMBRE|NOV|DICIEMBRE|DIC)\s+(?:DE\s+)?(20\d{2})\b/);
      if (mIso) fecha = `${mIso[1]}-${mIso[2].padStart(2, '0')}-${mIso[3].padStart(2, '0')}`;
      else if (mDmy) fecha = `${mDmy[3]}-${mDmy[2].padStart(2, '0')}-${mDmy[1].padStart(2, '0')}`;
      else if (mEs1 && MESES_ES[mEs1[1]]) fecha = `${mEs1[3]}-${String(MESES_ES[mEs1[1]]).padStart(2, '0')}-${String(mEs1[2] || '01').padStart(2, '0')}`;
      else if (mEs2 && MESES_ES[mEs2[2]]) fecha = `${mEs2[3]}-${String(MESES_ES[mEs2[2]]).padStart(2, '0')}-${String(mEs2[1]).padStart(2, '0')}`;
    }
    if (!fecha) { fecha = fechaHoy(); fechaDetectada = false; }

    let hintAnio = '';
    if (/4TO|4O|CUARTO/.test(headTxt)) hintAnio = 4;
    else if (/3ER|3RO|TERCER/.test(headTxt)) hintAnio = 3;
    else if (/2DO|2O|SEGUNDO/.test(headTxt)) hintAnio = 2;
    else if (/1ER|1RO|PRIMER/.test(headTxt)) hintAnio = 1;

    const etiqueta = buildEtiqueta(tipo, fecha);
    const faltan = [];
    if (!tipoDetectado) faltan.push('tipo de examen');
    if (!fechaDetectada) faltan.push('fecha');
    const avisoMeta = faltan.length ? `El encabezado no indica ${faltan.join(' ni ')}. Confirma o corrige antes de guardar.` : '';
    return { tipo, eval: etiqueta, etiqueta, fecha, hintAnio, tipoDetectado, fechaDetectada, avisoMeta };
  }

  function parsearLineaLibre(line, cells) {
    const partes = Array.isArray(cells) && cells.length >= 2 ? cells.map(x => String(x || '').trim()).filter(Boolean) : [String(line || '').trim()];
    const full = partes.join(' ').replace(/\s+/g, ' ').trim();
    if (!full || /^(NO\.?|NOMBRE|MATR[IÍ]CULA|EJ[EÉ]RCITO|DIR\.|ESC\.|SEC\.|P[ÁA]GINA|RESULTADOS|LISTA|SECRETAR[IÍ]A|UNIVERSIDAD)/i.test(full)) return null;
    let m = '';
    const mm = full.match(/\b([A-Za-z]-?\d{6,9})\b/);
    if (mm) m = normMat0(mm[1]);
    let cal = NaN, calIdx = -1;
    for (let i = partes.length - 1; i >= 0; i--) {
      if (i === 0 && partes.length >= 3 && /^\d{1,3}$/.test(partes[0])) continue;
      if (/^[A-Za-z]-?\d{6,9}$/.test(partes[i])) continue;
      if (/^\d{1,3}(?:[.,]\d{1,2})?$/.test(partes[i])) {
        const v = parseFloat(partes[i].replace(',', '.'));
        if (v >= 0 && v <= 100) { cal = Math.round(v * 10) / 10; calIdx = i; break; }
      }
    }
    if (isNaN(cal)) {
      const tail = full.match(/\s(\d{1,3}(?:[.,]\d{1,2})?)\s*$/);
      if (tail) { const v = parseFloat(tail[1].replace(',', '.')); if (v >= 0 && v <= 100) cal = Math.round(v * 10) / 10; }
    }
    if (isNaN(cal)) return null;
    let gp = '', gi = '', nomParts = [];
    partes.forEach((p, idx) => {
      if (idx === calIdx) return;
      if (idx === 0 && /^\d{1,3}\.?$/.test(p)) return;
      if (m && normMat0(p) === m) return;
      if (/^[1-4][A-E]$|^TSU$/i.test(p)) { gp = p.toUpperCase(); return; }
      if (/^[1-4]O-G\d+$/i.test(p)) { gi = p; return; }
      nomParts.push(p);
    });
    let rawNom = nomParts.join(' ');
    if (partes.length === 1) {
      rawNom = full.replace(/^\d{1,3}\.?\s+/, '').replace(/\b[A-Za-z]-?\d{6,9}\b/, '').replace(/\s+\d{1,3}(?:[.,]\d{1,2})?\s*$/, '').replace(/\b([1-4][A-E]|TSU)\b/i, m2 => { gp = m2.toUpperCase(); return ''; });
    }
    rawNom = limpiaNom(rawNom);
    if (!m && rawNom.split(' ').length < 2) return null;
    return { m, n: rawNom, cal, gp, gi };
  }

  /* Lector ZIP puro para .docx */
  async function leerDocx(buf) {
    const u8 = new Uint8Array(buf), dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
    let eocd = -1;
    for (let i = u8.length - 22; i >= Math.max(0, u8.length - 65558); i--) {
      if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('El archivo no es un .docx válido.');
    const cdCount = dv.getUint16(eocd + 10, true), cdOff = dv.getUint32(eocd + 16, true);
    let pos = cdOff, entry = null;
    const dec = new TextDecoder('utf-8');
    for (let i = 0; i < cdCount && pos + 46 <= u8.length; i++) {
      if (dv.getUint32(pos, true) !== 0x02014b50) break;
      const method = dv.getUint16(pos + 10, true), csize = dv.getUint32(pos + 20, true), fnLen = dv.getUint16(pos + 28, true), exLen = dv.getUint16(pos + 30, true), cmLen = dv.getUint16(pos + 32, true), lOff = dv.getUint32(pos + 42, true);
      const name = dec.decode(u8.subarray(pos + 46, pos + 46 + fnLen));
      if (name === 'word/document.xml') { entry = { method, csize, lOff }; break; }
      pos += 46 + fnLen + exLen + cmLen;
    }
    if (!entry) throw new Error('No se encontró contenido en el documento Word.');
    const lfn = dv.getUint16(entry.lOff + 26, true), lex = dv.getUint16(entry.lOff + 28, true);
    const dataOff = entry.lOff + 30 + lfn + lex;
    const comp = u8.subarray(dataOff, dataOff + entry.csize);
    let xml = '';
    if (entry.method === 0) xml = dec.decode(comp);
    else if (entry.method === 8 && typeof DecompressionStream !== 'undefined') {
      const ds = new DecompressionStream('deflate-raw');
      xml = await new Response(new Blob([comp]).stream().pipeThrough(ds)).text();
    } else throw new Error('Este navegador no pudo descomprimir el Word.');
    const dom = new DOMParser().parseFromString(xml, 'application/xml');
    const txtOf = el => Array.from(el.getElementsByTagName('*')).filter(x => x.localName === 't').map(x => x.textContent).join('').replace(/\s+/g, ' ').trim();
    const tbls = Array.from(dom.getElementsByTagName('*')).filter(x => x.localName === 'tbl');
    const tables = tbls.map(t => Array.from(t.children).filter(x => x.localName === 'tr').map(tr => Array.from(tr.children).filter(x => x.localName === 'tc').map(txtOf))).filter(rows => rows.length >= 2 && rows.some(r => r.length >= 2));
    const pars = Array.from(dom.getElementsByTagName('*')).filter(x => x.localName === 'p').map(txtOf).filter(Boolean);
    return { tables, pars };
  }

  let PDFJS = null;
  async function getPdfJs() { if (PDFJS) return PDFJS; const m = await import('./pdfjs/pdf.min.mjs'); m.GlobalWorkerOptions.workerSrc = new URL('pdfjs/pdf.worker.min.mjs', location.href).href; return (PDFJS = m); }
  async function leerPdf(buf) {
    const P = await getPdfJs();
    const doc = await P.getDocument({ data: new Uint8Array(buf), standardFontDataUrl: new URL('pdfjs/standard_fonts/', location.href).href }).promise;
    const allRows = [], previews = [];
    for (let pn = 1; pn <= doc.numPages; pn++) {
      const pg = await doc.getPage(pn);
      if (pn <= 3) {
        const vp = pg.getViewport({ scale: 1.4 });
        const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
        await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
        previews.push(cv.toDataURL('image/jpeg', 0.82));
      }
      const tc = await pg.getTextContent();
      const lines = [];
      tc.items.forEach(it => {
        const str = String(it.str || '').trim(); if (!str) return;
        const x = it.transform[4], y = it.transform[5], w = it.width || (str.length * 4);
        let row = lines.find(l => Math.abs(l.y - y) < 3.5);
        if (!row) { row = { y, items: [] }; lines.push(row); }
        row.items.push({ x, w, str });
      });
      lines.sort((a, b) => b.y - a.y);
      lines.forEach(l => {
        l.items.sort((a, b) => a.x - b.x);
        const cells = []; let cur = '', endX = null;
        l.items.forEach(it => {
          if (endX == null) cur = it.str;
          else if (it.x - endX > 10) { cells.push(cur.trim()); cur = it.str; }
          else cur += ' ' + it.str;
          endX = it.x + it.w;
        });
        if (cur.trim()) cells.push(cur.trim());
        if (cells.length) allRows.push(cells);
      });
    }
    return { numPages: doc.numPages, rows: allRows, previews };
  }

  function comprimirImagen(file, maxW = 1400, q = 0.84) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        try {
          const sc = Math.min(1, maxW / Math.max(img.naturalWidth, img.naturalHeight));
          const cv = document.createElement('canvas'); cv.width = Math.round(img.naturalWidth * sc); cv.height = Math.round(img.naturalHeight * sc);
          cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url);
          res({ dataUrl: cv.toDataURL('image/jpeg', q), canvas: cv });
        } catch (e) { URL.revokeObjectURL(url); rej(e); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('lectura')); };
      img.src = url;
    });
  }

  /* ---------- Carga de archivos desde Administración ---------- */
  async function cargarArchivo(inp) {
    if (soloVer()) return toast('Directora: solo consulta.');
    const f = inp.files && inp.files[0]; if (inp) inp.value = '';
    if (!f) return;
    const nom = f.name, ext = (nom.split('.').pop() || '').toLowerCase();
    const adjId = 'ADJ-' + Date.now().toString(36).toUpperCase();
    try {
      if (ext === 'json') {
        const d = JSON.parse(await f.text());
        const arr = Array.isArray(d) ? d : (d.items || d.calificaciones || []);
        if (!Array.isArray(arr) || !arr.length) return toast('El archivo JSON no contiene calificaciones.');
        const items = arr.map(x => {
          const enl = enlazarCadete(x.m || '', x.n || '', x.a || '', x.gp || '');
          const tipo = normTipo(x.tipo) || 'ALCPT';
          const fecha = normFecha(x.fecha) || '';
          const et = String(x.etiqueta || x.eval || buildEtiqueta(tipo, fecha)).trim();
          return { ok: true, m: enl.m, n: enl.n || limpiaNom(x.n), a: x.a || enl.a || '', gp: x.gp || enl.gp || '', gi: x.gi || enl.gi || '', cal: Number(x.cal), tipo, eval: x.eval || et, etiqueta: et, fecha, obs: x.obs || '', via: enl.via };
        }).filter(x => !isNaN(x.cal));
        IMP = { modo: 'asistido', adjId: '', archivo: nom, origen: 'json', previews: [], textoExtra: `Paquete JSON con ${items.length} registro(s). Revisa tipo, fecha y etiqueta antes de guardar.`, defTipo: items[0].tipo, defEval: items[0].eval, defEtiqueta: items[0].etiqueta, defFecha: items[0].fecha || fechaHoy(), etiquetaManual: true, avisoMeta: items.some(x => !x.fecha) ? 'Algunas filas del paquete no tienen fecha confirmada: revisa antes de guardar.' : '', hintAnio: '', items };
        render(); scrollTo(0, 0);
      } else if (['xlsx', 'xls', 'csv'].includes(ext)) {
        const buf = await f.arrayBuffer();
        const wb = XLSX.read(buf, { cellDates: true });
        const sheets = wb.SheetNames.map(sn => ({ name: sn, rows: XLSX.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: '' }) }));
        const best = sheets.slice().sort((a, b) => b.rows.length - a.rows.length)[0] || sheets[0];
        await saveAdj({ id: adjId, nombre: nom, tipo: 'excel', mime: f.type || 'application/vnd.ms-excel', tam: f.size, fecha: fechaHoy(), buf });
        prepararMapeo({ adjId, archivo: nom, origen: 'excel', sheets, sheetName: best.name, rows: best.rows });
      } else if (ext === 'docx') {
        const buf = await f.arrayBuffer();
        const { tables, pars } = await leerDocx(buf);
        await saveAdj({ id: adjId, nombre: nom, tipo: 'word', mime: f.type || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', tam: f.size, fecha: fechaHoy(), buf, texto: pars.join('\n') });
        if (tables.length) {
          const big = tables.slice().sort((a, b) => b.length - a.length)[0];
          prepararMapeo({ adjId, archivo: nom, origen: 'word', rows: big, textoExtra: pars.join('\n') });
        } else {
          const items = pars.map(l => parsearLineaLibre(l)).filter(Boolean);
          prepararAsistido({ adjId, archivo: nom, origen: 'word', items, rawRows: pars.map(l => [l]), textoExtra: pars.join('\n') });
        }
      } else if (ext === 'doc') {
        const buf = await f.arrayBuffer();
        await saveAdj({ id: adjId, nombre: nom, tipo: 'word', mime: f.type || 'application/msword', tam: f.size, fecha: fechaHoy(), buf });
        prepararAsistido({ adjId, archivo: nom, origen: 'word', items: [], textoExtra: 'Formato .doc antiguo: archivo adjunto guardado. Captura o pega las calificaciones abajo (para lectura automática de tablas usa .docx).' });
      } else if (ext === 'pdf') {
        toast('Leyendo PDF…');
        const buf = await f.arrayBuffer();
        const res = await leerPdf(buf);
        await saveAdj({ id: adjId, nombre: nom, tipo: 'pdf', mime: 'application/pdf', tam: f.size, fecha: fechaHoy(), buf, texto: res.rows.map(r => r.join(' | ')).join('\n') });
        const det = detectarCabecera(res.rows);
        if (det.hasHeader && det.map.cal != null && (det.map.m != null || det.map.n != null)) {
          prepararMapeo({ adjId, archivo: nom, origen: 'pdf', rows: res.rows, previews: res.previews, textoExtra: res.rows.map(r => r.join(' | ')).join('\n') });
        } else {
          const items = res.rows.map(r => parsearLineaLibre(r.join(' '), r)).filter(Boolean);
          prepararAsistido({ adjId, archivo: nom, origen: 'pdf', items, rawRows: res.rows, previews: res.previews, textoExtra: res.rows.map(r => r.join(' | ')).join('\n') });
        }
      } else if (['png', 'jpg', 'jpeg', 'webp'].includes(ext) || /^image\//.test(f.type)) {
        const { dataUrl, canvas } = await comprimirImagen(f);
        let ocrTxt = '', items = [];
        if (window.TextDetector) {
          try { const det = new TextDetector(); const blocks = await det.detect(canvas); ocrTxt = blocks.map(b => b.rawValue).join('\n'); items = ocrTxt.split(/\r?\n/).map(l => parsearLineaLibre(l)).filter(Boolean); } catch (e) { }
        }
        await saveAdj({ id: adjId, nombre: nom, tipo: 'imagen', mime: 'image/jpeg', tam: f.size, fecha: fechaHoy(), dataUrl, texto: ocrTxt });
        prepararAsistido({ adjId, archivo: nom, origen: 'imagen', items, rawRows: ocrTxt ? ocrTxt.split(/\r?\n/).map(l => [l]) : [], previews: [dataUrl], textoExtra: ocrTxt || 'Imagen guardada. Usa la captura asistida de abajo (escribe matrícula o nombre del padrón y calificación, o pega una lista).' });
      } else {
        toast('Usa Excel (.xlsx, .csv), PDF, Word (.docx), imagen o paquete JSON.');
      }
    } catch (e) {
      toast('No se pudo leer el archivo: ' + (e.message || 'formato no compatible'));
    }
  }

  function construirFilasMapeadas(imp) {
    const start = imp.hasHeader ? imp.headerRow + 1 : 0;
    const out = [];
    for (let i = start; i < imp.rows.length; i++) {
      const r = imp.rows[i] || [];
      const get = k => imp.map[k] != null && imp.map[k] !== '' ? String(r[+imp.map[k]] ?? '').trim() : '';
      const rawCal = get('cal');
      const cal = normNum(rawCal);
      const rawM = get('m'), rawN = get('n');
      if (isNaN(cal) || (!rawM && !rawN)) continue;
      if (/^(NOMBRE|MATR|TOTAL|PROMEDIO|INTERVALO|IGUAL)/i.test(rawN)) continue;
      const gpCell = get('gp');
      const aCell = parseInt(get('a')) || imp.hintAnio || '';
      const enl = enlazarCadete(rawM, rawN, aCell, gpCell);
      const a = parseInt(get('a')) || enl.a || imp.hintAnio || '';
      const gp = gpCell || enl.gp || '';
      const gi = get('gi') || enl.gi || '';
      const tipo = normTipo(get('tipo')) || imp.defTipo;
      const fecha = normFecha(get('fecha')) || imp.defFecha;
      const etiqueta = imp.defEtiqueta || buildEtiqueta(tipo, fecha);
      const evalNom = get('eval') || imp.defEval || etiqueta;
      out.push({ ok: true, m: enl.m, n: enl.n || rawN, a, gp, gi, cal, eval: evalNom, etiqueta, tipo, fecha, obs: get('obs'), via: enl.via });
    }
    return out;
  }

  function prepararMapeo({ adjId, archivo, origen, sheets, sheetName, rows, previews, textoExtra }) {
    const det = detectarCabecera(rows);
    const meta = guessMeta(archivo, rows, det.headerRow, sheetName);
    IMP = { modo: 'mapeo', adjId, archivo, origen, sheets: sheets || null, sheetName: sheetName || '', rows, headerRow: det.headerRow, hasHeader: det.hasHeader, map: det.map, defTipo: meta.tipo, defEval: meta.eval, defEtiqueta: meta.etiqueta, defFecha: meta.fecha, etiquetaManual: false, avisoMeta: meta.avisoMeta, hintAnio: meta.hintAnio, previews: previews || [], textoExtra: textoExtra || '', items: [] };
    IMP.items = construirFilasMapeadas(IMP);
    render(); scrollTo(0, 0);
  }

  function prepararAsistido({ adjId, archivo, origen, items, rawRows, previews, textoExtra }) {
    const meta = guessMeta(archivo, rawRows || [], 0, '');
    const enlazados = (items || []).map(x => {
      const enl = enlazarCadete(x.m, x.n, meta.hintAnio, x.gp);
      return { ok: true, m: enl.m, n: enl.n || x.n, a: enl.a || meta.hintAnio || '', gp: x.gp || enl.gp || '', gi: x.gi || enl.gi || '', cal: x.cal, eval: meta.eval, etiqueta: meta.etiqueta, tipo: meta.tipo, fecha: meta.fecha, obs: '', via: enl.via };
    });
    IMP = { modo: 'asistido', adjId, archivo, origen, previews: previews || [], textoExtra: textoExtra || '', defTipo: meta.tipo, defEval: meta.eval, defEtiqueta: meta.etiqueta, defFecha: meta.fecha, etiquetaManual: false, avisoMeta: meta.avisoMeta, hintAnio: meta.hintAnio, items: enlazados };
    render(); scrollTo(0, 0);
  }

  function setSheet(sn) {
    if (!IMP || !IMP.sheets) return;
    const sh = IMP.sheets.find(s => s.name === sn); if (!sh) return;
    IMP.sheetName = sn; IMP.rows = sh.rows;
    const det = detectarCabecera(sh.rows);
    const meta = guessMeta(IMP.archivo, sh.rows, det.headerRow, sn);
    IMP.headerRow = det.headerRow; IMP.hasHeader = det.hasHeader; IMP.map = det.map;
    IMP.defTipo = meta.tipo; IMP.defFecha = meta.fecha; IMP.defEtiqueta = meta.etiqueta; IMP.defEval = meta.eval;
    IMP.avisoMeta = meta.avisoMeta; IMP.hintAnio = meta.hintAnio; IMP.etiquetaManual = false;
    IMP.items = construirFilasMapeadas(IMP);
    render();
  }
  function setImpMeta(k, v) {
    if (!IMP) return;
    IMP[k] = v;
    if (k === 'defEtiqueta') { IMP.etiquetaManual = true; IMP.defEtiqueta = String(v || '').toUpperCase().trim(); }
    if ((k === 'defTipo' || k === 'defFecha') && !IMP.etiquetaManual) {
      IMP.defEtiqueta = buildEtiqueta(IMP.defTipo, IMP.defFecha);
      IMP.defEval = IMP.defEtiqueta;
    }
    if (IMP.modo === 'mapeo') IMP.items = construirFilasMapeadas(IMP);
    else IMP.items.forEach(it => {
      if (k === 'defTipo') it.tipo = v;
      if (k === 'defEval') it.eval = v;
      if (k === 'defFecha') it.fecha = v;
      if (k === 'defEtiqueta' || ((k === 'defTipo' || k === 'defFecha') && !IMP.etiquetaManual)) it.etiqueta = IMP.defEtiqueta;
    });
    render();
  }
  function editImpItem(i, k, v) {
    if (!IMP || !IMP.items[i]) return;
    const it = IMP.items[i];
    if (k === 'ok') { it.ok = !!v; return; }
    if (k === 'cal') { const n = normNum(v); if (!isNaN(n)) it.cal = n; return; }
    it[k] = v;
    if (k === 'm' || k === 'n') { const enl = enlazarCadete(it.m, it.n, it.a, it.gp); if (enl.via !== 'sin_padron') { it.m = enl.m; it.n = enl.n; it.a = enl.a; it.gp = enl.gp; it.gi = enl.gi; it.via = enl.via; render(); } }
  }
  function quitarImpItem(i) { if (!IMP) return; IMP.items.splice(i, 1); render(); }
  function agregarImpManual() {
    if (!IMP) return;
    const q = ($('#cal_q') && $('#cal_q').value || '').trim();
    const cal = normNum($('#cal_v') && $('#cal_v').value);
    if (!q || isNaN(cal)) return toast('Elige o escribe un cadete/matrícula y una calificación (0 a 100).');
    let rawM = '', rawN = q;
    const mm = q.match(/\b([A-Za-z]-?\d{6,9})\b/);
    if (mm) { rawM = mm[1]; rawN = q.replace(mm[0], '').replace(/[·|,-]/g, ' ').trim(); }
    const enl = enlazarCadete(rawM, rawN);
    IMP.items.push({ ok: true, m: enl.m, n: enl.n || rawN, a: enl.a || '', gp: enl.gp || '', gi: enl.gi || '', cal, eval: IMP.defEval || IMP.defEtiqueta, etiqueta: IMP.defEtiqueta, tipo: IMP.defTipo, fecha: IMP.defFecha, obs: '', via: enl.via });
    if ($('#cal_q')) $('#cal_q').value = '';
    if ($('#cal_v')) $('#cal_v').value = '';
    render();
  }
  function pegarBloque() {
    if (!IMP) return;
    const txt = ($('#cal_paste') && $('#cal_paste').value || '').trim();
    if (!txt) return toast('Pega líneas con nombre o matrícula y calificación.');
    let add = 0;
    txt.split(/\r?\n/).forEach(l => {
      const cells = l.includes('\t') ? l.split('\t') : (l.includes('|') ? l.split('|') : (l.includes(',') ? l.split(',') : null));
      const p = parsearLineaLibre(l, cells);
      if (!p) return;
      const enl = enlazarCadete(p.m, p.n, IMP.hintAnio, p.gp);
      IMP.items.push({ ok: true, m: enl.m, n: enl.n || p.n, a: enl.a || IMP.hintAnio || '', gp: p.gp || enl.gp || '', gi: p.gi || enl.gi || '', cal: p.cal, eval: IMP.defEval || IMP.defEtiqueta, etiqueta: IMP.defEtiqueta, tipo: IMP.defTipo, fecha: IMP.defFecha, obs: '', via: enl.via });
      add++;
    });
    toast(add ? `${add} fila(s) agregada(s) para revisión.` : 'No se detectaron líneas con calificación.');
    render();
  }
  function guardarImportacion() {
    if (soloVer() || !IMP) return;
    store();
    const sel = IMP.items.filter(x => x.ok && !isNaN(x.cal));
    if (!sel.length) return toast('No hay filas seleccionadas para guardar.');
    const now = Date.now(), nuevos = [];
    sel.forEach(x => {
      const tp = x.tipo || IMP.defTipo || 'Otro';
      const fc = normFecha(x.fecha) || IMP.defFecha || fechaHoy();
      const et = String(x.etiqueta || IMP.defEtiqueta || buildEtiqueta(tp, fc)).trim().toUpperCase();
      const ev = String(x.eval || IMP.defEval || et).trim();
      const reg = { id: uid(), m: normMat0(x.m), n: limpiaNom(x.n), a: x.a || '', gp: x.gp || '', gi: x.gi || '', tipo: tp, eval: ev, etiqueta: et, fecha: fc, cal: Number(x.cal), archivo: IMP.archivo || '', adjId: IMP.adjId || '', obs: (x.obs || '').trim(), ts: now };
      S.calif.push(reg); nuevos.push(reg);
    });
    if (IMP.adjId && !S.califAdj.some(a => a.id === IMP.adjId)) {
      S.califAdj.unshift({ id: IMP.adjId, nombre: IMP.archivo, tipo: IMP.origen, fecha: fechaHoy(), nReg: nuevos.length });
    }
    pushCalifHoja(nuevos);
    IMP = null; save(); render();
    toast(`${nuevos.length} calificación(es) guardada(s).`);
  }
  function cancelarImportacion() { IMP = null; render(); }

  /* ---------- Edición y captura manual directa ---------- */
  function abrirNueva() { if (soloVer()) return; const f = fechaHoy(); EDIT = { nuevo: true, m: '', n: '', a: '', gp: '', gi: '', tipo: 'ALCPT', eval: buildEtiqueta('ALCPT', f), etiqueta: buildEtiqueta('ALCPT', f), fecha: f, cal: '', obs: '' }; render(); scrollTo(0, 0); }
  function editar(id) { if (soloVer()) return; store(); const x = S.calif.find(r => r.id === id); if (!x) return; EDIT = Object.assign({}, x); render(); scrollTo(0, 0); }
  function borrar(id) {
    if (soloVer()) return;
    if (!confirm('¿Eliminar esta calificación oficial?')) return;
    store();
    S.calif = S.calif.filter(r => r.id !== id);
    pushBorrarHoja(id);
    save(); render(); toast('Calificación eliminada.');
  }
  function guardarEdicion() {
    if (soloVer() || !EDIT) return;
    store();
    const qm = normMat0($('#ce_m').value), qn = limpiaNom($('#ce_n').value), cal = normNum($('#ce_cal').value);
    const tp = $('#ce_tp').value || 'Otro', fc = normFecha($('#ce_f').value) || fechaHoy();
    const et = ($('#ce_et') && $('#ce_et').value || buildEtiqueta(tp, fc)).trim().toUpperCase();
    const ev = ($('#ce_ev').value || et).trim();
    const obs = ($('#ce_obs').value || '').trim();
    if (!ev) return toast('Escribe el nombre de la evaluación.');
    if (isNaN(cal)) return toast('Escribe una calificación entre 0 y 100.');
    const enl = enlazarCadete(qm, qn);
    const a = parseInt($('#ce_a').value) || enl.a || '';
    const gp = ($('#ce_gp').value || '').trim() || enl.gp || '';
    const gi = ($('#ce_gi').value || '').trim() || enl.gi || '';
    const n = (enl.via !== 'sin_padron' ? enl.n : qn) || qn;
    const m = enl.m || qm;
    if (!n && !m) return toast('Escribe el nombre o la matrícula del cadete.');
    const rec = { id: EDIT.id || uid(), m, n, a, gp, gi, tipo: tp, eval: ev, etiqueta: et, fecha: fc, cal, archivo: EDIT.archivo || 'Captura manual', adjId: EDIT.adjId || '', obs, ts: Date.now() };
    const i = S.calif.findIndex(r => r.id === rec.id);
    if (i >= 0) S.calif[i] = rec; else S.calif.push(rec);
    pushCalifHoja([rec]);
    EDIT = null; save(); render(); toast('Calificación guardada.');
  }
  function autollenarEdicion(val) {
    const mm = String(val || '').match(/\b([A-Za-z]-?\d{6,9})\b/);
    const enl = enlazarCadete(mm ? mm[1] : '', mm ? '' : val);
    if (enl.via !== 'sin_padron') {
      if ($('#ce_m')) $('#ce_m').value = enl.m;
      if ($('#ce_n')) $('#ce_n').value = enl.n;
      if ($('#ce_a') && enl.a) $('#ce_a').value = String(enl.a);
      if ($('#ce_gp') && enl.gp) $('#ce_gp').value = enl.gp;
      if ($('#ce_gi') && enl.gi) $('#ce_gi').value = enl.gi;
    }
  }

  /* ---------- Programa Sombra (seguimiento entre exámenes) ---------- */
  function esSombra(m, n) {
    store(); const k = sombraKey(m, n);
    return !!(k && S.califSombra[k] && S.califSombra[k].activo);
  }
  function toggleSombra(m, n) {
    if (soloVer()) return;
    store();
    const enl = enlazarCadete(m, n);
    const mat = enl.m || normMat0(m), nom = enl.n || limpiaNom(n);
    const k = sombraKey(mat, nom); if (!k) return;
    if (S.califSombra[k] && S.califSombra[k].activo) {
      const prev = S.califSombra[k];
      delete S.califSombra[k];
      pushSombrasHoja([{ m: mat, n: nom, pareja: prev.pareja || '', nota: prev.nota || '', activo: 0 }]);
      toast(`${nom || mat} salió de Programa Sombra.`);
    } else {
      const obj = { key: k, m: mat, n: nom, pareja: '', nota: '', activo: true, ts: Date.now() };
      S.califSombra[k] = obj;
      pushSombrasHoja([{ m: mat, n: nom, pareja: '', nota: '', activo: 1 }]);
      toast(`${nom || mat} marcado en Programa Sombra.`);
    }
    save(); render();
  }
  function agregarSombra() {
    if (soloVer()) return;
    const q = ($('#som_q') && $('#som_q').value || '').trim();
    const par = ($('#som_par') && $('#som_par').value || '').trim();
    const nota = ($('#som_nota') && $('#som_nota').value || '').trim();
    if (!q) return toast('Elige o escribe un cadete del padrón.');
    const mm = q.match(/\b([A-Za-z]-?\d{6,9})\b/);
    const enl = enlazarCadete(mm ? mm[1] : '', mm ? q.replace(mm[0], '').replace(/[·|,-]/g, ' ').trim() : q);
    const mat = enl.m || (mm ? normMat0(mm[1]) : '');
    const nom = enl.n || limpiaNom(q);
    const k = sombraKey(mat, nom); if (!k) return;
    store();
    S.califSombra[k] = { key: k, m: mat, n: nom, pareja: par, nota, activo: true, ts: Date.now() };
    pushSombrasHoja([{ m: mat, n: nom, pareja: par, nota, activo: 1 }]);
    save(); render(); toast('Cadete agregado a Programa Sombra.');
  }
  function importarSombrasApp() {
    if (soloVer()) return;
    store(); let add = 0; const lote = [];
    const fuentes = Object.values(g(() => S.avances, {}) || {}).concat(Object.values(g(() => S.perfiles, {}) || {}));
    fuentes.forEach(x => {
      const sm = (x && x.sm) || (x && x.sombra && x.sombra.m) || '';
      if (!sm) return;
      const mat = normMat0(x.m), nom = limpiaNom(x.n || x.nombre || '');
      const k = sombraKey(mat, nom); if (!k || S.califSombra[k]) return;
      S.califSombra[k] = { key: k, m: mat, n: nom, pareja: sm, nota: 'Sincronizado de Mi sombra', activo: true, ts: Date.now() };
      lote.push({ m: mat, n: nom, pareja: sm, nota: 'Sincronizado de Mi sombra', activo: 1 });
      add++;
    });
    if (lote.length) pushSombrasHoja(lote);
    save(); render();
    toast(add ? `${add} cadete(s) importado(s) desde Mi sombra.` : 'No hay parejas nuevas registradas en Avance/Perfiles.');
  }
  function filasSombraProgreso() {
    store();
    const out = [];
    Object.values(S.califSombra).filter(x => x && x.activo).forEach(s => {
      const k = sombraKey(s.m, s.n);
      const recs = S.calif.filter(r => sombraKey(r.m, r.n) === k).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.ts || 0) - (b.ts || 0));
      const p0 = listaPadron().find(c => normMat0(c.m) === normMat0(s.m)) || {};
      const a = (recs[0] && recs[0].a) || p0.a || '';
      const gp = (recs[0] && recs[0].gp) || p0.gp || '';
      const prim = recs.length ? recs[0] : null;
      const ult = recs.length ? recs[recs.length - 1] : null;
      const delta = recs.length >= 2 ? Math.round((Number(ult.cal) - Number(prim.cal)) * 10) / 10 : null;
      const meta = (typeof METAS !== 'undefined' && METAS[a]) || 60;
      out.push({ key: k, m: s.m || (ult && ult.m) || '', n: s.n || (ult && ult.n) || k, a, gp, pareja: s.pareja || '', nota: s.nota || '', nEx: recs.length, prim, ult, delta, meta });
    });
    return out.sort((a, b) => (b.delta ?? -999) - (a.delta ?? -999) || a.n.localeCompare(b.n));
  }
  function expSombra() {
    const L = filasSombraProgreso();
    if (!L.length) return toast('No hay cadetes marcados en Programa Sombra.');
    const rows = L.map(x => ({
      Nombre: x.n, Matrícula: x.m, Año: x.a || '', Grupo: x.gp || '', Pareja: x.pareja, Nota: x.nota,
      'Exámenes': x.nEx,
      'Primer examen': x.prim ? `${x.prim.cal} (${x.prim.etiqueta || x.prim.eval})` : '—',
      'Último examen': x.ult ? `${x.ult.cal} (${x.ult.etiqueta || x.ult.eval})` : '—',
      'Progreso (pts)': x.delta == null ? '—' : x.delta,
      'Meta año': x.meta,
      Estado: !x.ult ? 'Sin evaluaciones' : (x.ult.cal >= 60 ? 'Barra I (≥60)' : (x.ult.cal >= x.meta ? 'Cumple meta año' : 'En seguimiento'))
    }));
    exportar(rows, 'Programa_Sombra_Progreso', 'xlsx');
  }

  /* ---------- Visor de archivos adjuntos ---------- */
  async function verAdj(id) {
    const adj = await getAdj(id);
    if (!adj) return toast('El archivo adjunto no está disponible en este equipo.');
    VERADJ = { id: adj.id, nombre: adj.nombre, tipo: adj.tipo, texto: adj.texto || '', dataUrl: adj.dataUrl || '', previews: [] };
    if (adj.tipo === 'pdf' && adj.buf) {
      try { const res = await leerPdf(adj.buf); VERADJ.previews = res.previews; VERADJ.texto = res.rows.map(r => r.join(' | ')).join('\n'); } catch (e) { }
    }
    render(); scrollTo(0, 0);
  }
  async function descargarAdj(id) {
    const adj = await getAdj(id);
    if (!adj) return toast('Archivo no disponible en este equipo.');
    if (adj.buf) descargar(new Blob([adj.buf], { type: adj.mime || 'application/octet-stream' }), adj.nombre);
    else if (adj.dataUrl) { const a = document.createElement('a'); a.href = adj.dataUrl; a.download = adj.nombre; a.click(); }
  }
  async function borrarAdj(id) {
    if (soloVer()) return;
    if (!confirm('¿Quitar este archivo adjunto de este equipo? Las calificaciones ya guardadas se conservan.')) return;
    store(); S.califAdj = S.califAdj.filter(a => a.id !== id); await delAdj(id); save();
    if (VERADJ && VERADJ.id === id) VERADJ = null;
    render();
  }

  /* ---------- Filtros y Exportación Excel ---------- */
  function filtrarCalif(list) {
    return (list || []).filter(r => {
      if (CF.anio && String(r.a) !== CF.anio) return false;
      if (CF.gp && r.gp !== CF.gp && r.gi !== CF.gp) return false;
      if (CF.tipo && r.tipo !== CF.tipo) return false;
      if (CF.etiqueta && (r.etiqueta || buildEtiqueta(r.tipo, r.fecha)) !== CF.etiqueta) return false;
      if (CF.sombra && !esSombra(r.m, r.n)) return false;
      if (CF.desde && (!r.fecha || r.fecha < CF.desde)) return false;
      if (CF.hasta && (!r.fecha || r.fecha > CF.hasta)) return false;
      if (CF.txt) {
        const q = sinAc(CF.txt);
        if (!sinAc(r.n + ' ' + r.m + ' ' + r.eval + ' ' + (r.etiqueta || '')).includes(q)) return false;
      }
      const c = Number(r.cal);
      if (CF.rango === 'apr' && !(c >= 60)) return false;
      if (CF.rango === 'rep' && !(c < 60)) return false;
      const meta = (typeof METAS !== 'undefined' && METAS[r.a]) || 60;
      if (CF.rango === 'meta' && !(c >= meta)) return false;
      if (CF.rango === 'bajo_meta' && !(c < meta)) return false;
      if (CF.min !== '' && !isNaN(+CF.min) && c < +CF.min) return false;
      if (CF.max !== '' && !isNaN(+CF.max) && c > +CF.max) return false;
      return true;
    }).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || (a.n || '').localeCompare(b.n || ''));
  }
  function filasExp(L) {
    return L.map(r => {
      const meta = (typeof METAS !== 'undefined' && METAS[r.a]) || 60;
      return { Nombre: r.n, Matrícula: r.m, Año: r.a || '', 'Grupo ped.': r.gp || '', 'Grupo inglés': r.gi || '', Etiqueta: r.etiqueta || buildEtiqueta(r.tipo, r.fecha), Evaluación: r.eval, Tipo: r.tipo, Fecha: r.fecha, Calificación: Number(r.cal), 'Meta año': meta, Estado: Number(r.cal) >= 60 ? 'Aprobado (Barra I)' : (Number(r.cal) >= meta ? 'Meta de año' : 'Por mejorar'), 'Programa Sombra': esSombra(r.m, r.n) ? 'Sí' : 'No', Archivo: r.archivo || '', Observaciones: r.obs || '' };
    });
  }
  function exp(fmt) {
    store(); const L = filtrarCalif(S.calif);
    if (!L.length) return toast('No hay calificaciones con estos filtros para exportar.');
    exportar(filasExp(L), 'Calificaciones_oficiales', fmt || 'xlsx');
  }
  function plantilla() {
    const h = ['Nombre completo', 'Matrícula', 'Año', 'Grupo pedagógico', 'Grupo de inglés', 'Evaluación', 'Tipo', 'Fecha', 'Calificación', 'Observaciones'];
    descargar(new Blob(['\ufeff' + h.join(',') + '\r\n'], { type: 'text/csv;charset=utf-8' }), 'Plantilla_Calificaciones_Oficiales.csv');
  }

  /* ---------- Gráfica SVG y vista del Cadete (solo consulta) ---------- */
  function gradesForCadet(m) {
    store(); const mm = normMat0(m);
    const map = {};
    S.calif.filter(r => normMat0(r.m) === mm).forEach(r => { map[r.id] = r; });
    const loc = (S.califCad[mm] && S.califCad[mm].items) || [];
    loc.forEach(r => { if (normMat0(r.m) === mm) map[r.id] = Object.assign({}, r, map[r.id] || {}); });
    return Object.values(map).sort((a, b) => (a.fecha || '').localeCompare(b.fecha || '') || (a.ts || 0) - (b.ts || 0));
  }
  async function syncCadete(p, apManual) {
    if (!p || !SHEET || SRV || !navigator.onLine || p.piloto || p.vistaSolo) return;
    const ap = (apManual || p.ap || '').trim();
    if (!ap || ap.length < 2) { SYNC_CAD = { m: p.m, cargando: false, err: 'falta_ap', tried: true }; render(); return; }
    SYNC_CAD = { m: p.m, cargando: true, err: '', tried: true }; render();
    try {
      const v = await verHoja();
      if (v < 4) { SYNC_CAD = { m: p.m, cargando: false, err: 'v_ant', tried: true }; render(); return; }
      const r = await fetch(SHEET + '?hoja=calif_cadete&m=' + encodeURIComponent(normMat0(p.m)) + '&ap=' + encodeURIComponent(sinAc(ap)), { cache: 'no-store' }).then(x => x.json());
      if (r && r.ok) {
        store(); S.califCad[normMat0(p.m)] = { ts: Date.now(), items: r.items || [], sombra: r.sombra || null };
        if (r.sombra && window.SOMBRA) SOMBRA.aplicarSombraRemota(r.sombra);
        if (apManual) p.ap = apManual.trim();
        save();
        SYNC_CAD = { m: p.m, cargando: false, err: '', tried: true };
        if (apManual) toast(`Calificaciones actualizadas (${(r.items || []).length}).`);
      } else {
        SYNC_CAD = { m: p.m, cargando: false, err: r && r.espera ? 'espera' : 'no_coincide', tried: true };
      }
    } catch (e) { SYNC_CAD = { m: p.m, cargando: false, err: 'red', tried: true }; }
    render();
  }

  function graficaSVG(items, metaAnio) {
    if (!items.length) return '';
    const W = 540, H = 190, PL = 34, PR = 22, PT = 22, PB = 34;
    const vals = items.map(x => Number(x.cal));
    const mn = Math.max(0, Math.min(...vals, metaAnio, 60) - 8);
    const mx = Math.min(100, Math.max(...vals, metaAnio, 60) + 8);
    const X = i => items.length === 1 ? W / 2 : PL + i * (W - PL - PR) / (items.length - 1);
    const Y = v => H - PB - ((v - mn) / Math.max(1, mx - mn)) * (H - PT - PB);
    const pts = items.map((x, i) => [X(i), Y(Number(x.cal)), x]);
    const poly = pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
    const area = pts.length >= 2 ? `M${pts[0][0].toFixed(1)},${(H - PB).toFixed(1)} L${pts.map(p => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' L')} L${pts[pts.length - 1][0].toFixed(1)},${(H - PB).toFixed(1)} Z` : '';
    const yMeta = Y(metaAnio), y60 = Y(60);
    return `<svg class="calgraf" viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de progreso de calificaciones oficiales">
      <defs><linearGradient id="cgfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#6366f1" stop-opacity=".28"/><stop offset="100%" stop-color="#6366f1" stop-opacity="0"/></linearGradient></defs>
      <line x1="${PL}" x2="${W - PR}" y1="${y60.toFixed(1)}" y2="${y60.toFixed(1)}" class="g60"/>
      <text x="${W - PR}" y="${(y60 - 4).toFixed(1)}" text-anchor="end">Barra I (60)</text>
      ${metaAnio !== 60 ? `<line x1="${PL}" x2="${W - PR}" y1="${yMeta.toFixed(1)}" y2="${yMeta.toFixed(1)}" class="gmeta"/><text x="${PL + 2}" y="${(yMeta - 4).toFixed(1)}" class="tmeta">Meta ${metaAnio}</text>` : ''}
      ${area ? `<path d="${area}" fill="url(#cgfill)"/>` : ''}
      ${pts.length >= 2 ? `<polyline fill="none" stroke="#6366f1" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" points="${poly}"/>` : ''}
      ${pts.map(([x, y, it]) => `<g><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${Number(it.cal) >= metaAnio ? '#16a34a' : '#f59e0b'}" stroke="#fff" stroke-width="2"/><text x="${x.toFixed(1)}" y="${(y - 9).toFixed(1)}" text-anchor="middle" class="gval">${it.cal}</text><text x="${x.toFixed(1)}" y="${(H - 10).toFixed(1)}" text-anchor="middle" class="glbl">${esc((it.etiqueta || it.fecha || '').replace(/^DIAGNOSTICO/i, 'DIAG.').slice(0, 15))}</text></g>`).join('')}
    </svg>`;
  }

  function vCadete(p) {
    const items = gradesForCadet(p.m);
    const meta = (typeof METAS !== 'undefined' && METAS[p.anio]) || 60;
    if (SHEET && !SRV && navigator.onLine && !p.piloto && !p.vistaSolo && SYNC_CAD.m !== p.m && !SYNC_CAD.cargando) {
      if (p.ap) setTimeout(() => syncCadete(p), 30);
    }
    const ult = items.length ? items[items.length - 1] : null;
    const prom = items.length ? Math.round((items.reduce((s, x) => s + Number(x.cal), 0) / items.length) * 10) / 10 : null;
    const maxC = items.length ? Math.max(...items.map(x => Number(x.cal))) : null;
    const comp = ult ? (ult.cal >= 60 ? `🎉 Tu última calificación (${ult.cal}) supera la meta de ${p.anio}° año (${meta}) y alcanza la Barra I (60).`
      : ult.cal >= meta ? `✔ Vas arriba de la meta de ${p.anio}° año (${meta}) por +${Math.round((ult.cal - meta) * 10) / 10} pts. Te faltan ${Math.round((60 - ult.cal) * 10) / 10} para la Barra I (60).`
      : `Te faltan ${Math.round((meta - ult.cal) * 10) / 10} puntos para la meta de ${p.anio}° año (${meta}).`) : '';
    const syncUi = SHEET && !SRV && !p.piloto && !p.vistaSolo ? `<section class="card"><h3>Sincronización</h3>
      ${p.ap ? `<div class="row sp"><span class="mini">${SYNC_CAD.cargando ? 'Consultando la Hoja…' : SYNC_CAD.err === 'no_coincide' ? 'El apellido guardado no coincidió.' : SYNC_CAD.err === 'v_ant' ? 'La Hoja aún no activa la consulta v4.' : 'Actualiza para ver nuevas calificaciones registradas por la Mesa de Inglés.'}</span><button class="btn sm ghost" onclick="CALIF.sync(P())" ${SYNC_CAD.cargando ? 'disabled' : ''}>Actualizar</button></div>`
      : `<p class="mini">Escribe tu primer apellido para consultar las calificaciones oficiales que la Mesa de Inglés subió a la Hoja:</p><div class="row"><input id="cap_sync" placeholder="Primer apellido" style="flex:1"><button class="btn sm" onclick="CALIF.sync(P(), document.getElementById('cap_sync').value)">Consultar</button></div>${SYNC_CAD.err === 'no_coincide' ? '<p class="mini badt">No coincidió con tu matrícula.</p>' : ''}`}
      </section>` : '';

    return `<section class="ehero chero"><div class="eh1"><div class="eico">📊</div><div><h2>Calificaciones oficiales</h2><p>Seguimiento de tus evaluaciones registradas por la Mesa de Inglés. Solo consulta.</p></div></div>
      <div class="vkpis"><div><b>${ult ? ult.cal : '—'}</b><span>última</span></div><div><b>${prom ?? '—'}</b><span>promedio</span></div><div><b>${meta}</b><span>meta ${p.anio ? p.anio + '° año' : 'Barra I'}</span></div></div></section>
      ${comp ? `<section class="card ${ult.cal >= meta ? 'okc' : 'aviso'}"><p>${comp}</p>${maxC != null ? `<p class="mini">Mejor calificación oficial: <b>${maxC}</b> · Meta de egreso Barra I: <b>60</b>.</p>` : ''}</section>` : ''}
      ${items.length ? `<section class="card"><h3>Progreso oficial</h3>${graficaSVG(items, meta)}</section>
      <section class="card"><h3>Historial (${items.length})</h3><div class="tw"><table><tr><th>Fecha</th><th>Etiqueta / Evaluación</th><th>Calif.</th><th>Vs meta</th></tr>${items.slice().reverse().map(r => {
        const d = Math.round((r.cal - meta) * 10) / 10;
        const et = r.etiqueta || buildEtiqueta(r.tipo, r.fecha);
        return `<tr><td>${esc(r.fecha || '—')}</td><td><span class="tag">${esc(et)}</span> ${r.eval && r.eval !== et ? `<b>${esc(r.eval)}</b>` : ''}${r.obs ? `<small>${esc(r.obs)}</small>` : ''}</td><td><b class="${r.cal >= meta ? 'okt' : 'badt'}">${r.cal}</b></td><td>${d >= 0 ? '+' + d : d}</td></tr>`;
      }).join('')}</table></div></section>` : `<section class="card"><h3>Sin calificaciones registradas aún</h3><p class="mini">Cuando la Mesa de Inglés cargue tus resultados oficiales de ALCPT, ALC o parciales, aquí verás tu historial, tu gráfica de progreso y cuánto te falta para tu meta.</p></section>`}
      ${syncUi}
      <button class="btn ghost" style="width:100%" onclick="tab='hoy';render();scrollTo(0,0)">← Volver a Hoy</button>`;
  }

  function hoyCard(p) {
    if (!p) return '';
    const items = gradesForCadet(p.m), ult = items.length ? items[items.length - 1] : null;
    const meta = (typeof METAS !== 'undefined' && METAS[p.anio]) || 60;
    const msg = ult ? `Última: <b>${ult.cal}</b> (${esc(ult.etiqueta || ult.eval)}) · Meta ${meta} · ${items.length} registro(s).` : 'Consulta aquí tus exámenes ALCPT, ALC, diagnósticos y parciales oficiales.';
    return `<section class="card hoyvoc hoycal" onclick="tab='calif';render();scrollTo(0,0)"><div class="ic">📊</div><div><h3>Calificaciones oficiales</h3><p class="mini">${msg}</p></div></section>`;
  }

  function fichaResumen(m) {
    const items = gradesForCadet(m);
    const som = esSombra(m, '');
    if (!items.length) return `<p class="mini">Sin calificaciones oficiales cargadas.${som ? ' · <span class="tag">⚑ Programa Sombra</span>' : ''}</p>`;
    const ult = items[items.length - 1], prom = Math.round((items.reduce((s, x) => s + Number(x.cal), 0) / items.length) * 10) / 10;
    return `<p class="mini"><b>${items.length}</b> calificación(es) · Última: <b>${ult.cal}</b> (${esc(ult.etiqueta || ult.eval)}, ${esc(ult.fecha)}) · Promedio: <b>${prom}</b>${som ? ' · <span class="tag">⚑ Programa Sombra</span>' : ''}.</p>`;
  }

  /* ---------- Vista de Administración y Directora ---------- */
  function vDatalist() {
    const L = listaPadron();
    return `<datalist id="calpadlist">${L.map(c => `<option value="${esc(c.n + ' · ' + c.m)}"></option>`).join('')}</datalist>`;
  }

  function vImportacion() {
    if (!IMP) return '';
    const hdr = IMP.rows && IMP.rows[IMP.headerRow] ? IMP.rows[IMP.headerRow] : [];
    const maxCols = IMP.rows ? Math.max(0, ...IMP.rows.slice(0, 30).map(r => (r || []).length)) : 0;
    const colOpts = (sel) => CAMPOS.map(([k, l]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>${l}</option>`).join('');
    const campoPorCol = j => { for (const [k, idx] of Object.entries(IMP.map || {})) if (idx === j) return k; return ''; };
    const conMat = IMP.items.filter(x => x.via !== 'sin_padron').length;

    return `<section class="card calimp" id="calImpCard"><div class="row sp"><h3>Revisar archivo: ${esc(IMP.archivo)}</h3><button class="btn sm ghost" onclick="CALIF.cancelar()">Cancelar</button></div>
      ${IMP.avisoMeta ? `<p class="mini aviso" style="padding:8px 10px;border-radius:10px;margin:6px 0">⚠ ${esc(IMP.avisoMeta)}</p>` : ''}
      ${IMP.previews && IMP.previews.length ? `<div class="calprev">${IMP.previews.map((u, i) => `<img src="${u}" alt="Vista previa ${i + 1}">`).join('')}</div>` : ''}
      <div class="g3">
        ${IMP.sheets && IMP.sheets.length > 1 ? `<label>Hoja del Excel<select onchange="CALIF.setSheet(this.value)">${IMP.sheets.map(s => `<option ${s.name === IMP.sheetName ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}</select></label>` : ''}
        <label>Tipo de examen<select id="imp_tipo" onchange="CALIF.setImpMeta('defTipo',this.value)">${TIPOS.map(t => `<option ${IMP.defTipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label>Fecha de aplicación<input id="imp_fecha" type="date" value="${esc(IMP.defFecha)}" onchange="CALIF.setImpMeta('defFecha',this.value)"></label>
        <label>Etiqueta (TIPO MES AÑO)<input id="imp_etiqueta" value="${esc(IMP.defEtiqueta)}" onchange="CALIF.setImpMeta('defEtiqueta',this.value)" placeholder="Ej. ALCPT NOV 2026"></label>
      </div>
      <label>Nombre de evaluación (opcional)<input id="imp_eval" value="${esc(IMP.defEval)}" onchange="CALIF.setImpMeta('defEval',this.value)"></label>
      ${IMP.modo === 'mapeo' ? `
        <div class="row"><label class="chk"><input type="checkbox" ${IMP.hasHeader ? 'checked' : ''} onchange="CALIF.setImpMeta('hasHeader',this.checked)"> La fila ${IMP.headerRow + 1} tiene encabezados</label></div>
        <p class="mini"><b>Mapeo de columnas</b> (ajusta si el archivo usa otros nombres):</p>
        <div class="calmap">${Array.from({ length: maxCols }, (_, j) => {
          const sample = String(hdr[j] ?? '').replace(/\s+/g, ' ').trim() || `Columna ${j + 1}`;
          const cur = campoPorCol(j);
          return `<label><span>${esc(sample.slice(0, 26))}</span><select onchange="CALIF.setMapCol(${j},this.value)">${colOpts(cur)}</select></label>`;
        }).join('')}</div>`
      : `${IMP.textoExtra ? `<details class="mini" style="margin:6px 0"><summary>Texto detectado del archivo</summary><pre class="calpre">${esc(IMP.textoExtra.slice(0, 4000))}</pre></details>` : ''}
        <div class="card" style="background:var(--bg)"><b>Captura asistida</b>
          <div class="row"><input id="cal_q" list="calpadlist" placeholder="Busca nombre o matrícula del padrón" style="flex:2"><input id="cal_v" type="number" min="0" max="100" step="0.1" placeholder="Calif." style="width:95px"><button class="btn sm" onclick="CALIF.addManual()">+ Agregar</button></div>
          <details style="margin-top:6px"><summary class="mini">Pegar varias filas (nombre o matrícula + calificación)</summary><textarea id="cal_paste" placeholder="Ej.\nA-12345678, 84\nMaria Fernanda Lopez Ramirez 78"></textarea><button class="btn sm ghost" onclick="CALIF.pegar()">Detectar filas</button></details>
        </div>`}
      <h4>Vista previa para guardar (${IMP.items.filter(x => x.ok).length} de ${IMP.items.length} · Enlazados con padrón: ${conMat})</h4>
      ${IMP.items.length ? `<div class="tw"><table><tr><th></th><th>Nombre</th><th>Matrícula</th><th>Año/Gr.</th><th>Calif.</th><th>Enlace</th><th></th></tr>${IMP.items.slice(0, 400).map((it, i) => `<tr>
        <td><input type="checkbox" ${it.ok ? 'checked' : ''} onchange="CALIF.editImp(${i},'ok',this.checked)"></td>
        <td><input class="cinp" value="${esc(it.n)}" onchange="CALIF.editImp(${i},'n',this.value)"></td>
        <td><input class="cinp sm" value="${esc(it.m)}" onchange="CALIF.editImp(${i},'m',this.value)" placeholder="Sin mat."></td>
        <td>${it.a ? it.a + '°' : ''} ${esc(it.gp)}${it.gi ? '/' + esc(it.gi) : ''}</td>
        <td><input class="cinp num" type="number" min="0" max="100" step="0.1" value="${it.cal}" onchange="CALIF.editImp(${i},'cal',this.value)"></td>
        <td><small class="${it.via === 'sin_padron' ? 'badt' : 'okt'}">${it.via === 'matrícula' ? '✔ Matrícula' : it.via === 'nombre' ? '✔ Nombre' : '⚠ Sin padrón'}</small></td>
        <td><button class="btn sm ghost" onclick="CALIF.delImp(${i})">✕</button></td>
      </tr>`).join('')}</table></div>` : '<p class="mini">Aún no hay filas detectadas. Agrega filas arriba o revisa el mapeo de columnas.</p>'}
      <div class="row" style="margin-top:10px"><button class="btn big" onclick="CALIF.guardarImp()" ${IMP.items.some(x => x.ok) ? '' : 'disabled'}>Guardar ${IMP.items.filter(x => x.ok).length} calificación(es)</button></div>
    </section>`;
  }

  function vEdicion() {
    if (!EDIT) return '';
    return `<section class="card" id="calEditCard"><div class="row sp"><h3>${EDIT.nuevo ? 'Nueva calificación oficial' : 'Editar calificación'}</h3><button class="btn sm ghost" onclick="CALIF.cancelarEdit()">Cancelar</button></div>
      ${EDIT.nuevo ? `<label>Buscar en el padrón (opcional)<input list="calpadlist" placeholder="Escribe nombre o matrícula para autollenar" onchange="CALIF.autoEdit(this.value)"></label>` : ''}
      <div class="g2"><label>Nombre completo<input id="ce_n" value="${esc(EDIT.n)}"></label><label>Matrícula<input id="ce_m" autocapitalize="characters" value="${esc(EDIT.m)}"></label></div>
      <div class="g3"><label>Año<select id="ce_a"><option value="">—</option>${[1, 2, 3, 4].map(n => `<option value="${n}" ${+EDIT.a === n ? 'selected' : ''}>${n}°</option>`).join('')}</select></label><label>Grupo ped.<input id="ce_gp" value="${esc(EDIT.gp || '')}"></label><label>Grupo inglés<input id="ce_gi" value="${esc(EDIT.gi || '')}"></label></div>
      <div class="g3"><label>Tipo<select id="ce_tp" onchange="if(!document.getElementById('ce_et').dataset.ed)document.getElementById('ce_et').value=CALIF._et(this.value,document.getElementById('ce_f').value)">${TIPOS.map(t => `<option ${EDIT.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select></label><label>Fecha<input id="ce_f" type="date" value="${esc(EDIT.fecha)}" onchange="if(!document.getElementById('ce_et').dataset.ed)document.getElementById('ce_et').value=CALIF._et(document.getElementById('ce_tp').value,this.value)"></label><label>Etiqueta (TIPO MES AÑO)<input id="ce_et" value="${esc(EDIT.etiqueta || buildEtiqueta(EDIT.tipo, EDIT.fecha))}" oninput="this.dataset.ed=1" placeholder="ALCPT NOV 2026"></label></div>
      <div class="g3"><label>Evaluación<input id="ce_ev" value="${esc(EDIT.eval)}" placeholder="Ej. ALCPT NOV 2026"></label><label>Calificación (0–100)<input id="ce_cal" type="number" min="0" max="100" step="0.1" value="${EDIT.cal}"></label><label>Observaciones<input id="ce_obs" value="${esc(EDIT.obs || '')}"></label></div>
      <button class="btn big" onclick="CALIF.guardarEdit()">Guardar</button></section>`;
  }

  function vAdjunto() {
    if (!VERADJ) return '';
    return `<section class="card" id="calAdjVisor"><div class="row sp"><h3>Adjunto: ${esc(VERADJ.nombre)}</h3><div class="row"><button class="btn sm ghost" onclick="CALIF.descargarAdj('${esc(VERADJ.id)}')">Descargar</button><button class="btn sm ghost" onclick="CALIF.cerrarAdj()">Cerrar</button></div></div>
      ${VERADJ.dataUrl ? `<div class="calprev"><img src="${VERADJ.dataUrl}" alt="${esc(VERADJ.nombre)}"></div>` : ''}
      ${VERADJ.previews && VERADJ.previews.length ? `<div class="calprev">${VERADJ.previews.map((u, i) => `<img src="${u}" alt="Página ${i + 1}">`).join('')}</div>` : ''}
      ${VERADJ.texto ? `<pre class="calpre">${esc(VERADJ.texto.slice(0, 5000))}</pre>` : (!VERADJ.dataUrl && !(VERADJ.previews || []).length ? '<p class="mini">Archivo guardado listo para descargar.</p>' : '')}</section>`;
  }

  function vSombraCard(sl) {
    const ofic = (window.SOMBRA && SOMBRA.cardAdmin(sl)) || '';
    const L = filasSombraProgreso();
    return `${ofic}<section class="card" id="calSombraCard"><div class="row sp"><h3>⚑ Seguimiento Programa Sombra (${L.length})</h3><div class="row">${L.length ? `<button class="btn sm ghost" onclick="CALIF.expSombra()">Exportar Sombra (Excel)</button>` : ''}${sl ? '' : `<button class="btn sm ghost" onclick="CALIF.importarSombras()">Sincronizar de Mi sombra</button>`}</div></div>
      <p class="mini">Seguimiento del progreso entre exámenes oficiales para cadetes marcados en el Programa Sombra (también puedes marcarlos con ☆/⚑ en la tabla de calificaciones).</p>
      ${sl ? '' : `<div class="row" style="margin:8px 0"><input id="som_q" list="calpadlist" placeholder="Cadete o matrícula del padrón" style="flex:2"><input id="som_par" placeholder="Pareja / tutor (opcional)" style="flex:1"><input id="som_nota" placeholder="Nota (opcional)" style="flex:1"><button class="btn sm" onclick="CALIF.addSombra()">+ Agregar</button></div>`}
      ${L.length ? `<div class="tw"><table><tr><th>Cadete</th><th>Año/Gr.</th><th>Pareja / nota</th><th>Exámenes</th><th>Primero → Último</th><th>Progreso</th><th>Meta</th>${sl ? '' : '<th></th>'}</tr>${L.map(x => {
        const dTxt = x.delta == null ? '—' : `<b class="${x.delta >= 0 ? 'okt' : 'badt'}">${x.delta >= 0 ? '▲ +' + x.delta : '▼ ' + x.delta}</b>`;
        return `<tr><td>${esc(x.n)}<small>${esc(x.m || 'sin mat.')}</small></td><td>${x.a ? x.a + '° ' : ''}${esc(x.gp)}</td><td>${esc(x.pareja || '—')}${x.nota ? `<small>${esc(x.nota)}</small>` : ''}</td><td>${x.nEx}</td><td>${x.prim ? `${x.prim.cal} → <b>${x.ult.cal}</b>` : '—'}</td><td>${dTxt}</td><td>${x.ult ? (x.ult.cal >= 60 ? '<b class="okt">Barra I ✔</b>' : `${x.ult.cal}/${x.meta}`) : x.meta}</td>${sl ? '' : `<td><button class="btn sm ghost" onclick="CALIF.toggleSombra('${esc(x.m)}','${esc(x.n)}')" title="Quitar de Programa Sombra">✕</button></td>`}</tr>`;
      }).join('')}</table></div>` : '<p class="mini">Aún no hay cadetes marcados en Programa Sombra.</p>'}
    </section>`;
  }

  function vMando() {
    store();
    const sl = soloVer();
    const all = S.calif, L = filtrarCalif(all);
    const grupos = [...new Set(all.map(r => r.gp).concat(all.map(r => r.gi)).concat(listaPadron().map(c => c.gp)).filter(Boolean))].sort();
    const etiquetas = [...new Set(all.map(r => r.etiqueta || buildEtiqueta(r.tipo, r.fecha)).filter(Boolean))].sort();
    const dist = new Set(L.map(r => r.m || r.n)).size;
    const prom = L.length ? Math.round((L.reduce((s, r) => s + Number(r.cal), 0) / L.length) * 10) / 10 : null;
    const apr = L.filter(r => Number(r.cal) >= 60).length;

    return `${vDatalist()}
      ${sl ? '' : `<section class="card" id="calCarga"><h3>Cargar calificaciones oficiales</h3>
        <p class="mini">Adjunta Excel, CSV, PDF, Word (.docx), imagen o paquete JSON. La app detecta tipo y fecha del encabezado (<b>TIPO MES AÑO</b>) y enlaza cada fila con el padrón antes de guardar.</p>
        <div class="row">
          <label class="btn">📎 Subir archivo (Excel, PDF, Word, imagen, JSON)<input type="file" hidden accept=".xlsx,.xls,.csv,.pdf,.docx,.doc,.json,.png,.jpg,.jpeg,.webp,image/*" onchange="CALIF.cargar(this)"></label>
          <button class="btn ghost" onclick="CALIF.nueva()">+ Captura manual</button>
          <button class="btn ghost" onclick="CALIF.plantilla()">Plantilla CSV</button>
        </div></section>`}
      ${vImportacion()}${vEdicion()}${vAdjunto()}
      <section class="card"><h3>Filtros</h3>
        <div class="filtros">
          <select onchange="CALIF.setF('anio',this.value)"><option value="">Todos los años</option>${[1, 2, 3, 4].map(a => `<option value="${a}" ${CF.anio == a ? 'selected' : ''}>${a}° año</option>`).join('')}</select>
          <select onchange="CALIF.setF('gp',this.value)"><option value="">Todos los grupos</option>${grupos.map(gr => `<option ${CF.gp === gr ? 'selected' : ''}>${esc(gr)}</option>`).join('')}</select>
          <select onchange="CALIF.setF('tipo',this.value)"><option value="">Todos los tipos</option>${TIPOS.map(t => `<option ${CF.tipo === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
          <select onchange="CALIF.setF('etiqueta',this.value)"><option value="">Todas las etiquetas</option>${etiquetas.map(et => `<option ${CF.etiqueta === et ? 'selected' : ''}>${esc(et)}</option>`).join('')}</select>
          <input placeholder="Cadete, matrícula o etiqueta" value="${esc(CF.txt)}" oninput="CALIF.setF('txt',this.value,1)">
        </div>
        <div class="filtros">
          <input type="date" value="${esc(CF.desde)}" onchange="CALIF.setF('desde',this.value)" title="Desde">
          <input type="date" value="${esc(CF.hasta)}" onchange="CALIF.setF('hasta',this.value)" title="Hasta">
          <select onchange="CALIF.setF('rango',this.value)"><option value="">Todas las calificaciones</option><option value="apr" ${CF.rango === 'apr' ? 'selected' : ''}>Aprobadas (≥ 60 Barra I)</option><option value="rep" ${CF.rango === 'rep' ? 'selected' : ''}>Reprobadas (&lt; 60)</option><option value="meta" ${CF.rango === 'meta' ? 'selected' : ''}>Alcanza meta de su año</option><option value="bajo_meta" ${CF.rango === 'bajo_meta' ? 'selected' : ''}>Debajo de su meta</option></select>
          <div class="row" style="gap:6px"><input type="number" min="0" max="100" placeholder="Mín." value="${esc(CF.min)}" onchange="CALIF.setF('min',this.value)" style="width:76px"><input type="number" min="0" max="100" placeholder="Máx." value="${esc(CF.max)}" onchange="CALIF.setF('max',this.value)" style="width:76px"><label class="chk" style="margin:0"><input type="checkbox" ${CF.sombra ? 'checked' : ''} onchange="CALIF.setF('sombra',this.checked)"> Solo Sombra</label><button class="btn sm ghost" onclick="CALIF.limpiarF()">Limpiar</button></div>
        </div>
      </section>
      <section class="kpis"><div><b id="cal-n">${L.length}</b><span>Registros filtrados</span></div><div><b>${dist}</b><span>Cadetes</span></div><div><b>${prom ?? '—'}</b><span>Promedio</span></div><div><b>${L.length ? Math.round(100 * apr / L.length) + '%' : '—'}</b><span>Aprobados (≥ 60)</span></div></section>
      <section class="card"><div class="row sp"><h3>Calificaciones (${L.length})</h3><div class="row"><button class="btn sm" onclick="CALIF.exp('xlsx')">Exportar a Excel</button><button class="btn sm ghost" onclick="CALIF.exp('csv')">CSV</button></div></div>
        ${L.length ? `<div class="tw"><table><tr><th>Nombre</th><th>Año/Gr.</th><th>Etiqueta / Eval.</th><th>Fecha</th><th>Calif.</th><th>Sombra</th><th>Archivo</th>${sl ? '' : '<th></th>'}</tr>${L.slice(0, 500).map(r => {
          const meta = (typeof METAS !== 'undefined' && METAS[r.a]) || 60;
          const et = r.etiqueta || buildEtiqueta(r.tipo, r.fecha);
          const sm = esSombra(r.m, r.n);
          return `<tr><td>${esc(r.n)}<small>${esc(r.m || 'sin matrícula')}</small></td><td>${r.a ? r.a + '° ' : ''}${esc(r.gp)}${r.gi ? ' / ' + esc(r.gi) : ''}</td><td><span class="tag">${esc(et)}</span>${r.eval && r.eval !== et ? `<small>${esc(r.eval)}</small>` : ''}${r.obs ? `<small>${esc(r.obs)}</small>` : ''}</td><td>${esc(r.fecha)}</td><td><b class="${r.cal >= 60 ? 'okt' : (r.cal >= meta ? '' : 'badt')}">${r.cal}</b></td><td>${sl ? (sm ? '<span class="tag">⚑ Sombra</span>' : '—') : `<button class="btn sm ghost" onclick="CALIF.toggleSombra('${esc(r.m)}','${esc(r.n)}')" title="Marcar en Programa Sombra">${sm ? '⚑' : '☆'}</button>`}</td><td>${r.adjId ? `<button class="btn sm ghost" onclick="CALIF.verAdj('${esc(r.adjId)}')">${esc((r.archivo || 'Ver').slice(0, 18))}</button>` : `<small>${esc(r.archivo || '—')}</small>`}</td>${sl ? '' : `<td><button class="btn sm ghost" onclick="CALIF.editar('${esc(r.id)}')">✏️</button><button class="btn sm ghost" onclick="CALIF.borrar('${esc(r.id)}')">✕</button></td>`}</tr>`;
        }).join('')}</table></div>` : '<p class="mini">No hay calificaciones registradas con estos filtros.</p>'}
      </section>
      ${vSombraCard(sl)}
      ${S.califAdj.length ? `<section class="card"><h3>Archivos adjuntos (${S.califAdj.length})</h3><div class="tw"><table><tr><th>Archivo</th><th>Tipo</th><th>Fecha</th><th>Registros</th><th></th></tr>${S.califAdj.map(a => `<tr><td>${esc(a.nombre)}</td><td>${esc(a.tipo)}</td><td>${esc(a.fecha)}</td><td>${a.nReg}</td><td><button class="btn sm ghost" onclick="CALIF.verAdj('${esc(a.id)}')">Ver</button><button class="btn sm ghost" onclick="CALIF.descargarAdj('${esc(a.id)}')">⬇</button>${sl ? '' : `<button class="btn sm ghost" onclick="CALIF.borrarAdj('${esc(a.id)}')">✕</button>`}</td></tr>`).join('')}</table></div></section>` : ''}`;
  }

  function setMapCol(j, campo) {
    if (!IMP) return;
    for (const k of Object.keys(IMP.map)) if (IMP.map[k] === j) delete IMP.map[k];
    if (campo) IMP.map[campo] = j;
    IMP.items = construirFilasMapeadas(IMP);
    render();
  }
  function setF(k, v, noBlur) {
    CF[k] = v;
    if (noBlur) { const pos = document.activeElement && document.activeElement.selectionStart; render(); const inp = document.querySelector('.filtros input[oninput*="txt"]'); if (inp) { inp.focus(); try { inp.setSelectionRange(pos, pos); } catch (e) { } } return; }
    render();
  }
  function limpiarF() { CF = { anio: '', gp: '', txt: '', tipo: '', etiqueta: '', desde: '', hasta: '', rango: '', min: '', max: '', sombra: false }; render(); }

  window.CALIF = {
    vCadete, vMando, hoyCard, fichaResumen, cargar: cargarArchivo, setSheet, setMapCol, setImpMeta, editImp: editImpItem, delImp: quitarImpItem,
    addManual: agregarImpManual, pegar: pegarBloque, guardarImp: guardarImportacion, cancelar: cancelarImportacion,
    nueva: abrirNueva, editar, borrar, guardarEdit: guardarEdicion, cancelarEdit: () => { EDIT = null; render(); }, autoEdit: autollenarEdicion,
    toggleSombra, addSombra: agregarSombra, importarSombras: importarSombrasApp, expSombra, pushSombrasHoja,
    verAdj, descargarAdj, borrarAdj, cerrarAdj: () => { VERADJ = null; render(); },
    setF, limpiarF, exp, plantilla, sync: syncCadete, fusionarDesdeHoja, fusionarSombrasDesdeHoja, gradesForCadet,
    _et: buildEtiqueta, _filtrar: () => filtrarCalif(store().calif), _filasExp: () => filasExp(filtrarCalif(store().calif)),
    _imp: () => IMP
  };
})();
