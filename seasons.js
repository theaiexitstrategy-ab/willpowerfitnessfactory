/* ═══════════════════════════════════════════════════════════════════
   WILL POWER FITNESS FACTORY — SEASONAL LAYER (date gate + decor)

   One gate for every seasonal theme, so two can never run at once:

     halloween   October 1 – 31
     holidays    November 1 – January 1

   Loaded from <head> WITHOUT defer, so the class lands before the first
   paint and the page never flashes un-themed.

   To preview out of season, or to kill a theme early:
     ?season=halloween | holidays | none
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var VALID = { halloween: 1, holidays: 1, none: 1 };

  /* Months are zero-based. The holidays run from Nov 1 through New
     Year's Day, so the site is back to normal on January 2. */
  function seasonFor(d) {
    var m = d.getMonth();
    if (m === 9) return 'halloween';            // October
    if (m === 10 || m === 11) return 'holidays'; // November, December
    if (m === 0 && d.getDate() === 1) return 'holidays';
    return null;
  }

  var forced = null;
  try {
    var q = new URLSearchParams(window.location.search).get('season');
    if (q && VALID[q]) forced = q;
  } catch (e) { /* no URLSearchParams — fall through to the date */ }

  var season = forced || seasonFor(new Date());
  if (!season || season === 'none') return;

  document.documentElement.classList.add(season);

  var DECOR = { halloween: halloweenDecor, holidays: holidaysDecor };

  function run() {
    var hero = document.querySelector('.hero');
    DECOR[season](hero);

    // Marquee separators and the lead button pick up the season.
    var set = season === 'halloween'
      ? { glyphs: ['🎃', '💀', '🦇'],  // 🎃 💀 🦇
          badge: '🎃' }
      : { glyphs: ['❄️', '🎄', '✨'],        // ❄️ 🎄 ✨
          badge: '❄️' };

    var stars = document.querySelectorAll('.marquee .ms');
    for (var i = 0; i < stars.length; i++) {
      stars[i].textContent = set.glyphs[i % set.glyphs.length];
    }

    // The lead form's error path rewrites this label back to the flame,
    // so watch the button rather than swapping once — that keeps the
    // seasonal layer out of the lead-capture code.
    var submit = document.getElementById('leadSubmit');
    if (submit) {
      var swap = function () {
        if (submit.textContent.indexOf('🔥') === -1) return;   // 🔥
        submit.textContent = submit.textContent.replace('🔥', set.badge);
      };
      swap();
      if (window.MutationObserver) {
        new MutationObserver(swap)
          .observe(submit, { childList: true, characterData: true, subtree: true });
      }
    }

    if (document.title.indexOf(set.badge) === -1) {
      document.title = set.badge + ' ' + document.title;
    }
  }


  /* ───────────────────────────── HALLOWEEN ─────────────────────── */

  function halloweenDecor(hero) {
    if (!hero) return;
    hero.insertAdjacentHTML('beforeend',
      web('hw-web--l') + web('hw-web--r') +
      bat('hw-bat--1') + bat('hw-bat--2') + bat('hw-bat--3'));
  }

  /* Corner cobweb, built from polar coordinates: strands radiating from
     the corner, plus rings that sag back toward it between each pair. */
  function web(cls) {
    var R = 100, RAYS = 8, RINGS = 6, d = [], ang = [], i, k;
    for (i = 0; i <= RAYS; i++) ang.push(i * (Math.PI / 2) / RAYS);

    for (i = 0; i <= RAYS; i++) d.push('M0 0L' + polar(R, ang[i]));

    for (k = 1; k <= RINGS; k++) {
      var r = R * (k / (RINGS + 0.4)), seg = 'M' + polar(r, ang[0]);
      for (i = 1; i <= RAYS; i++) {
        seg += 'Q' + polar(r * 0.82, (ang[i - 1] + ang[i]) / 2) + ' ' + polar(r, ang[i]);
      }
      d.push(seg);
    }
    return '<svg class="s-deco hw-web ' + cls + '" viewBox="0 0 100 100" fill="none" ' +
      'stroke="currentColor" stroke-width="0.7" aria-hidden="true" focusable="false">' +
      '<path d="' + d.join(' ') + '"/></svg>';
  }

  function polar(r, a) {
    return (r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1);
  }

  function bat(cls) {
    return '<span class="s-deco hw-bat ' + cls + '" aria-hidden="true">' +
      '<svg viewBox="0 0 100 40" fill="currentColor" focusable="false">' +
      '<path d="M46.4 10.6 L44.6 3.4 L49.2 8.4 Z M53.6 10.6 L55.4 3.4 L50.8 8.4 Z"/>' +
      '<path d="M50 9c1.9 0 3.4 1.4 4 3.3 3.6-3.2 8-5.6 13.2-6.7 6.2-1.3 11.6-.7 17.8-3' +
      '-2 3.1-2.8 6.3-2.4 9.5 3.1.3 5.8 1.8 7.9 4.5-4.3-1.1-7.8.4-10.7 3.3-3.7 3.7-7.8 7-13.3 7' +
      '-5.5 0-10.1-3.1-13.1-7.4V31l-3.4 4.6L46.6 31V20.5c-3 4.3-7.6 7.4-13.1 7.4-5.5 0-9.6-3.3-13.3-7' +
      '-2.9-2.9-6.4-4.4-10.7-3.3 2.1-2.7 4.8-4.2 7.9-4.5.4-3.2-.4-6.4-2.4-9.5 6.2 2.3 11.6 1.7 17.8 3' +
      ' 5.2 1.1 9.6 3.5 13.2 6.7.6-1.9 2.1-3.3 4-3.3z"/>' +
      '</svg></span>';
  }


  /* ───────────────────────────── HOLIDAYS ──────────────────────── */

  function holidaysDecor(hero) {
    if (!hero) return;
    hero.insertAdjacentHTML('beforeend', garland() + snow(34));
  }

  /* String lights swagged across the hero. The SVG keeps a fixed
     viewBox and scales with the page, so the bulbs stay round at every
     width instead of stretching with the wire. */
  function garland() {
    var W = 1200, H = 112, SWAGS = 8, TOP = 5, SAG = 52;
    var span = W / SWAGS;
    // Quadratic midpoint is (P0 + 2C + P2)/4, so this control y puts the
    // lowest point of each swag exactly SAG below the wire's anchors.
    var cy = 2 * (TOP + SAG) - TOP;
    var colors = ['#ffc861', '#ff7a7a', '#8fd4ff', '#86e5b0'];
    var wire = '', bulbs = '', s, t, i;

    for (s = 0; s < SWAGS; s++) {
      var x0 = s * span, x2 = x0 + span;
      wire += 'M' + x0 + ' ' + TOP + 'Q' + (x0 + span / 2) + ' ' + cy + ' ' + x2 + ' ' + TOP;

      for (i = 0, t = 0.16; i < 5; i++, t += 0.17) {
        var u = 1 - t;
        var bx = u * u * x0 + 2 * u * t * (x0 + span / 2) + t * t * x2;
        var by = u * u * TOP + 2 * u * t * cy + t * t * TOP;
        var c = colors[(s * 5 + i) % colors.length];
        bulbs +=
          '<line class="hd-cap" x1="' + bx.toFixed(1) + '" y1="' + by.toFixed(1) +
          '" x2="' + bx.toFixed(1) + '" y2="' + (by + 5).toFixed(1) +
          '" stroke="#35506b" stroke-width="2"/>' +
          '<circle class="hd-bulb" cx="' + bx.toFixed(1) + '" cy="' + (by + 11).toFixed(1) +
          '" r="5.6" fill="' + c + '" style="animation-delay:' +
          (-(s * 5 + i) * 0.37).toFixed(2) + 's;filter:drop-shadow(0 0 5px ' + c + ')"/>';
      }
    }
    return '<svg class="s-deco hd-garland" viewBox="0 0 ' + W + ' ' + H + '" ' +
      'aria-hidden="true" focusable="false">' +
      '<path class="hd-wire" d="' + wire + '"/>' + bulbs + '</svg>';
  }

  /* Snowfall, randomised per flake. Negative delays spread them through
     their fall so the hero is never briefly empty on load. */
  function snow(count) {
    var out = '', i;
    for (i = 0; i < count; i++) {
      var size = 2 + Math.random() * 4;
      var dur  = 9 + Math.random() * 11;
      out += '<span class="s-deco hd-flake" aria-hidden="true" style="' +
        'left:'    + (Math.random() * 100).toFixed(2) + '%;' +
        'width:'   + size.toFixed(1) + 'px;' +
        'height:'  + size.toFixed(1) + 'px;' +
        'opacity:' + (0.25 + Math.random() * 0.5).toFixed(2) + ';' +
        '--drift:' + ((Math.random() * 2 - 1) * 60).toFixed(0) + 'px;' +
        'animation-duration:' + dur.toFixed(1) + 's;' +
        'animation-delay:' + (-Math.random() * dur).toFixed(1) + 's"></span>';
    }
    return out;
  }


  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
