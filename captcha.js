/* © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
 *
 * Cloudflare Turnstile for every lead form that posts to /api/lead.
 *
 * Put <div class="wpff-captcha"></div> inside a <form>. This script asks
 * /api/config for the public site key, loads Turnstile, and renders a
 * widget into each of those divs. In Managed mode with
 * appearance:'interaction-only' most visitors never see anything. The
 * widget appears only when Cloudflare wants an interaction.
 *
 * Submit handlers call:
 *   const token = await wpffCaptcha.token(form);  // '' if not configured
 *   ...send token as captcha_token...
 *   wpffCaptcha.reset(form);                       // after a failed send
 *
 * Tokens are single-use, so reset after any failed submit to get a new one.
 * When no site key is configured, token() resolves to '' and the server
 * doesn't enforce, so forms keep working.
 */
(function () {
  var widgets = new Map(); // form -> widget id
  var siteKey = null;
  var ready = new Promise(function (resolve) {
    fetch('/api/config')
      .then(function (r) { return r.json(); })
      .then(function (cfg) {
        siteKey = cfg && cfg.turnstileSiteKey;
        if (!siteKey) return resolve(false);
        window.__wpffTurnstileLoaded = function () { mountAll(); resolve(true); };
        var s = document.createElement('script');
        s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit&onload=__wpffTurnstileLoaded';
        s.async = true;
        s.defer = true;
        s.onerror = function () { resolve(false); };
        document.head.appendChild(s);
      })
      .catch(function () { resolve(false); });
  });

  function mountAll() {
    document.querySelectorAll('form .wpff-captcha').forEach(function (el) {
      var form = el.closest('form');
      if (!form || widgets.has(form)) return;
      widgets.set(form, window.turnstile.render(el, {
        sitekey: siteKey,
        appearance: 'interaction-only',
        'refresh-expired': 'auto',
        action: form.id || 'lead'
      }));
    });
  }

  function current(form) {
    var id = widgets.get(form);
    if (id === undefined || !window.turnstile) return '';
    return window.turnstile.getResponse(id) || '';
  }

  window.wpffCaptcha = {
    // Waits up to 10s for Turnstile to finish its check.
    token: function (form) {
      return ready.then(function (on) {
        if (!on) return '';
        return new Promise(function (resolve) {
          var waited = 0;
          (function poll() {
            var t = current(form);
            if (t || waited >= 10000) return resolve(t);
            waited += 200;
            setTimeout(poll, 200);
          })();
        });
      });
    },
    reset: function (form) {
      var id = widgets.get(form);
      if (id !== undefined && window.turnstile) {
        try { window.turnstile.reset(id); } catch (_) {}
      }
    }
  };
})();
