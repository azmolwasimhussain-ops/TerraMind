import { MissionGeneratorParams, OutdoorMission } from '../types/mission';
import { AppSettings } from '../types/settings';
import {
  generateMissionWithOllama,
  fetchOllamaModels,
  matchesModelName,
  resolveActualModelName,
  OllamaError,
} from './ollamaClient';
import { generateHeuristicMission } from './botanicalEngine';

export interface GenerationResult {
  mission: OutdoorMission;
  source: 'ollama' | 'heuristic_engine';
  modelUsed: string;
}

/**
 * Generate a mission based on user settings and parameters.
 * If fallbackToHeuristic is true (user explicitly chose to fall back upon error),
 * it returns a heuristic mission with transparent provenance.
 */
export async function generateMission(
  params: MissionGeneratorParams,
  settings: AppSettings,
  forceHeuristic: boolean = false
): Promise<GenerationResult> {
  // If user configured offline mode or specifically requested heuristic generator
  if (forceHeuristic || settings.connectionMode === 'offline_demo') {
    const mission = generateHeuristicMission(params);
    return {
      mission,
      source: 'heuristic_engine',
      modelUsed: 'Offline Botanical Heuristic Engine v2.4 (Rule-Based)',
    };
  }

  // Determine actual model name from Ollama tags if available
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
        // Model is not among installed models
        const availableNames = installed.map((m) => m.name || m.model).filter(Boolean).join(', ');
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
    // If tags check failed (e.g. network error / daemon offline), proceed to generate call
    // which will produce the proper UNREACHABLE diagnostic.
  }

  // Otherwise, use genuine local Ollama with resolved actual model name
  try {
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
  } catch (err) {
    // Re-throw so the UI can accurately present the error and offer offline fallback
    throw err;
  }
}
