/*! Navain AI — analytics.js | privacy-friendly, first-party-proxied analytics.
 *
 * WHY THIS FILE EXISTS
 * The site had no analytics at all, so there was no way to answer basic
 * questions like "how many people reach /pricing" or "does the revenue
 * calculator lift contact-form submissions".
 *
 * WHY PLAUSIBLE, PROXIED
 * Plausible is cookieless, sets no localStorage, uses no fingerprinting and
 * needs no consent banner under GDPR/ePrivacy — which keeps the existing cookie
 * notice ("no ad trackers") truthful. It is loaded through a Vercel rewrite
 * rather than directly from plausible.io, so from the browser's point of view
 * every request stays same-origin. That has two payoffs:
 *   1. The Content-Security-Policy can keep `script-src 'self'` and
 *      `connect-src 'self'` — no third-party origin is allowlisted.
 *   2. It survives ad blockers that block plausible.io far more often.
 * The rewrites live in vercel.json under `/pl/*`. They deliberately avoid
 * `/api/*`, which is reserved for the site's own serverless functions.
 *
 * TO TURN THIS OFF
 * Set ANALYTICS_DOMAIN to "" below. Nothing is injected and no request is made.
 *
 * TO SWITCH TO UMAMI (self-hosted)
 * Replace the src/data-* attributes below with your Umami snippet and point the
 * vercel.json rewrites at your Umami host instead.
 */
(function () {
  "use strict";

  /* ---- config -------------------------------------------------------- */
  /* Must match the site you create in your Plausible account. */
  var ANALYTICS_DOMAIN = "navainai.com";

  /* Same-origin paths created by the vercel.json rewrites. */
  var SCRIPT_PATH = "/pl/js/script.js";
  var API_PATH = "/pl/api/event";
  /* --------------------------------------------------------------------- */

  if (!ANALYTICS_DOMAIN) return;

  /* Don't inject twice if this file is ever included more than once. */
  if (document.querySelector('script[data-navain-analytics]')) return;

  /* Don't count the site's own team bouncing around during editing. */
  var host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host.slice(-11) === ".e2b.app") {
    return;
  }

  var s = document.createElement("script");
  s.defer = true;
  s.src = SCRIPT_PATH;
  s.setAttribute("data-domain", ANALYTICS_DOMAIN);
  s.setAttribute("data-api", API_PATH);
  s.setAttribute("data-navain-analytics", "");
  /* Analytics must never be able to break the page. */
  s.onerror = function () { s.remove(); };
  document.head.appendChild(s);
})();
