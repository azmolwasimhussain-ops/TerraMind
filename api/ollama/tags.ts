import type { VercelRequest, VercelResponse } from '@vercel/node';

function normalizeTargetUrl(raw?: string | null): string {
  const defaultUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim().replace(/\/+$/, '').replace(/\/api$/, '');
  if (!raw || typeof raw !== 'string' || !raw.trim()) return defaultUrl;
  let cleaned = raw.trim();
  if (!/^https?:\/\//i.test(cleaned)) cleaned = `http://${cleaned}`;
  cleaned = cleaned.replace(/\/+$/, '').replace(/\/api$/, '');
  return cleaned;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-ollama-url');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const headerUrl = Array.isArray(req.headers['x-ollama-url'])
    ? req.headers['x-ollama-url'][0]
    : req.headers['x-ollama-url'];
  const queryUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
  const targetUrl = normalizeTargetUrl(headerUrl || queryUrl);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${targetUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const preview = await response.text();
      return res.status(502).json({
        ok: false,
        code: 'UPSTREAM_NOT_JSON',
        error: `Ollama at ${targetUrl} returned non-JSON HTTP ${response.status}.`,
        preview: preview.slice(0, 200),
        models: [],
        url: targetUrl,
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        ok: false,
        error: (errData as any).error || `Ollama returned HTTP ${response.status}`,
        models: [],
        url: targetUrl,
      });
    }

    const data = await response.json() as { models?: any[] };
    return res.status(200).json({ ok: true, models: data.models || [], url: targetUrl });
  } catch (err: any) {
    return res.status(503).json({
      ok: false,
      code: 'UNREACHABLE',
      error: err.message || 'Unable to fetch models from Ollama',
      models: [],
      url: targetUrl,
    });
  }
}
