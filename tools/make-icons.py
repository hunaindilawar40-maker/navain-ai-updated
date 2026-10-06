#!/usr/bin/env python3
"""
Navain AI — icon set generator.

Renders the "N" brand mark on the dark rounded tile at high resolution, then
downsamples to every size the site (and Google Search) needs.

Why this exists: Google only uses a favicon that is square and at least 48x48,
and in practice wants a multiple of 48px (48, 96, 144, 192, 512 ...). The old
site shipped a single 64x64 PNG, which is not a multiple of 48 -> Google
ignored it and showed the generic globe instead of the Navain mark. There was
also no /favicon.ico at the site root.

Run from the repo root:  python3 tools/make-icons.py
Requires Pillow:         pip install pillow

Outputs
  favicon.ico                  (repo root, 16/32/48 multi-size)
  assets/favicon.png           64x64   (legacy path kept working)
  assets/favicon-48.png        48x48   <- Google's minimum
  assets/favicon-96.png        96x96   <- what Google actually renders
  assets/favicon-192.png       192x192
  assets/icon-512.png          512x512 (Google, PWA, structured data)
  assets/apple-touch-icon.png  180x180 (iOS: opaque, full-bleed square)
"""

import os
from PIL import Image, ImageChops, ImageDraw

# --- Brand palette (mirrors assets/base.css :root) ---------------------------
BG_TOP = (9, 13, 24)        # subtle lift at the top of the tile
BG_BOTTOM = (4, 6, 13)      # deep navy, close to --bg #05070E
CYAN = (34, 240, 255)       # --cyan-hot #22F0FF
VIOLET = (168, 85, 247)     # --violet   #A855F7
MAGENTA = (255, 46, 151)    # --magenta  #FF2E97

# --- Geometry, as fractions of the canvas ------------------------------------
CORNER_RADIUS = 0.217   # rounded tile, matches the existing logo.png silhouette
N_SCALE = 0.60          # side of the N / tile side (bigger than the old logo, so it reads at 16px)
N_ASPECT = 0.98         # N height / N width
STROKE = 0.23           # stroke width / N width (close to the old logo, nudged up for 16px legibility)
SS = 4                  # supersampling factor for the master render

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def _lerp(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def _gradient_color(t):
    """Cyan -> violet -> magenta (the site's brand gradient)."""
    if t < 0.5:
        return _lerp(CYAN, VIOLET, t / 0.5)
    return _lerp(VIOLET, MAGENTA, (t - 0.5) / 0.5)


def _tile_image(size):
    """Opaque dark rounded tile."""
    tile = Image.new("RGB", (size, size), BG_TOP)
    grad = Image.new("L", (2, size))
    for y in range(size):
        v = int(255 * y / max(1, size - 1))
        grad.putpixel((0, y), v)
        grad.putpixel((1, y), v)
    tile.paste(Image.new("RGB", (size, size), BG_BOTTOM), (0, 0), grad.resize((size, size)))

    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        [0, 0, size - 1, size - 1], radius=int(round(CORNER_RADIUS * size)), fill=255
    )
    out.paste(tile, (0, 0), mask)
    return out


def _n_box(size):
    n_w = N_SCALE * size
    n_h = N_ASPECT * n_w
    x0 = (size - n_w) / 2
    y0 = (size - n_h) / 2
    return x0, y0, x0 + n_w, y0 + n_h


def _n_mask(size):
    """The N: two rounded vertical strokes plus the diagonal, unioned."""
    x0, y0, x1, y1 = _n_box(size)
    w = STROKE * (x1 - x0)

    legs = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(legs)
    d.rounded_rectangle([x0, y0, x0 + w, y1], radius=w / 2, fill=255)
    d.rounded_rectangle([x1 - w, y0, x1, y1], radius=w / 2, fill=255)

    # Diagonal: a 45-degree band from the top-left cap's centre to the
    # bottom-right cap's centre, then clipped to the legs' outer edges so it
    # never bulges past them (the flaw in the original logo.png, where the
    # diagonal pokes out to the right of the right leg near the bottom).
    band = Image.new("L", (size, size), 0)
    bd = ImageDraw.Draw(band)
    p1 = (x0 + w / 2, y0 + w / 2)
    p2 = (x1 - w / 2, y1 - w / 2)
    bd.line([p1, p2], fill=255, width=int(round(w)))
    for cx, cy in (p1, p2):
        bd.ellipse([cx - w / 2, cy - w / 2, cx + w / 2, cy + w / 2], fill=255)
    clip = Image.new("L", (size, size), 0)
    ImageDraw.Draw(clip).rectangle([x0, y0, x1, y1], fill=255)
    band = ImageChops.multiply(band, clip)

    return ImageChops.lighter(legs, band)


def _n_layer(size):
    """Gradient-filled N, so the ramp runs corner-to-corner across the letter."""
    x0, y0, x1, y1 = _n_box(size)
    span = (x1 - x0) + (y1 - y0)

    # Build the smooth ramp small, then scale it up: a linear gradient survives
    # a bilinear resize exactly, and this keeps the render fast.
    src = max(16, size // 4)
    small = Image.new("RGB", (src, src))
    px = small.load()
    k = size / src
    for gy in range(src):
        for gx in range(src):
            t = ((gx * k - x0) + (gy * k - y0)) / span
            px[gx, gy] = _gradient_color(min(1.0, max(0.0, t)))
    ramp = small.resize((size, size), Image.BILINEAR)

    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    layer.paste(ramp, (0, 0), _n_mask(size))
    return layer


def _master(size):
    """Supersampled master: tile + gradient N."""
    s = size * SS
    return Image.alpha_composite(_tile_image(s), _n_layer(s)).resize(
        (size, size), Image.LANCZOS
    )


def render(size, master=None):
    master = master or _master(size)
    if size == master.size[0]:
        return master
    return master.resize((size, size), Image.LANCZOS)


def render_full_bleed(size, master):
    """iOS maskable: opaque square, edge to edge, no transparent corners."""
    bg = Image.new("RGBA", (size, size), BG_BOTTOM + (255,))
    bg.alpha_composite(render(size, master))
    return bg


def main():
    assets = os.path.join(ROOT, "assets")
    master = _master(512)  # one high-res render, downscaled to everything else

    targets = [
        ("icon-512.png", 512),
        ("favicon-192.png", 192),
        ("favicon-96.png", 96),
        ("favicon.png", 64),
        ("favicon-48.png", 48),
    ]
    for name, size in targets:
        render(size, master).save(os.path.join(assets, name), "PNG", optimize=True)
        print(f"wrote assets/{name} ({size}x{size})")

    apple = render_full_bleed(180, master)
    apple.save(os.path.join(assets, "apple-touch-icon.png"), "PNG", optimize=True)
    print("wrote assets/apple-touch-icon.png (180x180, opaque)")

    # favicon.ico at the site root: browsers and Google both look there by default.
    render(48, master).save(
        os.path.join(ROOT, "favicon.ico"), format="ICO", sizes=[(16, 16), (32, 32), (48, 48)]
    )
    print("wrote favicon.ico (16/32/48)")


if __name__ == "__main__":
    main()
