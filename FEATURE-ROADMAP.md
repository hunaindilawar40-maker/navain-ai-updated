# Navain AI — Feature Roadmap (no real-voice features)

> **Scope:** Suggestions only. Nothing in this document is built yet, and
> nothing here changes pricing, plans, or any promise on the live site.
> Existing prices stay exactly as published on `pricing.html`
> (Essential $699/mo + $899 setup · Growth $999/mo + $1,399 setup ·
> Enterprise custom).

## The hard rule: no real voice

Every feature below is **text, calendar, form, chat, SMS/email, or data**
based. A feature is rejected outright if it needs any of these:

- ❌ Voice cloning — copying the owner, a staff member, or any real person
- ❌ Playing, publishing, or demoing a recording of a real person's voice
  (no "listen to a real call", no audio testimonials, no call-recording player on the site)
- ❌ Text-to-speech playback presented as a real person (the old Stacy
  "🔊 Listen" button — now removed, see below)
- ❌ Claiming Navain "sounds like you" / uses "your own voice"
- ❌ Voice biometrics, voice passwords, or identifying a caller by their voice
- ❌ A live voice demo where a visitor talks to / is imitated by an AI voice

**Allowed substitute pattern:** show, don't play. Use clearly-labelled
*fictional text transcripts*, typed chat, written summaries, and mock
dashboards with made-up sample data. If a demo needs an example
conversation, it is written — never recorded, cloned, or played back.

### Already removed to enforce this (done, not "planned")

| Removed / changed | Where |
|---|---|
| `POST /api/speak` text-to-speech endpoint (PlayAI `Aaliyah-PlayAI`) | `api/speak.js` deleted |
| Stacy "🔊 Listen" button + `/api/speak` fetch + `Audio()` playback | `assets/chat.js` |
| `tts` flag from `GET /api/config` | `api/config.js` |
| `.tts-btn` styles | `assets/base.css` |
| `media-src 'self' blob:` (only needed for TTS playback) → `media-src 'self'` | `vercel.json` |
| `TTS_VOICE` / TTS docs | `.env.example`, `README.md` |
| All "in your own voice" / "custom agent voice" / "sounds like you" copy | every `.html` page, `assets/chat.js`, JSON-LD, meta/OG tags → replaced with "your approved greeting and script" |
| Mic icon on the "Keep your welcome familiar" card | `index.html` → message icon |
| Guardrail inside Stacy's system prompt (never claim voice cloning / offer a recording in a real voice; never claim to be human) | `assets/chat.js` |
| "Stacy is text-only…" disclosure | `privacy.html` |

Copy that remains is honest about the actual product: Navain answers the
phone using **the greeting and script the business approves** — it does not
claim to copy, clone, or be the owner's real voice.

---

## How to read the priorities

- **P0 — Do next (website-only, no new backend):** fits the current static
  site + Formspree/Calendly/Groq-chat stack. Days, not weeks.
- **P1 — Needs a small backend or integration:** highest product value,
  needs real engineering/accounts beyond this repo.
- **P2 — Later / validate first:** good ideas, only after P0/P1 prove demand.
- **Effort:** S = under a day · M = a few days · L = a week+ (rough, for planning)

---

## P0 — Website features (no new backend, no voice)

> **Status (2026-10-14): P0-1 to P0-8 are BUILT and live in this repo** —
> simulator + sample summary (`testimonials.html#simulator`, `how-it-works.html`),
> plan quiz (`pricing.html#plan-finder`), calculator v2 (`index.html#calculator`),
> FAQ search (every page with a `.faq-list`), written-reply form
> (`contact.html`), roofing/dental/law-offices/restaurants pages, and the
> setup checklist (`how-it-works.html#setup-checklist`). All in
> `assets/features.js` + the calculator/contact work in `assets/ui.js`;
> regression-tested with a DOM harness (27 checks).

### P0-1 · Text-based call simulator ("Read a call, don't hear one")
- **What:** Visitor picks an industry (plumbing/HVAC/salon…), picks a
  scenario (after-hours emergency, booking, price question), then watches a
  **typed, clearly-labelled fictional transcript** play out line-by-line,
  ending in the exact text/email summary the owner would receive.
- **Why:** This replaces the classic "listen to a demo call" — which is
  banned by the rule above — with something better for this audience:
  readable on a job site, skimmable, shareable, no audio, no fake voice.
- **Effort:** M (static JS + 4–6 hand-written fictional transcripts).
- **Guardrail:** Banner on the widget: "Fictional example — written, not a
  recording of a real call." No names of real customers, no invented results.

### P0-2 · Plan-finder quiz
- **What:** 4 questions (weekly call volume, locations, need CRM/SMS
  follow-up?, need multi-location?) → recommends Essential / Growth /
  Enterprise or "help me choose", then deep-links to
  `/contact.html?plan=…&intent=pricing` (the form already supports this).
- **Why:** Turns the pricing page's hardest job — "which one am I?" — into
  30 seconds. Reuses the existing contact-form prefill plumbing.
- **Effort:** S–M (static, client-side only).

### P0-3 · Missed-call calculator, v2
- **What:** Keep the existing calculator; add (a) industry presets for
  "average job value" the visitor can override, (b) a plain-English result
  sentence, (c) "Copy my result" / prefilled contact link carrying the
  three numbers into the contact form message.
- **Why:** It's already the homepage's strongest interactive asset; this
  makes its output *portable* into a lead instead of a dead-end number.
  Never auto-fill fake precision — label it an estimate, keep visitor's numbers.
- **Effort:** S.

### P0-4 · Searchable FAQ
- **What:** One search box filtering the existing `<details>` FAQs across
  Home / Pricing / industry pages (client-side text match + "no results →
  ask Stacy / email us").
- **Why:** Prospects ask the same 10 questions; Stacy shouldn't be the only
  way to find an answer. Good for SEO long-tail if the FAQ copy stays visible in HTML.
- **Effort:** S.

### P0-5 · "Text me / email me" callback request (not a call demo)
- **What:** A small form: name + mobile/email + "what's this about?" →
  Formspree (existing endpoint pattern) asking the **team** to reply **in
  writing**. Explicit copy: "We'll reply by text/email — no sales call unless you ask."
- **Why:** Many owners are on a job and can't take a call; a written reply
  respects that and matches the no-voice rule for the website itself.
- **Effort:** S (new `intent` prefill in `assets/ui.js`).

### P0-6 · Sample owner summary (mock, fictional data)
- **What:** A static, annotated mock of the post-call text/email summary
  and the end-of-week digest, with obviously fictional data
  ("Example — made-up data").
- **Why:** "What do I actually get after a call?" is the product's core
  promise and it's currently only described in prose. Showing the artefact
  (in text) sells it without any recording.
- **Effort:** S (pure HTML/CSS, reuse `.calc`/card styles).

### P0-7 · More industry pages from the existing template
- **What:** Roofing, dental, law offices, restaurants, real-estate /
  property management — cloned from `plumbing.html`/`hvac.html`/`salons.html`
  (workflow + FAQ per trade), linked from `industries.html`.
- **Why:** `industries.html` already lists these trades with no deep page;
  `testimonials.html` already has fictional scenarios for them. Cheap SEO + relevance.
- **Effort:** S per page (plus per-page OG banner via `tools/make-og-banners.py`).

### P0-8 · Interactive 24-hour setup checklist
- **What:** Tick-box version of the `how-it-works.html` setup steps
  ("approve your greeting & script → connect calendar → test the flow in
  writing → go live"), stored in `localStorage` like the cookie choice.
- **Why:** Makes "live in 24 hours" feel concrete and gives returning
  visitors a reason to come back. Script approval is a **text** step — the
  checklist should say exactly that.
- **Effort:** S.

---

## Batch 2 — built 2026-10-14 (website previews of P1/P2 ideas, honestly labelled)

- **"You be the caller" branching simulator** (`testimonials.html#branching-simulator`) —
  visitor chooses replies, including the urgent human-handoff path. Fictional, text-only.
- **Greeting & script builder** (`how-it-works.html#script-builder`) — the P2 script
  builder, lite: drafts *wording only* (greeting, services, booking + urgent/handoff
  rules from the owner's own keywords), copy or send to Navain via the contact form.
  No voice recording/cloning is involved at any step.
- **Owner inbox concept demo** (`how-it-works.html#inbox-demo`) — the P1-3 idea as an
  interactive, clearly-labelled concept with made-up data: search, tag filters,
  mark-handled (localStorage). Not claimed as a live product dashboard.
- **Integrations directory** (`integrations.html`) — the P1-7 page: only the
  connections published in pricing (calendar sync, text/email + weekly summaries,
  Growth SMS follow-up / HubSpot / Go High Level / monthly report, Enterprise
  custom), each with what data it receives. No invented integrations.
- **First-year cost view** (`pricing.html#cost-view`) — totals the published fixed
  fees only (Essential $9,287 / Growth $13,387 first 12 months; Enterprise custom).

## P1 — Product features worth building (need backend/integration)

These are product suggestions to validate with customers before building;
listing them here is not a promise to ship or a claim they exist.

### P1-1 · ~~Missed-call text-back (SMS)~~ — REMOVED (no budget)

> Removed 2026-10-14: the Twilio endpoint (`api/text-back.js`) and all paid-provider
> plans were deleted. A paid SMS provider would also have needed the “missed-call
> signal” explained in `BACKEND-SCOPING.md` — with automatic text-back gone, that
> signal is no longer needed for anything on this site. Growth's *product* feature
> “SMS follow-up after every call” in the published pricing is unchanged (that's the
> Navain service, not this website's code).
Automatic **text** to a caller whose call couldn't be completed:
"We missed you — reply here or book: [link]". Pure SMS + booking link.
Highest-ROI follow-up channel for trades, zero voice involved.

### P1-2 · Web-chat → booking (extend Stacy) *(booking-**request** flow built in Stacy — free: Calendly/Formspree, no live-calendar hold; see `BACKEND-SCOPING.md`)*
Let the existing text chat check real calendar availability and hold a
slot, then hand the details into the contact/CRM flow. Same widget, same
text-only rule — no voice input, no spoken replies.

### P1-3 · Unified text inbox for owners *(free concept demo built on how-it-works.html; a real login/database backend is NOT planned — no budget. The demo is the deliverable.)*
One searchable list of call **summaries** (text), SMS follow-ups, and chat
threads per location, with tags (urgent / booking / callback) and
"mark handled". Deliberately **transcript-and-summary first**: no
recording player in the inbox UI.

### P1-4 · Appointment reminders & no-show reducers
SMS/email reminders, one-tap reschedule links, and a day-before
confirmation — all written channels, calendar-driven.

### P1-5 · Review-request automation
After a job is marked complete, send a text/email asking for a review
with the business's review link. Owner approves the template (text) once.

### P1-6 · Routing & urgency rules builder (text rules) *(draft version built into the script builder on how-it-works.html)*
Owner-written rules in plain language: "If the message says *leak / no
heat / locked out* → text the on-call number immediately." Rules operate
on the summary/transcript text — never on voiceprints or caller-voice analysis.

### P1-7 · Integrations directory + two more CRMs *(directory page built: integrations.html — still no invented CRMs; add new ones only when real)*
A public directory page (what connects, what data flows, in writing),
then add the two most-requested CRMs/calendars after HubSpot / Go High
Level. Every integration listed must state whether it receives
transcripts/summaries — so customers can choose text-only data sharing.

---

## P2 — Later, after P0/P1 validate demand

| Idea | Why later |
|---|---|
| Self-serve **script builder** (owner drafts greeting/FAQ answers in text, Navain reviews) | Great onboarding tool, but needs accounts/login the static site doesn't have |
| Owner digest v2 (reply-to-digest actions: "text this customer back: …") | Needs the P1-3 inbox first |
| Seasonal campaign templates (text/email reactivation offers) | Needs P1-4/P1-5 channels live |
| Referral programme page | Needs tracked attribution beyond current Plausible events |
| Public status / uptime page | Only meaningful once SLAs (Enterprise) exist in practice |

---

## Explicitly NOT doing (do not resurrect)

1. Voice cloning of the owner or any staff member — in product or marketing.
2. "Listen to a sample call" audio of any kind (real, acted, or synthetic)
   on this website. Use P0-1's written simulator instead.
3. Audio testimonials or played-back customer recordings.
4. Stacy (or any widget) speaking aloud, accepting voice input, or using the microphone.
   Note: `vercel.json` already sends `Permissions-Policy: microphone=()` — keep it.
5. Copy claiming Navain "is your voice", "sounds like you", or passes as a
   specific real human. Approved phrasing: **"answers with the greeting and
   script you approve."**
6. Any demo using a real customer's name, call, or results. Fictional,
   labelled examples only — as `testimonials.html` already does.

## Ship-gate checklist (apply to every future feature)

- [ ] Works fully with speakers muted and microphone denied?
- [ ] No real person's voice recorded, cloned, played, or imitated anywhere?
- [ ] No new `Audio()`, `MediaRecorder`, `getUserMedia`, TTS, or `/api/speak`-style endpoint?
- [ ] If it shows a conversation: fictional + labelled, in text?
- [ ] Copy says "greeting and script you approve", never "your own voice"?
- [ ] `python3 tools/check-site.py` passes; CSP in `vercel.json` unchanged
      or tightened (never re-add `blob:` media for audio)?

## Suggested sequence

- **First 2 weeks:** P0-2 quiz → P0-3 calculator v2 → P0-6 sample summary
  (smallest effort, directly help the existing contact/pricing pages convert).
- **Next:** P0-1 text simulator (the demo, done the no-voice way) → P0-5 written callback.
- **Then:** P0-4 FAQ search, P0-7 industry pages, P0-8 checklist as fill-in work.
- **Validate before building:** ~~interview prospects on P1-1 vs P1-3~~ — both paid
  backend plans removed (no budget). Free website features only.
