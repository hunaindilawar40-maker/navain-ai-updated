# Navain AI — Marketing Website

The complete **Navain AI** marketing site: ten static pages, a working AI chatbot
(**Stacy**), and a Formspree-powered contact form. No build step, no bundled
libraries — plain HTML, one shared stylesheet (`assets/base.css`), and a few tiny
hand-written scripts.

**Navain AI** is a 24/7 AI phone receptionist for service businesses. It answers
every call in the business's own voice within two rings, books appointments from
a live calendar, and sends the owner a text/email summary. No hardware, no
contracts, live on the customer's existing number within 24 hours.
A [Pontis Construction](https://navainai.com/about.html) company ·
<https://navainai.com>

## Pages

| File | Purpose |
|---|---|
| `index.html` | Hero, cost of missed calls, call flow, benefits, industries, testimonials, before/after, pricing, revenue calculator, FAQ, CTA + JSON-LD |
| `how-it-works.html` | Ring → Understand → Resolve → Notify, 24-hour setup |
| `why-navain.html` | Positioning + honest comparison table |
| `industries.html` | All served industries |
| `testimonials.html` | Customer stories |
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
  base.css      shared stylesheet (all ten pages link exactly this one)
  reveal.js     IntersectionObserver fade-ins (<2KB, reduced-motion + no-JS safe)
  ui.js         nav drawer, cookie banner, contact form fetch, revenue calculator
  chat.js       the "Stacy" chat widget
  favicon.png / logo.png / og-banner.png
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
visitors to **revenuepartners.co@gmail.com**.

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

## Notes

- `robots.txt` allows everything except `/api/` and points to `sitemap.xml`
  (all ten pages at `https://navainai.com/`).
- Structured data (`index.html`): a single JSON-LD `@graph` with Organization,
  WebSite, Service (with the two real Offers, $699/$999 USD), and FAQPage.
  Deliberately **no** `aggregateRating`/`review` markup, and never `"price": "0"`.
- Copy rule: product facts only (two rings, 24/7, no hardware, live within
  24 hours, month-to-month). No invented metrics anywhere on the site.
