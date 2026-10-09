export interface AppEnvironment {
  isCloudPreview: boolean;
  hostname: string;
  isLocalhost: boolean;
  canDirectAccessLocalhost: boolean;
}

/**
 * Detect runtime execution environment (Localhost vs Google AI Studio Cloud Run Preview)
 */
export function getAppEnvironment(): AppEnvironment {
  if (typeof window === 'undefined') {
    return {
      isCloudPreview: process.env.NODE_ENV === 'production' || !!process.env.K_SERVICE,
      hostname: 'server',
      isLocalhost: false,
      canDirectAccessLocalhost: false,
    };
  }

  const hostname = window.location.hostname;
  const isLocalhost =
    hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0';
  const isHttps = window.location.protocol === 'https:';

  return {
    isCloudPreview: !isLocalhost,
    hostname,
    isLocalhost,
    // Browsers block HTTPS -> HTTP localhost fetch due to Mixed Content & Private Network Access
    canDirectAccessLocalhost: isLocalhost || !isHttps,
  };
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
