from __future__ import annotations

import json
import re
from pathlib import Path

from hubspot_import_utils import (
    build_source_file,
    clean_body,
    find_body_wrapper,
    guess_extension,
    normalize_text,
    parse_document,
    slugify,
)


ROOT = Path("/Users/flo/Sites/clickie-website")
EXPORT_DIR = ROOT / "content/hubspot-site-export" / "io/clickie/blog"
SOURCE_DIR = ROOT / "content/blog-pending"
ASSET_DIR = ROOT / "assets/blog"
MANIFEST_PATH = SOURCE_DIR / "download-manifest.tsv"
SUMMARY_PATH = SOURCE_DIR / "hubspot-batch-summary.json"

CURRENT_POSTS = ROOT / "scripts/blog-posts.js"


def load_current_posts():
    content = CURRENT_POSTS.read_text(encoding="utf-8")
    blocks = re.findall(r"\{\s*slug:\s*\"([^\"]+)\"[\s\S]*?title:\s*\"([^\"]+)\"", content)
    return [{"slug": slug, "title": title} for slug, title in blocks]


def normalize_compare(value: str) -> str:
    return slugify(value).replace("-", "")


def infer_category_key(title: str, description: str, tags: list[str]) -> str:
    haystack = " ".join([title, description, *tags]).lower()

    if "caso de éxito" in haystack or "caso de exito" in haystack:
        return "casos"
    if "mercurio" in haystack or "prensa" in haystack or "feria" in haystack or "expo" in haystack:
        return "prensa"
    if "esg" in haystack or "sosten" in haystack or "huella" in haystack or "transición" in haystack or "transicion" in haystack:
        return "sostenibilidad"
    if "retail" in haystack or "supermercado" in haystack or "industria" in haystack or "tarifa" in haystack or "factura" in haystack:
        return "industria"
    return "eficiencia"


def choose_subtitle(description: str, first_paragraph: str) -> str:
    candidate = description or first_paragraph
    candidate = normalize_text(candidate)
    return candidate[:220].rstrip(" .,;:")


def extract_first_paragraph_text(body_html: str) -> str:
    import re

    match = re.search(r"<p[^>]*>([\s\S]*?)</p>", body_html)
    if not match:
        return ""
    paragraph_html = match.group(1)
    paragraph_text = re.sub(r"<[^>]+>", " ", paragraph_html)
    return normalize_text(paragraph_text)


def unique_slug(base_slug: str, used_slugs: set[str]) -> str:
    slug = base_slug
    index = 2
    while slug in used_slugs:
        slug = f"{base_slug}-{index}"
        index += 1
    used_slugs.add(slug)
    return slug


def main():
    SOURCE_DIR.mkdir(parents=True, exist_ok=True)
    ASSET_DIR.mkdir(parents=True, exist_ok=True)

    current_posts = load_current_posts()
    current_title_map = {
        normalize_compare(post["title"]): post["slug"]
        for post in current_posts
    }
    used_slugs = {post["slug"] for post in current_posts}

    manifest_rows = []
    summary = []

    for source_path in sorted(EXPORT_DIR.glob("*.html")):
        if source_path.name.startswith("-temporary-slug"):
            continue

        doc = parse_document(source_path)
        title = normalize_text(" ".join(doc.xpath("//h1//text()")))
        description = normalize_text(" ".join(doc.xpath('//meta[@name="description"]/@content')))
        published_at = normalize_text(" ".join(doc.xpath('//time[contains(@class, "blog-post__timestamp")]/@datetime')))[:10]
        cover_url = normalize_text(" ".join(doc.xpath('//meta[@property="og:image"]/@content')))
        tags = [
            normalize_text(tag).lstrip("#")
            for tag in doc.xpath('//a[contains(@class, "blog-post__tag-link")]//text()')
        ]

        if not title:
            summary.append(
                {
                    "source": source_path.name,
                    "status": "skipped-no-title",
                }
            )
            continue

        normalized_title = normalize_compare(title)
        if normalized_title in current_title_map:
            summary.append(
                {
                    "source": source_path.name,
                    "title": title,
                    "status": "already-published",
                    "existingSlug": current_title_map[normalized_title],
                }
            )
            continue

        base_slug = slugify(source_path.stem) or slugify(title)
        slug = unique_slug(base_slug, used_slugs)

        body_wrapper = find_body_wrapper(doc)
        body_html, body_images = clean_body(body_wrapper, slug, ASSET_DIR)
        first_paragraph = extract_first_paragraph_text(body_html)
        subtitle = choose_subtitle(description, first_paragraph)
        category_key = infer_category_key(title, description, tags)

        cover_relative = ""
        if cover_url:
            cover_ext = guess_extension(cover_url)
            cover_name = f"{slug}-cover{cover_ext}"
            cover_relative = f"assets/blog/{cover_name}"
            manifest_rows.append(f"{cover_url}\t{ASSET_DIR / cover_name}")

        for image_item in body_images:
            manifest_rows.append(f'{image_item["url"]}\t{image_item["target"]}')

        source_file = SOURCE_DIR / f"{slug}.source"
        source_file.write_text(build_source_file(body_html, tags, ""), encoding="utf-8")

        summary.append(
            {
                "source": source_path.name,
                "status": "pending",
                "slug": slug,
                "title": title,
                "subtitle": subtitle,
                "description": description,
                "publishedAt": published_at,
                "categoryKey": category_key,
                "coverImage": cover_relative,
                "coverAlt": title,
                "sourceFile": str(source_file.relative_to(ROOT)),
                "tags": tags,
            }
        )

    MANIFEST_PATH.write_text("\n".join(manifest_rows) + ("\n" if manifest_rows else ""), encoding="utf-8")
    SUMMARY_PATH.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")

    pending_count = sum(1 for item in summary if item.get("status") == "pending")
    published_count = sum(1 for item in summary if item.get("status") == "already-published")
    print(f"Batch import preparado: {pending_count} pendientes, {published_count} ya publicados.")


if __name__ == "__main__":
    main()
