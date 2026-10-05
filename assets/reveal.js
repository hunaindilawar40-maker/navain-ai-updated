/*! Navain AI — reveal.js | fade sections in on scroll (IntersectionObserver).
    No-JS fallback: content is visible unless this script adds .reveal-init. */
(function () {
  "use strict";
  var items = document.querySelectorAll(".reveal");
  if (!items.length) return;
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return; // leave content visible
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });
  for (var i = 0; i < items.length; i++) { items[i].classList.add("reveal-init"); io.observe(items[i]); }
})();
