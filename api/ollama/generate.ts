import type { VercelRequest, VercelResponse } from '@vercel/node';

function normalizeTargetUrl(raw?: string | null): string {
  const defaultUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim().replace(/\/+$/, '').replace(/\/api$/, '');
  if (!raw || typeof raw !== 'string' || !raw.trim()) return defaultUrl;
  let cleaned = raw.trim();
  if (!/^https?:\/\//i.test(cleaned)) cleaned = `http://${cleaned}`;
  cleaned = cleaned.replace(/\/+$/, '').replace(/\/api$/, '');
  return cleaned;
}

function matchesModelName(requested: string, installedName: string): boolean {
  const req = (requested || '').trim().toLowerCase();
  const inst = (installedName || '').trim().toLowerCase();
  if (!req || !inst) return false;
  if (req === inst) return true;
  const reqWithLatest = req.includes(':') ? req : `${req}:latest`;
  const instWithLatest = inst.includes(':') ? inst : `${inst}:latest`;
  return reqWithLatest === instWithLatest;
}

async function resolveInstalledModel(targetUrl: string, requestedModel: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const response = await fetch(`${targetUrl}/api/tags`, { method: 'GET', signal: controller.signal });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json() as { models?: Array<{ name?: string; model?: string }> };
      const models = data.models || [];
      const match = models.find((m) => matchesModelName(requestedModel, m.name || m.model || ''));
      if (match) return match.name || match.model || requestedModel;
    }
  } catch { /* fallback to requestedModel */ }
  return requestedModel;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-ollama-url');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' });

  const headerUrl = Array.isArray(req.headers['x-ollama-url'])
    ? req.headers['x-ollama-url'][0]
    : req.headers['x-ollama-url'];
  const targetUrl = normalizeTargetUrl(headerUrl);

  const { model = 'llama3.2', prompt, system, options, format = 'json' } = req.body || {};

  if (!prompt) {
    return res.status(400).json({ ok: false, error: 'Prompt is required' });
  }

  const actualModel = await resolveInstalledModel(targetUrl, model);

  try {
    const controller = new AbortController();
    // 90s timeout — Vercel serverless functions have a max of 300s on Pro plan
    const timeout = setTimeout(() => controller.abort(), 90000);

    const response = await fetch(`${targetUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: actualModel,
        prompt,
        system,
        stream: false,
        format,
        options: options || { temperature: 0.65 },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const errText = await response.text();
      return res.status(502).json({
        ok: false,
        code: 'UPSTREAM_NOT_JSON',
        error: `Ollama at ${targetUrl} returned HTTP ${response.status} (${contentType || 'text/html'}). Expected JSON.`,
        preview: errText.slice(0, 200),
        hint: 'Check your Ollama base URL. On Vercel, localhost:11434 is not reachable — use an ngrok tunnel URL in Settings.',
      });
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({})) as { error?: string };
      const errMessage = errJson.error || `Ollama error (${response.status})`;

      if (response.status === 404 || errMessage.toLowerCase().includes('not found')) {
        return res.status(404).json({
          ok: false,
          code: 'MODEL_NOT_FOUND',
          error: `Model "${model}" not found in Ollama library.`,
          hint: `Run \`ollama pull ${model}\` in your terminal to download this model.`,
        });
      }

      return res.status(response.status).json({ ok: false, code: 'OLLAMA_ERROR', error: errMessage });
    }

    const data = await response.json() as { response?: string; total_duration?: number; model?: string };
    return res.status(200).json({ ok: true, response: data.response, total_duration: data.total_duration, model: data.model });
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    const isConnRefused = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED') || err.message?.includes('fetch failed');

    return res.status(503).json({
      ok: false,
      code: isTimeout ? 'TIMEOUT' : isConnRefused ? 'ECONNREFUSED' : 'UNREACHABLE',
      error: isTimeout
        ? 'Generation timed out after 90 seconds.'
        : isConnRefused
        ? `Could not reach Ollama at ${targetUrl}. Is it running and publicly accessible?`
        : (err.message || 'Generation failed'),
      hint: isConnRefused
        ? 'Ollama is not running or not reachable from Vercel. Use `ollama serve` locally and expose it via ngrok, then set the ngrok URL in Settings.'
        : 'Ensure Ollama is running and the model is pulled.',
    });
  }
}
