import { MissionGeneratorParams, OutdoorMission } from '../types/mission';
import { AppSettings } from '../types/settings';
import { generateMissionWithOllama, OllamaError } from './ollamaClient';
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

  // Otherwise, use genuine local Ollama
  try {
    const mission = await generateMissionWithOllama(
      params,
      settings.ollamaBaseUrl,
      settings.ollamaModel,
      settings.connectionMode
    );

    return {
      mission,
      source: 'ollama',
      modelUsed: `Ollama (${settings.ollamaModel})`,
    };
  } catch (err) {
    // Re-throw so the UI can accurately present the error and ask user if they want offline fallback
    throw err;
  }
}
