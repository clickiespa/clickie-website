# Blog Sources

Esta carpeta contiene la fuente canónica de cada nota del blog.

## Regla principal

- Edita aquí el contenido editorial.
- No edites `recursos/blog/*.html` manualmente.
- `recursos/blog/*.html` y `recursos/blog.html` se regeneran con `scripts/build-blog.js`.

## Formato de cada archivo `.source`

Cada nota debe seguir esta estructura:

```html
<!-- ARTICLE_HIGHLIGHT: frase corta a resaltar -->
<!-- ARTICLE_CONTENT_START -->
<div class="article-content">
  ...
</div>
<!-- ARTICLE_CONTENT_END -->

<!-- ARTICLE_TAGS_START -->
<div class="article-footer">
  <div class="article-tags">
    <span>#TagUno</span>
    <span>#TagDos</span>
  </div>
</div>
<!-- ARTICLE_TAGS_END -->
```

## Convenciones editoriales

- Usa negrita solo para palabras clave cortas o labels breves.
- Define una sola frase de highlight por nota en `ARTICLE_HIGHLIGHT`.
- Prefiere listas reales (`ul` / `ol`) cuando haya enumeraciones.
- Si necesitas iconos, usa el set `fa-solid` en vez de emojis.
