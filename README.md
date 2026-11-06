# Misión: Obtener la Barra I
Práctica de inglés tipo ALCPT (Mesa de Inglés, Esc. Mil. Enfría.). PWA sin servidor: se instala en el celular y funciona sin internet. Se publica vacía; todos los datos viven en el dispositivo de cada usuario.

## v2.4 · Sección ALC · ALCPT (agregada; todo lo anterior se conserva)
- Nueva pestaña **ALC** (cadete y planta) y **ALC · ALCPT** (Centro de mando), con: ALC Parcial 1 y 2; evaluación por semestre y por parcial (ALCPT); **Examen final** con formas originales en PDF y audio MP3, hoja de respuestas A–D, clave opcional y tablas de conversión; Calificación; Resultados; Banco.
- El banco (`banco_alcpt_alc_privado.json`), las formas, los audios y las claves se importan en cada equipo (IndexedDB `mb1_alc`) y **no se publican**. El cadete no ve la clave ni la revisión del examen final.
- No cambia los datos existentes (`mb1_estado_v2`, `mb1_eq`, `mb1_hk`, `mb1_k`). Visor PDF: pdf.js 4.10.38 (Apache-2.0) en `pdfjs/`.
