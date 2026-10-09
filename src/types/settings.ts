export type OllamaConnectionMode = 'proxy' | 'direct' | 'offline_demo';

export interface OllamaModelInfo {
  name: string;
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
