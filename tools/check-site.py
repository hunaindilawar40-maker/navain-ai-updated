#!/usr/bin/env python3
"""Navain AI — static site health check (run in CI and locally).

Validates, across every *.html page:
  1. Tag balance (no unclosed / stray tags)          — catches broken markup.
  2. Every internal link and asset reference resolves — catches dead links.
  3. Every JSON-LD block is valid JSON                — catches structured-data
     typos that would silently kill rich results.
  4. Required SEO/OG head tags are present            — catches regressed meta.

Usage:
    python3 tools/check-site.py
Exit code 0 = clean, 1 = problems found. Designed to have zero non-stdlib
dependencies so CI needs no package install step.
"""
import glob
import json
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}

problems = []


def clean_urls():
    """Map of vercel.json rewrites: /about -> /about.html etc."""
    m = {}
    try:
        cfg = json.load(open(os.path.join(ROOT, "vercel.json")))
        for r in cfg.get("rewrites", []):
            src, dst = r.get("source"), r.get("destination")
            if src and dst and dst.endswith(".html"):
                m[src] = dst
    except Exception:
        pass
    return m


class TagChecker(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errs = []

    def handle_starttag(self, tag, attrs):
        if tag not in VOID:
            self.stack.append((tag, self.getpos()[0]))

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        if not self.stack:
            self.errs.append(f"stray </{tag}> line {self.getpos()[0]}")
            return
        if self.stack[-1][0] == tag:
            self.stack.pop()
        else:
            self.errs.append(
                f"</{tag}> line {self.getpos()[0]} closes <{self.stack[-1][0]}> "
                f"opened line {self.stack[-1][1]}")
            for i in range(len(self.stack) - 1, -1, -1):
                if self.stack[i][0] == tag:
                    del self.stack[i:]
                    break


def resolve(path, rewrites):
    if path in ("", "/"):
        return "index.html"
    if path in rewrites:
        return rewrites[path].lstrip("/")
    return path.lstrip("/")


def main():
    rewrites = clean_urls()
    pages = sorted(glob.glob(os.path.join(ROOT, "*.html")))
    if not pages:
        print("no html files found")
        return 1

    for page in pages:
        name = os.path.basename(page)
        s = open(page, encoding="utf-8").read()

        # 1. tag balance
        tc = TagChecker()
        tc.feed(s)
        for e in tc.errs:
            problems.append(f"{name}: {e}")
        for t, l in tc.stack:
            problems.append(f"{name}: unclosed <{t}> opened line {l}")

        # 2. internal links / assets resolve (drop query string / fragment)
        for ref in re.findall(r'(?:href|src)="(/[^"#?][^"#]*)', s):
            ref = ref.split("?")[0].split("#")[0]
            target = os.path.join(ROOT, resolve(ref, rewrites))
            if not os.path.exists(target):
                problems.append(f"{name}: broken internal ref -> {ref}")

        # 3. JSON-LD validity
        for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>',
                            s, re.S):
            try:
                json.loads(b)
            except Exception as e:
                problems.append(f"{name}: invalid JSON-LD ({e})")

        # 4. required head tags. The 404 page is an error page: it must be
        # noindex and deliberately has NO canonical (no single true URL), so we
        # don't demand one there.
        required = [
            ('name="description"', "meta description"),
            ('name="viewport"', "viewport"),
        ]
        if name != "404.html":
            required += [
                ('rel="canonical"', "canonical"),
                ('property="og:title"', "og:title"),
            ]
        else:
            if 'name="robots" content="noindex' not in s:
                problems.append(f"{name}: error page must be noindex")
        for needle, label in required:
            if needle not in s:
                problems.append(f"{name}: missing {label}")

    if problems:
        print(f"FAILED with {len(problems)} problem(s):")
        for p in problems:
            print("  -", p)
        return 1

    print(f"OK — {len(pages)} pages checked, no broken links, "
          f"valid JSON-LD, balanced markup.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
