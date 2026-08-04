from __future__ import annotations

from io import BytesIO
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
BLOG_ASSETS = ROOT / "assets" / "blog"
MAX_DIMENSION = 1600
JPEG_QUALITY = 82
PNG_COLORS_RGB = 256
PNG_COLORS_RGBA = 192
MIN_BYTES_SAVED = 1024


def optimize_image(path: Path) -> tuple[int, int] | None:
    suffix = path.suffix.lower()
    if suffix not in {".png", ".jpg", ".jpeg"}:
        return None

    with Image.open(path) as original:
        original.load()
        image = original.copy()

    image.thumbnail((MAX_DIMENSION, MAX_DIMENSION), Image.Resampling.LANCZOS)

    buffer = BytesIO()

    if suffix in {".jpg", ".jpeg"}:
        if image.mode not in {"RGB", "L"}:
            image = image.convert("RGB")
        image.save(
            buffer,
            format="JPEG",
            quality=JPEG_QUALITY,
            optimize=True,
            progressive=True,
        )
    else:
        if "A" in image.getbands():
            image = image.convert("RGBA").quantize(
                colors=PNG_COLORS_RGBA,
                method=Image.Quantize.FASTOCTREE,
                dither=Image.Dither.FLOYDSTEINBERG,
            )
        else:
            image = image.convert(
                "P",
                palette=Image.Palette.ADAPTIVE,
                colors=PNG_COLORS_RGB,
                dither=Image.Dither.FLOYDSTEINBERG,
            )
        image.save(buffer, format="PNG", optimize=True)

    before = path.stat().st_size
    after = buffer.tell()
    if before - after < MIN_BYTES_SAVED:
        return None

    path.write_bytes(buffer.getvalue())
    return before, after


def main() -> None:
    total_before = 0
    total_after = 0
    updated = 0

    for path in sorted(BLOG_ASSETS.iterdir()):
        if not path.is_file():
            continue

        result = optimize_image(path)
        if result is None:
            continue

        before, after = result
        total_before += before
        total_after += after
        updated += 1
        print(f"{path.name}: {before} -> {after}")

    saved = total_before - total_after
    print(
        f"Optimized {updated} images. Saved {saved} bytes "
        f"({saved / 1024 / 1024:.2f} MiB)."
    )


if __name__ == "__main__":
    main()
