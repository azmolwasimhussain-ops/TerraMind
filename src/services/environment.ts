export interface AppEnvironment {
  isCloudPreview: boolean;
  isCloudDeployment: boolean;
  hostname: string;
  isLocalhost: boolean;
  canDirectAccessLocalhost: boolean;
}

/**
 * Detect runtime execution environment (Localhost vs Cloud / Vercel deployment)
 */
export function getAppEnvironment(): AppEnvironment {
  if (typeof window === 'undefined') {
    const isCloud =
      process.env.VERCEL === '1' ||
      process.env.NODE_ENV === 'production' ||
      !!process.env.K_SERVICE;
    return {
      isCloudPreview: isCloud,
      isCloudDeployment: isCloud,
      hostname: 'server',
      isLocalhost: !isCloud,
      canDirectAccessLocalhost: false,
    };
  }

  const hostname = window.location.hostname || '';
  const isLocalhost =
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '[::1]' ||
    hostname === '::1' ||
    hostname.endsWith('.local');

  const isHttps = window.location.protocol === 'https:';

  return {
    isCloudPreview: !isLocalhost,
    isCloudDeployment: !isLocalhost,
    hostname,
    isLocalhost,
    // Browsers block HTTPS -> HTTP localhost fetch due to Mixed Content & Private Network Access
    canDirectAccessLocalhost: isLocalhost || !isHttps,
  };
}

/**
 * Returns true if the given Ollama URL points to localhost / 127.0.0.1 / loopback.
 * Used to detect "user configured local Ollama URL (http://localhost:11434) but app is running in the cloud."
 */
export function isLocalhostUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const lower = url.trim().toLowerCase();
  return (
    lower === '' ||
    lower.includes('localhost') ||
    lower.includes('127.0.0.1') ||
    lower.includes('0.0.0.0') ||
    lower.includes('[::1]') ||
    lower.includes('::1')
  );
}

/**
 * Returns true if the URL is a usable public remote endpoint for cloud deployments
 * (e.g. an ngrok tunnel, cloudflare tunnel, or remote VPS host with valid http/https).
 */
export function isUsableCloudOllamaUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const cleaned = url.trim();
  if (!cleaned) return false;
  if (!/^https?:\/\//i.test(cleaned)) return false;
  return !isLocalhostUrl(cleaned);
}

/**
 * Returns true when the app is running in a cloud deployment AND the
 * configured Ollama URL points to localhost — meaning Ollama is unreachable.
 *
 * In this case the app automatically uses the Offline Botanical Engine
 * without attempting any doomed Ollama connection (which fails with HTTP 405 on Vercel).
 * The user can override this by providing a public ngrok/tunnel URL in Settings.
 */
export function shouldAutoFallbackToOffline(
  ollamaBaseUrl?: string | null,
  customEnv?: AppEnvironment
): boolean {
  const env = customEnv || getAppEnvironment();
  // If running locally, localhost:11434 is reachable!
  if (env.isLocalhost) return false;

  // In cloud deployments, localhost:11434 points to the cloud host, not the user's laptop.
  // Unless user supplied a reachable public tunnel URL, auto-fallback to offline botanical engine.
  return !isUsableCloudOllamaUrl(ollamaBaseUrl);
}

/**
 * Normalize an Ollama base URL to ensure valid protocol and strip duplicated/trailing path segments.
 */
export function normalizeOllamaUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'http://127.0.0.1:11434';
  }

  let cleaned = rawUrl.trim();
  if (!cleaned) return 'http://127.0.0.1:11434';

  // Add default protocol if omitted
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = `http://${cleaned}`;
  }

  // Strip trailing slashes
  cleaned = cleaned.replace(/\/+$/, '');

  // Strip trailing /api or /api/ so appending /api/... never produces /api/api/...
  cleaned = cleaned.replace(/\/api$/, '');

  return cleaned.replace(/\/+$/, '');
}
