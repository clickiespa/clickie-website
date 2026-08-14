from __future__ import annotations

import html as html_lib
import os
import re
import unicodedata
from pathlib import Path
from urllib.parse import unquote, urlparse

from lxml import html


SKIP_IMAGE_PATTERNS = (
    "CLICKIE%20LOGO",
    "/hs-fs/hubfs/CLICKIE LOGO",
)

INLINE_KEEP_STYLES = {
    "iframe",
    "div",
}

DROP_TAGS = {"script", "style"}


def normalize_text(value: str) -> str:
    value = html_lib.unescape(value or "")
    value = value.replace("\xa0", " ")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def parse_document(source_path: Path):
    return html.fromstring(source_path.read_text(encoding="utf-8"))


def find_body_wrapper(doc):
    nodes = doc.xpath('//div[contains(@class, "blog-post__body")]//*[@id="hs_cos_wrapper_post_body"]')
    if not nodes:
        raise RuntimeError("No se encontró hs_cos_wrapper_post_body")
    return nodes[0]


def sanitize_url(href: str, text_value: str) -> str:
    if not href:
        return href

    text_lower = text_value.lower()

    if href.endswith("../../../io/clickie/blog/index.html"):
        if "hola@clickie.io" in text_lower:
            return "mailto:hola@clickie.io"
        if "escr" in text_lower:
            return "../../index.html#contacto"
        return "../blog.html"

    if href.startswith("http://www.clickie.io") or href.startswith("https://www.clickie.io"):
        if "#contact" in href:
            return "../../index.html#contacto"
        return "../../index.html"

    if href.startswith("http://clickie.io") or href.startswith("https://clickie.io"):
        if "#contact" in href:
            return "../../index.html#contacto"
        return "../../index.html"

    if href.startswith("https://blog.clickie.io/author/"):
        return "../blog.html"

    return href


def guess_extension(url: str) -> str:
    parsed = urlparse(url)
    raw_path = unquote(parsed.path)
    ext = os.path.splitext(raw_path)[1].lower()
    if ext in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        return ext
    return ".jpg"


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value)
    ascii_text = normalized.encode("ascii", "ignore").decode("ascii")
    ascii_text = ascii_text.lower()
    ascii_text = re.sub(r"[^a-z0-9]+", "-", ascii_text)
    return ascii_text.strip("-")


def clean_body(body_wrapper, slug: str, asset_dir: Path):
    body_wrapper = html.fromstring(html.tostring(body_wrapper, encoding="unicode"))

    for comment in body_wrapper.xpath(".//comment()"):
        parent = comment.getparent()
        if parent is not None:
            parent.remove(comment)

    for tag_name in DROP_TAGS:
        for node in body_wrapper.xpath(f".//{tag_name}"):
            node.drop_tree()

    for button_wrapper in body_wrapper.xpath('.//div[contains(@class, "button-wrapper")]'):
        button_wrapper.drop_tree()

    download_items = []
    body_image_index = 1

    for node in body_wrapper.iter():
        if not isinstance(node.tag, str):
            continue

        if node.tag == "a":
            text_value = normalize_text(" ".join(node.xpath(".//text()")))
            href = sanitize_url(node.get("href", ""), text_value)
            for attr in list(node.attrib):
                if attr not in {"href", "target", "rel"}:
                    del node.attrib[attr]
            if href:
                node.set("href", href)

        elif node.tag == "img":
            src = node.get("src", "")
            if src and not any(pattern in src for pattern in SKIP_IMAGE_PATTERNS):
                ext = guess_extension(src)
                target_name = f"{slug}-{body_image_index:02d}{ext}"
                node.set("src", f"../../assets/blog/{target_name}")
                download_items.append(
                    {
                        "url": src,
                        "target": str(asset_dir / target_name),
                    }
                )
                body_image_index += 1
            keep_attrs = {"src", "alt"}
            for attr in list(node.attrib):
                if attr not in keep_attrs:
                    del node.attrib[attr]

        elif node.tag == "iframe":
            keep_attrs = {"src", "title", "allow", "allowfullscreen", "frameborder", "referrerpolicy", "style"}
            for attr in list(node.attrib):
                if attr not in keep_attrs:
                    del node.attrib[attr]

        else:
            for attr in list(node.attrib):
                if attr == "class" and node.tag == "blockquote":
                    continue
                if attr == "style" and node.tag in INLINE_KEEP_STYLES:
                    continue
                del node.attrib[attr]

    for span in body_wrapper.xpath(".//span[not(@class) and not(@style)]"):
        span.drop_tag()

    for wrapper in body_wrapper.xpath(".//div[not(@style) and not(@class)]"):
        wrapper.drop_tag()

    for list_item in body_wrapper.xpath(".//li"):
        children = [child for child in list_item if isinstance(child.tag, str)]
        if len(children) == 1 and children[0].tag == "p" and len(children[0]) == 0:
            paragraph = children[0]
            list_item.text = (paragraph.text or "").strip()
            paragraph.drop_tree()

    for list_node in body_wrapper.xpath(".//ul | .//ol"):
        next_sibling = list_node.getnext()
        while next_sibling is not None and isinstance(next_sibling.tag, str) and next_sibling.tag == list_node.tag:
            following = next_sibling.getnext()
            for child in list(next_sibling):
                list_node.append(child)
            next_sibling.drop_tree()
            next_sibling = following

    for empty in body_wrapper.xpath(".//*[self::p or self::h2 or self::h3]"):
        text_value = normalize_text(empty.text_content())
        has_media = bool(empty.xpath(".//img | .//iframe"))
        if not text_value and not has_media:
            empty.drop_tree()

    for empty_div in reversed(body_wrapper.xpath(".//div")):
        text_value = normalize_text(empty_div.text_content())
        has_keep_content = bool(empty_div.xpath(".//img | .//iframe | .//blockquote | .//p | .//ul | .//ol | .//h2 | .//h3"))
        if not text_value and not has_keep_content:
            empty_div.drop_tree()

    for paragraph in body_wrapper.xpath(".//p"):
        text_value = normalize_text(paragraph.text_content())
        if text_value.startswith("#") and " " in text_value:
            paragraph.drop_tree()

    if body_wrapper.text:
        body_wrapper.text = normalize_text(body_wrapper.text)

    parts = []
    for child in body_wrapper:
        serialized = html.tostring(child, encoding="unicode", method="html")
        parts.append(serialized.strip())

    body_html = "\n      ".join(part for part in parts if part)
    body_html = body_html.replace("<!--more-->", "")
    body_html = re.sub(r">\s+<", ">\n      <", body_html)
    body_html = re.sub(
        r'(?<!mailto:)(?<!">)(hola@clickie\.io)(?!</a>)',
        r'<a href="mailto:hola@clickie.io">\1</a>',
        body_html,
    )
    body_html = re.sub(r"<br\s*/?>\s*<br\s*/?>\s*<br\s*/?>", "<br><br>", body_html, flags=re.IGNORECASE)
    body_html = body_html.replace(" O escribenos ", " O escríbenos ")
    body_html = body_html.replace(">Escribenos<", ">Escríbenos<")
    body_html = body_html.replace(">escribenos<", ">escríbenos<")

    return body_html.strip(), download_items


def build_source_file(body_html: str, tags: list[str], highlight: str = "") -> str:
    tag_html = "\n".join(f'    <span>#{tag}</span>' for tag in tags)
    return (
        f"<!-- ARTICLE_HIGHLIGHT: {highlight} -->\n"
        "<!-- ARTICLE_CONTENT_START -->\n"
        '<div class="article-content">\n'
        f"      {body_html}\n"
        "</div>\n"
        "<!-- ARTICLE_CONTENT_END -->\n\n"
        "<!-- ARTICLE_TAGS_START -->\n"
        '<div class="article-footer">\n'
        '  <div class="article-tags">\n'
        f"{tag_html}\n"
        "  </div>\n"
        "</div>\n"
        "<!-- ARTICLE_TAGS_END -->\n"
    )
