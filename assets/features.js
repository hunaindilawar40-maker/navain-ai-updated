/*! Navain AI — features.js | P0 interactive features: written call simulator,
    plan-finder quiz, FAQ search, 24-hour setup checklist, written-callback form.
    Text only: no audio, no microphone, no speech playback, no voice cloning. */
(function () {
  "use strict";

  function track(name) {
    if (typeof window.plausible === "function") window.plausible(name);
  }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }
  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ======================================================================
     1 · Text-based call simulator (testimonials.html #simulator)
     Fictional, written transcripts — never a recording, never audio.
     ====================================================================== */
  var SCENARIOS = {
    "plumbing-leak": {
      label: "Plumbing — leak after hours",
      business: "Example Plumbing Co. (fictional)",
      lines: [
        ["caller", "Hi — there's water coming from under my kitchen sink. Is anyone able to look at it?"],
        ["navain", "I'm sorry you're dealing with that. I can help get this booked. Is the water still flowing, and have you been able to turn off the tap under the sink?"],
        ["caller", "It's a slow drip now. The tap underneath is off."],
        ["navain", "Thank you. To book the right visit, may I take your name, the service address, and a callback number?"],
        ["caller", "Alex Morgan, 12 Example Street. This number is fine."],
        ["navain", "I can offer tomorrow at 9:00 AM or 1:30 PM. Which suits you better?"],
        ["caller", "9:00 works."],
        ["navain", "You're booked for tomorrow at 9:00 AM. I've sent the details to the team. If the leak gets worse before then, please call this number again and choose the urgent option."]
      ],
      summary: {
        "Caller": "Alex Morgan (fictional) — callback number provided",
        "Reason": "Slow leak under kitchen sink; under-sink tap turned off",
        "Outcome": "Visit booked for tomorrow, 9:00 AM",
        "Next step": "Team to confirm on arrival window; caller advised what to do if it worsens"
      }
    },
    "hvac-no-heat": {
      label: "HVAC — no heating, evening",
      business: "Example Heating & Air (fictional)",
      lines: [
        ["caller", "Our heating has stopped and the house is getting cold. Can someone come out?"],
        ["navain", "I'm sorry — let's get the details captured properly. Is anyone in the home who is unwell, elderly, or very young?"],
        ["caller", "No, we're okay for tonight, but we'd like it checked tomorrow."],
        ["navain", "Understood. May I take your name, address, and the best callback number?"],
        ["caller", "Jordan Lee, 48 Example Avenue. This number works."],
        ["navain", "I can offer tomorrow at 8:30 AM or 11:00 AM for a diagnostic visit. Which do you prefer?"],
        ["caller", "8:30, please."],
        ["navain", "Booked for tomorrow at 8:30 AM. I've marked it as a no-heating visit and sent the details to the team. For any immediate safety concern, please contact local emergency services."]
      ],
      summary: {
        "Caller": "Jordan Lee (fictional) — callback number provided",
        "Reason": "No heating; household comfortable overnight",
        "Outcome": "Diagnostic visit booked for tomorrow, 8:30 AM",
        "Next step": "Team to review before the visit; urgent route available if circumstances change"
      }
    },
    "salon-booking": {
      label: "Salon — booking while every chair is busy",
      business: "Example Salon (fictional)",
      lines: [
        ["caller", "Hi, do you have anything this Saturday for a cut and colour?"],
        ["navain", "Hello! I can check the calendar. Which service did you have in mind, and is there a stylist you'd prefer?"],
        ["caller", "Cut and colour, no preference on stylist."],
        ["navain", "Saturday has 10:00 AM or 2:15 PM available. Would either work?"],
        ["caller", "10:00 is perfect."],
        ["navain", "Great — may I take your name and mobile number for the booking and reminder?"],
        ["caller", "Sam Patel, this number."],
        ["navain", "You're booked for Saturday at 10:00 AM. The salon will receive the details, and you'll get a written reminder before your appointment."]
      ],
      summary: {
        "Caller": "Sam Patel (fictional) — mobile provided",
        "Reason": "Cut and colour appointment request for Saturday",
        "Outcome": "Booked Saturday, 10:00 AM",
        "Next step": "Salon to review; written reminder to be sent before the visit"
      }
    },
    "roofing-inspection": {
      label: "Roofing — inspection request while the crew is on site",
      business: "Example Roofing Co. (fictional)",
      lines: [
        ["caller", "We had shingles come off in the wind last night. Could someone inspect the roof?"],
        ["navain", "I can capture that for an inspection request. Is there any active leaking inside the home right now?"],
        ["caller", "No leaking that we can see, just missing shingles."],
        ["navain", "Thank you. May I take your name, the property address, and a callback number?"],
        ["caller", "Taylor Brooks, 7 Example Road. This number is fine."],
        ["navain", "I've noted the property and the damage you described. The team will review it and contact you to arrange the inspection time."],
        ["caller", "Thanks — that's all I needed."],
        ["navain", "You're welcome. I've sent the request and your callback details to the team."]
      ],
      summary: {
        "Caller": "Taylor Brooks (fictional) — callback number provided",
        "Reason": "Missing shingles after wind; no active leak reported",
        "Outcome": "Inspection request captured for team review",
        "Next step": "Team to call back to arrange the inspection time"
      }
    },
    "dental-reschedule": {
      label: "Dental — moving an appointment",
      business: "Example Dental Practice (fictional)",
      lines: [
        ["caller", "Hi, I need to move my check-up next week. Something's come up."],
        ["navain", "Of course, I can help with that. May I take your name and the date of your current appointment?"],
        ["caller", "Casey Nguyen — it's on Tuesday at 3:00 PM."],
        ["navain", "Thank you. I can see later that week: Thursday at 11:00 AM or Friday at 9:30 AM. Would either suit you?"],
        ["caller", "Thursday at 11:00 works."],
        ["navain", "Done — your appointment is moved to Thursday at 11:00 AM. The practice will receive the updated details. For anything clinical, the team will follow up with you directly."]
      ],
      summary: {
        "Caller": "Casey Nguyen (fictional)",
        "Reason": "Requested to move an existing check-up",
        "Outcome": "Appointment moved to Thursday, 11:00 AM",
        "Next step": "Practice to review; clinical questions handled by the team directly"
      }
    },
    "restaurant-reservation": {
      label: "Restaurant — reservation during the dinner rush",
      business: "Example Restaurant (fictional)",
      lines: [
        ["caller", "Hi, do you have a table for four tonight?"],
        ["navain", "Hello! I can check for you. What time were you hoping for?"],
        ["caller", "Around 7:30, if possible."],
        ["navain", "Tonight I can offer 7:15 PM or 8:00 PM for four guests. Which would you prefer?"],
        ["caller", "7:15 is great."],
        ["navain", "May I take a name and mobile number for the reservation?"],
        ["caller", "Riley Shah, this number."],
        ["navain", "A table for four is noted for 7:15 PM under Riley Shah. The restaurant team will receive the details."]
      ],
      summary: {
        "Caller": "Riley Shah (fictional) — mobile provided",
        "Reason": "Table for four requested for tonight",
        "Outcome": "Reservation noted for 7:15 PM (per the restaurant's configured setup)",
        "Next step": "Restaurant team to review the reservation"
      }
    }
  };

  var sim = document.getElementById("simulator");
  if (sim) {
    var select = sim.querySelector("#sim-scenario");
    var transcript = sim.querySelector("#sim-transcript");
    var summaryBox = sim.querySelector("#sim-summary");
    var status = sim.querySelector("#sim-status");
    var btnStep = sim.querySelector("#sim-step");
    var btnAll = sim.querySelector("#sim-all");
    var btnReset = sim.querySelector("#sim-reset");
    var current = null, idx = 0, timer = null, trackedSim = false;

    function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }

    function renderSummary() {
      summaryBox.innerHTML = "";
      summaryBox.appendChild(el("p", "sim-summary-badge", "Example — made-up data"));
      summaryBox.appendChild(el("h3", null, "What the owner receives (text & email)"));
      var dl = el("div", "sim-summary-rows");
      Object.keys(current.summary).forEach(function (k) {
        var row = el("p", "sim-summary-row");
        var key = el("strong", null, k + ": ");
        row.appendChild(key);
        row.appendChild(document.createTextNode(current.summary[k]));
        dl.appendChild(row);
      });
      summaryBox.appendChild(dl);
      summaryBox.hidden = false;
    }

    function showLine() {
      if (!current || idx >= current.lines.length) {
        stopTimer();
        status.textContent = "End of example. This is a written, fictional transcript — not a recording of a real call.";
        btnStep.disabled = true;
        renderSummary();
        return;
      }
      var who = current.lines[idx][0], text = current.lines[idx][1];
      var p = el("p", "bubble " + (who === "caller" ? "caller" : "ai"));
      var name = el("span", "sim-who", who === "caller" ? "Caller" : "Navain");
      p.appendChild(name);
      p.appendChild(document.createTextNode(text));
      transcript.appendChild(p);
      idx += 1;
      status.textContent = "Line " + idx + " of " + current.lines.length + " — " + current.label;
      if (idx >= current.lines.length) {
        stopTimer();
        btnStep.disabled = true;
        status.textContent = "End of example. This is a written, fictional transcript — not a recording of a real call.";
        renderSummary();
      }
    }

    function load(key, autoplay) {
      stopTimer();
      current = SCENARIOS[key] || SCENARIOS["plumbing-leak"];
      idx = 0;
      transcript.innerHTML = "";
      summaryBox.hidden = true;
      summaryBox.innerHTML = "";
      btnStep.disabled = false;
      status.textContent = "Ready — " + current.label + " at " + current.business + ". Read it line by line, or show the full transcript.";
      if (!trackedSim) { trackedSim = true; track("Simulator Used"); }
      if (autoplay) {
        if (reduced) { while (idx < current.lines.length) showLine(); return; }
        timer = setInterval(showLine, 1400);
        showLine();
      }
    }

    if (select) select.addEventListener("change", function () { load(select.value, false); });
    btnStep.addEventListener("click", function () { stopTimer(); showLine(); });
    btnAll.addEventListener("click", function () {
      stopTimer();
      while (idx < current.lines.length) showLine();
    });
    btnReset.addEventListener("click", function () { load(select ? select.value : "plumbing-leak", false); });
    load(select ? select.value : "plumbing-leak", false);
  }

  /* ======================================================================
     2 · Plan-finder quiz (pricing.html #plan-finder)
     4 questions -> Essential / Growth / Enterprise, deep-link to contact.
     ====================================================================== */
  var quiz = document.getElementById("plan-finder");
  if (quiz) {
    var result = quiz.querySelector("#quiz-result");
    var form = quiz.querySelector("#quiz-form");
    var trackedQuiz = false;

    function answer(name) {
      var checked = form.querySelector('input[name="' + name + '"]:checked');
      return checked ? checked.value : "";
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var calls = answer("q-calls"), locations = answer("q-locations"),
          followup = answer("q-followup"), custom = answer("q-custom");
      if (!calls || !locations || !followup || !custom) {
        result.hidden = false;
        result.innerHTML = "";
        result.appendChild(el("p", null, "Please answer all four questions so we can point you at the right starting plan."));
        return;
      }

      var plan, planName, price, why = [];
      if (custom === "yes" || locations === "4+") {
        plan = "enterprise"; planName = "Enterprise"; price = "Custom pricing";
        why.push("You need dedicated, custom, or multi-location-at-scale support.");
      } else if (locations !== "1" || followup === "yes" || calls === "76-150" || calls === "150+") {
        plan = "growth"; planName = "Growth"; price = "$999/month + $1,399 one-time setup";
        if (locations !== "1") why.push("You have more than one location (Growth includes multi-location support).");
        if (followup === "yes") why.push("You want SMS follow-up and/or CRM integration (Growth features).");
        if (calls === "76-150" || calls === "150+") why.push("Your weekly call volume is high, so Growth's monthly performance report is worth having.");
      } else {
        plan = "essential"; planName = "Essential"; price = "$699/month + $899 one-time setup";
        why.push("One location, no CRM/SMS follow-up needed yet, and a call volume Essential is built for.");
      }

      result.innerHTML = "";
      result.appendChild(el("p", "quiz-result-badge", "Your suggested starting plan"));
      result.appendChild(el("h3", null, planName + " — " + price));
      var ul = el("ul", "quiz-why");
      why.forEach(function (w) { ul.appendChild(el("li", null, "✓ " + w)); });
      ul.appendChild(el("li", null, "✓ The listed fees are fixed; call credits are included, with the allowance set for your expected weekly volume and confirmed before signup."));
      result.appendChild(ul);
      var cta = el("a", "btn btn-primary", "Ask about " + planName);
      cta.href = "/contact.html?intent=pricing&plan=" + plan + "#contact-form";
      result.appendChild(cta);
      var alt = el("a", "btn btn-ghost quiz-alt", "Not sure? Ask us to choose with you");
      alt.href = "/contact.html?intent=pricing&plan=help-me-choose#contact-form";
      result.appendChild(alt);
      var small = el("p", "quiz-small", "This is a guide, not a quote or a contract. You can change or cancel month-to-month.");
      result.appendChild(small);
      result.hidden = false;
      if (result.scrollIntoView) result.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "nearest" });
      if (!trackedQuiz) { trackedQuiz = true; track("Plan Quiz Completed"); }
    });
  }

  /* ======================================================================
     3 · FAQ search (any page with .faq-list)
     Keeps every FAQ in the HTML; search only filters what's displayed.
     ====================================================================== */
  var faqLists = document.querySelectorAll(".faq-list");
  Array.prototype.forEach.call(faqLists, function (list) {
    var items = list.querySelectorAll("details.faq");
    if (!items.length) return;
    var wrap = el("div", "faq-search");
    var label = el("label", "faq-search-label", "Search these questions");
    label.setAttribute("for", "");
    var input = el("input", "faq-search-input");
    input.type = "search";
    input.placeholder = "Type a word — e.g. price, calendar, cancel…";
    input.setAttribute("aria-label", "Search frequently asked questions");
    var count = el("p", "faq-search-count");
    count.setAttribute("role", "status");
    count.setAttribute("aria-live", "polite");
    var empty = el("p", "faq-search-empty", "");
    empty.hidden = true;
    wrap.appendChild(label);
    wrap.appendChild(input);
    wrap.appendChild(count);
    list.parentNode.insertBefore(wrap, list);
    list.parentNode.insertBefore(empty, list.nextSibling);

    var trackedFaq = false;
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      Array.prototype.forEach.call(items, function (item) {
        var hay = item.textContent.toLowerCase();
        var match = !q || hay.indexOf(q) !== -1;
        item.style.display = match ? "" : "none";
        if (match) shown += 1;
      });
      count.textContent = q ? shown + " of " + items.length + " questions match." : "";
      if (q && shown === 0) {
        empty.textContent = "No match for \u201C" + input.value.trim() + "\u201D. Try another word, ask Stacy (the chat in the corner), or email info@navainai.com.";
        empty.hidden = false;
      } else {
        empty.hidden = true;
      }
      if (q && !trackedFaq) { trackedFaq = true; track("FAQ Search Used"); }
    });
  });

  /* ======================================================================
     4 · 24-hour setup checklist (how-it-works.html #setup-checklist)
     Stored only in this browser's localStorage.
     ====================================================================== */
  var checklist = document.getElementById("setup-checklist");
  if (checklist) {
    var KEY = "navain-setup-checklist-v1";
    var boxes = checklist.querySelectorAll('input[type="checkbox"][data-step]');
    var progress = checklist.querySelector("#checklist-progress");
    var doneMsg = checklist.querySelector("#checklist-done");
    var resetBtn = checklist.querySelector("#checklist-reset");
    var saved = [];
    try { saved = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (err) { saved = []; }

    function refresh() {
      var done = 0, state = [];
      Array.prototype.forEach.call(boxes, function (b, i) {
        if (b.checked) { done += 1; state.push(i); }
      });
      progress.textContent = done + " of " + boxes.length + " steps ready";
      doneMsg.hidden = done !== boxes.length;
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) {}
    }
    Array.prototype.forEach.call(boxes, function (b, i) {
      if (saved.indexOf(i) !== -1) b.checked = true;
      b.addEventListener("change", function () { refresh(); track("Setup Checklist Used"); });
    });
    if (resetBtn) resetBtn.addEventListener("click", function () {
      Array.prototype.forEach.call(boxes, function (b) { b.checked = false; });
      refresh();
    });
    refresh();
  }

  /* ======================================================================
     5 · Written-callback form (contact.html #written-callback-form)
     We reply in writing. No sales call unless the visitor asks for one.
     ====================================================================== */
  var callback = document.getElementById("written-callback-form");
  if (callback) {
    var cbStatus = callback.querySelector("#callback-status");
    var cbBtn = callback.querySelector('button[type="submit"]');
    callback.addEventListener("submit", function (e) {
      e.preventDefault();
      var hp = callback.querySelector('input[name="_gotcha"]');
      if (hp && hp.value !== "") return;
      cbBtn.disabled = true;
      cbStatus.className = "form-status";
      cbStatus.textContent = "Sending…";
      fetch("https://formspree.io/f/xnjwnoyw", {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(callback)
      })
        .then(function (r) {
          if (!r.ok) throw new Error("Formspree " + r.status);
          Array.prototype.forEach.call(callback.children, function (node) {
            if (node !== cbStatus) node.style.display = "none";
          });
          callback.reset();
          track("Written Callback Requested");
          cbStatus.className = "form-status success";
          cbStatus.innerHTML =
            "<strong>Thank you — we'll reply in writing.</strong>" +
            "No sales call unless you asked for one. We usually reply the same business day from info@navainai.com.";
        })
        .catch(function () {
          track("Written Callback Error");
          cbStatus.className = "form-status error";
          cbStatus.innerHTML =
            "<strong>That didn't go through.</strong> Please try again, or email us directly at " +
            '<a href="mailto:info@navainai.com">info@navainai.com</a>.';
        })
        .then(function () { cbBtn.disabled = false; });
    });
  }
})();
/*! Navain AI — features.js (batch 2) | branching "you be the caller" simulator,
    greeting & script builder, owner-inbox concept demo, first-year cost view.
    All fictional/text-only. No audio, microphone, speech or voice cloning. */
(function () {
  "use strict";
  function track(name) { if (typeof window.plausible === "function") window.plausible(name); }
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  /* ======================================================================
     6 · Branching simulator — "You be the caller" (testimonials.html)
     ====================================================================== */
  var NODES = {
    start: {
      navain: "Hello, thanks for calling Example Plumbing Co. (fictional). I can help you book a visit, reschedule, or take a message. How can I help?",
      choices: [
        ["I have a leak", "leak"],
        ["I'd like to book a visit", "book"],
        ["What are your hours?", "hours"]
      ]
    },
    leak: {
      navain: "I'm sorry you're dealing with that. Is water spraying or flowing heavily right now, or is it a slow drip?",
      choices: [
        ["It's a slow drip", "leak-slow"],
        ["Water is spraying everywhere", "leak-urgent"]
      ]
    },
    "leak-slow": {
      navain: "Thank you. If you can, turn off the tap under the sink. I can book a visit tomorrow at 9:00 AM or 1:30 PM — which suits you?",
      choices: [
        ["Tomorrow at 9:00 AM", "booked-leak"],
        ["Tomorrow at 1:30 PM", "booked-leak"]
      ]
    },
    "leak-urgent": {
      navain: "Please only if it's safe: turn off your main water shut-off. I'm marking this urgent and following the business's urgent-handoff rule now. For any immediate danger, contact local emergency services.",
      choices: [
        ["Okay — please get them to call me back urgently", "urgent-end"]
      ]
    },
    book: {
      navain: "Of course. Is this for a new issue, a routine service, or something else?",
      choices: [
        ["A new issue", "book-new"],
        ["A routine service", "book-routine"]
      ]
    },
    "book-new": {
      navain: "I can offer tomorrow at 9:00 AM or 1:30 PM. Which works better?",
      choices: [["9:00 AM", "booked-visit"], ["1:30 PM", "booked-visit"]]
    },
    "book-routine": {
      navain: "I can offer Thursday at 11:00 AM or Friday at 10:00 AM. Which works better?",
      choices: [["Thursday 11:00 AM", "booked-visit"], ["Friday 10:00 AM", "booked-visit"]]
    },
    hours: {
      navain: "In this fictional example the business is open Monday to Friday, 8:00 AM to 5:00 PM — and I answer calls 24/7. Would you like to book a visit or leave a message?",
      choices: [
        ["Book a visit", "book"],
        ["Leave a message", "message-end"]
      ]
    }
  };
  var ENDS = {
    "booked-leak": { navain: "You're booked. The team will receive the details and next step in writing.", summary: { "Caller": "You (playing the caller, fictional example)", "Reason": "Slow leak; advised to turn off the under-sink tap", "Outcome": "Visit booked for tomorrow at your chosen time", "Next step": "Team receives a text & email summary" } },
    "booked-visit": { navain: "You're booked. The team will receive the details and next step in writing.", summary: { "Caller": "You (playing the caller, fictional example)", "Reason": "Appointment request", "Outcome": "Visit booked at your chosen time", "Next step": "Team receives a text & email summary" } },
    "urgent-end": { navain: "Done. Your request is flagged urgent for priority follow-up under the business's configured rules.", summary: { "Caller": "You (playing the caller, fictional example)", "Reason": "Active water spray reported — urgent route chosen", "Outcome": "Flagged for priority human follow-up; no booking made", "Next step": "On-call contact alerted per the business's urgent rule" } },
    "message-end": { navain: "Done — I've taken your message and the team will follow up. (In a real setup, Navain would ask for your name, number, and message here.)", summary: { "Caller": "You (playing the caller, fictional example)", "Reason": "General enquiry during fictional opening hours question", "Outcome": "Message taken for follow-up", "Next step": "Team receives a text & email summary" } }
  };

  var branch = document.getElementById("branching-simulator");
  if (branch) {
    var bTranscript = branch.querySelector("#branch-transcript");
    var bChoices = branch.querySelector("#branch-choices");
    var bSummary = branch.querySelector("#branch-summary");
    var bRestart = branch.querySelector("#branch-restart");
    var trackedBranch = false;

    function bubble(who, text) {
      var p = el("p", "bubble " + (who === "caller" ? "caller" : "ai"));
      var name = el("span", "sim-who", who === "caller" ? "You (caller)" : "Navain");
      p.appendChild(name);
      p.appendChild(document.createTextNode(text));
      bTranscript.appendChild(p);
      bTranscript.scrollTop = bTranscript.scrollHeight;
    }
    function showSummary(summary) {
      bSummary.innerHTML = "";
      bSummary.appendChild(el("p", "sim-summary-badge", "Example — made-up data"));
      bSummary.appendChild(el("h3", null, "What the owner receives (text & email)"));
      Object.keys(summary).forEach(function (k) {
        var row = el("p", "sim-summary-row");
        row.appendChild(el("strong", null, k + ": "));
        row.appendChild(document.createTextNode(summary[k]));
        bSummary.appendChild(row);
      });
      bSummary.hidden = false;
    }
    function go(key) {
      if (ENDS[key]) {
        bubble("navain", ENDS[key].navain);
        bChoices.innerHTML = "";
        showSummary(ENDS[key].summary);
        return;
      }
      var node = NODES[key];
      if (!node) return;
      bubble("navain", node.navain);
      bChoices.innerHTML = "";
      node.choices.forEach(function (pair) {
        var b = el("button", "btn btn-ghost btn-sm", pair[0]);
        b.type = "button";
        b.addEventListener("click", function () {
          bubble("caller", pair[0]);
          if (!trackedBranch) { trackedBranch = true; track("Branching Simulator Used"); }
          go(pair[1]);
        });
        bChoices.appendChild(b);
      });
    }
    function reset() {
      bTranscript.innerHTML = "";
      bChoices.innerHTML = "";
      bSummary.hidden = true;
      bSummary.innerHTML = "";
      go("start");
    }
    if (bRestart) bRestart.addEventListener("click", reset);
    reset();
  }

  /* ======================================================================
     7 · Greeting & script builder — text only (how-it-works.html)
     Draft wording to approve with Navain; never a voice recording.
     ====================================================================== */
  var sb = document.getElementById("script-builder");
  if (sb) {
    var sbForm = sb.querySelector("#sb-form");
    var sbOut = sb.querySelector("#sb-output");
    var sbCopy = sb.querySelector("#sb-copy");
    var sbSend = sb.querySelector("#sb-send");
    var sbStatus = sb.querySelector("#sb-status");
    var tones = {
      warm: "Hello, and thanks for calling",
      straightforward: "Thanks for calling",
      formal: "Good day, and thank you for calling"
    };
    var built = "";
    sbForm.addEventListener("submit", function (e) {
      e.preventDefault();
      function val(id) { var n = sb.querySelector(id); return n ? n.value.trim() : ""; }
      var biz = val("#sb-business") || "Your Business";
      var trade = val("#sb-trade") || "your trade";
      var hours = val("#sb-hours") || "your opening hours (to confirm)";
      var services = val("#sb-services") || "the services you approve (to list during setup)";
      var booking = val("#sb-booking");
      var urgent = val("#sb-urgent");
      var keywords = val("#sb-keywords") || "an urgent issue";
      var tone = tones[val("#sb-tone")] || tones.warm;
      var bookingLine = booking === "message"
        ? "I take booking requests as messages, and the team confirms every appointment personally."
        : "I can check the calendar and offer available times. If nothing suits you, I'll take a message for the team.";
      var urgentLine = urgent === "message"
        ? "If a caller mentions " + keywords + ", I capture the details, mark it urgent, and send it for priority follow-up. I never try to handle an emergency myself — for immediate danger, callers should contact local emergency services."
        : "If a caller mentions " + keywords + ", I follow the urgent-handoff rule the business chose (for example, alerting the on-call contact) and capture the details for follow-up. For immediate danger, callers should contact local emergency services.";
      built =
        "DRAFT GREETING & SCRIPT — for " + biz + " (draft to approve with Navain; wording only)\n\n" +
        "GREETING\n" + tone + " " + biz + ". I can help you book, reschedule, or leave a message for the team. How can I help?\n\n" +
        "ABOUT THE BUSINESS\nWe are a " + trade + " business. Our hours are " + hours + ". Services I can talk about: " + services + ".\n\n" +
        "BOOKING\n" + bookingLine + "\n\n" +
        "URGENT CALLS & HANDOFF\n" + urgentLine + "\n" +
        "If someone asks for a person, is confused, or asks something outside my approved answers, I take a clear message and flag it for follow-up.\n\n" +
        "AFTER EVERY CALL\nThe owner receives a text and email summary: who called, what they needed, what was booked or captured, and the next step.";
      sbOut.textContent = built;
      sbOut.hidden = false;
      sbSend.href = "/contact.html?intent=script&plan=help-me-choose&note=" +
        encodeURIComponent("I'd like Navain to review this draft greeting/script for my business:\n\n" + built.slice(0, 420)) + "#contact-form";
      sbSend.hidden = false;
      sbCopy.hidden = false;
      sbStatus.textContent = "Draft built below. Edit it with Navain during setup — nothing goes live without your approval.";
      track("Script Builder Used");
    });
    if (sbCopy) sbCopy.addEventListener("click", function () {
      if (!built) { sbStatus.textContent = "Build a draft first, then copy it."; return; }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(built).then(
          function () { sbStatus.textContent = "Copied — paste it into an email or bring it to your setup call."; },
          function () { sbStatus.textContent = "Copy didn't work here — select the draft text and copy it manually."; });
      }
    });
  }

  /* ======================================================================
     8 · Owner inbox — CONCEPT demo with made-up data (how-it-works.html)
     A preview of an idea from the roadmap, not a live product dashboard.
     ====================================================================== */
  var ITEMS = [
    { tag: "booking", title: "Visit booked — tomorrow 9:00 AM", body: "Fictional caller reported a slow sink leak. Under-sink tap off. Callback number captured." },
    { tag: "urgent", title: "Urgent follow-up flagged", body: "Fictional caller reported no heating with an elderly relative at home. Routed under the example urgent rule." },
    { tag: "callback", title: "Callback requested", body: "Fictional caller asked for a person about an existing job. Contact details and reason captured." },
    { tag: "booking", title: "Appointment moved — Thursday 11:00 AM", body: "Fictional caller moved an existing appointment. Practice team to review." },
    { tag: "message", title: "Message taken — hours question", body: "Fictional caller asked about opening hours outside office time and left a message for the morning." },
    { tag: "callback", title: "Quote request captured", body: "Fictional caller asked about an inspection. Property details captured for the team to arrange a time." }
  ];
  var inbox = document.getElementById("inbox-demo");
  if (inbox) {
    var list = inbox.querySelector("#inbox-list");
    var count = inbox.querySelector("#inbox-count");
    var search = inbox.querySelector("#inbox-search");
    var filterBtns = inbox.querySelectorAll("[data-filter]");
    var KEY = "navain-inbox-demo-v1";
    var done = [];
    try { done = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (err) { done = []; }
    var activeFilter = "all";

    function render() {
      var q = search ? search.value.trim().toLowerCase() : "";
      list.innerHTML = "";
      var open = 0, handled = 0, shown = 0;
      ITEMS.forEach(function (item, i) {
        var isDone = done.indexOf(i) !== -1;
        if (isDone) handled += 1; else open += 1;
        var matchFilter = activeFilter === "all" || item.tag === activeFilter;
        var matchSearch = !q || (item.title + " " + item.body + " " + item.tag).toLowerCase().indexOf(q) !== -1;
        if (!matchFilter || !matchSearch) return;
        shown += 1;
        var card = el("div", "inbox-item" + (isDone ? " is-done" : ""));
        card.appendChild(el("span", "inbox-tag", item.tag));
        card.appendChild(el("h3", null, item.title));
        card.appendChild(el("p", null, item.body));
        var b = el("button", "btn btn-ghost btn-sm", isDone ? "Mark as not handled" : "Mark handled");
        b.type = "button";
        b.addEventListener("click", function () {
          var at = done.indexOf(i);
          if (at === -1) done.push(i); else done.splice(at, 1);
          try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (err) {}
          render();
        });
        card.appendChild(b);
        list.appendChild(card);
      });
      count.textContent = shown + " shown · " + open + " open · " + handled + " handled (saved only in this browser)";
      if (!shown) list.appendChild(el("p", "sim-note", "Nothing matches that filter/search in this made-up demo data."));
    }
    Array.prototype.forEach.call(filterBtns, function (b) {
      b.addEventListener("click", function () {
        activeFilter = b.getAttribute("data-filter");
        track("Inbox Demo Used");
        render();
      });
    });
    if (search) search.addEventListener("input", render);
    render();
  }

  /* ======================================================================
     9 · First-year cost view (pricing.html) — published fixed fees only
     ====================================================================== */
  var cost = document.getElementById("cost-view");
  if (cost) {
    var planSel = cost.querySelector("#cost-plan");
    var out = cost.querySelector("#cost-output");
    var FEES = {
      essential: { name: "Essential", monthly: 699, setup: 899 },
      growth: { name: "Growth", monthly: 999, setup: 1399 }
    };
    function money(n) { return "$" + n.toLocaleString("en-US"); }
    function refresh() {
      var v = planSel.value;
      if (v === "enterprise") {
        out.textContent = "Enterprise is custom-priced and agreed in writing — there is no fixed fee to total here. Everything is month-to-month, with a dedicated account manager, custom integrations, white-label, and SLA.";
        return;
      }
      var f = FEES[v] || FEES.essential;
      var year1 = f.setup + f.monthly * 12;
      out.textContent = f.name + ": " + money(f.setup) + " one-time setup + " + money(f.monthly) +
        "/month = " + money(year1) + " for the first 12 months, then " + money(f.monthly * 12) +
        " per year after that. Month-to-month, cancel anytime. Call credits are included; the allowance is set for your expected weekly volume and confirmed before signup. There is no single published allowance for everyone; any change after the first-week review needs your approval first.";
    }
    planSel.addEventListener("change", function () { refresh(); track("Cost View Used"); });
    refresh();
  }
})();
