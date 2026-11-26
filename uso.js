/* v2.15 · Uso de la app (con o sin internet) e ingresos de la Directora.
   Solo Administración ve el panel (Ajustes). El pulso del dispositivo no lleva la clave de lectura. */
(function () {
  const ST = { t: 0, err: '', disp: [], ing: [], filtro: { modo: '', anio: '', perfil: '', txt: '' } };
  let lastPulso = 0;

  const g = (r, ...ks) => {
    for (const k of ks) if (r && r[k] != null && String(r[k]).trim() !== '') return r[k];
    return '';
  };
  function normIng(r) {
    return {
      ts: String(g(r, 'ts', 'Fecha/hora', 'Fecha/Hora') || ''),
      perfil: String(g(r, 'perfil', 'Perfil') || ''),
      nombre: String(g(r, 'nombre', 'Nombre') || ''),
      m: typeof normMat === 'function' ? normMat(g(r, 'm', 'Matrícula')) : String(g(r, 'm', 'Matrícula') || ''),
      anio: g(r, 'anio', 'Año'),
      gp: String(g(r, 'gp', 'Grupo ped.', 'Grupo') || ''),
      gi: String(g(r, 'gi', 'Grupo inglés') || ''),
      cia: String(g(r, 'cia', 'Compañía') || ''),
      equipo: String(g(r, 'equipo', 'Equipo') || ''),
      ver: String(g(r, 'ver', 'Versión', 'Version') || ''),
      modo: String(g(r, 'modo', 'Modo') || '')
    };
  }
  function colaPendiente() {
    return ((S.colaH || []).length + (S.colaH2 || []).length + (S.cola || []).length);
  }
  function lastSync() { try { return localStorage.getItem('mb1_last_sync') || ''; } catch (e) { return ''; } }
  function marcarSync() { try { localStorage.setItem('mb1_last_sync', new Date().toISOString()); } catch (e) { } }
  function marcarUsoLocal() { try { localStorage.setItem('mb1_last_local', new Date().toISOString()); if (!navigator.onLine) localStorage.setItem('mb1_uso_off', '1'); } catch (e) { } }
  function modoActual() {
    if (!navigator.onLine) return 'offline';
    try { if (localStorage.getItem('mb1_uso_off') === '1') return 'offline'; } catch (e) { }
    return 'online';
  }
  function etiquetaModo(modo) {
    const m = String(modo || '').toLowerCase();
    if (m === 'online' || m === 'en linea' || m === 'en línea') return { cls: 'uso-on', txt: 'Con internet (sincronizada)' };
    if (m === 'offline' || m === 'sin internet') return { cls: 'uso-off', txt: 'Sin internet (datos locales)' };
    return { cls: 'uso-sin', txt: 'Sin reporte' };
  }
  function fmtFecha(s) {
    if (!s) return '—';
    const d = new Date(s);
    if (!isNaN(d.getTime()) && /T|\d{4}-/.test(String(s))) return d.toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
    return String(s);
  }
  function sesionReportable() {
    if (!S || !S.sesion || REAL) return null;
    if (typeof esPiloto === 'function' && esPiloto()) return null;
    const p = S.sesion.perfil;
    if (p === 'cadete') {
      const u = typeof P === 'function' ? P() : null;
      if (!u || u.piloto || u.vistaSolo) return null;
      return { perfil: 'cadete', m: u.m, nombre: u.nombre, anio: u.anio || '', gp: u.gp || '', gi: u.gi || '', hubo: !!(u.ans && u.ans.length || u.xp || u.ultAvance), lastLocal: u.ultAvance ? new Date(u.ultAvance).toISOString() : (function () { try { return localStorage.getItem('mb1_last_local') || ''; } catch (e) { return ''; } })() };
    }
    if (p === 'directora') {
      return { perfil: 'directora', m: S.sesion.m || '', nombre: S.sesion.nombre || 'Directora', anio: '', gp: '', gi: '', hubo: false, lastLocal: '' };
    }
    return null;
  }

  function pulso(forzar) {
    try {
      if (typeof marcarUsoLocal === 'function') { /* noop keep lint quiet */ }
      const quien = sesionReportable();
      if (!quien) return;
      if (!navigator.onLine) { marcarUsoLocal(); return; }
      if (!SHEET || SRV || REAL) return;
      if (!forzar && Date.now() - lastPulso < 55e3) return;
      const datos = {
        ts: typeof tsLocal === 'function' ? tsLocal() : new Date().toISOString(),
        m: quien.m, nombre: quien.nombre, anio: quien.anio, gp: quien.gp, gi: quien.gi,
        equipo: EQUIPO, ver: VER, modo: modoActual(), cola: colaPendiente(),
        lastSync: lastSync(), hubo_local: quien.hubo || colaPendiente() > 0,
        last_local_ts: quien.lastLocal || (function () { try { return localStorage.getItem('mb1_last_local') || ''; } catch (e) { return ''; } })(),
        perfil: quien.perfil
      };
      lastPulso = Date.now();
      hojaPost('dispositivo', datos);
      try { if (navigator.onLine && datos.modo === 'online') localStorage.removeItem('mb1_uso_off'); } catch (e) { }
    } catch (e) { }
  }

  function datosLoginExtra() {
    return { equipo: EQUIPO, ver: VER, modo: navigator.onLine ? 'online' : 'offline' };
  }

  async function cargar(forzar) {
    if (!esAdmin()) return;
    const k = localStorage.getItem('mb1_hk') || '';
    if (!SHEET || SRV) { ST.err = SHEET ? '' : 'sin_hoja'; ST.t = Date.now(); return; }
    if (!k) { ST.err = 'clave'; ST.t = Date.now(); return; }
    if (!forzar && ST.t && Date.now() - ST.t < 15e3 && ST.err !== 'cargando') return;
    ST.err = 'cargando';
    try {
      const v = await verHoja(true);
      const ghoja = h => fetch(SHEET + '?hoja=' + h + '&clave=' + encodeURIComponent(k), { cache: 'no-store' }).then(r => r.json());
      const jobs = [ghoja('ingresos')];
      if (v >= 5) jobs.push(ghoja('dispositivos'));
      const [ing, disp] = await Promise.all(jobs).then(xs => [xs[0], xs[1]]);
      if (ing && ing.error) { ST.err = 'clave'; ST.t = Date.now(); return; }
      if (v >= 5 && disp && disp.error) { ST.err = 'clave'; ST.t = Date.now(); return; }
      ST.ing = (Array.isArray(ing) ? ing : []).map(normIng);
      ST.disp = (v >= 5 && Array.isArray(disp)) ? disp.filter(r => r && !/^TEST/i.test(String(r.m || '')) && !/^TEST/i.test(String(r.n || ''))) : [];
      ST.err = v >= 5 ? '' : 'v_ant';
      ST.t = Date.now();
    } catch (e) { ST.err = 'red'; ST.t = Date.now(); }
  }

  function padronLista() {
    const out = [], seen = new Set();
    const add = (m, n, a, gp, gi) => {
      const k = (typeof normMat === 'function' ? normMat(m) : String(m || '')).toUpperCase();
      if (!k || seen.has(k) || /^TEST/i.test(k)) return;
      seen.add(k);
      out.push({ m: k, n: n || '', a: a || '', gp: gp || '', gi: gi || '' });
    };
    (typeof padronTodo === 'function' ? padronTodo() : (S.padron || [])).forEach(p => add(p.m, p.n || p.nombre, p.a || p.anio, p.gp, p.gi));
    (S.avances && Object.values(S.avances) || []).forEach(p => add(p.m, p.n, p.a, p.gp, p.gi));
    ST.disp.forEach(d => { if (String(d.perfil || 'cadete') !== 'directora') add(d.m, d.n, d.a, d.gp, d.gi); });
    return out;
  }

  function clasifica(d) {
    if (!d) return 'sin';
    const modo = String(d.modo || '').toLowerCase();
    if ((Number(d.cola) || 0) > 0) return 'offline';
    if (modo === 'offline' || modo === 'sin internet') return 'offline';
    if (modo === 'online' || modo === 'en linea' || modo === 'en línea') return 'online';
    return 'sin';
  }
  function horaMs(s) {
    if (!s) return 0;
    const n = Date.parse(s);
    return isNaN(n) ? 0 : n;
  }
  function reciente(d, ms) { return d && horaMs(d.ts) && (Date.now() - horaMs(d.ts) <= ms); }

  function filasCadetes() {
    const pads = padronLista();
    const byM = {};
    ST.disp.forEach(d => {
      if (String(d.perfil || 'cadete') === 'directora') return;
      const m = (typeof normMat === 'function' ? normMat(d.m) : d.m) || '';
      if (!m) return;
      if (!byM[m]) byM[m] = [];
      byM[m].push(d);
    });
    Object.keys(byM).forEach(m => byM[m].sort((a, b) => horaMs(b.ts) - horaMs(a.ts)));
    const rows = pads.map(p => {
      const devs = byM[p.m] || [];
      const last = devs[0] || null;
      return { p, devs, last, kind: clasifica(last) };
    });
    // dispositivos de cadetes que no están en el padrón de este equipo
    Object.keys(byM).forEach(m => {
      if (pads.some(p => p.m === m)) return;
      const last = byM[m][0];
      rows.push({ p: { m, n: last.n, a: last.a, gp: last.gp, gi: last.gi }, devs: byM[m], last, kind: clasifica(last) });
    });
    const f = ST.filtro;
    return rows.filter(r => {
      if (f.modo === 'online' && r.kind !== 'online') return false;
      if (f.modo === 'offline' && r.kind !== 'offline') return false;
      if (f.modo === 'sin' && r.kind !== 'sin') return false;
      if (f.anio && String(r.p.a) !== String(f.anio)) return false;
      if (f.perfil && f.perfil !== 'cadete') return false;
      if (f.txt) {
        const q = String(f.txt).toUpperCase();
        const blob = ((r.p.n || '') + ' ' + (r.p.m || '') + ' ' + (r.last && r.last.equipo || '')).toUpperCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => (a.p.n || '').localeCompare(b.p.n || '', 'es') || (a.p.m || '').localeCompare(b.p.m || ''));
  }

  function ingresosDirectora() {
    const f = ST.filtro;
    return ST.ing.filter(r => {
      const p = String(r.perfil || '').toLowerCase();
      if (p !== 'directora') return false;
      if (f.txt) {
        const q = String(f.txt).toUpperCase();
        const blob = ((r.nombre || '') + ' ' + (r.m || '') + ' ' + (r.equipo || '')).toUpperCase();
        if (!blob.includes(q)) return false;
      }
      return true;
    }).sort((a, b) => String(b.ts).localeCompare(String(a.ts)));
  }

  function setFiltro(k, v) { ST.filtro[k] = v; if (typeof render === 'function') render(); }

  function cardAjustes() {
    if (typeof esAdmin !== 'function' || !esAdmin()) return '';
    if (!ST.t && SHEET && !SRV) setTimeout(() => { cargar(true).then(() => { if (tab === 'ajustes') render(); }); }, 40);
    const f = ST.filtro;
    const h = ST.t ? new Date(ST.t).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) : '';
    const aviso = (!SHEET && !SRV)
      ? '<p class="mini">Esta versión no tiene Hoja de registro conectada; no se puede ver el uso remoto.</p>'
      : (ST.err === 'clave'
        ? '<p>Captura la clave de lectura de la Hoja para ver el uso por cadete y los ingresos de la Directora.</p><button class="btn sm" onclick="claveHoja()">Capturar clave de lectura</button>'
        : ST.err === 'red'
          ? '<p>No se pudo leer la Hoja (sin internet o la clave no coincidió).</p><button class="btn sm ghost" onclick="USO.refrescar()">Reintentar</button> <button class="btn sm ghost" onclick="claveHoja()">Clave</button>'
          : ST.err === 'cargando'
            ? '<p class="mini">Leyendo el uso reportado por cada dispositivo…</p>'
            : ST.err === 'v_ant'
              ? '<p>Para ver si cada cadete usa la app <b>sin internet</b> (datos locales) o <b>con internet</b> (sincronizada con la Hoja), actualiza el script de la Hoja a la <b>versión 5</b>. Los pasos están en el archivo privado y en el documento de actualización. Los ingresos de la Directora sí se pueden consultar desde ahora.</p>'
              : '');

    const rows = (ST.err && ST.err !== 'v_ant' && ST.err !== '') ? [] : filasCadetes();
    const dir = (ST.err && ST.err !== 'v_ant' && ST.err !== '') ? [] : ingresosDirectora();
    const nOn = rows.filter(r => r.kind === 'online' && reciente(r.last, 864e5)).length;
    const nOff = rows.filter(r => r.kind === 'offline').length;
    const nCola = rows.filter(r => r.last && (Number(r.last.cola) || 0) > 0).length;
    const nSin = rows.filter(r => r.kind === 'sin').length;
    const n24 = rows.filter(r => reciente(r.last, 864e5)).length;
    const n7 = rows.filter(r => reciente(r.last, 7 * 864e5)).length;

    const filtros = `<div class="filtros">
      <select onchange="USO.setFiltro('modo', this.value)" title="Modo">
        <option value="" ${!f.modo ? 'selected' : ''}>Todos los modos</option>
        <option value="online" ${f.modo === 'online' ? 'selected' : ''}>Con internet</option>
        <option value="offline" ${f.modo === 'offline' ? 'selected' : ''}>Sin internet</option>
        <option value="sin" ${f.modo === 'sin' ? 'selected' : ''}>Sin reporte</option>
      </select>
      <select onchange="USO.setFiltro('anio', this.value)" title="Año">
        <option value="">Todos los años</option>
        ${[1, 2, 3, 4].map(a => `<option value="${a}" ${String(f.anio) === String(a) ? 'selected' : ''}>${a}° año</option>`).join('')}
      </select>
      <input placeholder="Cadete, matrícula o equipo" value="${esc(f.txt || '')}" onchange="USO.setFiltro('txt', this.value)">
      <button class="btn sm ghost" onclick="USO.refrescar()">Actualizar</button>
      ${!SRV && SHEET ? '<button class="btn sm ghost" onclick="claveHoja()">Clave</button>' : ''}
    </div>`;

    const tablaCad = rows.length
      ? `<div class="tw"><table><tr><th>Cadete</th><th>Año</th><th>Grupo</th><th>Modo</th><th>Último reporte</th><th>Último sync</th><th>Versión</th><th>Equipo</th><th>Cola</th></tr>${rows.map(r => {
        const et = etiquetaModo(r.kind === 'sin' ? '' : r.kind);
        const d = r.last || {};
        const extra = r.devs && r.devs.length > 1 ? ` <small>+${r.devs.length - 1} equipo(s)</small>` : '';
        return `<tr><td>${esc(r.p.n || '—')}<small>${esc(r.p.m)}</small></td><td>${esc(r.p.a || '—')}</td><td>${esc(r.p.gp || '')}${r.p.gi ? ' / ' + esc(r.p.gi) : ''}</td><td><span class="uso-pill ${et.cls}">${et.txt}</span></td><td>${esc(fmtFecha(d.ts))}</td><td>${esc(fmtFecha(d.lastSync))}</td><td>${esc(d.ver || '—')}</td><td><small>${esc(d.equipo || '—')}</small>${extra}</td><td>${d.cola ? d.cola : '—'}</td></tr>`;
      }).join('')}</table></div>`
      : (ST.err === '' || ST.err === 'v_ant' ? '<p class="mini">No hay cadetes que coincidan con el filtro (o aún no hay padrón ni reportes).</p>' : '');

    const dispDir = ST.disp.filter(d => String(d.perfil || '').toLowerCase() === 'directora').sort((a, b) => horaMs(b.ts) - horaMs(a.ts));
    const tablaDir = `<div class="tw"><table><tr><th>Fecha y hora</th><th>Nombre</th><th>Equipo</th><th>Modo</th><th>Versión</th></tr>${(dir.length ? dir : []).map(r => {
      const et = etiquetaModo(r.modo);
      return `<tr><td>${esc(fmtFecha(r.ts) === '—' ? r.ts : fmtFecha(r.ts))}</td><td>${esc(r.nombre || 'Directora')}${r.m ? `<small>${esc(r.m)}</small>` : ''}</td><td><small>${esc(r.equipo || '—')}</small></td><td>${r.modo ? `<span class="uso-pill ${et.cls}">${et.txt}</span>` : '<span class="uso-pill uso-sin">Sin dato de modo (ingreso anterior a v5)</span>'}</td><td>${esc(r.ver || '—')}</td></tr>`;
    }).join('')}${!dir.length ? '<tr><td colspan="5">Aún no hay ingresos de la Directora en la Hoja.</td></tr>' : ''}</table></div>`;

    const kpis = (ST.err && ST.err !== 'v_ant' && ST.err !== '') ? '' : `<section class="kpis k4"><div><b>${nOn}</b><span>Con internet (24 h)</span></div><div><b>${nOff}</b><span>Sin internet / datos locales</span></div><div><b>${nSin}</b><span>Sin reporte</span></div><div><b>${nCola}</b><span>Cola pendiente</span></div></section>
      <p class="mini">Reportaron en las últimas 24 h: ${n24} · en 7 días: ${n7} · cadetes en esta lista: ${rows.length}${h ? ' · actualizado ' + h : ''}.</p>`;

    return `<section class="card" id="usoApp">
      <div class="row sp"><h3>Uso de la app (con o sin internet)</h3></div>
      <p class="mini">Cada dispositivo de cadete (y el de la Directora) reporta si está usando la versión <b>sin internet</b>, con los datos guardados en ese equipo, o la versión <b>con internet</b>, sincronizada con la Hoja: modo, último sync y versión de la app. El pulso no lleva claves. Si un cadete no ha abierto la app con internet desde que actualizaste el script, aparece como «Sin reporte».</p>
      ${aviso}${filtros}${kpis}${tablaCad}
      <h3 style="margin-top:18px">Ingresos de la Directora</h3>
      <p class="mini">Fecha y hora de cada inicio de sesión, dispositivo (equipo) y modo con o sin internet. El ingreso ya se registraba en la pestaña Actividad › Ingresos; aquí se ve filtrado y, con el script v5, también el modo y la versión.</p>
      ${dispDir.length ? `<p class="mini">Último pulso del dispositivo de la Directora: ${esc(fmtFecha(dispDir[0].ts))} · ${esc(etiquetaModo(dispDir[0].modo).txt)} · versión ${esc(dispDir[0].ver || '—')} · equipo ${esc(dispDir[0].equipo || '—')}.</p>` : ''}
      ${tablaDir}
    </section>`;
  }

  function refrescar() { ST.t = 0; cargar(true).then(() => { if (tab === 'ajustes') render(); }); }

  window.USO = { pulso, cargar, cardAjustes, setFiltro, refrescar, marcarSync, marcarUsoLocal, datosLoginExtra, normIng, ST };

  window.addEventListener('online', () => setTimeout(() => pulso(true), 2200));
  window.addEventListener('offline', () => marcarUsoLocal());
  document.addEventListener('visibilitychange', () => { if (!document.hidden) pulso(); });
  setInterval(() => { if (!document.hidden) pulso(); }, 5 * 60 * 1000);
})();
