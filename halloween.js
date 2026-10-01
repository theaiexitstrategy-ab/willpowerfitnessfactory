/* ═══════════════════════════════════════════════════════════════════
   WILL POWER FITNESS FACTORY — HALLOWEEN LAYER (date gate + decor)

   Loaded from <head> WITHOUT defer, so html.halloween lands before the
   first paint and the page never flashes un-themed.

   On automatically for the whole of October, local time. To preview out
   of season, or to kill it early:
     ?halloween=1   force on
     ?halloween=0   force off
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var OCTOBER = 9; // Date#getMonth is zero-based

  var force = null;
  try {
    var q = new URLSearchParams(window.location.search).get('halloween');
    if (q === '1' || q === 'true')  force = true;
    if (q === '0' || q === 'false') force = false;
  } catch (e) { /* no URLSearchParams — fall through to the date */ }

  if (!(force !== null ? force : new Date().getMonth() === OCTOBER)) return;

  document.documentElement.classList.add('halloween');

  // ── Decorations, once the body exists ─────────────────────────────
  function decorate() {
    var hero = document.querySelector('.hero');
    if (hero) {
      hero.insertAdjacentHTML('beforeend',
        web('hw-web--l') + web('hw-web--r') +
        bat('hw-bat--1') + bat('hw-bat--2') + bat('hw-bat--3'));
    }

    // Marquee stars become a pumpkin / skull / bat rotation.
    var glyphs = ['🎃', '💀', '🦇']; // 🎃 💀 🦇
    var stars = document.querySelectorAll('.marquee .ms');
    for (var i = 0; i < stars.length; i++) {
      stars[i].textContent = glyphs[i % glyphs.length];
    }

    // Seasonal flourish on the lead button. The form's own error path
    // rewrites this label back to the flame, so watch the button rather
    // than swapping once — that keeps the theme out of lead-capture code.
    var submit = document.getElementById('leadSubmit');
    if (submit) {
      pumpkin(submit);
      if (window.MutationObserver) {
        new MutationObserver(function () { pumpkin(submit); })
          .observe(submit, { childList: true, characterData: true, subtree: true });
      }
    }

    if (document.title.indexOf('🎃') === -1) {
      document.title = '🎃 ' + document.title;
    }
  }

  // 🔥 → 🎃, no-op once it has already been swapped.
  function pumpkin(el) {
    if (el.textContent.indexOf('🔥') === -1) return;
    el.textContent = el.textContent.replace('🔥', '🎃');
  }

  /* Corner cobweb, built from polar coordinates: strands radiating from
     the corner, plus rings that sag back toward it between each pair. */
  function web(cls) {
    var R = 100, RAYS = 8, RINGS = 6, d = [], ang = [], i, k;
    for (i = 0; i <= RAYS; i++) ang.push(i * (Math.PI / 2) / RAYS);

    for (i = 0; i <= RAYS; i++) {
      d.push('M0 0L' + px(R, ang[i]));
    }
    for (k = 1; k <= RINGS; k++) {
      var r = R * (k / (RINGS + 0.4)), seg = 'M' + px(r, ang[0]);
      for (i = 1; i <= RAYS; i++) {
        seg += 'Q' + px(r * 0.82, (ang[i - 1] + ang[i]) / 2) + ' ' + px(r, ang[i]);
      }
      d.push(seg);
    }
    return '<svg class="hw-deco hw-web ' + cls + '" viewBox="0 0 100 100" fill="none" ' +
      'stroke="currentColor" stroke-width="0.7" aria-hidden="true" focusable="false">' +
      '<path d="' + d.join(' ') + '"/></svg>';
  }

  function px(r, a) {
    return (r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1);
  }

  function bat(cls) {
    return '<span class="hw-deco hw-bat ' + cls + '" aria-hidden="true">' +
      '<svg viewBox="0 0 100 40" fill="currentColor" focusable="false">' +
      '<path d="M46.4 10.6 L44.6 3.4 L49.2 8.4 Z M53.6 10.6 L55.4 3.4 L50.8 8.4 Z"/>' +
      '<path d="M50 9c1.9 0 3.4 1.4 4 3.3 3.6-3.2 8-5.6 13.2-6.7 6.2-1.3 11.6-.7 17.8-3' +
      '-2 3.1-2.8 6.3-2.4 9.5 3.1.3 5.8 1.8 7.9 4.5-4.3-1.1-7.8.4-10.7 3.3-3.7 3.7-7.8 7-13.3 7' +
      '-5.5 0-10.1-3.1-13.1-7.4V31l-3.4 4.6L46.6 31V20.5c-3 4.3-7.6 7.4-13.1 7.4-5.5 0-9.6-3.3-13.3-7' +
      '-2.9-2.9-6.4-4.4-10.7-3.3 2.1-2.7 4.8-4.2 7.9-4.5.4-3.2-.4-6.4-2.4-9.5 6.2 2.3 11.6 1.7 17.8 3' +
      ' 5.2 1.1 9.6 3.5 13.2 6.7.6-1.9 2.1-3.3 4-3.3z"/>' +
      '</svg></span>';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorate);
  } else {
    decorate();
  }
})();
