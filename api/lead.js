// POST /api/lead
//
// Browser-facing endpoint for the homepage lead capture (both the
// hero "One Free Session" form and the SMS band quick-text capture).
// Captures the lead via three fallback paths, in order:
//
//   1. Forward to LEAD_CAPTURE_URL (the upstream CRM/leads webhook)
//   2. If that fails, email the lead to LEAD_FALLBACK_EMAIL via Resend
//   3. ALWAYS log the lead to Vercel function logs as a last-resort
//      so it's at least recoverable from the operator's dashboard.
//
// The endpoint returns success to the customer if ANY of those paths
// captured the lead. The customer never sees a "we failed" message
// when a fallback path saved the data. Failures only surface to the
// customer if every path errored out (extremely rare).

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    // Two capture flavors come through this endpoint:
    //   1. Full lead form (hero "One Free Session") — requires the
    //      name + email + phone quartet.
    //   2. Quick-text band (mid-page "Get session info sent to your
    //      phone") — only collects a phone number. These submit with
    //      partial_capture=true and are tagged for follow-up so the
    //      operator knows to gather the rest.
    const partial = body.partial_capture === true;

    if (partial) {
      if (!String(body.phone || '').trim()) {
        return res.status(400).json({ error: 'Phone number is required.' });
      }
    } else {
      const missing = ['first_name', 'last_name', 'email', 'phone']
        .filter(k => !String(body[k] || '').trim());
      if (missing.length) {
        return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }
    }

    const payload = {
      gym: body.gym || 'willpowerfitnessfactory',
      source: body.source || 'homepage',
      partial_capture: partial,
      first_name: String(body.first_name || '').trim() || null,
      last_name:  String(body.last_name  || '').trim() || null,
      email:      String(body.email      || '').trim().toLowerCase() || null,
      phone:      String(body.phone      || '').trim(),
      goal:       String(body.goal       || '').trim() || null,
      captured_at: new Date().toISOString(),
      meta: {
        user_agent: req.headers['user-agent'] || '',
        referer:    req.headers['referer']    || '',
        ip:         req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      },
    };

    // ─── 1. CONSOLE LOG (always — Vercel function logs become the
    //        operator's de-facto "lead inbox" until upstream is wired)
    console.log('[/api/lead] LEAD CAPTURED', JSON.stringify(payload));

    // Track what worked so the response can be transparent in logs.
    const captured = { upstream: false, email: false };
    const errors   = [];

    // ─── 2. UPSTREAM WEBHOOK (LEAD_CAPTURE_URL) — only attempt if the
    //        URL was explicitly configured. The previous default of
    //        api.goelev8.ai/leads was creating 502s when that endpoint
    //        didn't exist yet, so we skip the upstream step entirely
    //        when no URL is set in Vercel env vars.
    if (process.env.LEAD_CAPTURE_URL) {
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.LEAD_CAPTURE_API_KEY) {
        headers.Authorization = `Bearer ${process.env.LEAD_CAPTURE_API_KEY}`;
      }
      try {
        const upstream = await fetch(process.env.LEAD_CAPTURE_URL, {
          method: 'POST', headers, body: JSON.stringify(payload),
        });
        if (upstream.ok) {
          captured.upstream = true;
        } else {
          const text = await upstream.text().catch(() => '');
          errors.push(`upstream ${upstream.status}: ${text.slice(0, 200)}`);
          console.warn('[/api/lead] upstream non-2xx (falling back)', upstream.status, text);
        }
      } catch (err) {
        errors.push(`upstream fetch threw: ${err.message}`);
        console.warn('[/api/lead] upstream fetch threw (falling back)', err);
      }
    }

    // ─── 2b. TWILIO CONFIRMATION SMS — send the customer an immediate
    //         opt-in confirmation text with the booking link. Best-effort,
    //         non-fatal: if Twilio isn't configured or the send fails,
    //         the lead is still captured via the email + log paths and
    //         the customer gets the auto-redirect to the booking page
    //         from the browser. This is what makes Will's "Opt-in SMS"
    //         actually happen.
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER) {
      try {
        const phoneDigits = String(payload.phone).replace(/\D/g, '');
        const toE164 = phoneDigits.length === 10
          ? `+1${phoneDigits}`
          : phoneDigits.length === 11 && phoneDigits.startsWith('1')
            ? `+${phoneDigits}`
            : null;

        if (toE164) {
          const firstName = payload.first_name ? `, ${payload.first_name}` : '';
          const smsBody = process.env.TWILIO_LEAD_TEMPLATE
            ? process.env.TWILIO_LEAD_TEMPLATE
                .replace('{first_name}', payload.first_name || '')
                .replace('{booking_url}', 'https://book.willpowerfitnessfactory.com/')
            : `Hey${firstName} — thanks for reaching out to Will Power Fitness Factory! ` +
              `Book your free first session with William here: https://book.willpowerfitnessfactory.com/ ` +
              `Reply STOP to opt out.`;

          // Twilio's Messages.create REST endpoint via fetch — keeps us
          // off the twilio npm package since this is the only Twilio
          // call in the codebase.
          const twilioRes = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                Authorization: 'Basic ' + Buffer.from(
                  `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
                ).toString('base64'),
              },
              body: new URLSearchParams({
                To: toE164,
                From: process.env.TWILIO_FROM_NUMBER,
                Body: smsBody,
              }).toString(),
            }
          );
          if (twilioRes.ok) {
            console.log('[/api/lead] Twilio confirmation SMS sent to', toE164);
          } else {
            const text = await twilioRes.text().catch(() => '');
            console.warn('[/api/lead] Twilio send non-2xx', twilioRes.status, text.slice(0, 200));
          }
        } else {
          console.warn('[/api/lead] Twilio skipped — phone not normalizable to E.164:', payload.phone);
        }
      } catch (err) {
        console.warn('[/api/lead] Twilio send threw (non-fatal)', err);
      }
    }

    // ─── 3. RESEND EMAIL FALLBACK — if a fallback address is configured
    //        and the upstream didn't catch the lead, email the operator.
    //        Uses the same Resend client the merch order confirmations
    //        use, so no extra package needed.
    const fallbackEmail = process.env.LEAD_FALLBACK_EMAIL;
    if (!captured.upstream && fallbackEmail && process.env.RESEND_API_KEY) {
      try {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'leads@willpowerfitnessfactory.com';

        const niceLabel = partial ? 'New phone-only lead (SMS band)' : 'New lead (Free First Session form)';
        const lines = [
          `<p><strong>${niceLabel}</strong></p>`,
          `<p>Source: ${payload.source}</p>`,
          payload.first_name || payload.last_name
            ? `<p>Name: ${[payload.first_name, payload.last_name].filter(Boolean).join(' ')}</p>` : '',
          payload.email ? `<p>Email: ${payload.email}</p>` : '',
          `<p>Phone: <strong>${payload.phone}</strong></p>`,
          payload.goal ? `<p>Goal: ${payload.goal}</p>` : '',
          `<p style="color:#888;font-size:12px;margin-top:24px;">Captured ${payload.captured_at}</p>`,
        ].filter(Boolean).join('');

        await resend.emails.send({
          from: `Will Power Leads <${fromEmail}>`,
          to: fallbackEmail,
          subject: niceLabel,
          html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">${lines}</div>`,
        });
        captured.email = true;
      } catch (err) {
        errors.push(`resend fallback failed: ${err.message}`);
        console.error('[/api/lead] resend fallback failed', err);
      }
    }

    // If at least one persistent path worked, the lead is safe — return
    // success. Otherwise we still log so the data is in Vercel logs, but
    // surface a soft failure so the customer knows to text the gym.
    if (captured.upstream || captured.email) {
      return res.status(200).json({ ok: true, captured });
    }

    // The console.log above means the lead is at least recoverable from
    // Vercel logs. We still return 200 so the customer experience isn't
    // broken — the operator will see this in logs and follow up.
    console.warn('[/api/lead] CAPTURED VIA LOG-ONLY (no upstream, no email fallback). Errors:', errors);
    return res.status(200).json({ ok: true, captured: { logged_only: true } });
  } catch (err) {
    console.error('[/api/lead]', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
