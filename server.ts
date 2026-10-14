import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

/**
 * Normalize and clean target Ollama base URL
 */
function normalizeTargetUrl(raw?: string | null): string {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').trim().replace(/\/+$/, '').replace(/\/api$/, '');
  }
  let cleaned = raw.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `http://${cleaned}`;
  }
  cleaned = cleaned.replace(/\/+$/, '');
  cleaned = cleaned.replace(/\/api$/, '');
  return cleaned.replace(/\/+$/, '');
}

function getTargetOllamaUrl(req: express.Request): string {
  const headerUrl = req.headers['x-ollama-url'];
  if (typeof headerUrl === 'string' && headerUrl.trim()) {
    return normalizeTargetUrl(headerUrl);
  }
  const queryUrl = req.query.url;
  if (typeof queryUrl === 'string' && queryUrl.trim()) {
    return normalizeTargetUrl(queryUrl);
  }
  return normalizeTargetUrl(process.env.OLLAMA_BASE_URL);
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'terramind-backend',
    timestamp: new Date().toISOString(),
  });
});

// Handler for Ollama Version / Ping proxy
async function handleVersion(req: express.Request, res: express.Response) {
  const targetUrl = getTargetOllamaUrl(req);
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${targetUrl}/api/version`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const preview = await response.text();
      return res.status(502).json({
        ok: false,
        status: 'invalid_upstream',
        code: 'UPSTREAM_NOT_JSON',
        error: `Ollama at ${targetUrl} returned non-JSON HTTP ${response.status} (${contentType || 'unknown'}).`,
        preview: preview.slice(0, 200),
        url: targetUrl,
        hint: 'Check that the URL points directly to an Ollama server and not a website or web proxy.',
      });
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        ok: false,
        status: 'error',
        error: errData.error || `Ollama returned HTTP ${response.status}`,
        url: targetUrl,
      });
    }

    const data = await response.json();
    return res.json({
      ok: true,
      status: 'connected',
      version: data.version || 'unknown',
      url: targetUrl,
    });
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    const isConnRefused = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED') || err.message?.includes('fetch failed');

    return res.status(503).json({
      ok: false,
      status: 'unreachable',
      code: isConnRefused ? 'ECONNREFUSED' : isTimeout ? 'TIMEOUT' : 'UNKNOWN',
      error: isTimeout
        ? 'Connection timed out while reaching Ollama'
        : isConnRefused
        ? `Connection refused at ${targetUrl}. Ollama is not running on this host.`
        : (err.message || 'Unable to connect to Ollama service'),
      url: targetUrl,
      hint: isConnRefused
        ? 'Ollama is not running. On macOS, keep `ollama serve` active in a separate terminal tab or start the Ollama desktop app (`open -a Ollama`).'
        : 'Ensure Ollama is running and accessible at ' + targetUrl,
    });
  }
}

app.get('/api/ollama/version', handleVersion);
app.get('/api/version', handleVersion);

// Handler for Ollama Tags / Installed Models proxy
async function handleTags(req: express.Request, res: express.Response) {
  const targetUrl = getTargetOllamaUrl(req);
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
        error: errData.error || `Ollama returned HTTP ${response.status}`,
        models: [],
        url: targetUrl,
      });
    }

    const data = await response.json();
    return res.json({
      ok: true,
      models: data.models || [],
      url: targetUrl,
    });
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

app.get('/api/ollama/tags', handleTags);
app.get('/api/tags', handleTags);

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
    const response = await fetch(`${targetUrl}/api/tags`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (response.ok) {
      const data = await response.json();
      const models = data.models || [];
      const match = models.find((m: any) =>
        matchesModelName(requestedModel, m.name || m.model || '')
      );
      if (match) {
        return match.name || match.model || requestedModel;
      }
    }
  } catch {
    // If tags query fails, fallback to requested model
  }
  return requestedModel;
}

// Handler for Ollama Generate proxy
async function handleGenerate(req: express.Request, res: express.Response) {
  const targetUrl = getTargetOllamaUrl(req);
  const { model = 'llama3.2', prompt, system, options, format = 'json' } = req.body;

  if (!prompt) {
    return res.status(400).json({ ok: false, error: 'Prompt is required' });
  }

  const actualModel = await resolveInstalledModel(targetUrl, model);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s max for local LLM

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

    // Guard against upstream returning HTML or non-JSON
    if (!contentType.includes('application/json')) {
      const errText = await response.text();
      return res.status(502).json({
        ok: false,
        code: 'UPSTREAM_NOT_JSON',
        error: `Ollama upstream at ${targetUrl} returned HTTP ${response.status} (${contentType || 'text/html'}). Expected JSON.`,
        preview: errText.slice(0, 200),
        hint: 'Check your Ollama base URL. It may be pointing to a website instead of the Ollama API server.',
      });
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      const errMessage = errJson.error || `Ollama error (${response.status})`;

      if (response.status === 404 || errMessage.toLowerCase().includes('not found')) {
        return res.status(404).json({
          ok: false,
          code: 'MODEL_NOT_FOUND',
          error: `Model "${model}" not found in Ollama library.`,
          hint: `Run \`ollama pull ${model}\` in your terminal to download this model.`,
        });
      }

      return res.status(response.status).json({
        ok: false,
        code: 'OLLAMA_ERROR',
        error: errMessage,
      });
    }

    const data = await response.json();
    return res.json({
      ok: true,
      response: data.response,
      total_duration: data.total_duration,
      model: data.model,
    });
  } catch (err: any) {
    const isTimeout = err.name === 'AbortError';
    const isConnRefused = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('fetch failed');

    return res.status(503).json({
      ok: false,
      code: isTimeout ? 'TIMEOUT' : isConnRefused ? 'ECONNREFUSED' : 'UNREACHABLE',
      error: isTimeout
        ? 'Generation timed out after 60 seconds.'
        : isConnRefused
        ? `Could not reach Ollama at ${targetUrl}. Is the service running?`
        : (err.message || 'Generation failed'),
      hint: isConnRefused
        ? 'Ollama is not running. On macOS, keep `ollama serve` active in a separate terminal tab or start the Ollama desktop app (`open -a Ollama`).'
        : 'Ensure Ollama is running and the model is pulled.',
    });
  }
}

app.post('/api/ollama/generate', handleGenerate);
app.post('/api/generate', handleGenerate);

// Handler for Ollama Chat proxy
async function handleChat(req: express.Request, res: express.Response) {
  const targetUrl = getTargetOllamaUrl(req);
  const { model = 'llama3.2', messages, format = 'json', options } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ ok: false, error: 'Messages array is required' });
  }

  const actualModel = await resolveInstalledModel(targetUrl, model);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(`${targetUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: actualModel,
        messages,
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
        error: `Ollama chat upstream returned non-JSON HTTP ${response.status}`,
        preview: errText.slice(0, 200),
      });
    }

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        ok: false,
        code: response.status === 404 ? 'MODEL_NOT_FOUND' : 'OLLAMA_ERROR',
        error: errJson.error || `Ollama chat error (${response.status})`,
      });
    }

    const data = await response.json();
    return res.json({
      ok: true,
      message: data.message,
      model: data.model,
    });
  } catch (err: any) {
    return res.status(503).json({
      ok: false,
      code: err.name === 'AbortError' ? 'TIMEOUT' : 'UNREACHABLE',
      error: err.name === 'AbortError' ? 'Chat timed out' : (err.message || 'Chat failed'),
    });
  }
}

app.post('/api/ollama/chat', handleChat);
app.post('/api/chat', handleChat);

// CRITICAL GUARANTEE: Never let any /api/* route fall through to Vite SPA index.html
app.all('/api/*', (req, res) => {
  res.status(404).json({
    ok: false,
    code: 'ROUTE_NOT_FOUND',
    error: `API route not found: ${req.method} ${req.originalUrl}`,
    hint: 'Supported endpoints: /api/ollama/version, /api/ollama/tags, /api/ollama/generate, /api/health',
  });
});

// Vite middleware integration
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TerraMind server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
