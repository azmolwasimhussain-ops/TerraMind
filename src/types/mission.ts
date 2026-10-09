export type EnergyLevel = 'Low' | 'Medium' | 'High';

export type NatureInterest =
  | 'Birdwatching'
  | 'Photography'
  | 'Mindfulness'
  | 'Hiking'
  | 'Gardening'
  | 'Stargazing'
  | 'Water'
  | 'Insects'
  | 'Trees'
  | 'Clouds'
  | 'Sketching'
  | 'Running'
  | 'Foraging';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface MissionInstructionStep {
  stepNumber: number;
  phase: string; // e.g. "Preparation & Grounding", "Slow Discovery Walk", "Deep Observation", "Reflection"
  instruction: string;
}

export interface SensoryPrompts {
  sight?: string;
  sound?: string;
  touch?: string;
  smell?: string;
}

export interface OutdoorMission {
  id: string;
  title: string;
  purpose?: string;
  description: string;
  personalizedIntro?: string;
  durationMinutes: number;
  energyLevel: EnergyLevel;
  interests: NatureInterest[];
  locationHint?: string;
  instructions: MissionInstructionStep[];
  sensoryPrompts?: SensoryPrompts;
  fieldNotesPrompt?: string;
  safetyTips: string[];
  equipment: string[];
  checklist: ChecklistItem[];
  status: 'not_started' | 'in_progress' | 'completed';
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  source: 'ollama' | 'heuristic_engine';
  modelUsed?: string;
  notes?: string;
}

export interface MissionGeneratorParams {
  durationMinutes: number;
  energyLevel: EnergyLevel;
  interests: NatureInterest[];
  locationHint?: string;
}
