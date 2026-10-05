/*! Navain AI — ui.js | nav drawer, cookie banner, Formspree contact form, revenue calculator. */
(function () {
  "use strict";

  /* ---------- Mobile nav drawer ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var links = document.getElementById("nav-links");
  var overlay = document.querySelector(".nav-overlay");

  function setNav(open) {
    if (!toggle || !links) return;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    links.classList.toggle("open", open);
    if (overlay) overlay.classList.toggle("show", open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      setNav(!links.classList.contains("open"));
    });
    if (overlay) overlay.addEventListener("click", function () { setNav(false); });
    links.addEventListener("click", function (e) {
      if (e.target && e.target.closest("a")) setNav(false);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setNav(false);
    });
  }

  /* ---------- Cookie banner (localStorage) ---------- */
  var CK = "navain-cookie-choice";
  try {
    if (!localStorage.getItem(CK)) {
      var banner = document.createElement("div");
      banner.className = "cookie-banner";
      banner.setAttribute("role", "region");
      banner.setAttribute("aria-label", "Cookie notice");
      banner.innerHTML =
        '<p>We store one small preference in localStorage to remember your choice here — no ad trackers. ' +
        'See our <a href="/privacy.html">privacy&nbsp;policy</a>.</p>' +
        '<div class="cookie-btns">' +
        '<button class="btn btn-primary btn-sm" data-ck="accepted">Accept</button>' +
        '<button class="btn btn-ghost btn-sm" data-ck="declined">Decline</button></div>';
      document.body.appendChild(banner);
      banner.addEventListener("click", function (e) {
        var b = e.target.closest("button[data-ck]");
        if (!b) return;
        try { localStorage.setItem(CK, b.getAttribute("data-ck")); } catch (err) {}
        banner.remove();
      });
    }
  } catch (err) { /* storage unavailable — banner stays dismissible */ }

  /* ---------- Contact form -> Formspree (no page reload) ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    var status = document.getElementById("form-status");
    var btn = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      btn.disabled = true;
      status.className = "form-status";
      status.textContent = "Sending…";
      fetch("https://formspree.io/f/xnjwnoyw", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form)
      })
        .then(function (r) {
          if (!r.ok) throw new Error("Formspree " + r.status);
          form.reset();
          form.style.display = "none";
          status.className = "form-status success";
          status.innerHTML =
            "<strong>Message sent — thank you.</strong> We got your details and will reply from " +
            "revenuepartners.co@gmail.com, usually the same business day.";
        })
        .catch(function () {
          status.className = "form-status error";
          status.innerHTML =
            "<strong>That didn’t go through.</strong> Please try again, or email us directly at " +
            '<a href="mailto:revenuepartners.co@gmail.com">revenuepartners.co@gmail.com</a>.';
        })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ---------- Revenue calculator (index.html) ---------- */
  var calc = document.getElementById("calc");
  if (calc) {
    var cCalls = document.getElementById("calc-calls");
    var cValue = document.getElementById("calc-value");
    var cRate = document.getElementById("calc-rate");
    var oCalls = document.getElementById("calc-calls-out");
    var oRate = document.getElementById("calc-rate-out");
    var figure = document.getElementById("calc-figure");
    var note = document.getElementById("calc-note");

    var fmt = function (n) {
      return "$" + Math.round(n).toLocaleString("en-US");
    };
    var recalc = function () {
      var calls = parseFloat(cCalls.value) || 0;
      var value = parseFloat(cValue.value) || 0;
      var rate = (parseFloat(cRate.value) || 0) / 100;
      var monthly = calls * 4.33 * rate * value;
      oCalls.textContent = calls;
      oRate.textContent = Math.round(rate * 100) + "%";
      figure.textContent = fmt(monthly) + " / mo";
      note.textContent = "≈ " + Math.round(calls * 4.33) + " unanswered calls a month, at your numbers.";
    };
    [cCalls, cValue, cRate].forEach(function (el) {
      el.addEventListener("input", recalc);
    });
    recalc();
  }
})();
