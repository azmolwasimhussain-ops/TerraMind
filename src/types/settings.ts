export type OllamaConnectionMode = 'proxy' | 'direct' | 'offline_demo';

export interface OllamaModelInfo {
  name: string;
  model?: string;
  modified_at?: string;
  size?: number;
  digest?: string;
}

export interface AppSettings {
  displayName: string;
  ollamaBaseUrl: string; // e.g. "http://localhost:11434"
  ollamaModel: string; // e.g. "llama3.2"
  connectionMode: OllamaConnectionMode;
  prefersReducedMotion: boolean;
  screenFreeVoiceChime: boolean;
  lastConnectedAt?: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  displayName: '',
  ollamaBaseUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  connectionMode: 'proxy',
  prefersReducedMotion: false,
  screenFreeVoiceChime: true,
};

/**
 * Returns environment-aware default settings:
 * In local dev -> 'proxy' mode targeting http://localhost:11434.
 * In cloud deployment (Vercel) -> 'offline_demo' mode (Offline Botanical Engine)
 * so cloud users immediately have a functioning, zero-error experience.
 */
export function getDefaultSettings(): AppSettings {
  const isCloud =
    typeof window !== 'undefined'
      ? window.location.hostname !== 'localhost' &&
        window.location.hostname !== '127.0.0.1' &&
        window.location.hostname !== '0.0.0.0' &&
        window.location.hostname !== '[::1]' &&
        !window.location.hostname.endsWith('.local')
      : process.env.VERCEL === '1' ||
        process.env.NODE_ENV === 'production' ||
        !!process.env.K_SERVICE;

  return {
    ...DEFAULT_SETTINGS,
    connectionMode: isCloud ? 'offline_demo' : 'proxy',
  };
}
