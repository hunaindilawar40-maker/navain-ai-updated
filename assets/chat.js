/*! Navain AI — chat.js | "Stacy" floating assistant. Talks to /api/chat (Vercel
    serverless -> Groq). The API key stays on the server; the browser never sees it. */
(function () {
  "use strict";

  var EMAIL = "info@navainai.com";
  var PHONE = "+1 (251) 203-1002";
  var GREETING = "Hi, I'm Stacy, Navain's virtual assistant. I can answer questions about how the receptionist works, what it costs, or whether it might suit your business. What would be helpful?";
  var QUICK = ["How does it work?", "What is the pricing?", "How fast is setup?", "I want to get started"];

  var SYSTEM_PROMPT =
    "You are Stacy, Navain AI's friendly virtual assistant. Be warm, clear and conversational; " +
    "never claim to be human. Navain AI is a 24/7 AI phone receptionist for service businesses. " +
    "It answers every call in the business's own voice within two rings, books appointments " +
    "from a live calendar, and sends the owner a text and email " +
    "summary after every call. No hardware, no contracts, live on the customer's existing " +
    "number within 24 hours. Navain AI is built by the team behind Pontis Construction Inc., " +
    "which has operated across the US and Canada since 2010, with offices in Sacramento, " +
    "California and Richmond Hill, Ontario. Pontis provides construction estimating, material " +
    "sourcing, pre-construction BIM, shop drawings, roofing, millwork and interior-finish " +
    "services. Its official website is https://www.pontisconstruction.com/.\n\n" +
    "PRICING — these are the only plans and prices that exist, and you must never invent plans, " +
    "tiers, prices, discounts, statistics, customer counts or performance numbers:\n" +
    "- Essential: $699/month + $899 one-time setup. AI receptionist on your existing number, " +
    "appointment booking with calendar sync, call summaries by email and SMS, 24/7 coverage, " +
    "custom agent voice and script, live within 24 hours.\n" +
    "- Growth: $999/month + $1,399 one-time setup. Everything in Essential plus SMS follow-up " +
    "after every call, CRM integration with HubSpot and Go High Level, multi-location support, " +
    "priority onboarding, monthly performance report.\n" +
    "- Enterprise: custom pricing — dedicated account manager, custom integrations, " +
    "white-label, SLA.\n" +
    "All plans are month-to-month.\n\n" +
    "When a visitor sounds interested in signing up, collect four things one at a time: their " +
    "name, their business name, their phone number, and their daily call volume. Then invite " +
    "them to the contact page at https://navainai.com/contact.html or to email " + EMAIL + ".\n" +
    "Contact info: " + EMAIL + " or " + PHONE + ".\n" +
    "Keep replies warm, concrete and under 90 words. Never invent plans, tiers or prices.";

  /* ---------- config: which features are live? ---------- */
  var chatReady = null, ttsReady = false;
  window.NAVAIN_CHAT_READY = null;
  fetch("/api/config")
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (c) {
      chatReady = !!(c && c.chat);
      ttsReady = !!(c && c.tts);
      window.NAVAIN_CHAT_READY = chatReady;
    })
    .catch(function () { window.NAVAIN_CHAT_READY = false; });

  /* ---------- build widget ---------- */
  var ICON_CHAT = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M4 6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9l-4.2 3.4A1 1 0 0 1 3.2 19l.3-3H7a3 3 0 0 1-3-3V6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
  var ICON_SEND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M4 12l16-7-6.5 16-2.3-6.2L4 12Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';

  var launcher = document.createElement("button");
  launcher.className = "chat-launcher";
  launcher.type = "button";
  launcher.setAttribute("aria-label", "Chat with Stacy");
  launcher.setAttribute("aria-expanded", "false");
  launcher.innerHTML = ICON_CHAT + '<span class="launcher-note" aria-hidden="true"></span>';

  var panel = document.createElement("div");
  panel.className = "chat-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Chat with Stacy, Navain AI assistant");
  panel.innerHTML =
    '<div class="chat-head">' +
      '<span class="chat-avatar" aria-hidden="true">S</span>' +
      '<span class="chat-id"><span class="chat-name">Stacy</span>' +
      '<span class="chat-status"><span class="on-dot"></span>Navain AI assistant</span></span>' +
      '<button class="chat-close" type="button" aria-label="Close chat">✕</button>' +
    "</div>" +
    '<div class="chat-msgs" aria-live="polite"></div>' +
    '<div class="chat-quick" role="group" aria-label="Quick replies"></div>' +
    '<form class="chat-input-row">' +
      '<input type="text" placeholder="Type a message…" aria-label="Message to Stacy" autocomplete="off" maxlength="500">' +
      '<button class="chat-send" type="submit" aria-label="Send">' + ICON_SEND + "</button>" +
    "</form>";

  document.body.appendChild(launcher);
  document.body.appendChild(panel);

  var msgs = panel.querySelector(".chat-msgs");
  var quickRow = panel.querySelector(".chat-quick");
  var input = panel.querySelector("input");
  var opened = false, greeted = false, busy = false;
  var history = [];

  /* ---------- helpers ---------- */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  function scrollDown() { msgs.scrollTop = msgs.scrollHeight; }

  function addTTS(bubble, text) {
    var b = el("button", "tts-btn", "🔊 Listen");
    b.type = "button";
    b.addEventListener("click", function () {
      b.disabled = true;
      b.textContent = "🔊 Loading…";
      fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text })
      })
        .then(function (r) { if (!r.ok) throw new Error("tts " + r.status); return r.blob(); })
        .then(function (blob) { new Audio(URL.createObjectURL(blob)).play(); })
        .catch(function () { b.textContent = "🔊 Unavailable"; })
        .then(function () { b.disabled = false; });
    });
    bubble.appendChild(b);
  }

  function botMsg(text) {
    var b = el("div", "chat-bubble bot", text);
    if (ttsReady && text.length < 600) addTTS(b, text);
    msgs.appendChild(b);
    scrollDown();
  }

  function typing() {
    var t = el("div", "chat-typing");
    t.appendChild(document.createElement("span"));
    t.appendChild(document.createElement("span"));
    t.appendChild(document.createElement("span"));
    msgs.appendChild(t);
    scrollDown();
    return t;
  }

  function fallback() {
    botMsg(
      "Sorry — I'm having trouble connecting right now. You can reach the team at " +
      EMAIL + " or " + PHONE + ", and they'll get back to you quickly."
    );
  }

  /* ---------- quick replies ---------- */
  QUICK.forEach(function (q) {
    var b = el("button", null, q);
    b.type = "button";
    b.addEventListener("click", function () { send(q); });
    quickRow.appendChild(b);
  });

  /* ---------- send / receive ---------- */
  function send(text) {
    text = (text || "").trim();
    if (!text || busy) return;
    msgs.appendChild(el("div", "chat-bubble user", text));
    history.push({ role: "user", content: text });
    scrollDown();
    input.value = "";

    if (chatReady === false) { fallback(); return; }

    busy = true;
    var t = typing();
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ system: SYSTEM_PROMPT, messages: history, max_tokens: 1000 })
    })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        t.remove();
        if (res.ok && res.j && res.j.text) {
          history.push({ role: "assistant", content: res.j.text });
          botMsg(res.j.text);
        } else {
          fallback();
        }
      })
      .catch(function () { t.remove(); fallback(); })
      .then(function () { busy = false; });
  }

  panel.querySelector("form").addEventListener("submit", function (e) {
    e.preventDefault();
    send(input.value);
  });
  panel.querySelector(".chat-close").addEventListener("click", close);

  /* ---------- open / close ---------- */
  function open() {
    panel.classList.add("open");
    launcher.setAttribute("aria-expanded", "true");
    launcher.classList.remove("has-note");
    opened = true;
    if (!greeted) {
      greeted = true;
      history.push({ role: "assistant", content: GREETING });
      botMsg(GREETING);
    }
    input.focus();
  }
  function close() {
    panel.classList.remove("open");
    launcher.setAttribute("aria-expanded", "false");
    input.blur();
  }
  launcher.addEventListener("click", function () {
    panel.classList.contains("open") ? close() : open();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && panel.classList.contains("open")) close();
  });

  /* notification dot after 4s if the widget is still closed */
  setTimeout(function () {
    if (!opened) launcher.classList.add("has-note");
  }, 4000);
})();
