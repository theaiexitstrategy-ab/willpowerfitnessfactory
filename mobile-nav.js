/* © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited. */
/* ═══════════════════════════════════════════════════════════════════
   WILL POWER FITNESS FACTORY — MOBILE MENU

   Every page hides .nav-links below its own breakpoint (680px, 720px on
   /sponsor). This adds a menu button that shows up exactly when the
   links are hidden, so each page keeps its own breakpoint and markup.
   Without JS the page behaves as before.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function init() {
    var links = document.querySelector('nav .nav-links');
    if (!links) return;
    var nav = links.closest('nav');

    if (!links.id) links.id = 'site-menu';
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'nav-toggle';
    btn.setAttribute('aria-controls', links.id);
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML =
      '<span class="nav-toggle-bars" aria-hidden="true"><span></span><span></span><span></span></span>' +
      '<span class="nav-toggle-label">Menu</span>';

    // Button sits just left of the page's CTA (Book Now / Sponsor Will / cart).
    var last = nav.lastElementChild;
    nav.insertBefore(btn, last === links ? null : last);

    function setOpen(open) {
      nav.classList.toggle('nav-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      nav.style.setProperty('--nav-h', nav.offsetHeight + 'px');
    }

    // The button only shows while the page's own CSS is hiding the links.
    function sync() {
      if (nav.classList.contains('nav-open')) setOpen(false);
      var hidden = getComputedStyle(links).display === 'none';
      nav.classList.toggle('nav-collapsed', hidden);
    }

    btn.addEventListener('click', function () {
      setOpen(!nav.classList.contains('nav-open'));
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('nav-open')) {
        setOpen(false);
        btn.focus();
      }
    });
    document.addEventListener('click', function (e) {
      if (nav.classList.contains('nav-open') && !nav.contains(e.target)) setOpen(false);
    });

    var lastW = window.innerWidth;
    window.addEventListener('resize', function () {
      // Mobile browsers fire resize on scroll (URL bar); only react to width.
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      sync();
    });
    sync();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
