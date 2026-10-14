#!/usr/bin/env python3
"""Zero-dependency static performance-budget checks for Navain AI.

Checks shipped asset sizes, parser-blocking scripts, image dimensions, local
font loading, and immutable asset caching. These are preventive budgets; they
do not replace Lighthouse or real-user Core Web Vitals measurements.

Usage: python3 tools/check-performance.py
"""
import glob
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIMITS = {
    "html": 100 * 1024,
    "css_file": 100 * 1024,
    "js_file": 50 * 1024,
    "js_total": 200 * 1024,
    "fonts_total": 250 * 1024,
    "image_file": 250 * 1024,
}
problems = []


class AssetMarkupCheck(HTMLParser):
    def __init__(self, name):
        super().__init__(convert_charrefs=True)
        self.name = name

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "script" and attrs.get("src") and not ("defer" in attrs or "async" in attrs):
            problems.append(f"{self.name}: parser-blocking script {attrs['src']} needs defer or async")
        if tag == "img":
            if not attrs.get("width") or not attrs.get("height"):
                problems.append(f"{self.name}: image {attrs.get('src', '(unknown)')} needs width and height to reduce layout shift")


def files(pattern):
    return [Path(path) for path in glob.glob(str(ROOT / pattern), recursive=True) if Path(path).is_file()]


def enforce_size(path, limit, label=None):
    size = path.stat().st_size
    if size > limit:
        problems.append(f"{label or path.relative_to(ROOT)} is {size / 1024:.1f} KiB; budget is {limit / 1024:.0f} KiB")
    return size


def main():
    html_pages = files("*.html")
    for path in html_pages:
        enforce_size(path, LIMITS["html"])
        parser = AssetMarkupCheck(path.name)
        try:
            parser.feed(path.read_text(encoding="utf-8"))
        except Exception as exc:
            problems.append(f"{path.name}: could not inspect page assets ({exc})")

    styles = files("assets/*.css")
    for path in styles:
        enforce_size(path, LIMITS["css_file"])

    scripts = files("assets/*.js")
    script_total = sum(enforce_size(path, LIMITS["js_file"]) for path in scripts)
    if script_total > LIMITS["js_total"]:
        problems.append(f"JavaScript total is {script_total / 1024:.1f} KiB; budget is {LIMITS['js_total'] / 1024:.0f} KiB")

    font_files = files("assets/fonts/*.woff2")
    font_total = sum(path.stat().st_size for path in font_files)
    if font_total > LIMITS["fonts_total"]:
        problems.append(f"self-hosted fonts total {font_total / 1024:.1f} KiB; budget is {LIMITS['fonts_total'] / 1024:.0f} KiB")

    images = [p for p in files("assets/*") if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".webp", ".gif")]
    for path in images:
        enforce_size(path, LIMITS["image_file"])

    fonts_css = ROOT / "assets" / "fonts.css"
    font_css = fonts_css.read_text(encoding="utf-8") if fonts_css.exists() else ""
    font_css = re.sub(r"/\*.*?\*/", "", font_css, flags=re.S)
    if re.search(r"@import\s+url\(|url\(\s*['\"]?https?://", font_css, re.I):
        problems.append("assets/fonts.css: load fonts locally instead of from a third-party font CDN")

    try:
        vercel = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        cache_rules = [
            header.get("value", "")
            for rule in vercel.get("headers", [])
            if rule.get("source") == "/assets/(.*)"
            for header in rule.get("headers", [])
            if header.get("key", "").lower() == "cache-control"
        ]
        if not any("immutable" in rule and "max-age=31536000" in rule for rule in cache_rules):
            problems.append("vercel.json: /assets/* should use long-lived immutable caching")
    except Exception as exc:
        problems.append(f"vercel.json: could not verify static asset caching ({exc})")

    if problems:
        print(f"PERFORMANCE CHECK FAILED with {len(problems)} problem(s):")
        for problem in problems:
            print("  -", problem)
        return 1

    max_html = max((p.stat().st_size for p in html_pages), default=0)
    max_css = max((p.stat().st_size for p in styles), default=0)
    max_js = max((p.stat().st_size for p in scripts), default=0)
    max_image = max((p.stat().st_size for p in images), default=0)
    print(
        f"OK — static budgets pass: {len(html_pages)} pages, "
        f"largest HTML {max_html / 1024:.1f} KiB, CSS {max_css / 1024:.1f} KiB, "
        f"largest JS {max_js / 1024:.1f} KiB, fonts {font_total / 1024:.1f} KiB total, "
        f"largest image {max_image / 1024:.1f} KiB; scripts deferred and assets cached."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
