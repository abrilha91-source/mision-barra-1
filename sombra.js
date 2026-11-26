/* v2.15 · Programa Sombra oficial (Senior / Junior a partir de ALCPT NOV 2026).
   La asignación con nombres reales no va en este archivo: se calcula en el equipo y se guarda en la Hoja y en PRIVADO. */
(function () {
  const SEMILLA = 20261121;
  const ETIQUETA_BASE = 'ALCPT NOV 2026';
  const FECHA_BASE = '2026-11-21';
  const GEN = 'mulberry32';

  const DINAMICA = `<h3>Dinámica (realista, poco tiempo)</h3>
    <p>Dos sesiones por semana de <b>20 minutos</b>. Si una semana no alcanzan las dos, al menos una de 25 a 30 minutos. El senior guía y el junior practica en esta app (juntos en un equipo o cada quien en el suyo, y registran la sesión).</p>
    <ol>
      <li><b>4 min · Vocabulario.</b> Flash cards del tema que más le cueste al junior (mazo ALCPT o ALC). El senior pregunta en voz alta y corrige pronunciación.</li>
      <li><b>12 min · Eje de la semana</b> (se alterna):
        <ul>
          <li><b>Semanas impares · comprensión auditiva:</b> Listening Lab, 10 audios (diálogos cortos, dictado o «¿Cuál escuchaste?»), velocidad normal o lenta.</li>
          <li><b>Semanas pares · lectura, vocabulario y gramática:</b> Completa la palabra (unas 10 oraciones) y, si alcanza, revisión de errores o un bloque corto de práctica tipo examen.</li>
        </ul>
      </li>
      <li><b>4 min · Cierre.</b> Anotan 3 errores o palabras para la siguiente sesión y registran lo hecho en <b>Mi sombra › Registrar sesión</b>.</li>
    </ol>
    <h3>Puntos de control</h3>
    <ul>
      <li><b>Semanal:</b> la pareja registra por lo menos una sesión (lo ideal son dos).</li>
      <li><b>Cada 3 semanas:</b> un simulacro corto de 20 preguntas (15 min) en la app. Es práctica, no calificación oficial; se anota en la sesión.</li>
      <li><b>Oficial:</b> el próximo ALCPT se compara con el de noviembre de 2026. El avance es en puntos porcentuales (calificación nueva − calificación de noviembre). El senior cuyos juniors sumen más avance en porcentaje obtendrá un <b>beneficio adicional</b>.</li>
    </ul>`;

  const AYUDA_HTML = `<h3>Qué es el Programa Sombra</h3>
    <p>Es un programa de tutoría entre pares de la Mesa de Inglés. Un cadete con mejor resultado en el último ALCPT (noviembre de 2026) acompaña a compañeros que necesitan reforzar comprensión auditiva y lectura, vocabulario y gramática, usando esta misma aplicación.</p>
    <h3>Quiénes son Senior shadow y Junior shadow</h3>
    <p>Sin importar el año: <b>Senior shadow</b> es quien obtuvo <b>más de 70</b> en el ALCPT de noviembre de 2026. <b>Junior shadow</b> es quien obtuvo <b>menos de 70</b>. A cada senior se le asignan juniors en cantidades lo más iguales posible; cada senior tiene al menos a uno de los juniors con el puntaje más bajo. Quien obtuvo <b>exactamente 70</b> queda pendiente y no se asigna en esta ronda. El senior ve a sus juniors en <b>Mi sombra</b>; el junior ve quién es su senior.</p>
    ${DINAMICA}
    <p>El senior cuyos juniors sumen más avance en porcentaje en el próximo ALCPT obtendrá un <b>beneficio adicional</b>.</p>`;

  function mulberry32(a) {
    return function () {
      let t = a = (a + 0x6D2B79F5) | 0;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function shuffle(arr, rand) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  const normM = m => (typeof normMat0 === 'function' ? normMat0(m) : (typeof normMat === 'function' ? normMat(m) : String(m || '')));
  const sin = s => (typeof sinAc === 'function' ? sinAc(s) : String(s || '').toUpperCase());
  function keyOf(p) {
    const m = normM(p && p.m);
    return m || ('N:' + sin(p && p.n));
  }
  function store() {
    S.sombraProg = S.sombraProg && typeof S.sombraProg === 'object' ? S.sombraProg : null;
    S.sombraSesiones = Array.isArray(S.sombraSesiones) ? S.sombraSesiones : [];
    S.califSombra = S.califSombra && typeof S.califSombra === 'object' ? S.califSombra : {};
  }

  function listaBase(calif) {
    const L = Array.isArray(calif) ? calif : ((S && S.calif) || []);
    const map = {};
    L.forEach(r => {
      if (!r || String(r.etiqueta || '').trim() !== ETIQUETA_BASE) return;
      const c = Number(r.cal);
      if (isNaN(c)) return;
      const rec = { m: normM(r.m), n: String(r.n || '').trim(), a: r.a || '', gp: String(r.gp || '').trim(), gi: String(r.gi || '').trim(), cal: c, id: r.id, fecha: r.fecha || FECHA_BASE, etiqueta: ETIQUETA_BASE };
      map[keyOf(rec)] = rec;
    });
    return Object.values(map);
  }
  function clasificar(lista) {
    const L = lista || listaBase();
    return {
      seniors: L.filter(p => p.cal > 70),
      juniors: L.filter(p => p.cal < 70),
      pendientes70: L.filter(p => p.cal === 70)
    };
  }

  function asignar(seniors, juniors, seed) {
    const N = seniors.length, M = juniors.length, sem = seed == null ? SEMILLA : seed;
    if (!N || !M) return { ok: false, motivo: 'sin_datos', n_sen: N, n_jun: M, semilla: sem, asign: {} };
    if (N > M) return { ok: false, motivo: 'mas_seniors_que_juniors', n_sen: N, n_jun: M, semilla: sem, asign: {} };
    const cmpS = (a, b) => String(a.n || '') < String(b.n || '') ? -1 : String(a.n || '') > String(b.n || '') ? 1 : (String(a.m || '') < String(b.m || '') ? -1 : String(a.m || '') > String(b.m || '') ? 1 : 0);
    const senHi = seniors.slice().sort((a, b) => b.cal - a.cal || cmpS(a, b));
    const junLo = juniors.slice().sort((a, b) => a.cal - b.cal || cmpS(a, b));
    const lowest = junLo.slice(0, N), rest = junLo.slice(N);
    const asign = {}; seniors.forEach(s => { asign[keyOf(s)] = []; });
    const origen = {};
    senHi.forEach((s, i) => { asign[keyOf(s)].push(lowest[i]); origen[keyOf(lowest[i])] = 'mas_bajo'; });
    const base = Math.floor(M / N), extra = M % N;
    const rand = mulberry32(sem);
    const kst = (a, b) => (String(a.n || '') < String(b.n || '') ? -1 : String(a.n || '') > String(b.n || '') ? 1 : (String(a.m || '') < String(b.m || '') ? -1 : String(a.m || '') > String(b.m || '') ? 1 : (a.cal - b.cal)));
    const senSh = shuffle(seniors.slice().sort(kst), rand);
    const restSh = shuffle(rest.slice().sort(kst), rand);
    const target = {}; seniors.forEach(s => { target[keyOf(s)] = base; });
    senSh.slice(0, extra).forEach(s => { target[keyOf(s)] = base + 1; });
    let i = 0;
    restSh.forEach(j => {
      for (let k = 0; k < N; k++) {
        const s = senSh[i % N]; i++;
        const sk = keyOf(s);
        if (asign[sk].length < target[sk]) { asign[sk].push(j); origen[keyOf(j)] = 'aleatorio'; return; }
      }
    });
    const counts = Object.keys(asign).map(k => asign[k].length);
    return { ok: true, semilla: sem, generador: GEN, n_sen: N, n_jun: M, base, extra, por_min: Math.min.apply(null, counts), por_max: Math.max.apply(null, counts), origen, asign, seniors, juniors };
  }

  function preview() {
    const c = clasificar();
    const r = asignar(c.seniors, c.juniors, SEMILLA);
    return Object.assign({ pendientes70: c.pendientes70 }, r);
  }

  function examenesOficiales(m, n) {
    const L = (S && S.calif) || [];
    const k = keyOf({ m, n });
    return L.filter(r => {
      if (keyOf(r) !== k) return false;
      const t = String(r.tipo || r.etiqueta || '').toUpperCase();
      return t.indexOf('ALCPT') >= 0;
    }).slice().sort((a, b) => String(a.fecha || '').localeCompare(String(b.fecha || '')) || (a.ts || 0) - (b.ts || 0));
  }
  function calNov(p) {
    if (p && p.cal != null && p.calBase == null) {
      const hit = examenesOficiales(p.m, p.n).filter(r => String(r.etiqueta || '').trim() === ETIQUETA_BASE)[0];
      if (hit) return Number(hit.cal);
      if (p.cal != null) return Number(p.cal);
    }
    if (p && p.calBase != null) return Number(p.calBase);
    const hit = examenesOficiales(p.m, p.n).filter(r => String(r.etiqueta || '').trim() === ETIQUETA_BASE)[0];
    return hit ? Number(hit.cal) : null;
  }
  function calProx(p) {
    const xs = examenesOficiales(p.m, p.n).filter(r => {
      const et = String(r.etiqueta || '').trim();
      const fe = String(r.fecha || '');
      if (et === ETIQUETA_BASE) return false;
      if (fe && fe > FECHA_BASE) return true;
      return false;
    });
    return xs.length ? Number(xs[xs.length - 1].cal) : null;
  }
  function avanceDe(p) {
    const a = calNov(p), b = calProx(p);
    if (a == null || b == null || isNaN(a) || isNaN(b)) return null;
    return Math.round((b - a) * 10) / 10;
  }

  function construirPrograma(res) {
    const senBy = {};
    (res.seniors || []).forEach(s => { senBy[keyOf(s)] = s; });
    const pares = Object.keys(res.asign).map(sk => {
      const s = senBy[sk];
      const juniors = (res.asign[sk] || []).slice().sort((a, b) => a.cal - b.cal || String(a.n).localeCompare(String(b.n), 'es'));
      return { senior: s, juniors };
    }).filter(x => x.senior).sort((a, b) => b.senior.cal - a.senior.cal || String(a.senior.n).localeCompare(String(b.senior.n), 'es'));
    return {
      activo: true, iniciado: new Date().toISOString(), semilla: res.semilla, generador: GEN,
      etiquetaBase: ETIQUETA_BASE, fechaBase: FECHA_BASE,
      nSen: res.n_sen, nJun: res.n_jun, porMin: res.por_min, porMax: res.por_max,
      pendientes70: (res.pendientes70 || []).map(p => Object.assign({}, p)),
      pares
    };
  }

  function aplicarACalifSombra(prog) {
    store();
    const ts = Date.now();
    const lote = [];
    const keep = {};
    (prog.pares || []).forEach(par => {
      const s = par.senior;
      const sk = keyOf(s);
      const nJ = par.juniors.length;
      const nombres = par.juniors.map(j => j.n.split(' ')[0]).slice(0, 3).join(', ');
      S.califSombra[sk] = { key: sk, m: s.m, n: s.n, pareja: nJ + ' junior(s)', nota: 'Senior shadow · ' + ETIQUETA_BASE + ' · ' + s.cal, activo: true, ts, rol: 'senior', seniorMat: s.m, a: s.a, gp: s.gp, calBase: s.cal, etiquetaBase: ETIQUETA_BASE };
      keep[sk] = 1;
      lote.push(Object.assign({}, S.califSombra[sk], { activo: 1 }));
      par.juniors.forEach(j => {
        const jk = keyOf(j);
        const tipo = 'junior';
        S.califSombra[jk] = { key: jk, m: j.m, n: j.n, pareja: s.n + (s.m ? ' (' + s.m + ')' : ''), nota: 'Junior shadow · ' + ETIQUETA_BASE + ' · ' + j.cal, activo: true, ts, rol: 'junior', seniorMat: s.m, seniorNom: s.n, a: j.a, gp: j.gp, calBase: j.cal, etiquetaBase: ETIQUETA_BASE };
        keep[jk] = 1;
        lote.push(Object.assign({}, S.califSombra[jk], { activo: 1 }));
      });
    });
    (prog.pendientes70 || []).forEach(p => {
      const k = keyOf(p);
      S.califSombra[k] = { key: k, m: p.m, n: p.n, pareja: '', nota: 'Pendiente (puntaje 70) · ' + ETIQUETA_BASE, activo: false, ts, rol: 'pendiente', a: p.a, gp: p.gp, calBase: p.cal, etiquetaBase: ETIQUETA_BASE };
      lote.push(Object.assign({}, S.califSombra[k], { activo: 0 }));
    });
    Object.keys(S.califSombra).forEach(k => {
      const x = S.califSombra[k];
      if (x && x.activo && (x.rol === 'senior' || x.rol === 'junior') && !keep[k]) {
        x.activo = false; lote.push(Object.assign({}, x, { activo: 0 }));
        delete S.califSombra[k];
      }
    });
    if (typeof CALIF !== 'undefined' && CALIF && typeof pushSombras === 'function') { /* noop */ }
    return lote;
  }

  function pushLote(lote) {
    if (typeof CALIF !== 'undefined' && CALIF.pushSombrasHoja) CALIF.pushSombrasHoja(lote);
    else if (typeof window !== 'undefined' && window._pushSombrasHoja) window._pushSombrasHoja(lote);
    else {
      try {
        if (REAL || SRV || !SHEET || !(HV.v >= 4)) return;
        const k = localStorage.getItem('mb1_hk') || '';
        if (!k) return;
        fetch(SHEET, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ tipoRegistro: 'sombra_lote', clave: k, datos: { items: lote } }) }).catch(() => { });
      } catch (e) { }
    }
  }

  function iniciar(silencio) {
    if (typeof soloLectura === 'function' && soloLectura()) return typeof bloquearEscritura === 'function' ? bloquearEscritura() : toast('Solo Administración puede iniciar el programa.');
    if (typeof esAdmin === 'function' && !esAdmin()) return toast('Solo Administración puede iniciar el Programa Sombra.');
    const c = clasificar();
    if (!c.seniors.length || !c.juniors.length) return toast('No encuentro calificaciones ALCPT NOV 2026 en este equipo. Actualiza la Hoja en Calificaciones e inténtalo de nuevo.');
    const r = asignar(c.seniors, c.juniors, SEMILLA);
    if (!r.ok && r.motivo === 'mas_seniors_que_juniors') return toast('Hay más Senior shadow que Junior shadow. No se asignó: hay que definir una regla antes de continuar.');
    if (!r.ok) return toast('No se pudo calcular la asignación.');
    r.pendientes70 = c.pendientes70;
    const msg = `Se iniciará el Programa Sombra con ${r.n_sen} Senior shadow y ${r.n_jun} Junior shadow (ALCPT NOV 2026). ` +
      `Cada senior tendrá ${r.por_min === r.por_max ? r.por_min : r.por_min + ' o ' + r.por_max} juniors (semilla ${SEMILLA}). ` +
      (c.pendientes70.length ? c.pendientes70.length + ' cadete(s) con exactamente 70 quedan pendientes y no se asignan. ' : '') +
      'Se guardará en este equipo y en la Hoja. ¿Continuar?';
    if (!silencio && !confirm(msg)) return;
    store();
    const prog = construirPrograma(r);
    S.sombraProg = prog;
    const lote = aplicarACalifSombra(prog);
    pushLote(lote);
    if (typeof save === 'function') save();
    if (typeof render === 'function') render();
    if (!silencio) toast('Programa Sombra iniciado: ' + r.n_sen + ' seniors, ' + r.n_jun + ' juniors.');
    return prog;
  }

  function reconstruirDesdeSombras() {
    store();
    const seniors = [], juniors = [], pend = [];
    Object.values(S.califSombra || {}).forEach(x => {
      if (!x) return;
      if (x.rol === 'pendiente' || /Pendiente \(puntaje 70\)/.test(x.nota || '')) { pend.push(x); return; }
      if (!x.activo) return;
      if (x.rol === 'senior' || /Senior shadow/.test(x.nota || '')) seniors.push(x);
      if (x.rol === 'junior' || /Junior shadow/.test(x.nota || '')) juniors.push(x);
    });
    if (!seniors.length) return null;
    const pares = seniors.map(s => {
      const juniorsDe = juniors.filter(j => normM(j.seniorMat) === normM(s.m) || (j.pareja || '').indexOf(s.n) === 0 || (j.pareja || '').indexOf(s.m) >= 0);
      return { senior: { m: s.m, n: s.n, a: s.a, gp: s.gp, cal: s.calBase }, juniors: juniorsDe.map(j => ({ m: j.m, n: j.n, a: j.a, gp: j.gp, cal: j.calBase })) };
    });
    return {
      activo: true, iniciado: '', semilla: SEMILLA, generador: GEN, etiquetaBase: ETIQUETA_BASE, fechaBase: FECHA_BASE,
      nSen: seniors.length, nJun: juniors.length, pares, pendientes70: pend.map(p => ({ m: p.m, n: p.n, a: p.a, gp: p.gp, cal: p.calBase }))
    };
  }
  function programa() {
    store();
    if (S.sombraProg && S.sombraProg.activo && (S.sombraProg.pares || []).length) return S.sombraProg;
    const rec = reconstruirDesdeSombras();
    if (rec) { S.sombraProg = rec; return rec; }
    return S.sombraProg;
  }

  function filasSeguimiento() {
    const p = programa();
    if (!p || !p.pares) return [];
    return p.pares.map(par => {
      const juniors = par.juniors.map(j => {
        const nov = calNov(j), prox = calProx(j), av = avanceDe(j);
        return Object.assign({}, j, { nov, prox, avance: av });
      });
      const conProx = juniors.filter(j => j.avance != null);
      const suma = conProx.length ? Math.round(conProx.reduce((s, j) => s + j.avance, 0) * 10) / 10 : null;
      const ses = sesionesDe(par.senior.m).length + juniors.reduce((s, j) => s + sesionesDe(j.m).length, 0);
      return { senior: par.senior, juniors, suma, nProx: conProx.length, nJun: juniors.length, sesiones: ses };
    }).sort((a, b) => (b.suma == null ? -1e9 : b.suma) - (a.suma == null ? -1e9 : a.suma) || String(a.senior.n).localeCompare(String(b.senior.n), 'es'));
  }

  function deCadete(p) {
    if (!p) return null;
    const prog = programa();
    const k = keyOf(p);
    if (prog && prog.pares) {
      for (let i = 0; i < prog.pares.length; i++) {
        const par = prog.pares[i];
        if (keyOf(par.senior) === k) return { rol: 'senior', senior: par.senior, juniors: par.juniors };
        const j = par.juniors.find(x => keyOf(x) === k);
        if (j) return { rol: 'junior', senior: par.senior, juniors: [j], yo: j };
      }
      const pend = (prog.pendientes70 || []).find(x => keyOf(x) === k);
      if (pend) return { rol: 'pendiente', yo: pend };
    }
    const cad = S.califCad && S.califCad[normM(p.m)] && S.califCad[normM(p.m)].sombra;
    if (cad && cad.rol) return cad;
    return null;
  }

  function sesionesDe(m) {
    store();
    const mm = normM(m);
    return (S.sombraSesiones || []).filter(s => normM(s.m) === mm || (s.contra && normM(s.contra) === mm)).slice().sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  }
  function registrarSesion(datos) {
    const p = typeof P === 'function' ? P() : null;
    if (!p) return toast('Inicia sesión como cadete.');
    store();
    const minutos = Number(datos && datos.minutos) || 20;
    const ejercicios = (datos && datos.ejercicios) || [];
    const nota = String((datos && datos.nota) || '').slice(0, 240);
    const ofic = deCadete(p);
    const rec = {
      ts: (typeof tsLocal === 'function' ? tsLocal() : new Date().toISOString()),
      m: p.m, n: p.nombre, rol: ofic && ofic.rol || '',
      contra: ofic && ofic.rol === 'junior' && ofic.senior ? ofic.senior.m : '',
      minutos, ejercicios, nota, equipo: typeof EQUIPO !== 'undefined' ? EQUIPO : ''
    };
    S.sombraSesiones.push(rec);
    if (typeof save === 'function') save();
    try {
      if (typeof enviar === 'function') enviar('api/actividad', { ts: rec.ts, m: p.m, nombre: p.nombre, perfil: 'cadete', anio: p.anio, gp: p.gp, gi: p.gi, tipo: 'Programa Sombra', tema: (ejercicios || []).join(', ') || 'Sesión', preguntas: 0, aciertos: 0, duracion_s: minutos * 60, equipo: rec.equipo });
    } catch (e) { }
    if (typeof render === 'function') render();
    toast('Sesión registrada (' + minutos + ' min).');
  }

  function fmtAv(v) {
    if (v == null) return 'Pendiente';
    const cls = v >= 0 ? 'okt' : 'badt';
    return `<b class="${cls}">${v >= 0 ? '▲ +' + v : '▼ ' + v}</b>`;
  }

  function cardAdmin(sl) {
    const prev = (S.calif && S.calif.some(r => String(r.etiqueta || '').trim() === ETIQUETA_BASE)) ? preview() : null;
    const prog = programa();
    const filas = prog && prog.activo ? filasSeguimiento() : [];
    const puede = !sl && typeof esAdmin === 'function' && esAdmin();
    const cuenta = prev && prev.ok
      ? `<p class="mini">Con ALCPT NOV 2026 en este equipo: <b>${prev.n_sen}</b> Senior shadow (&gt; 70), <b>${prev.n_jun}</b> Junior shadow (&lt; 70), <b>${(prev.pendientes70 || []).length}</b> con exactamente 70 (pendientes, no se asignan). Carga: ${prev.por_min === prev.por_max ? prev.por_min : prev.por_min + ' o ' + prev.por_max} juniors por senior. Semilla del reparto aleatorio: <b>${SEMILLA}</b>.</p>`
      : '<p class="mini">Para iniciar, actualiza las calificaciones de la Hoja (etiqueta ALCPT NOV 2026) en esta pestaña.</p>';
    const btn = puede
      ? `<div class="row"><button class="btn" id="btnIniciaSombra" onclick="SOMBRA.iniciar()">${prog && prog.activo ? 'Reiniciar asignación oficial' : 'Iniciar Programa Sombra'}</button>
         ${prog && prog.activo ? '<button class="btn sm ghost" onclick="SOMBRA.expSeguimiento()">Exportar seguimiento (Excel)</button>' : ''}</div>`
      : (sl ? '<p class="mini">Solo consulta.</p>' : '');
    const pendTxt = prog && (prog.pendientes70 || []).length
      ? `<p class="mini">Pendientes con 70 (no asignados): ${(prog.pendientes70 || []).map(p => esc(p.n) + ' (' + (p.a ? p.a + '° ' : '') + esc(p.gp || '') + ')').join(' · ')}.</p>`
      : '';
    const tabla = filas.length ? `<div class="tw" id="sombraSeguimiento"><table><tr><th>#</th><th>Senior shadow</th><th>Puntaje nov.</th><th>Juniors</th><th>Avance sumado</th><th>Con próximo ALCPT</th><th>Sesiones</th></tr>${filas.map((f, i) => {
      const det = f.juniors.map(j => `<tr><td></td><td colspan="2"><small>${esc(j.n)}${j.m ? ' · ' + esc(j.m) : ''}</small></td><td>${j.nov != null ? j.nov : '—'}</td><td>${j.prox != null ? j.prox : 'Pendiente'}</td><td>${fmtAv(j.avance)}</td><td>${(j.a ? j.a + '° ' : '')}${esc(j.gp || '')}</td></tr>`).join('');
      return `<tr class="sombra-sen"><td>${i + 1}</td><td>${esc(f.senior.n)}<small>${esc(f.senior.m || '')}</small></td><td>${f.senior.cal != null ? f.senior.cal : '—'}</td><td>${f.nJun}</td><td>${f.suma == null ? '—' : fmtAv(f.suma)}</td><td>${f.nProx}/${f.nJun}</td><td>${f.sesiones || '—'}</td></tr>${det}`;
    }).join('')}</table></div>
      <p class="mini">Clasificación de seniors por avance sumado (puntos porcentuales) de sus juniors en el próximo ALCPT respecto de noviembre de 2026. Quien aún no presenta el próximo examen aparece como pendiente y no entra a la suma.</p>` : (prog && prog.activo ? '<p class="mini">Asignación activa, sin filas para mostrar.</p>' : '');

    return `<section class="card" id="sombraOficialCard">
      <div class="row sp"><h3>⚑ Programa Sombra oficial</h3></div>
      <p class="mini">A partir del último ALCPT (noviembre 2026), Administración inicia el programa: seniors (&gt; 70) y juniors (&lt; 70), con seguimiento del avance al próximo examen y una clasificación por avance sumado.</p>
      ${cuenta}${btn}${pendTxt}${tabla}
      <details class="sombra-din"><summary>Ejercicios y dinámica</summary>${DINAMICA}</details>
    </section>`;
  }

  function vistaCadete(p) {
    const ofic = deCadete(p);
    let oficial = '';
    if (ofic && ofic.rol === 'senior') {
      const f = (filasSeguimiento().find(x => keyOf(x.senior) === keyOf(ofic.senior))) || { juniors: ofic.juniors.map(j => Object.assign({}, j, { nov: calNov(j), prox: calProx(j), avance: avanceDe(j) })), suma: null };
      oficial = `<section class="card" id="sombraCadeteCard"><h3>Eres Senior shadow</h3>
        <p>Acompañas a <b>${(f.juniors || ofic.juniors).length}</b> Junior shadow. En el próximo ALCPT se suma el avance en porcentaje de tus juniors (respecto de noviembre de 2026). El senior con más avance sumado obtendrá un <b>beneficio adicional</b>.</p>
        <div class="tw"><table><tr><th>Junior</th><th>Año / grupo</th><th>ALCPT nov. 2026</th><th>Próximo ALCPT</th><th>Avance</th></tr>${(f.juniors || []).map(j => `<tr><td>${esc(j.n)}<small>${esc(j.m || '')}</small></td><td>${j.a ? j.a + '° ' : ''}${esc(j.gp || '')}</td><td>${j.nov != null ? j.nov : (j.cal != null ? j.cal : '—')}</td><td>${j.prox != null ? j.prox : 'Pendiente'}</td><td>${fmtAv(j.avance)}</td></tr>`).join('')}</table></div>
        ${f.suma != null ? `<p class="mini">Avance sumado actual: ${fmtAv(f.suma)}.</p>` : '<p class="mini">El avance sumado aparecerá cuando se registre el próximo ALCPT oficial.</p>'}
        ${formSesion(p, ofic)}</section>`;
    } else if (ofic && ofic.rol === 'junior') {
      const s = ofic.senior || {};
      oficial = `<section class="card" id="sombraCadeteCard"><h3>Eres Junior shadow</h3>
        <p>Tu Senior shadow es <b>${esc(s.n || '—')}</b>${s.m ? ' (' + esc(s.m) + ')' : ''}. Practican juntos en esta app (listening, vocabulario, gramática y simulacros cortos). El avance de tus juniors (tú y tus compañeros de grupo) se suma para tu senior en el próximo ALCPT.</p>
        <p class="mini">Tu ALCPT de noviembre de 2026: <b>${calNov(ofic.yo || p) ?? (ofic.yo && ofic.yo.cal) ?? '—'}</b>${calProx(ofic.yo || p) != null ? ' · próximo: <b>' + calProx(ofic.yo || p) + '</b> · avance ' + fmtAv(avanceDe(ofic.yo || p)) : ' · el próximo ALCPT oficial aún no está registrado'}.</p>
        ${formSesion(p, ofic)}</section>`;
    } else if (ofic && ofic.rol === 'pendiente') {
      oficial = `<section class="card" id="sombraCadeteCard"><h3>Programa Sombra</h3><p>Tu calificación en el ALCPT de noviembre de 2026 fue exactamente 70, así que en esta ronda quedaste en lista de espera (no senior ni junior). La Mesa de Inglés te indicará si te incorpora más adelante.</p></section>`;
    } else if (programa() && programa().activo) {
      oficial = `<section class="card" id="sombraCadeteCard"><h3>Programa Sombra</h3><p class="mini">El programa oficial ya inició. Si no ves tu asignación, actualiza tus calificaciones oficiales (matrícula y primer apellido) o pregunta a la Mesa de Inglés.</p></section>`;
    }
    return oficial;
  }

  function formSesion(p, ofic) {
    const ses = sesionesDe(p.m).slice(0, 6);
    const ops = [['vocab', 'Vocabulario (flash cards)'], ['listening', 'Listening Lab'], ['completa', 'Completa la palabra'], ['simulacro', 'Simulacro corto (20)'], ['errores', 'Revisión de errores']];
    return `<div class="sombra-ses"><h3>Registrar sesión</h3>
      <p class="mini">20 minutos, dos veces por semana (si no se puede, al menos una de 25–30 min). Marca lo que practicaron.</p>
      <div class="row" style="flex-wrap:wrap">${ops.map(o => `<label class="chk"><input type="checkbox" class="som-ej" value="${o[0]}"> ${o[1]}</label>`).join('')}</div>
      <div class="row"><label>Minutos <select id="som_min">${[15, 20, 25, 30].map(n => `<option ${n === 20 ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        <input id="som_nota" placeholder="Nota breve (3 errores, tema…)" style="flex:1">
        <button class="btn sm" onclick="SOMBRA.guardarSesionUI()">Registrar</button></div>
      ${ses.length ? `<div class="tw"><table><tr><th>Fecha</th><th>Min</th><th>Ejercicios</th><th>Nota</th></tr>${ses.map(s => `<tr><td>${esc(s.ts)}</td><td>${s.minutos || '—'}</td><td>${esc((s.ejercicios || []).join(', ') || '—')}</td><td>${esc(s.nota || '')}</td></tr>`).join('')}</table></div>` : '<p class="mini">Aún no registras sesiones en este equipo.</p>'}
    </div>`;
  }
  function guardarSesionUI() {
    const ejercicios = Array.from(document.querySelectorAll('.som-ej:checked')).map(x => x.value);
    const minutos = +((document.getElementById('som_min') || {}).value || 20);
    const nota = ((document.getElementById('som_nota') || {}).value || '').trim();
    if (!ejercicios.length && !nota) return toast('Marca al menos un ejercicio o escribe una nota.');
    registrarSesion({ minutos, ejercicios, nota });
  }

  function expSeguimiento() {
    const filas = filasSeguimiento();
    if (!filas.length) return toast('Aún no hay asignación oficial.');
    const rows = [];
    filas.forEach((f, i) => {
      f.juniors.forEach(j => {
        rows.push({
          Lugar: i + 1, Senior: f.senior.n, 'Mat. senior': f.senior.m, 'Puntaje senior nov.': f.senior.cal,
          Junior: j.n, 'Mat. junior': j.m, Año: j.a || '', Grupo: j.gp || '',
          'ALCPT NOV 2026': j.nov, 'Próximo ALCPT': j.prox == null ? '' : j.prox,
          'Avance (pts porcentuales)': j.avance == null ? '' : j.avance,
          'Avance sumado del senior': f.suma == null ? '' : f.suma
        });
      });
    });
    if (typeof exportar === 'function') exportar(rows, 'Programa_Sombra_Seguimiento', 'xlsx');
  }

  function aplicarSombraRemota(sombra) {
    if (!sombra || !sombra.rol) return;
    store();
    const p = typeof P === 'function' ? P() : null;
    if (!p) return;
    const m = normM(p.m);
    S.califCad = S.califCad || {};
    S.califCad[m] = Object.assign({}, S.califCad[m] || {}, { sombra });
  }

  window.SOMBRA = {
    SEMILLA, ETIQUETA_BASE, FECHA_BASE, AYUDA_HTML, DINAMICA,
    mulberry32, shuffle, keyOf, clasificar, asignar, preview, iniciar,
    programa, filasSeguimiento, deCadete, cardAdmin, vistaCadete,
    registrarSesion, guardarSesionUI, expSeguimiento, aplicarSombraRemota,
    listaBase, calNov, calProx, avanceDe, reconstruirDesdeSombras
  };
})();
