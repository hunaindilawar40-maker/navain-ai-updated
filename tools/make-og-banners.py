#!/usr/bin/env python3
"""Navain AI — per-page Open Graph banner generator.

Reproduces the visual language of assets/og-banner.png (dark canvas, Fraunces
serif display type, Inter body copy, cyan mono footer, gradient "N" mark) but
with a per-page headline, so social shares of /pricing etc. no longer all look
identical to the home page.

Usage:
    python3 tools/make-og-banners.py

Writes assets/og-<page>.png for every entry in PAGES below. The home page keeps
the original assets/og-banner.png. Re-run after editing PAGES or the palette.

Requires Pillow + fonttools (+ brotli). Static brand fonts are instantiated on
the fly from the variable woff2 files the site actually ships, so the banners
always use the same type as the live site.
"""
import os
import sys

from PIL import Image, ImageDraw, ImageFont
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONTS = os.path.join(ROOT, "assets", "fonts")
OUT = os.path.join(ROOT, "assets")

W, H = 1200, 630

# Palette sampled from assets/og-banner.png.
BG_A = (9, 13, 26)        # near-black navy (top-left)
BG_B = (16, 22, 38)       # slightly lighter navy (bottom-right)
INK = (245, 247, 250)     # headline
SUB = (214, 224, 235)     # body copy
CYAN = (0, 207, 232)      # mono accents / url
GRID = (255, 255, 255, 6) # faint grid lines

N_TOP = (123, 167, 240)   # N mark gradient top (blue)
N_BOT = (227, 123, 192)   # N mark gradient bottom (magenta)

# page -> (kicker, display title, subtitle)
PAGES = {
    "how-it-works": ("How it works", "How Navain AI works",
                     "Ring, understand, resolve, notify."),
    "why-navain": ("Why Navain", "Why teams choose Navain",
                   "An honest look at the alternatives."),
    "industries": ("Industries", "Built for your trade",
                   "HVAC to dental, salons to law offices."),
    "testimonials": ("Call stories", "Navain, on the line",
                     "Illustrative calls across nine niches."),
    "about": ("About us", "The people behind Navain",
                   "Built by the team behind Pontis Construction."),
    "pricing": ("Pricing", "Simple, honest pricing",
                "Essential $699 / Growth $999 per month."),
    "contact": ("Contact", "Talk to a person",
                "We reply the same business day."),
    "privacy": ("Privacy", "Your data, explained",
                "What we collect, why, and your choices."),
    "terms": ("Terms", "Terms of service",
              "The rules that govern the service."),
}


def _static_ttf(src, dst, axes):
    f = TTFont(src)
    f.flavor = None
    # Static fonts (e.g. IBM Plex Mono) have no fvar table — nothing to instance.
    if "fvar" in f and axes:
        instancer.instantiateVariableFont(f, axes)
    f.save(dst)
    return dst


def fonts():
    fra = _static_ttf(os.path.join(FONTS, "fraunces-var.woff2"),
                      "/tmp/fra_og.ttf", {"wght": 600, "opsz": 144})
    fra7 = _static_ttf(os.path.join(FONTS, "fraunces-var.woff2"),
                       "/tmp/fra_og7.ttf", {"wght": 700, "opsz": 144})
    int4 = _static_ttf(os.path.join(FONTS, "inter-var.woff2"),
                       "/tmp/int_og4.ttf", {"wght": 400})
    mono = _static_ttf(os.path.join(FONTS, "plex-mono-500.woff2"),
                       "/tmp/mono_og.ttf", {})
    return {
        "display": lambda s: ImageFont.truetype(fra7, s),
        "serif": lambda s: ImageFont.truetype(fra, s),
        "body": lambda s: ImageFont.truetype(int4, s),
        "mono": lambda s: ImageFont.truetype(mono, s),
    }


def _gradient(draw, box, a, b):
    x0, y0, x1, y1 = box
    for y in range(y0, y1):
        t = (y - y0) / max(1, (y1 - y0) - 1)
        c = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
        draw.line([(x0, y), (x1, y)], fill=c)


def render(f, page, kicker, title, subtitle):
    img = Image.new("RGB", (W, H), BG_A)
    d = ImageDraw.Draw(img, "RGBA")

    # diagonal-ish background wash
    _gradient(d, (0, 0, W, H), BG_A, BG_B)

    # faint grid, like the original banner
    for x in range(0, W, 60):
        d.line([(x, 0), (x, H)], fill=GRID, width=1)
    for y in range(0, H, 60):
        d.line([(0, y), (W, y)], fill=GRID, width=1)

    M = 70  # left margin

    # kicker (mono, cyan, letter-spaced)
    k = f["mono"](22)
    kt = kicker.upper()
    d.text((M, 96), "   ".join(kt), font=k, fill=CYAN)

    # display title (Fraunces), fit to width
    size = 96
    tfont = f["display"](size)
    while tfont.getlength(title) > (W - 2 * M - 260) and size > 40:
        size -= 4
        tfont = f["display"](size)
    d.text((M - 4, 150), title, font=tfont, fill=INK)

    # subtitle (Inter)
    b = f["body"](34)
    d.text((M, 150 + size + 34), subtitle, font=b, fill=SUB)

    # footer url (mono, cyan)
    d.text((M, H - 92), "navainai.com", font=f["mono"](28), fill=CYAN)

    # gradient "N" mark, right side
    nfont = f["serif"](300)
    # draw glyph to a mask then fill with a vertical gradient
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    md.text((W - 420, 170), "N", font=nfont, fill=255)
    grad = Image.new("RGB", (W, H))
    gd = ImageDraw.Draw(grad)
    _gradient(gd, (0, 150, W, 520), N_TOP, N_BOT)
    img.paste(grad, (0, 0), mask)

    return img


def main():
    f = fonts()
    for page, (kicker, title, subtitle) in PAGES.items():
        img = render(f, page, kicker, title, subtitle)
        out = os.path.join(OUT, f"og-{page}.png")
        img.save(out, "PNG", optimize=True)
        print(f"  wrote {os.path.basename(out)}  {os.path.getsize(out) // 1024}KB")


if __name__ == "__main__":
    sys.exit(main())
