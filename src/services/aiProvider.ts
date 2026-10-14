import { MissionGeneratorParams, OutdoorMission } from '../types/mission';
import { AppSettings } from '../types/settings';
import {
  generateMissionWithOllama,
  fetchOllamaModels,
  matchesModelName,
  OllamaError,
} from './ollamaClient';
import { generateHeuristicMission } from './botanicalEngine';
import { shouldAutoFallbackToOffline } from './environment';

export interface GenerationResult {
  mission: OutdoorMission;
  source: 'ollama' | 'heuristic_engine';
  modelUsed: string;
}

/**
 * Generate a mission based on user settings and parameters.
 *
 * Priority order:
 *  1. forceHeuristic === true OR settings.connectionMode === 'offline_demo'
 *     → Offline Botanical Engine immediately.
 *  2. Cloud deployment + localhost Ollama URL (default / unconfigured):
 *     → If forceHeuristic is undefined, auto-fallback to Offline Botanical Engine immediately.
 *     → If user explicitly requested Ollama (forceHeuristic === false) on cloud with localhost,
 *       throw an informative OllamaError with clear explanation and action items.
 *  3. Local development or cloud with public tunnel URL:
 *     → Verify installed models via /api/tags and generate with real Ollama.
 */
export async function generateMission(
  params: MissionGeneratorParams,
  settings: AppSettings,
  forceHeuristic?: boolean
): Promise<GenerationResult> {
  // --- Priority 1: Explicitly offline mode ---
  if (forceHeuristic === true || settings.connectionMode === 'offline_demo') {
    const mission = generateHeuristicMission(params);
    return {
      mission,
      source: 'heuristic_engine',
      modelUsed: 'Offline Botanical Heuristic Engine v2.4 (Rule-Based)',
    };
  }

  // --- Priority 2: Cloud deployment with localhost URL ---
  if (shouldAutoFallbackToOffline(settings.ollamaBaseUrl)) {
    // When forceHeuristic is undefined (default generation in cloud): auto-fallback seamlessly
    if (forceHeuristic === undefined) {
      const mission = generateHeuristicMission(params);
      return {
        mission,
        source: 'heuristic_engine',
        modelUsed: 'Offline Botanical Heuristic Engine v2.4 (Cloud Auto-Fallback)',
      };
    }

    // When user explicitly switched to Ollama (forceHeuristic === false) while targeting localhost:
    // Inform them clearly instead of failing with an unexpected HTTP 405 error
    throw new OllamaError(
      'Cloud deployment cannot connect directly to Ollama at localhost:11434.',
      'UNREACHABLE',
      'In cloud deployments (like Vercel), localhost points to the cloud host, not your computer. To use Ollama from the cloud, configure a public tunnel URL (e.g. ngrok http 11434) in Settings, or use the built-in Offline Botanical Engine.'
    );
  }

  // --- Priority 3: Real Ollama (local dev or user-supplied public URL) ---

  // Resolve actual installed model name from /api/tags
  let effectiveModel = settings.ollamaModel;
  try {
    const installed = await fetchOllamaModels(
      settings.ollamaBaseUrl,
      settings.connectionMode
    );

    if (installed && installed.length > 0) {
      const match = installed.find((m) =>
        matchesModelName(settings.ollamaModel, m.name || m.model || '')
      );

      if (match) {
        effectiveModel = match.name || match.model || settings.ollamaModel;
      } else {
        const availableNames = installed
          .map((m) => m.name || m.model)
          .filter(Boolean)
          .join(', ');
        throw new OllamaError(
          `Model "${settings.ollamaModel}" not found in Ollama library.`,
          'MODEL_NOT_FOUND',
          `Run \`ollama pull ${settings.ollamaModel}\` in your terminal to download this model, or choose an installed model (${availableNames}) in Settings.`
        );
      }
    }
  } catch (err) {
    if (err instanceof OllamaError) {
      throw err;
    }
    // Tags check failed (network/daemon offline) — proceed; generate call will surface the real error.
  }

  // Generate via Ollama
  const mission = await generateMissionWithOllama(
    params,
    settings.ollamaBaseUrl,
    effectiveModel,
    settings.connectionMode
  );

  return {
    mission,
    source: 'ollama',
    modelUsed: mission.modelUsed || `Ollama (${effectiveModel})`,
  };
}
