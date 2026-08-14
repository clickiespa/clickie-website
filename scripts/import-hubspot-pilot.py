from __future__ import annotations

import json
from pathlib import Path

from hubspot_import_utils import (
    build_source_file,
    clean_body,
    find_body_wrapper,
    guess_extension,
    normalize_text,
    parse_document,
)


ROOT = Path("/Users/flo/Sites/clickie-website")
EXPORT_DIR = ROOT / "content/hubspot-site-export" / "io/clickie/blog"
SOURCE_DIR = ROOT / "content/blog-imported"
ASSET_DIR = ROOT / "assets/blog"
MANIFEST_PATH = SOURCE_DIR / "download-manifest.tsv"
SUMMARY_PATH = SOURCE_DIR / "pilot-import-summary.json"

PILOT_POSTS = [
    {
        "slug": "5-errores-gestion-energetica",
        "source": "5-errores-comunes-en-la-gestión-energética-y-cómo-solucionarlos.html",
        "categoryKey": "eficiencia",
        "categoryLabel": "Eficiencia Energética",
        "subtitle": "Cinco errores frecuentes que frenan ahorros energéticos y cómo corregirlos con mejor visibilidad, segmentación y apoyo experto.",
    },
    {
        "slug": "alza-tarifaria-julio-2026-retailers-multisucursal",
        "source": "como-prepararte-para-el-alza-tarifaria-de-julio-2026-impacto-del-10-a-los-retailers-multisucursal.html",
        "categoryKey": "industria",
        "categoryLabel": "Industria",
        "subtitle": "El ajuste tarifario de julio de 2026 puede transformarse en un golpe de 6% a 10% para cadenas multisucursal si no se gestiona con datos por local.",
    },
    {
        "slug": "caso-exito-oxxo-energia-chile",
        "source": "caso-de-éxito-cómo-oxxo-gestiona-la-energía-de-más-de-230-tiendas-en-chile-con-clickie.html",
        "categoryKey": "casos",
        "categoryLabel": "Caso de Éxito",
        "subtitle": "Cómo una operación de más de 230 tiendas convirtió monitoreo, análisis y personalización por local en una palanca real de eficiencia.",
    },
]


def main():
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)

    manifest_rows = []
    summary = []

    for post in PILOT_POSTS:
        source_path = EXPORT_DIR / post["source"]
        doc = parse_document(source_path)

        title = normalize_text(" ".join(doc.xpath("//h1//text()")))
        description = normalize_text(" ".join(doc.xpath('//meta[@name="description"]/@content')))
        published_at = normalize_text(" ".join(doc.xpath('//time[contains(@class, "blog-post__timestamp")]/@datetime')))[:10]
        cover_url = normalize_text(" ".join(doc.xpath('//meta[@property="og:image"]/@content')))
        tags = [
            normalize_text(tag).lstrip("#")
            for tag in doc.xpath('//a[contains(@class, "blog-post__tag-link")]//text()')
        ]

        body_wrapper = find_body_wrapper(doc)
        body_html, body_images = clean_body(body_wrapper, post["slug"], ASSET_DIR)

        cover_ext = guess_extension(cover_url)
        cover_name = f'{post["slug"]}-cover{cover_ext}'
        cover_relative = f"assets/blog/{cover_name}"
        manifest_rows.append(f"{cover_url}\t{ASSET_DIR / cover_name}")

        for image_item in body_images:
            manifest_rows.append(f'{image_item["url"]}\t{image_item["target"]}')

        source_content = build_source_file(body_html, tags)
        source_file = SOURCE_DIR / f'{post["slug"]}.source'
        source_file.write_text(source_content, encoding="utf-8")

        summary.append(
            {
                "slug": post["slug"],
                "title": title,
                "description": description,
                "publishedAt": published_at,
                "categoryKey": post["categoryKey"],
                "categoryLabel": post["categoryLabel"],
                "subtitle": post["subtitle"],
                "coverImage": cover_relative,
                "coverAlt": title,
                "sourceFile": str(source_file.relative_to(ROOT)),
                "tags": tags,
            }
        )

    MANIFEST_PATH.write_text("\n".join(manifest_rows) + "\n", encoding="utf-8")
    SUMMARY_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Importación piloto preparada: {len(summary)} notas.")


if __name__ == "__main__":
    main()
