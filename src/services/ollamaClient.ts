import { MissionGeneratorParams, OutdoorMission, EnergyLevel } from '../types/mission';
import { OllamaConnectionMode, OllamaModelInfo } from '../types/settings';
import { normalizeOllamaUrl } from './environment';

export interface OllamaTestResult {
  ok: boolean;
  version?: string;
  error?: string;
  hint?: string;
  latencyMs?: number;
  models?: OllamaModelInfo[];
}

export class OllamaError extends Error {
  code: 'UNREACHABLE' | 'MODEL_NOT_FOUND' | 'TIMEOUT' | 'INVALID_JSON' | 'UNKNOWN';
  hint?: string;
  preview?: string;

  constructor(
    message: string,
    code: 'UNREACHABLE' | 'MODEL_NOT_FOUND' | 'TIMEOUT' | 'INVALID_JSON' | 'UNKNOWN',
    hint?: string,
    preview?: string
  ) {
    super(message);
    this.name = 'OllamaError';
    this.code = code;
    this.hint = hint;
    this.preview = preview;
  }
}

export interface SafeFetchResult<T> {
  ok: boolean;
  status: number;
  contentType: string;
  data?: T;
  rawText?: string;
}

/**
 * Robust fetch utility that checks Content-Type before parsing JSON.
 * Avoids SyntaxError: Unexpected token '<' on HTML responses.
 */
export async function safeFetchJson<T = any>(
  url: string,
  options: RequestInit,
  diagnosticLabel: string = 'API'
): Promise<SafeFetchResult<T>> {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') ?? '';

  if (!contentType.includes('application/json')) {
    const rawText = await response.text();
    return {
      ok: false,
      status: response.status,
      contentType,
      rawText,
    };
  }

  try {
    const data = (await response.json()) as T;
    return {
      ok: response.ok,
      status: response.status,
      contentType,
      data,
    };
  } catch (err: any) {
    return {
      ok: false,
      status: response.status,
      contentType,
      rawText: `JSON parse error on ${diagnosticLabel}: ${err.message}`,
    };
  }
}

/**
 * Test connectivity to Ollama (via server proxy or direct browser fetch)
 */
export async function testOllamaConnection(
  baseUrl: string = 'http://localhost:11434',
  mode: OllamaConnectionMode = 'proxy'
): Promise<OllamaTestResult> {
  const cleanUrl = normalizeOllamaUrl(baseUrl);
  const startTime = performance.now();

  if (mode === 'offline_demo') {
    return {
      ok: true,
      version: 'Offline Botanical Engine (Active)',
      latencyMs: 1,
      models: [{ name: 'offline-botanical-heuristic-v2.4' }],
      hint: 'Running in offline mode. No local Ollama daemon connection required.',
    };
  }

  try {
    const targetApi =
      mode === 'proxy'
        ? `/api/ollama/version?url=${encodeURIComponent(cleanUrl)}`
        : `${cleanUrl}/api/version`;

    const headers: Record<string, string> = {};
    if (mode === 'proxy') {
      headers['x-ollama-url'] = cleanUrl;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const result = await safeFetchJson<{
      ok?: boolean;
      version?: string;
      error?: string;
      hint?: string;
      status?: string;
      code?: string;
    }>(
      targetApi,
      {
        method: 'GET',
        headers,
        signal: controller.signal,
      },
      `Ollama version check (${mode})`
    );
    clearTimeout(timeout);

    const latencyMs = Math.round(performance.now() - startTime);

    if (!result.contentType.includes('application/json')) {
      const preview = (result.rawText || '').slice(0, 150);
      return {
        ok: false,
        error: `Expected JSON but received HTTP ${result.status}. Response preview: ${preview}`,
        hint: 'The configured URL returned an HTML webpage instead of Ollama JSON. Check your settings.',
        latencyMs,
      };
    }

    if (!result.ok) {
      return {
        ok: false,
        error: result.data?.error || `Server returned HTTP ${result.status}`,
        hint: result.data?.hint || 'Ensure Ollama is running (`ollama serve`) and accessible.',
        latencyMs,
      };
    }

    return {
      ok: true,
      version: result.data?.version || 'connected',
      latencyMs,
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - startTime);
    const isTimeout = err.name === 'AbortError';

    let hint = 'Make sure Ollama is running (`ollama serve`).';
    if (mode === 'direct') {
      hint = 'Browser security (CORS/Mixed Content) may block direct localhost fetch from HTTPS. Switch to Server Proxy mode, or use the Offline Botanical Engine.';
    }

    return {
      ok: false,
      error: isTimeout ? 'Connection timed out' : (err.message || 'Unable to connect to Ollama'),
      hint,
      latencyMs,
    };
  }
}

/**
 * Fetch list of installed models from Ollama
 */
export async function fetchOllamaModels(
  baseUrl: string = 'http://localhost:11434',
  mode: OllamaConnectionMode = 'proxy'
): Promise<OllamaModelInfo[]> {
  if (mode === 'offline_demo') {
    return [{ name: 'offline-botanical-heuristic-v2.4' }];
  }

  try {
    const cleanUrl = normalizeOllamaUrl(baseUrl);
    const targetApi =
      mode === 'proxy'
        ? `/api/ollama/tags?url=${encodeURIComponent(cleanUrl)}`
        : `${cleanUrl}/api/tags`;

    const headers: Record<string, string> = {};
    if (mode === 'proxy') {
      headers['x-ollama-url'] = cleanUrl;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const result = await safeFetchJson<{ ok?: boolean; models?: OllamaModelInfo[]; error?: string }>(
      targetApi,
      {
        method: 'GET',
        headers,
        signal: controller.signal,
      },
      `Ollama tags check (${mode})`
    );
    clearTimeout(timeout);

    if (!result.contentType.includes('application/json') || !result.ok || !result.data) {
      return [];
    }

    return result.data.models || [];
  } catch (err) {
    console.warn('Failed to fetch Ollama models:', err);
    return [];
  }
}

/**
 * Generate structured mission using Ollama /api/generate or /api/chat
 */
export async function generateMissionWithOllama(
  params: MissionGeneratorParams,
  baseUrl: string = 'http://localhost:11434',
  model: string = 'llama3.2',
  mode: OllamaConnectionMode = 'proxy'
): Promise<OutdoorMission> {
  const systemPrompt = `You are TerraMind, a naturalist and mindful outdoor companion created for the Hacktoberfest 'Touch Grass' challenge. Your mission is to disconnect users from digital screens and reconnect them with the living earth. You design safe, tactile, sensory-rich outdoor expeditions. You MUST respond ONLY with a single valid JSON object, without any prose, markdown wrapping or conversational commentary.`;

  const userPrompt = `Generate a structured nature exploration mission:
Time Available: ${params.durationMinutes} minutes
Energy Level: ${params.energyLevel}
Interests: ${params.interests.join(', ')}
Location Setting: ${params.locationHint || 'Local public park, yard, or nature trail'}

You must return valid JSON with this exact structure:
{
  "title": "Evocative, inspiring title",
  "description": "Short description of the outdoor focus (1-2 sentences)",
  "durationMinutes": ${params.durationMinutes},
  "energyLevel": "${params.energyLevel}",
  "instructions": [
    { "stepNumber": 1, "phase": "Preparation & Grounding", "instruction": "Clear outdoor instructions..." },
    { "stepNumber": 2, "phase": "Slow Discovery Walk", "instruction": "..." },
    { "stepNumber": 3, "phase": "Deep Observation & Sensory Study", "instruction": "..." }
  ],
  "safetyTips": ["Safety tip 1", "Safety tip 2"],
  "equipment": ["Equipment or preparation item 1", "Equipment item 2"],
  "checklist": [
    "Specific sensory element to find",
    "Concrete observation task to complete",
    "Mindful discovery item"
  ]
}`;

  let rawResponseText = '';
  const cleanUrl = normalizeOllamaUrl(baseUrl);

  const apiUrl = mode === 'proxy' ? '/api/ollama/generate' : `${cleanUrl}/api/generate`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (mode === 'proxy') {
    headers['x-ollama-url'] = cleanUrl;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s for local LLM inference

  let fetchResult: SafeFetchResult<any>;
  try {
    fetchResult = await safeFetchJson(
      apiUrl,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model,
          prompt: userPrompt,
          system: systemPrompt,
          stream: false,
          format: 'json',
          options: { temperature: 0.65 },
        }),
        signal: controller.signal,
      },
      `Ollama generate (${mode})`
    );
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new OllamaError('Ollama request timed out after 60 seconds.', 'TIMEOUT');
    }
    throw new OllamaError(
      err.message || 'Unable to connect to Ollama server.',
      'UNREACHABLE',
      'Check if Ollama is running with `ollama serve` or use the built-in Offline Botanical Engine.'
    );
  } finally {
    clearTimeout(timeout);
  }

  // 1. Guard against HTML or non-JSON responses (Prevents "Unexpected token '<'")
  if (!fetchResult.contentType.includes('application/json')) {
    const preview = (fetchResult.rawText || '').slice(0, 200);
    throw new OllamaError(
      `Expected JSON but received HTTP ${fetchResult.status}. Check the API endpoint and server logs. Response preview: ${preview}`,
      'UNREACHABLE',
      'The API endpoint returned a webpage instead of JSON. Verify the server proxy or Ollama base URL.',
      preview
    );
  }

  // 2. Handle HTTP errors
  if (!fetchResult.ok) {
    const errData = fetchResult.data || {};
    const errorMsg = errData.error || `Request failed with HTTP ${fetchResult.status}`;

    if (fetchResult.status === 404 || errData.code === 'MODEL_NOT_FOUND' || errorMsg.toLowerCase().includes('not found')) {
      throw new OllamaError(
        `Model "${model}" not found in Ollama library.`,
        'MODEL_NOT_FOUND',
        `Run \`ollama pull ${model}\` in your terminal to download the weights, or select an available model in Settings.`
      );
    }

    if (errData.code === 'TIMEOUT') {
      throw new OllamaError(errorMsg, 'TIMEOUT', 'The model took too long to generate. Try a smaller model or fewer minutes.');
    }

    throw new OllamaError(
      errorMsg,
      'UNREACHABLE',
      errData.hint || 'Verify your Ollama server is running and accessible.'
    );
  }

  const data = fetchResult.data;
  rawResponseText = data?.response || '';
  if (!rawResponseText) {
    throw new OllamaError('Ollama returned empty response', 'INVALID_JSON');
  }

  // Parse and validate the response
  try {
    // Strip markdown code block fences if present and find outermost JSON
    let cleaned = rawResponseText.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.replace(/^```json/, '').replace(/```$/, '').trim();
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```/, '').replace(/```$/, '').trim();
    }

    // Attempt to locate JSON object substring if model included leading/trailing commentary
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    // Try parsing; if it fails, attempt common repairs (strip trailing commas)
    let parsed: any;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Repair trailing commas before } or ]
      const repaired = cleaned
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u0000-\u001F]+/g, ' ');
      parsed = JSON.parse(repaired);
    }

    // Validate required fields
    if (!parsed.title || !parsed.description) {
      throw new Error('Missing title or description in Ollama response');
    }

    const instructions = Array.isArray(parsed.instructions)
      ? parsed.instructions.map((step: any, idx: number) => ({
          stepNumber: typeof step.stepNumber === 'number' ? step.stepNumber : idx + 1,
          phase: step.phase || `Phase ${idx + 1}`,
          instruction: step.instruction || String(step),
        }))
      : [
          {
            stepNumber: 1,
            phase: 'Exploration',
            instruction: 'Step outdoors, put your device away, and explore quietly.',
          },
        ];

    const checklist = Array.isArray(parsed.checklist)
      ? parsed.checklist.map((item: any, idx: number) => ({
          id: `check_${Date.now()}_${idx}`,
          text: typeof item === 'string' ? item : item.text || 'Observe natural habitat feature',
          completed: false,
        }))
      : [
          { id: `check_${Date.now()}_0`, text: 'Disconnect from screens for the duration', completed: false },
          { id: `check_${Date.now()}_1`, text: 'Spot 3 wild plants or animals', completed: false },
        ];

    const safetyTips = Array.isArray(parsed.safetyTips) && parsed.safetyTips.length > 0
      ? parsed.safetyTips
      : ['Stay aware of weather shifts', 'Practice Leave No Trace principles'];

    const equipment = Array.isArray(parsed.equipment) && parsed.equipment.length > 0
      ? parsed.equipment
      : ['Comfortable walking shoes', 'Drinking water', 'Field notebook (optional)'];

    // Extract sensory prompts or synthesize sensible naturalist prompts
    const sensoryPrompts = parsed.sensoryPrompts && typeof parsed.sensoryPrompts === 'object'
      ? {
          sight: parsed.sensoryPrompts.sight || 'Look for subtle light patterns and leaf venation.',
          sound: parsed.sensoryPrompts.sound || 'Listen for bird vocalizations and canopy wind.',
          touch: parsed.sensoryPrompts.touch || 'Touch dry stone or tree bark mindfully.',
          smell: parsed.sensoryPrompts.smell || 'Inhale the aroma of moist earth and living plants.',
        }
      : {
          sight: 'Notice subtle gradients of sunlight, moss cushions, and branch architecture.',
          sound: 'Close your eyes for 60 seconds; isolate distant ambient wind from nearby leaves.',
          touch: 'Gently feel two contrasting surfaces (e.g. rough tree bark vs smooth pebble).',
          smell: 'Breathe in the damp earthy scent of soil or resinous conifer needles.',
        };

    const fieldNotesPrompt =
      parsed.fieldNotesPrompt ||
      'When you return, jot down the most surprising outdoor discovery in your private field notebook.';

    return {
      id: `mission_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: parsed.title,
      purpose: parsed.purpose || `To explore nature screen-free for ${params.durationMinutes} minutes.`,
      description: parsed.description,
      personalizedIntro: parsed.personalizedIntro || 'Step outdoors, breathe deeply, and allow your senses to tune into the living landscape.',
      durationMinutes: typeof parsed.durationMinutes === 'number' ? parsed.durationMinutes : params.durationMinutes,
      energyLevel: (parsed.energyLevel as EnergyLevel) || params.energyLevel,
      interests: params.interests,
      locationHint: params.locationHint,
      instructions,
      sensoryPrompts,
      fieldNotesPrompt,
      safetyTips,
      equipment,
      checklist,
      status: 'not_started',
      createdAt: new Date().toISOString(),
      source: 'ollama',
      modelUsed: `Ollama (${model})`,
    };
  } catch (parseErr: any) {
    console.error('Failed to parse Ollama JSON:', rawResponseText);
    throw new OllamaError(
      `Ollama returned invalid JSON response: ${parseErr.message}`,
      'INVALID_JSON',
      'The local model produced an unparseable response. You can retry or switch to Offline Heuristic mode.',
      rawResponseText.slice(0, 150)
    );
  }
}
