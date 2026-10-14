#!/usr/bin/env python3
"""Zero-dependency accessibility smoke checks for Navain AI's static pages.

This catches common regressions in page structure, accessible names, image
alternatives, ARIA/label references, motion preferences, focus styling, and the
site's core text-color contrast tokens. It is a useful CI guard, not a substitute
for keyboard, screen-reader, or browser-based WCAG testing.

Usage: python3 tools/check-a11y.py
"""
import glob
import os
import re
import sys
from html.parser import HTMLParser

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link",
        "meta", "param", "source", "track", "wbr"}
TEXT_CONTRAST = 4.5
LARGE_TEXT_CONTRAST = 3.0
problems = []


class PageAudit(HTMLParser):
    def __init__(self, page):
        super().__init__(convert_charrefs=True)
        self.page = page
        self.ids = set()
        self.duplicates = set()
        self.labels_for = []
        self.label_depth = 0
        self.controls = []
        self.images = []
        self.named_elements = []
        self.named_records = []
        self.aria_refs = []
        self.lang = ""
        self.main_ids = []
        self.h1_count = 0
        self.has_skip_link = False
        self.stack = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        element_id = attrs.get("id")
        if element_id:
            if element_id in self.ids:
                self.duplicates.add(element_id)
            self.ids.add(element_id)

        if tag == "html":
            self.lang = attrs.get("lang", "").strip()
        elif tag == "main":
            self.main_ids.append(element_id or "")
        elif tag == "h1":
            self.h1_count += 1
        elif tag == "label":
            self.label_depth += 1
            if attrs.get("for"):
                self.labels_for.append(attrs["for"])
        elif tag == "a" and attrs.get("href") == "#main":
            self.has_skip_link = True

        if tag in ("input", "select", "textarea"):
            control_type = attrs.get("type", "").lower()
            if control_type not in ("hidden", "submit", "button", "reset", "image"):
                self.controls.append((tag, attrs, self.label_depth > 0))
        elif tag == "img":
            self.images.append(attrs)

        if tag in ("a", "button"):
            self.named_elements.append({"tag": tag, "attrs": attrs, "text": ""})

        for attr in ("aria-labelledby", "aria-describedby", "aria-controls"):
            if attrs.get(attr):
                self.aria_refs.extend((self.page, attr, ref) for ref in attrs[attr].split())

        if tag not in VOID:
            self.stack.append(tag)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag == "label" and self.label_depth:
            self.label_depth -= 1
        if tag in ("a", "button"):
            for i in range(len(self.named_elements) - 1, -1, -1):
                if self.named_elements[i]["tag"] == tag:
                    self.named_records.append(self.named_elements.pop(i))
                    break
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i] == tag:
                del self.stack[i:]
                break

    def handle_data(self, data):
        text = data.strip()
        if text:
            for element in self.named_elements:
                element["text"] += text + " "


def has_name(element):
    attrs = element["attrs"]
    if any(attrs.get(key, "").strip() for key in ("aria-label", "aria-labelledby", "title")):
        return True
    if element["text"].strip():
        return True
    return False


def audit_pages():
    pages = sorted(glob.glob(os.path.join(ROOT, "*.html")))
    if not pages:
        problems.append("no HTML pages found")
        return 0

    for path in pages:
        name = os.path.basename(path)
        parser = PageAudit(name)
        try:
            with open(path, encoding="utf-8") as f:
                parser.feed(f.read())
        except Exception as exc:
            problems.append(f"{name}: could not parse HTML ({exc})")
            continue

        if not parser.lang:
            problems.append(f"{name}: <html> needs a lang attribute")
        if parser.main_ids != ["main"]:
            problems.append(f"{name}: expected exactly one <main id=\"main\">")
        if parser.h1_count != 1:
            problems.append(f"{name}: expected one clear page <h1>, found {parser.h1_count}")
        if not parser.has_skip_link:
            problems.append(f"{name}: missing a skip link to #main")
        for duplicate in sorted(parser.duplicates):
            problems.append(f"{name}: duplicate id \"{duplicate}\"")
        for label_id in parser.labels_for:
            if label_id not in parser.ids:
                problems.append(f"{name}: label points to missing id \"{label_id}\"")
        for tag, attrs, nested in parser.controls:
            labelled = nested or attrs.get("id") in parser.labels_for
            labelled = labelled or bool(attrs.get("aria-label", "").strip())
            labelled = labelled or bool(attrs.get("aria-labelledby", "").strip())
            if not labelled:
                problems.append(
                    f"{name}: <{tag}> needs a visible label or an accessible name"
                )
        for attrs in parser.images:
            if "alt" not in attrs:
                problems.append(f"{name}: image {attrs.get('src', '(unknown)')} needs an alt attribute")
        for element in parser.named_records:
            if not has_name(element):
                problems.append(f"{name}: <{element['tag']}> needs an accessible name")
        for _, attr, ref in parser.aria_refs:
            if ref not in parser.ids:
                problems.append(f"{name}: {attr} points to missing id \"{ref}\"")
    return len(pages)


def rgb(hex_color):
    value = hex_color.lstrip("#")
    if len(value) != 6:
        raise ValueError(f"expected a six-digit hex color, got {hex_color}")
    return tuple(int(value[i:i + 2], 16) / 255 for i in (0, 2, 4))


def luminance(hex_color):
    channels = []
    for value in rgb(hex_color):
        channels.append(value / 12.92 if value <= 0.04045 else ((value + 0.055) / 1.055) ** 2.4)
    return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]


def contrast(foreground, background):
    first, second = sorted((luminance(foreground), luminance(background)), reverse=True)
    return (first + 0.05) / (second + 0.05)


def audit_color_tokens():
    css_path = os.path.join(ROOT, "assets", "base.css")
    with open(css_path, encoding="utf-8") as f:
        css = f.read()
    root = re.search(r":root\s*\{(.*?)\}", css, re.S)
    if not root:
        problems.append("assets/base.css: could not find design-token :root block")
        return 0

    tokens = dict(re.findall(r"(--[\w-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;", root.group(1)))
    required = ("--bg", "--surface", "--card", "--ink-h", "--ink-body", "--ink-micro",
                "--cyan", "--cyan-hot", "--cyan-text", "--clay-text", "--error-text")
    missing = [name for name in required if name not in tokens]
    if missing:
        problems.append("assets/base.css: missing contrast-tested tokens " + ", ".join(missing))
        return 0

    tested = 0
    surfaces = ("--bg", "--surface", "--card")
    text_tokens = ("--ink-h", "--ink-body", "--ink-micro", "--cyan", "--cyan-hot", "--cyan-text", "--clay-text", "--error-text")
    for text_token in text_tokens:
        for surface in surfaces:
            score = contrast(tokens[text_token], tokens[surface])
            tested += 1
            if score < TEXT_CONTRAST:
                problems.append(
                    f"assets/base.css: {text_token} on {surface} is {score:.2f}:1; "
                    f"needs at least {TEXT_CONTRAST:.1f}:1 for normal text"
                )

    for button_background in ("--cyan", "--cyan-hot"):
        button_contrast = contrast("#FFFEFB", tokens[button_background])
        tested += 1
        if button_contrast < TEXT_CONTRAST:
            problems.append(
                f"assets/base.css: primary button text on {button_background} "
                f"is {button_contrast:.2f}:1"
            )

    gradient_pairs = re.findall(r"(--grad-[\w-]+)\s*:\s*(linear-gradient\([^;]+\))\s*;", root.group(1))
    gradients = dict(gradient_pairs)
    for name, value in gradients.items():
        colors = re.findall(r"#[0-9A-Fa-f]{6}", value)
        for color in colors:
            for surface in surfaces:
                score = contrast(color, tokens[surface])
                tested += 1
                if score < LARGE_TEXT_CONTRAST:
                    problems.append(
                        f"assets/base.css: {name} stop {color} on {surface} is {score:.2f}:1; "
                        f"needs at least {LARGE_TEXT_CONTRAST:.1f}:1 for large text"
                    )

    return tested


def audit_styles():
    path = os.path.join(ROOT, "assets", "base.css")
    with open(path, encoding="utf-8") as f:
        css = f.read()
    if ":focus-visible" not in css:
        problems.append("assets/base.css: visible keyboard focus styling is required")
    if "prefers-reduced-motion: reduce" not in css:
        problems.append("assets/base.css: reduced-motion support is required")


def main():
    count = audit_pages()
    tested = audit_color_tokens()
    audit_styles()
    if problems:
        print(f"ACCESSIBILITY CHECK FAILED with {len(problems)} problem(s):")
        for problem in problems:
            print("  -", problem)
        return 1
    print(f"OK — {count} pages passed structural accessibility checks; "
          f"{tested} design-token contrast checks passed; focus and reduced-motion styles found.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
