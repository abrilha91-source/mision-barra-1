/* Misión: Obtener la Barra I · v2.13 · Perfil del cadete
   Foto (cámara o galería, comprimida a 320 px en el equipo). Si el cadete acepta compartirla, se envía una versión más pequeña a la Hoja para que Administración la vea. */
(function () {
  'use strict';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toast = m => { if (typeof window.toast === 'function') window.toast(m); };
  const g = (f, d) => { try { return f(); } catch (e) { return d; } };
  const GUSTOS = ['🎵 Música', '⚽ Deportes', '🏋️ Gimnasio', '🎬 Series y películas', '🎮 Videojuegos', '📚 Lectura', '✈️ Viajar', '🍳 Cocinar', '🎨 Arte y dibujo', '🐶 Animales', '🌄 Naturaleza', '📸 Fotografía', '💃 Bailar', '🎤 Cantar', '🧩 Retos y juegos', '💻 Tecnología', '🩺 Enfermería', '🌎 Otros idiomas'];
  const CUESTA = ['🎧 Listening', '🧱 Gramática', '🔤 Vocabulario', '🗣️ Pronunciación', '📖 Lectura', '✍️ Ortografía', '⏱️ Terminar a tiempo', '😰 Nervios en el examen'];
  const EMOJIS = ['🦊', '🐯', '🦁', '🐺', '🦅', '🐬', '🐼', '🦉', '🐻', '🐱', '🦄', '🐝', '🌟', '⚡', '🚀', '💜'];
  const COLORES = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#0ea5e9'];
  const FKEY = m => 'mb1_foto_' + m;
  const P0 = () => g(() => P(), null);
  const soloVer = () => { const s = g(() => S.sesion, null), p = P0(); return !!(s && s.vistaCadete) || !!(p && (p.vistaSolo || p.piloto)) || g(() => !!REAL, false); };
  const yo = p => (p && p.yo) || {};
  let MEMFOTO = {};
  function foto(m) { if (MEMFOTO[m] !== undefined) return MEMFOTO[m]; let f = null; try { f = localStorage.getItem(FKEY(m)); } catch (e) { } if (!f) { try { f = (S.fotos && S.fotos[m]) || null; } catch (e) { } } return (MEMFOTO[m] = f); }
  function iniciales(n) { const w = String(n || '').trim().split(/\s+/).filter(Boolean); return ((w[0] || '?')[0] + (w.length > 2 ? w[w.length - 2][0] : (w[1] || '')[0] || '')).toUpperCase(); }
  function avatar(p, tam) { if (!p) return ''; const y = yo(p), f = foto(p.m), c = y.color || '#6366f1'; return `<span class="pav${tam ? ' ' + tam : ''}" style="--pc:${esc(c)}">${f ? `<img src="${f}" alt="Foto de perfil">` : y.emoji ? `<b class="emo">${y.emoji}</b>` : `<b>${esc(iniciales(p.nombre))}</b>`}</span>`; }
  function completo(p) { const y = yo(p); return !!((foto(p.m) || y.emoji) && (y.gustos || []).length && ((y.cuesta || []).length || y.texto)); }
  let ED = null; // borrador en edición
  function vPerfil(p) {
    const y = yo(p), sv = soloVer();
    if (ED && ED.m === p.m) return vEditar(p);
    const vr = g(() => VOCAB.resumen(), null), er = g(() => ESCUCHA.resumen(), null), cr = g(() => COMPLETA.resumen(), null);
    const ins = Object.keys(p.ins || {}).length;
    return `<section class="pcard" style="--pc:${esc(y.color || '#6366f1')}"><div class="pcover"></div><div class="pbody">${avatar(p, 'xl')}
      <h2>${esc(p.nombre)}</h2><p class="mini">${p.perfil === 'cadete' ? `${esc(p.anio)}° año${p.gp ? ' · grupo ' + esc(p.gp) : ''}${p.gi ? ' · inglés ' + esc(p.gi) : ''}` : ''} · ${esc(p.m)}</p>
      ${y.frase ? `<p class="pfrase">“${esc(y.frase)}”</p>` : ''}
      <div class="pstats"><div><b>${g(() => xp(p), 0).toLocaleString('es-MX')}</b><span>XP</span></div><div><b>${g(() => racha(p), 0)}</b><span>días seguidos</span></div><div><b>${er ? er.pts : 0}</b><span>pts listening</span></div><div><b>${vr ? vr.aprendidas : 0}</b><span>palabras</span></div><div><b>${ins}</b><span>insignias</span></div></div></div></section>
      <section class="card"><h3>Me gusta</h3>${(y.gustos || []).length ? `<div class="pchips">${y.gustos.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : '<p class="mini">Aún no eliges tus gustos.</p>'}</section>
      <section class="card pcuesta"><h3>Lo que más me cuesta aprender</h3>${(y.cuesta || []).length ? `<div class="pchips warm">${y.cuesta.map(x => `<span>${esc(x)}</span>`).join('')}</div>` : ''}${y.texto ? `<blockquote>${esc(y.texto)}</blockquote>` : (y.cuesta || []).length ? '' : '<p class="mini">Cuéntanos qué se te dificulta: la app y tu docente te ayudan a reforzarlo.</p>'}
      ${(y.cuesta || []).some(x => /Listening/.test(x)) ? `<button class="btn sm" onclick="tab='escucha';render();scrollTo(0,0)">🎧 Ir al Listening Lab</button>` : ''}${(y.cuesta || []).some(x => /Gramática|Ortografía/.test(x)) ? ` <button class="btn sm ghost" onclick="tab='completa';render();scrollTo(0,0)">🧩 Completa la oración</button>` : ''}${(y.cuesta || []).some(x => /Vocabulario|Pronunciación/.test(x)) ? ` <button class="btn sm ghost" onclick="tab='vocab';render();scrollTo(0,0)">❖ Flash cards</button>` : ''}</section>
      ${cr && cr.n ? `<section class="card"><h3>Mi práctica</h3><p class="mini">Completa la oración: ${cr.ok}/${cr.n} aciertos · ${cr.pts} pts</p></section>` : ''}
      <div class="row"><button class="btn" style="flex:1" onclick="PERFIL.editar()" ${sv ? 'disabled' : ''}>✏️ Personalizar mi perfil</button><button class="btn ghost" onclick="tab='hoy';render();scrollTo(0,0)">Volver</button></div>
      ${sv ? '<p class="mini">Vista de consulta o usuario piloto: el perfil no se puede editar.</p>' : '<p class="mini">Si compartes tu foto, Administración de la Mesa de Inglés puede verla (se envía comprimida). Tus gustos y lo que te cuesta también los ve tu docente, para apoyarte. Si prefieres no compartir la foto, usa un avatar: se queda solo en este equipo.</p>'}`;
  }
  function vEditar(p) {
    const y = ED, f = ED.foto === undefined ? foto(p.m) : ED.foto;
    const chips = (lista, sel, k, max) => `<div class="pchips sel">${lista.concat(sel.filter(x => !lista.includes(x))).map(x => `<button type="button" class="${sel.includes(x) ? 'on' : ''}" onclick="PERFIL.toggle('${k}',${esc(JSON.stringify(x))},${max})">${esc(x)}</button>`).join('')}</div>`;
    return `<div class="vtop"><button class="ico" onclick="PERFIL.cancelar()" title="Cancelar">✕</button><b>Personalizar mi perfil</b></div>
      <section class="card pedit" style="--pc:${esc(y.color)}"><h3>Foto o avatar</h3><div class="pfoto"><span class="pav xl" style="--pc:${esc(y.color)}">${f ? `<img src="${f}" alt="">` : y.emoji ? `<b class="emo">${y.emoji}</b>` : `<b>${esc(iniciales(p.nombre))}</b>`}</span>
        <div class="col"><label class="btn sm">📷 Tomar foto<input type="file" accept="image/*" capture="user" hidden onchange="PERFIL.foto(this)"></label><label class="btn sm ghost">🖼️ Elegir de la galería<input type="file" accept="image/*" hidden onchange="PERFIL.foto(this)"></label>${f ? '<button class="btn sm ghost" onclick="PERFIL.quitarFoto()">Quitar foto</button>' : ''}</div></div>
        <p class="mini">Sin foto, elige un avatar:</p><div class="pemo">${EMOJIS.map(e => `<button type="button" class="${y.emoji === e ? 'on' : ''}" onclick="PERFIL.set('emoji','${e}')">${e}</button>`).join('')}</div>
        <p class="mini">Color de tu tarjeta:</p><div class="pcol">${COLORES.map(c => `<button type="button" class="${y.color === c ? 'on' : ''}" style="background:${c}" onclick="PERFIL.set('color','${c}')" aria-label="Color ${c}"></button>`).join('')}</div>
        ${f ? `<label class="chk"><input type="checkbox" id="psync" ${y.sync !== false ? 'checked' : ''} onchange="PERFIL.set('sync',this.checked)"> Compartir mi foto con Administración (se envía comprimida a la Hoja de la Mesa de Inglés). Si la desmarcas, la foto se queda solo en este equipo.</label>` : '<p class="mini">Si más adelante agregas una foto, podrás elegir si la compartes con Administración.</p>'}</section>
      <section class="card"><h3>Mi frase o lema <small class="mini">(opcional)</small></h3><input id="pfrase" maxlength="60" value="${esc(y.frase || '')}" placeholder="Ej. Step by step, I'll get it!" oninput="PERFIL.campo('frase',this.value)"></section>
      <section class="card"><h3>Me gusta <small class="mini">(hasta 6)</small></h3>${chips(GUSTOS, y.gustos, 'gustos', 6)}<div class="row"><input id="pgusto" maxlength="24" placeholder="Agregar otro gusto"><button class="btn sm ghost" onclick="PERFIL.agregarGusto()">Agregar</button></div></section>
      <section class="card"><h3>Lo que más me cuesta aprender</h3>${chips(CUESTA, y.cuesta, 'cuesta', 4)}<textarea id="ptexto" maxlength="200" rows="3" placeholder="Cuéntalo con tus palabras. Ej. Me cuesta entender cuando hablan rápido y los números." oninput="PERFIL.campo('texto',this.value);document.getElementById('pcnt').textContent=this.value.length">${esc(y.texto || '')}</textarea><p class="mini"><span id="pcnt">${(y.texto || '').length}</span>/200</p></section>
      <div class="row"><button class="btn big" onclick="PERFIL.guardar()">Guardar mi perfil</button></div>`;
  }
  function editar() { const p = P0(); if (!p) return; if (soloVer()) return toast('Vista de consulta: no se puede editar.'); const y = yo(p); ED = { m: p.m, emoji: y.emoji || '', color: y.color || '#6366f1', sync: y.sync !== false, frase: y.frase || '', gustos: (y.gustos || []).slice(), cuesta: (y.cuesta || []).slice(), texto: y.texto || '', foto: undefined }; redraw(); scrollTo(0, 0); }
  function cancelar() { ED = null; redraw(); }
  function set(k, v) { if (!ED) return; ED[k] = ED[k] === v && k === 'emoji' ? '' : v; keep(); redraw(); }
  function campo(k, v) { if (ED) ED[k] = String(v).slice(0, k === 'frase' ? 60 : 200); }
  function toggle(k, v, max) { if (!ED) return; const a = ED[k], i = a.indexOf(v); if (i >= 0) a.splice(i, 1); else { if (a.length >= max) return toast(`Máximo ${max}.`); a.push(v); } keep(); redraw(); }
  function agregarGusto() { const i = document.getElementById('pgusto'), v = (i && i.value || '').trim(); if (!v) return; if (ED.gustos.length >= 6) return toast('Máximo 6.'); if (!ED.gustos.includes(v)) ED.gustos.push(v.slice(0, 24)); keep(); redraw(); }
  function keep() { const f = document.getElementById('pfrase'), t = document.getElementById('ptexto'); if (ED && f) ED.frase = f.value.slice(0, 60); if (ED && t) ED.texto = t.value.slice(0, 200); }
  function redraw() { const y = scrollY; try { render(); } catch (e) { } scrollTo(0, y); }
  function comprimir(file, lado = 320, q = .82) {
    return new Promise((res, rej) => {
      if (!file || !/^image\//.test(file.type || 'image/')) return rej(new Error('tipo'));
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => { try { const s = Math.min(img.naturalWidth, img.naturalHeight), sx = (img.naturalWidth - s) / 2, sy = (img.naturalHeight - s) / 2, cv = document.createElement('canvas'); cv.width = cv.height = Math.min(lado, s); const cx = cv.getContext('2d'); cx.drawImage(img, sx, sy, s, s, 0, 0, cv.width, cv.height); URL.revokeObjectURL(url); res(cv.toDataURL('image/jpeg', q)); } catch (e) { rej(e); } };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('lectura')); }; img.src = url;
    });
  }
  function ponerFoto(inp) { const f = inp.files && inp.files[0]; inp.value = ''; if (!f || !ED) return; keep(); if (f.size > 25e6) return toast('La imagen es muy grande.'); comprimir(f).then(d => { ED.foto = d; redraw(); toast('Foto lista. Toca «Guardar mi perfil».'); }).catch(() => toast('No se pudo leer la imagen. Prueba con otra (JPG o PNG).')); }
  function quitarFoto() { if (!ED) return; keep(); ED.foto = null; redraw(); }
  function reducirParaEnvio(dataUrl, lado, q) {
    return new Promise((res, rej) => {
      if (!dataUrl) return res('');
      const img = new Image();
      img.onload = () => { try { const cv = document.createElement('canvas'); cv.width = cv.height = lado || 160; cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height); let out = cv.toDataURL('image/jpeg', q == null ? 0.62 : q); if (out.length > 18000) out = cv.toDataURL('image/jpeg', 0.45); res(out); } catch (e) { rej(e); } };
      img.onerror = () => rej(new Error('foto')); img.src = dataUrl;
    });
  }
  function guardar() {
    const p = P0(); if (!p || !ED) return; if (soloVer()) return toast('Vista de consulta: no se puede editar.'); keep();
    if (ED.foto !== undefined) { try { if (ED.foto) localStorage.setItem(FKEY(p.m), ED.foto); else localStorage.removeItem(FKEY(p.m)); MEMFOTO[p.m] = ED.foto || null; } catch (e) { return toast('No hay espacio en el dispositivo para la foto. Usa un avatar.'); } }
    const hay = !!foto(p.m), sync = hay && ED.sync !== false;
    p.yo = { emoji: ED.emoji, color: ED.color, frase: ED.frase.trim(), gustos: ED.gustos, cuesta: ED.cuesta, texto: ED.texto.trim(), ts: Date.now(), foto: sync, sync: sync };
    const borrador = ED; ED = null; try { usar('perfil'); save(); } catch (e) { }
    const enviarAv = () => { try { if (!p.piloto && (SRV || SHEET)) enviar('api/avance', payload(p)); } catch (e) { } };
    const fin = () => { redraw(); scrollTo(0, 0); toast('¡Perfil guardado! ✨'); if (window.FX) FX.fin(60); };
    const mandarFoto = url => { try { if (typeof enviarFoto === 'function') enviarFoto(p.m, p.nombre, url || ''); } catch (e) { } enviarAv(); fin(); };
    if (p.piloto) { enviarAv(); return fin(); }
    if (sync && hay) reducirParaEnvio(foto(p.m)).then(d => mandarFoto(d)).catch(() => { mandarFoto(''); toast('Se guardó el perfil, pero la foto no se pudo enviar.'); });
    else { mandarFoto(''); }
  }
  function hoyCard(p) { if (!p || soloVer() || completo(p)) return ''; return `<section class="card pinvita" onclick="PERFIL.editar()"><div class="pinv-av">${avatar(p, 'md')}</div><div><h3>Personaliza tu perfil ✨</h3><p class="mini">Agrega tu foto o avatar, tus gustos y lo que más te cuesta aprender. ¡Haz tuya la app!</p></div></section>`; }
  function borrarFoto(m) { try { localStorage.removeItem(FKEY(m)); } catch (e) { } delete MEMFOTO[m]; }
  window.PERFIL = { vPerfil, avatar, editar, cancelar, set, campo, toggle, agregarGusto, foto: ponerFoto, quitarFoto, guardar, hoyCard, completo, borrarFoto, fotoDe: foto, _comprimir: comprimir, _reducir: reducirParaEnvio, GUSTOS, CUESTA };
})();
