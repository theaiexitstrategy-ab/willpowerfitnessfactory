// POST /api/lead
//
// Browser-facing endpoint for the homepage "Free Week Pass" lead capture
// form. Validates the payload, then forwards it to the GoElev8 leads
// endpoint (LEAD_CAPTURE_URL — defaults to https://api.goelev8.ai/leads).
//
// The proxy pattern lets us:
//   - swap the upstream URL via an env var without touching the page
//   - send an Authorization header server-side without exposing the key
//     to the browser
//   - sidestep CORS issues (the request is same-origin from the browser
//     and Vercel-to-GoElev8 server-to-server from here)
//   - log a clear failure to Vercel functions logs if the upstream rejects

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = req.body || {};

    // Minimal server-side validation. The client also validates via
    // required attributes, but never trust the client.
    const missing = ['first_name', 'last_name', 'email', 'phone']
      .filter(k => !String(body[k] || '').trim());
    if (missing.length) {
      return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(body.email))) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const upstreamUrl = process.env.LEAD_CAPTURE_URL || 'https://api.goelev8.ai/leads';

    const headers = { 'Content-Type': 'application/json' };
    if (process.env.LEAD_CAPTURE_API_KEY) {
      headers.Authorization = `Bearer ${process.env.LEAD_CAPTURE_API_KEY}`;
    }

    const payload = {
      gym: body.gym || 'willpowerfitnessfactory',
      source: body.source || 'homepage',
      first_name: String(body.first_name).trim(),
      last_name:  String(body.last_name).trim(),
      email:      String(body.email).trim().toLowerCase(),
      phone:      String(body.phone).trim(),
      goal:       String(body.goal || '').trim() || null,
      captured_at: new Date().toISOString(),
      // user-agent + page is handy for the CRM end to bucket leads by
      // device + entry point. Server-side so a script-injection can't
      // forge it.
      meta: {
        user_agent: req.headers['user-agent'] || '',
        referer:    req.headers['referer']    || '',
        ip:         req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '',
      },
    };

    let upstream;
    try {
      upstream = await fetch(upstreamUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error('[/api/lead] upstream fetch threw', err);
      return res.status(502).json({ error: 'We couldn\'t reach the lead system. Please try again in a minute.' });
    }

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => '');
      console.error('[/api/lead] upstream non-2xx', upstream.status, text);
      return res.status(502).json({ error: 'Something went wrong saving your info. Please text 314-964-7114 instead.' });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[/api/lead]', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
};
