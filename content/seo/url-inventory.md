# Inventario de URLs Clickie

Fecha de generación: 2026-08-10

## Resumen
- Total de registros inventariados: 232
- URLs activas detectadas en archivos publicados: 91
- URLs legacy con archivo de redirección: 61
- Reglas adicionales de redirección en `scripts/legacy-redirects.js`: 79
- Páginas de error/control: 1
- Snapshots HTML heredados dentro del repo: 0
- URLs con canonical distinto para revisar manualmente: 0

## Criterio
- Se clasificaron como activas las páginas HTML públicas que no son stubs de redirección.
- Se clasificaron como redireccionadas las URLs legacy con `meta refresh`, `window.location.replace` o reglas del fallback de `404.html`.
- Se clasificaron como snapshots las copias HTML de HubSpot guardadas fuera de la ruta pública del sitio, porque son material de archivo y no deberían competir con las URLs canónicas.

## Muestras de URLs activas
- https://clickie.io/
- https://clickie.io/cotiza.html
- https://clickie.io/historias/copec.html
- https://clickie.io/historias/la-araucana.html
- https://clickie.io/historias/lipigas.html
- https://clickie.io/historias/oxxo.html
- https://clickie.io/historias/preunic.html
- https://clickie.io/historias/renova.html

## Muestras de URLs redireccionadas
- https://clickie.io/-temporary-slug-2451f5da-5928-4bec-83bf-ba8169e009ad -> https://clickie.io/recursos/blog.html
- https://clickie.io/-temporary-slug-2451f5da-5928-4bec-83bf-ba8169e009ad.html -> https://clickie.io/recursos/blog.html
- https://clickie.io/-temporary-slug-2451f5da-5928-4bec-83bf-ba8169e009ad/ -> https://clickie.io/recursos/blog.html
- https://clickie.io/-temporary-slug-332fd0ab-79e4-4dde-b554-2b82f3a2ab65 -> https://clickie.io/recursos/blog.html
- https://clickie.io/-temporary-slug-332fd0ab-79e4-4dde-b554-2b82f3a2ab65.html -> https://clickie.io/recursos/blog.html
- https://clickie.io/-temporary-slug-332fd0ab-79e4-4dde-b554-2b82f3a2ab65/ -> https://clickie.io/recursos/blog.html
- https://clickie.io/-temporary-slug-c0e8915f-65c1-479e-8b4e-3c199f16bd53 -> https://clickie.io/recursos/blog.html
- https://clickie.io/-temporary-slug-c0e8915f-65c1-479e-8b4e-3c199f16bd53.html -> https://clickie.io/recursos/blog.html

## Riesgos detectados
- La versión canónica actual del blog vive bajo `/recursos/blog/*.html`, mientras que muchas URLs históricas siguen existiendo como stubs legacy en la raíz del sitio.
- `404.html` depende de `scripts/legacy-redirects.js` para rescatar URLs antiguas no cubiertas por archivos físicos.
- No quedan snapshots HTML de HubSpot dentro de la ruta pública del sitio.

## Archivo maestro
- El detalle completo está en `content/seo/url-inventory.csv`.

