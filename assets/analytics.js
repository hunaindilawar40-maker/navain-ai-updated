/*! Navain AI — analytics.js | privacy-friendly, first-party-proxied analytics.
 *
 * Plausible provides aggregate page views and a small set of product-interest
 * events. No form values, contact details, or chat-message text are sent as
 * event properties. The site property must exist in Plausible for events to
 * appear in its dashboard.
 */
(function () {
  "use strict";

  /* Must match the site created in the Plausible account. */
  var ANALYTICS_DOMAIN = "navainai.com";
  var SCRIPT_PATH = "/pl/js/script.js";
  var API_PATH = "/pl/api/event";

  /* Do not count local development, Arena previews, or the team's own checks. */
  var host = location.hostname;
  if (host === "localhost" || host === "127.0.0.1" || /\.(?:e2b\.app|vercel\.app)$/i.test(host)) return;
  if (!ANALYTICS_DOMAIN) return;

  /* Queue events that happen before the proxied Plausible script has loaded. */
  window.plausible = window.plausible || function () {
    (window.plausible.q = window.plausible.q || []).push(arguments);
  };
  function track(name) {
    window.plausible(name);
  }

  /* Track meaningful actions without sending any form or message content. */
  document.addEventListener("click", function (event) {
    var target = event.target;
    if (!target || !target.closest) return;

    var action = target.closest("[data-analytics-event]");
    if (action) {
      track(action.getAttribute("data-analytics-event"));
      return;
    }

    var link = target.closest("a[href]");
    if (!link) return;
    var href = link.getAttribute("href") || "";
    if (/^tel:/i.test(href)) {
      track("Phone Link Click");
    } else if (/^mailto:/i.test(href)) {
      track("Email Link Click");
    } else if (/^\/contact(?:\.html)?(?:[?#]|$)/i.test(href)) {
      track(location.pathname.indexOf("pricing") !== -1 ? "Pricing Contact Click" : "Contact Link Click");
    }
  });

  window.addEventListener("navain:chat-open", function () {
    track("Chat Opened");
  });

  /* Don't inject twice if this file is ever included more than once. */
  if (document.querySelector('script[data-navain-analytics]')) return;
  var script = document.createElement("script");
  script.defer = true;
  script.src = SCRIPT_PATH;
  script.setAttribute("data-domain", ANALYTICS_DOMAIN);
  script.setAttribute("data-api", API_PATH);
  script.setAttribute("data-navain-analytics", "");
  script.onerror = function () { script.remove(); };
  document.head.appendChild(script);
})();
