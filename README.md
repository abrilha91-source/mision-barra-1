# Misión: Obtener la Barra I
Práctica de inglés tipo ALCPT (Mesa de Inglés, Esc. Mil. Enfría.). PWA sin servidor: se instala en el celular y funciona sin internet. Se publica vacía; todos los datos viven en el dispositivo de cada usuario.

## v2.7 · Perfil Directora (solo consulta)

Nuevo acceso **Directora**: ve el Centro de mando (Mando, Avance, Estadística, En riesgo, Actividad, ALC, etc.) y una vista de las pantallas del cadete, sin poder generar códigos, cambiar ajustes, importar, borrar ni editar. Administración sigue con el control total. La clave de lectura de la Hoja se captura igual que en Administración (una vez por equipo).

## v2.6 · Registro automático completo (Hoja de Google)
- Cada cadete envía solo, sin códigos: ingresos, ejercicios, **resumen de avance** (firmado), **evaluaciones oficiales** (folio, forma, salidas, puntaje) y **resultados ALC / ALCPT / Examen final**.
- Administración los carga sola al entrar (Mando › Actualizar) en Avance, Estadística, En riesgo, Antigüedad, Áreas, Mando y ALC › Resultados, combinados con los códigos importados.
- El código de avance queda como respaldo opcional.
- Requiere el script v2 de la Hoja (misma URL, nueva versión de la implementación). Con el script anterior la app sigue funcionando: lo nuevo queda en cola en cada equipo y se envía al actualizar el script.

## v2.5 · Una sola app, diseño dinámico, sin perfil Planta
- Diseño nuevo: degradados, animaciones, confeti al acertar y al terminar, modo claro/oscuro, primero móvil, Noto Sans.
- El acceso queda en dos perfiles: **Cadete** y **Administración**. Se quitó la opción Planta del inicio de sesión y su instructivo.
- La función de aplicador pasa a Administración: Evaluación (código del día, resultados, verificar folio) y Aplicadores → botón **Aplicar** en cada pase activo.
- Los datos guardados de planta (perfiles, pases, avances) se conservan sin cambios en el equipo; una sesión de planta abierta se cierra sin borrar nada.

## v2.4 · Sección ALC · ALCPT (agregada; todo lo anterior se conserva)
- Nueva pestaña **ALC** (cadete y planta) y **ALC · ALCPT** (Centro de mando), con: ALC Parcial 1 y 2; evaluación por semestre y por parcial (ALCPT); **Examen final** con formas originales en PDF y audio MP3, hoja de respuestas A–D, clave opcional y tablas de conversión; Calificación; Resultados; Banco.
- El banco (`banco_alcpt_alc_privado.json`), las formas, los audios y las claves se importan en cada equipo (IndexedDB `mb1_alc`) y **no se publican**. El cadete no ve la clave ni la revisión del examen final.
- No cambia los datos existentes (`mb1_estado_v2`, `mb1_eq`, `mb1_hk`, `mb1_k`). Visor PDF: pdf.js 4.10.38 (Apache-2.0) en `pdfjs/`.
