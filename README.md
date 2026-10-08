# navain-ai-updated
# Navain AI — Marketing Website

The complete **Navain AI** marketing site: ten content pages plus a branded 404,
a working AI chatbot (**Stacy**), a spam-protected Formspree contact form,
self-hosted webfonts, per-page social preview images, full structured data, and a
CI health check. No build step, no bundled libraries — plain HTML, one shared
stylesheet (`assets/base.css`), and a few tiny hand-written scripts.

**Navain AI** is a 24/7 AI phone receptionist for service businesses. It answers
every call in the business's own voice within two rings, books appointments from
a live calendar, and sends the owner a text/email summary. No hardware, no
contracts, live on the customer's existing number within 24 hours.
A [Pontis Construction Inc.](https://www.pontisconstruction.com/) company ·
<https://navainai.com>

## Pages

| File | Purpose |
|---|---|
| `index.html` | Human-first hero, immediate revenue calculator, trust signals, call flow, benefits, industries, testimonials, pricing, FAQ, CTA + JSON-LD |
| `how-it-works.html` | Ring → Understand → Resolve → Notify, 24-hour setup |
| `why-navain.html` | Positioning + honest comparison table |
| `industries.html` | All served industries |
| `testimonials.html` | Transparent, illustrative call stories across nine service-business niches |
| `about.html` | Pontis Construction origin story |
| `pricing.html` | Plans + full comparison table |
| `contact.html` | Formspree contact form |
| `privacy.html` / `terms.html` | Legal |

Every page: sticky nav with hamburger drawer under 760px, the floating chat
widget, a cookie banner (localStorage), and full Open Graph / Twitter / canonical
head tags.

## Repo layout

```
assets/
  base.css      shared stylesheet (all pages link exactly this one)
  fonts.css     @font-face rules for the self-hosted webfonts
  fonts/        woff2 webfonts (see "Fonts" below) — no third-party font CDN
  404.css       styles for 404.html only (kept out of base.css)
  reveal.js     IntersectionObserver fade-ins (<2KB, reduced-motion + no-JS safe)
  ui.js         nav drawer, cookie banner, contact form fetch, revenue calculator
  chat.js       the "Stacy" chat widget
  analytics.js  privacy-friendly, first-party-proxied analytics (see below)
  icon-512.png  the brand mark, 512x512 — Search, PWA and JSON-LD `logo`
  favicon-48/96/192.png, favicon.png (legacy 64px), apple-touch-icon.png
  logo.svg      displayed brand mark in the header and footer (vector, crisp at any size)
  logo.png      512x512 raster master the SVG was traced from (kept for reference)
  og-banner.png home-page social preview; og-<page>.png per-page variants
favicon.ico     multi-size 16/32/48 at the site root (default crawler fallback)
404.html        branded not-found page (auto-served by Vercel for unknown paths)
.github/workflows/site-check.yml  CI: HTML/link/JSON-LD health check on every push
tools/
  make-icons.py    regenerates the whole icon set from code — see "Favicon" below
  make-og-banners.py  regenerates the per-page og-<page>.png banners
  check-site.py    zero-dependency static health check (run in CI and locally)
api/
  config.js     GET  → { chat, tts } — which env vars exist
  chat.js       POST → Groq chat completion → { text }
  speak.js      POST → optional text-to-speech (audio/wav)
```

## The chatbot (API key never reaches the browser)

1. On load the widget calls `GET /api/config`, which reports
   `{ chat: boolean, tts: boolean }` based on which environment variables exist.
2. On send it POSTs `{ system, messages, max_tokens }` to `/api/chat`.
3. `/api/chat` reads `GROQ_API_KEY` from **Vercel's environment variables** and
   proxies the request to Groq. On any failure it returns `{ error }` with an
   appropriate status, and the widget shows a friendly fallback message with the
   contact email.

If the key is missing, the site still works — Stacy simply apologizes and points
visitors to **info@navainai.com**.

## Deploying (Vercel)

1. Push this repo to GitHub and import it at [vercel.com/new](https://vercel.com/new).
   Vercel detects the `api/` directory automatically — no framework preset needed.
2. **Vercel → Project → Settings → Environment Variables** → add:
   - `GROQ_API_KEY` — your key from [console.groq.com](https://console.groq.com)
   - Optional: `GROQ_MODEL` (default `llama-3.1-8b-instant`), `TTS_VOICE`
3. **Redeploy.** The serverless functions read env vars at runtime; without a
   redeploy the chatbot stays in its fallback mode.

`vercel.json` sets long-cache headers for `/assets/*`, sensible security headers,
and clean-URL rewrites (`/pricing` → `/pricing.html`).

The Formspree endpoint (`formspree.io/f/xnjwnoyw`) is already live — the form
works via `fetch` (no page reload) and falls back to a normal POST if JavaScript
is off. **Don't change the endpoint ID.**

## Running locally

Any static file server works:

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

For the chatbot locally, use Vercel's dev server so `/api/*` functions run:

```bash
npm i -g vercel && vercel dev
```

(With a plain static server, `/api/config` 404s and the widget gracefully shows
its fallback message — that's expected.)

## Favicon / the logo in Google Search

Google shows a site's icon next to its search results, but only if the icon it
fetches is square, at least 48x48, and in practice a **multiple of 48px**
(48/96/192/512). The site previously shipped one 64x64 PNG — 64 is not a
multiple of 48, so Google ignored it and displayed the default globe. There was
also no `/favicon.ico` at the root.

Every page now declares (see the head of any `.html`):

```html
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" sizes="48x48"   href="/assets/favicon-48.png">
<link rel="icon" type="image/png" sizes="96x96"   href="/assets/favicon-96.png">
<link rel="icon" type="image/png" sizes="192x192" href="/assets/favicon-192.png">
<link rel="icon" type="image/png" sizes="512x512" href="/assets/icon-512.png">
<link rel="apple-touch-icon" sizes="180x180" href="/assets/apple-touch-icon.png">
```

`robots.txt` explicitly allows `Googlebot-Image` (a blocked icon is never shown),
and `index.html` points its JSON-LD `Organization.logo` at `icon-512.png`.

Regenerate everything after a brand change:

```bash
pip install pillow
python3 tools/make-icons.py    # rewrites favicon.ico + all assets/favicon-*.png
```

Icon URLs are stable across deploys on purpose — Google caches the favicon and a
URL that keeps changing resets the clock. To nudge Google after an icon change,
open the site in [Search Console](https://search.google.com/search-console) →
**URL inspection** → *Request indexing* for the homepage. Updates normally appear
within a few days to a few weeks.

## Fonts (self-hosted, no third party)

The site loads Fraunces (display), Inter (body) and IBM Plex Mono (labels) from
`assets/fonts/*.woff2`, declared in `assets/fonts.css`. This replaced the old
`fonts.googleapis.com` `<link>` tags. Why it matters:

- **Privacy.** Requesting a font from Google sends every visitor's IP address to
  Google on every pageview — an undisclosed third-party processor under GDPR.
  Self-hosting removes that entirely (and it's what the privacy policy now says).
- **Performance.** No extra DNS/TLS round-trips to two Google origins, and the
  fonts inherit the site's own immutable `/assets/*` cache policy.
- **CSP.** A strict `font-src 'self'` becomes possible.

Family names in `assets/fonts.css` deliberately match the ones `base.css` already
references, so `base.css` needed no changes. `font-weight: 650` (used on `h1` and
the brand word) only works because Fraunces/Inter ship as *variable* fonts
(`woff2` with a `wght` axis). If you change families, update `assets/fonts.css`
and regenerate with the files in `assets/fonts/`.

## Security headers (vercel.json)

`vercel.json` now sends, in addition to the existing headers:

- `Content-Security-Policy` — enforceable because the site has **zero** inline
  `<script>`, **zero** inline `<style>` and **zero** `style=` attributes
  (verified by `tools/check-site.py`). Every allowlisted origin is one the site
  genuinely calls. `media-src blob:` covers Stacy's TTS playback; `form-action`
  covers Formspree and the DuckDuckGo search on the 404 page; Groq is **not**
  listed because `api/*.js` call it server-side.
- `X-Frame-Options: DENY` and `Strict-Transport-Security`.

**If you add an inline `<script>` later, add a nonce** to it and to the CSP
rather than weakening the policy with `'unsafe-inline'`.

## Analytics

`assets/analytics.js` injects a cookieless Plausible snippet, loaded through the
Vercel rewrites `/pl/js/script.js` → `plausible.io` and `/pl/api/event` →
`plausible.io/api/event`. From the browser's point of view every request stays
same-origin, so the CSP keeps `script-src 'self'` / `connect-src 'self'`, and it
survives most ad blockers. It sets no cookies and is disclosed in the privacy
policy. To disable, set `ANALYTICS_DOMAIN = ""` in `assets/analytics.js`.

**Action required:** create the site in your Plausible account (domain
`navainai.com`) for events to actually record. Until then the script loads
harmlessly and records nothing.

## 404 page

`404.html` is served automatically by Vercel for unknown paths. It is branded,
`noindex`, has no canonical, and offers search + the most-visited links so a
typo'd or stale link never dead-ends a prospect.

## Structured data (all pages)

`index.html` has the full `@graph` (Organization, WebSite, Service, FAQPage).
The other nine pages now carry their own JSON-LD: `BreadcrumbList` everywhere,
plus `AboutPage`/`ContactPage`/`CollectionPage`/`WebPage` as appropriate, an
`ItemList` of the real industries on `industries.html`, and a `Product` with the
two real `Offer`s on `pricing.html`. Testimonials deliberately get **no**
`Review`/`aggregateRating` markup because the page states its stories are
illustrative — marking them up as reviews would misstate that to Google.

## Per-page social previews

Each page declares its own `og:image` (`assets/og-<page>.png`), generated to
match the home banner's visual language. Regenerate after a brand change:

```bash
pip install pillow fonttools brotli
python3 tools/make-og-banners.py
```

## CI health check

`.github/workflows/site-check.yml` runs `tools/check-site.py` on every push and
PR. It checks HTML tag balance, that every internal link/asset resolves, that
every JSON-LD block parses, and that required SEO/OG head tags exist (the 404
page is exempted from canonical and must be `noindex`). Run it locally with:

```bash
python3 tools/check-site.py
```

## Notes

- `robots.txt` allows everything except `/api/`, explicitly allows
  `Googlebot-Image` so the favicon stays crawlable, and points to `sitemap.xml`
  (all content pages at `https://navainai.com/`). The 404 page is excluded.
- Copy rule: product facts only (two rings, 24/7, no hardware, live within
  24 hours, month-to-month). No invented metrics anywhere on the site.

### Deliberately **not** done (and why)

- **CSS minification.** `base.css` is 66KB raw but ~13KB gzip/brotli, and Vercel
  compresses automatically. Minifying would save ~1KB on the wire and destroy
  readability — not worth it for a no-build site.
- **WebP/AVIF + `loading="lazy"`.** The only `<img>` tags on the entire site are
  two small inline SVG logos (header + footer), which are above the fold —
  lazy-loading them would *hurt* LCP. The 131KB `og-banner.png` is fetched only
  by social crawlers, and those handle PNG/JPEG more reliably than WebP, so
  converting it risks breaking previews. There is effectively nothing to
  optimize in the render path.
- **Real customer testimonials.** The current stories are honestly labeled
  "illustrative." Fabricating named endorsements would be dishonest and would
  also breach Google's self-serving-review policy. Add real quotes as soon as
  you have them.
