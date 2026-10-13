# Backend scope — free only (paid plans removed)

**Decision (2026-10-14): no budget.** Every paid backend plan has been
removed from this repo. What remains costs nothing beyond the existing
Vercel hosting, the Groq chat key, Calendly, and Formspree that the site
already uses.

## What was removed, and why

| Removed | Why it cost money |
|---|---|
| `api/text-back.js` — SMS missed-call text-back endpoint | Needs a paid SMS provider (e.g. Twilio) per message, a purchased sender number, and paid carrier (A2P 10DLC) registration |
| The real owner-inbox backend plan (login + database) | Needs hosted auth and a hosted database; even “free tiers” become paid at real usage, and it isn't needed to sell the service today |
| All `TWILIO_*` / `TEXTBACK_*` env vars (`.env.example`, `/api/config`) | Nothing left for them to configure |

Deleted code can be recovered from git history if budget ever exists —
but nothing on the site may hint that text-back or a live inbox exists.
It doesn't.

## The two questions you asked about, in plain English

### “What is Point 1 for?” — the missed-call signal
Point 1 asked: *what tells the system that a call was just missed?*
An automatic feature (like texting a caller back) can't react to thin
air — some phone system has to send a “call missed” signal first.
**You no longer need to answer this.** It only existed to feed the paid
automatic text-back (and a live inbox). Both are removed, so no signal,
webhook, or phone-system integration is needed for anything in this repo.

### “What is Point 3 for?” — the owner inbox
Point 3 was a future private, login-protected page where a business owner
could read, search, and tick off their call summaries (instead of getting
them by text/email).
**What you keep, free:** the clearly-labelled *concept demo* of that idea
on `how-it-works.html#inbox-demo` (made-up data, stored only in the
visitor's browser) — it shows prospects the idea without any login,
database, or cost. Owners today still get summaries by **text and email
after every call**, which is the published product behaviour and needs no
new backend from this website.

## What stays — all free, all already built

| Feature | How it works (no paid service) |
|---|---|
| Chat → booking **request** (`assets/chat.js`) | Stacy's “Book a demo” collects name → business → written-reply contact → weekly volume, then the visitor either picks a real time on **Calendly** or sends the request via the existing **Formspree** endpoint. It does not check a live calendar or hold a slot, and says so |
| Owner inbox concept demo | Static page demo, localStorage only, labelled made-up data |
| Everything from the P0/Batch-2 website features | Plain HTML/CSS/JS on static hosting — simulators, quiz, calculators, script builder, FAQ search, checklist, industry + integrations pages |

## If budget ever appears (not planned, not promised)

Revisit in this order, and only with fresh pricing confirmed at the time —
vendor prices change, so none are quoted here:

1. Decide the missed-call signal source (Point 1 above) — it gates any
   automation.
2. SMS text-back: provider account + carrier registration + consent
   wording confirmed with counsel, *then* re-add an env-gated endpoint.
3. Real inbox: magic-link auth + a hosted database, ingesting the same
   written summaries owners already receive by text/email.

Until then: **free features only, and the site copy stays exactly that
honest.**
