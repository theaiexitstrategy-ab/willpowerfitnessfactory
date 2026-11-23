// © 2026 GoElev8.ai | Aaron Bryant. All rights reserved. Unauthorized use prohibited.
//
// Bot protection for /api/lead. Mirrors lib/bot-guard.js in the
// goelev8.ai-portal repo (keep the signature in step with it).
//
// Why this runs here and not only in the portal: /api/lead sends the
// Twilio confirmation SMS itself, before the portal sees anything. A bot
// submission has to be stopped here or it costs a text. The Turnstile
// token is single-use, so this server verifies it and tells the portal
// via `captcha_verified` in the HMAC-signed ingest body.

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

function isDottedGmail(email) {
  const e = String(email || '').trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1) return false;
  const domain = e.slice(at + 1);
  if (domain !== 'gmail.com' && domain !== 'googlemail.com') return false;
  return (e.slice(0, at).match(/\./g) || []).length >= 3;
}

function isGibberishName(name) {
  return String(name || '').trim().split(/\s+/).filter(Boolean).some((t) =>
    /^[A-Za-z]{16,}$/.test(t) || (t.match(/[a-z][A-Z]/g) || []).length >= 3);
}

function botReasons({ name, email, honeypot }) {
  const reasons = [];
  if (honeypot && String(honeypot).trim()) reasons.push('honeypot');
  if (isDottedGmail(email)) reasons.push('dotted_gmail');
  if (isGibberishName(name)) reasons.push('name_gibberish');
  return reasons;
}

// Enforced only when BOTH keys are set. /api/config hands the site key to
// the page under the same condition, so the page always renders the
// widget whenever the server expects a token.
function captchaEnabled() {
  return !!((process.env.TURNSTILE_SITE_KEY || '').trim() && (process.env.TURNSTILE_SECRET_KEY || '').trim());
}

async function verifyCaptcha(token, ip) {
  if (!token) return { ok: false, missing: true };
  const form = new URLSearchParams({ secret: process.env.TURNSTILE_SECRET_KEY.trim(), response: String(token) });
  if (ip) form.set('remoteip', ip);
  try {
    const r = await fetch(SITEVERIFY, { method: 'POST', body: form });
    const j = await r.json();
    return { ok: !!j.success, errors: j['error-codes'] || [] };
  } catch (e) {
    // Cloudflare unreachable: never turn a real lead away for that.
    return { ok: false, unavailable: true, errors: [e.message] };
  }
}

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || String(req.headers['x-real-ip'] || '') || null;
}

module.exports = { botReasons, captchaEnabled, verifyCaptcha, clientIp, isDottedGmail, isGibberishName };
