// GET /api/twilio-test?phone=13145551234
//
// One-shot diagnostic that exercises the same Twilio configuration the
// /api/lead endpoint uses, and returns the full diagnostic block as
// JSON. Designed to be hit directly in a browser tab — no DevTools or
// form submission required.
//
// Returns the same `twilio` object shape as /api/lead so the
// troubleshooting guide ("twilio_code: 30032 means TFV pending" etc.)
// applies here too.
//
// If `?phone=` is omitted, no SMS is sent — the endpoint just reports
// whether the env vars are present and trimmed correctly. Useful as a
// pre-flight check before testing with a real number.

module.exports = async (req, res) => {
  const phoneInput = String(req.query?.phone || '').trim();

  const sid    = (process.env.TWILIO_ACCOUNT_SID || '').trim();
  const token  = (process.env.TWILIO_AUTH_TOKEN  || '').trim();
  const from   = (process.env.TWILIO_FROM_NUMBER || '').trim();
  const template = process.env.TWILIO_LEAD_TEMPLATE || '';

  const out = {
    env_check: {
      TWILIO_ACCOUNT_SID:   sid    ? `set (length ${sid.length}, starts "${sid.slice(0, 4)}…")` : 'MISSING',
      TWILIO_AUTH_TOKEN:    token  ? `set (length ${token.length})` : 'MISSING',
      TWILIO_FROM_NUMBER:   from   ? from : 'MISSING',
      TWILIO_LEAD_TEMPLATE: template ? 'set (custom template)' : 'unset (default body will be used)',
    },
    twilio: {
      attempted: false,
      configured: !!(sid && token && from),
      skipped_reason: null,
      sent_to: null,
      from_number: from || null,
      status_code: null,
      twilio_code: null,
      twilio_message: null,
      message_sid: null,
      threw: null,
    },
    instructions: 'Pass ?phone=18775551234 to actually send a test SMS. Without it, only env vars are reported.',
  };

  if (!out.twilio.configured) {
    const missing = [
      !sid    && 'TWILIO_ACCOUNT_SID',
      !token  && 'TWILIO_AUTH_TOKEN',
      !from   && 'TWILIO_FROM_NUMBER',
    ].filter(Boolean);
    out.twilio.skipped_reason = 'config_missing';
    out.twilio.threw = `missing env vars: ${missing.join(', ')}`;
    return res.status(200).json(out);
  }

  if (!phoneInput) {
    out.twilio.skipped_reason = 'no_phone_in_query';
    return res.status(200).json(out);
  }

  // Same E.164 normalization as /api/lead
  const phoneDigits = phoneInput.replace(/\D/g, '');
  const toE164 = phoneDigits.length === 10
    ? `+1${phoneDigits}`
    : phoneDigits.length === 11 && phoneDigits.startsWith('1')
      ? `+${phoneDigits}`
      : null;

  if (!toE164) {
    out.twilio.skipped_reason = 'phone_invalid';
    out.twilio.threw = `Could not normalize "${phoneInput}" to E.164. Use a 10-digit US number or 11-digit with 1 prefix.`;
    return res.status(200).json(out);
  }

  out.twilio.attempted = true;
  out.twilio.sent_to = toE164;

  const smsBody =
    'Will Power Fitness Factory — Twilio test from /api/twilio-test. ' +
    'If you got this, the SMS pipeline is working. Reply STOP to opt out.';

  try {
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
        },
        body: new URLSearchParams({
          To: toE164,
          From: from,
          Body: smsBody,
        }).toString(),
      }
    );
    out.twilio.status_code = twilioRes.status;
    const bodyText = await twilioRes.text().catch(() => '');
    let bodyJson = null;
    try { bodyJson = JSON.parse(bodyText); } catch {}

    if (twilioRes.ok) {
      out.twilio.message_sid = bodyJson?.sid || null;
    } else {
      out.twilio.twilio_code = bodyJson?.code || null;
      out.twilio.twilio_message = bodyJson?.message || bodyText.slice(0, 300);
    }
  } catch (err) {
    out.twilio.threw = err && err.message ? err.message : String(err);
  }

  return res.status(200).json(out);
};
