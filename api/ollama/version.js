// @ts-check
'use strict';

function normalizeTargetUrl(raw) {
  const defaultUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434')
    .trim().replace(/\/+$/, '').replace(/\/api$/, '');
  if (!raw || typeof raw !== 'string' || !raw.trim()) return defaultUrl;
  let cleaned = raw.trim();
  if (!/^https?:\/\//i.test(cleaned)) cleaned = `http://${cleaned}`;
  return cleaned.replace(/\/+$/, '').replace(/\/api$/, '');
}

/** @param {import('@vercel/node').VercelRequest} req @param {import('@vercel/node').VercelResponse} res */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-ollama-url');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const headerUrl = Array.isArray(req.headers['x-ollama-url'])
    ? req.headers['x-ollama-url'][0] : req.headers['x-ollama-url'];
  const queryUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const targetUrl = normalizeTargetUrl(headerUrl || queryUrl);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(`${targetUrl}/api/version`, { signal: controller.signal });
    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const preview = await response.text();
      return res.status(502).json({
        ok: false, code: 'UPSTREAM_NOT_JSON',
        error: `Ollama at ${targetUrl} returned non-JSON HTTP ${response.status}.`,
        preview: preview.slice(0, 200), url: targetUrl,
        hint: 'Verify Ollama base URL. On Vercel, localhost is not reachable — use ngrok.',
      });
    }
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({ ok: false, error: errData.error || `HTTP ${response.status}`, url: targetUrl });
    }
    const data = await response.json();
    return res.status(200).json({ ok: true, status: 'connected', version: data.version || 'unknown', url: targetUrl });
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    const isConnRefused = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed');
    return res.status(503).json({
      ok: false,
      code: isConnRefused ? 'ECONNREFUSED' : isTimeout ? 'TIMEOUT' : 'UNKNOWN',
      error: isTimeout ? 'Connection timed out' : isConnRefused
        ? `Connection refused at ${targetUrl}. Ollama not running or not publicly accessible.`
        : (err.message || 'Unable to connect'),
      url: targetUrl,
      hint: 'On Vercel, expose local Ollama via ngrok and set the ngrok URL in Settings.',
    });
  }
}
