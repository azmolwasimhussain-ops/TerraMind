import React, { useState } from 'react';
import {
  Clock,
  Compass,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  MapPin,
  RefreshCw,
  Eye,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Info,
  Globe,
  Zap,
} from 'lucide-react';
import {
  EnergyLevel,
  NatureInterest,
  MissionGeneratorParams,
  OutdoorMission,
} from '../types/mission';
import { AppSettings } from '../types/settings';
import { generateMission } from '../services/aiProvider';
import { saveMission } from '../db/indexedDb';
import { OllamaError } from '../services/ollamaClient';
import { getAppEnvironment } from '../services/environment';

const AVAILABLE_INTERESTS: { id: NatureInterest; label: string; icon: string }[] = [
  { id: 'Birdwatching', label: 'Birdwatching', icon: '🪶' },
  { id: 'Trees', label: 'Trees & Canopy', icon: '🌲' },
  { id: 'Mindfulness', label: 'Mindfulness & Grounding', icon: '🧘' },
  { id: 'Photography', label: 'Photography & Macro', icon: '📷' },
  { id: 'Water', label: 'Water & Streams', icon: '💧' },
  { id: 'Insects', label: 'Insects & Pollinators', icon: '🐝' },
  { id: 'Hiking', label: 'Hiking & Trails', icon: '🥾' },
  { id: 'Gardening', label: 'Gardening & Flora', icon: '🌱' },
  { id: 'Clouds', label: 'Clouds & Atmosphere', icon: '☁️' },
  { id: 'Sketching', label: 'Sketching & Field Notes', icon: '✏️' },
  { id: 'Stargazing', label: 'Stargazing & Twilight', icon: '✨' },
  { id: 'Running', label: 'Trail Movement & Pace', icon: '🏃' },
  { id: 'Foraging', label: 'Wild Plant Foraging Study', icon: '🍄' },
];

const TIME_PRESETS = [15, 30, 45, 60, 90, 120];

interface GeneratorPageProps {
  settings: AppSettings;
  onMissionSelected: (mission: OutdoorMission) => void;
  onNavigate: (route: string) => void;
}

export const GeneratorPage: React.FC<GeneratorPageProps> = ({
  settings,
  onMissionSelected,
  onNavigate,
}) => {
  const env = getAppEnvironment();

  // Generator State
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('Medium');
  const [selectedInterests, setSelectedInterests] = useState<NatureInterest[]>([
    'Trees',
    'Mindfulness',
  ]);
  const [locationHint, setLocationHint] = useState<string>('');
  const [useOfflineEngineOverride, setUseOfflineEngineOverride] = useState<boolean>(
    settings.connectionMode === 'offline_demo'
  );

  // Status State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<{
    message: string;
    hint?: string;
    code?: string;
    preview?: string;
  } | null>(null);
  const [generatedMission, setGeneratedMission] = useState<OutdoorMission | null>(null);

  const toggleInterest = (interest: NatureInterest) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((i) => i !== interest);
      } else {
        if (prev.length >= 4) {
          // Keep max 4 to ensure focused generation
          return [...prev.slice(1), interest];
        }
        return [...prev, interest];
      }
    });
  };

  const handleGenerate = async (forceHeuristic: boolean = false) => {
    setError(null);
    setIsLoading(true);

    const params: MissionGeneratorParams = {
      durationMinutes,
      energyLevel,
      interests: selectedInterests,
      locationHint: locationHint.trim() || undefined,
    };

    try {
      const result = await generateMission(
        params,
        settings,
        forceHeuristic || useOfflineEngineOverride
      );

      // Persist immediately in IndexedDB
      await saveMission(result.mission);
      setGeneratedMission(result.mission);
    } catch (err: any) {
      console.error('Mission generation failed:', err);
      if (err instanceof OllamaError) {
        setError({
          message: err.message,
          hint: err.hint,
          code: err.code,
          preview: err.preview,
        });
      } else {
        setError({
          message: err.message || 'An unexpected error occurred while generating the mission.',
          hint: 'You can generate immediately with our built-in Offline Botanical Engine.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartDistractionFree = () => {
    if (generatedMission) {
      onMissionSelected(generatedMission);
    }
  };

  const isLocalhostTarget =
    settings.ollamaBaseUrl.includes('localhost') || settings.ollamaBaseUrl.includes('127.0.0.1');

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Page Header */}
      <div className="mb-8 space-y-3">
        <div className="flex items-center gap-2 text-xs font-medium text-[#1b5e46]">
          <Compass className="h-4 w-4" />
          <span>Mission Generator · Step 1</span>
        </div>
        <h1 className="font-serif-nature text-3xl sm:text-4xl font-bold tracking-tight text-[#0f291e]">
          Craft Your Outdoor Mission
        </h1>
        <p className="text-xs sm:text-sm text-[#4c6b5d] max-w-2xl leading-relaxed">
          Define your available minutes, physical energy, and nature curiosities. TerraMind designs a structured, distraction-free outdoor study.
        </p>
      </div>

      {/* Engine Switcher Bar */}
      <div className="mb-8 rounded-2xl border border-[#dce7e1] bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[#eef6f1] border border-[#bcdbc8] flex items-center justify-center text-[#1b5e46] shrink-0">
            {useOfflineEngineOverride ? <Zap className="h-4 w-4" /> : <Cpu className="h-4 w-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#0f291e]">
                {useOfflineEngineOverride
                  ? 'Offline Botanical Engine Active'
                  : `Local Ollama AI Active (${settings.ollamaModel})`}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  useOfflineEngineOverride
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-stone-100 text-stone-700'
                }`}
              >
                {useOfflineEngineOverride ? '100% Offline' : 'Local LLM'}
              </span>
            </div>
            <p className="text-[11px] text-[#5c806f]">
              {useOfflineEngineOverride
                ? 'Instant rule-based naturalist generator. Requires zero daemons or connections.'
                : env.isCloudPreview && isLocalhostTarget
                ? 'Cloud preview detected: localhost:11434 points to this cloud instance, not your Mac.'
                : `Targeting ${settings.ollamaBaseUrl}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setError(null);
            setUseOfflineEngineOverride(!useOfflineEngineOverride);
          }}
          className="text-xs px-3.5 py-1.5 rounded-lg border border-[#bcdbc8] bg-[#eef6f1] text-[#1b5e46] font-semibold hover:bg-[#dff0e6] transition self-start sm:self-auto"
        >
          {useOfflineEngineOverride ? 'Switch to Ollama AI' : 'Switch to Offline Engine'}
        </button>
      </div>

      {/* Form & Result Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Controls (lg:col-span-7) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#dce7e1] bg-white p-6 sm:p-8 space-y-6 shadow-sm">
          {/* Input 1: Duration Slider */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label htmlFor="duration-slider" className="text-sm font-semibold text-[#0f291e] flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#1b5e46]" />
                Expedition Duration
              </label>
              <span className="font-mono text-sm font-semibold text-[#1b5e46] bg-[#eef6f1] px-2.5 py-1 rounded-md border border-[#bcdbc8]">
                {durationMinutes} minutes
              </span>
            </div>

            <input
              id="duration-slider"
              type="range"
              min="10"
              max="180"
              step="5"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10))}
              className="w-full accent-[#1b5e46] cursor-pointer h-2 bg-[#e2ede5] rounded-lg"
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 pt-1">
              {TIME_PRESETS.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setDurationMinutes(minutes)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                    durationMinutes === minutes
                      ? 'bg-[#1b5e46] text-white font-semibold'
                      : 'bg-[#f0f5f2] text-[#426353] hover:bg-[#e4ede7] hover:text-[#0f291e]'
                  }`}
                >
                  {minutes < 60 ? `${minutes}m` : `${minutes / 60}h`}
                </button>
              ))}
            </div>
          </div>

          {/* Input 2: Energy Level */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-[#0f291e] flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#1b5e46]" />
              Energy & Pace
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['Low', 'Medium', 'High'] as EnergyLevel[]).map((level) => {
                const isSelected = energyLevel === level;
                return (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setEnergyLevel(level)}
                    className={`flex flex-col p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'border-emerald-600 bg-[#eef6f1] text-[#0f291e] shadow-sm'
                        : 'border-[#dce7e1] bg-[#fbfdfb] text-[#557667] hover:border-[#b8ddcb] hover:text-[#0f291e]'
                    }`}
                  >
                    <span className="text-sm font-semibold text-[#0f291e]">{level}</span>
                    <span className="text-[11px] text-[#5a7b6c] mt-1 leading-tight">
                      {level === 'Low'
                        ? 'Gentle sit & grounding'
                        : level === 'Medium'
                        ? 'Paced walk & scan'
                        : 'Active hike & elevation'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input 3: Nature Interests */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-[#0f291e] flex items-center gap-2">
                <Compass className="h-4 w-4 text-[#1b5e46]" />
                Interests & Focus (Select 1 to 4)
              </label>
              <span className="text-xs text-[#5a7b6c]">
                {selectedInterests.length} selected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AVAILABLE_INTERESTS.map((interest) => {
                const isSelected = selectedInterests.includes(interest.id);
                return (
                  <button
                    key={interest.id}
                    type="button"
                    onClick={() => toggleInterest(interest.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-medium transition text-left ${
                      isSelected
                        ? 'border-emerald-600 bg-[#eef6f1] text-[#1b5e46] font-semibold shadow-sm'
                        : 'border-[#dce7e1] bg-[#fbfdfb] text-[#4d6d5e] hover:border-[#b8ddcb] hover:text-[#0f291e]'
                    }`}
                  >
                    <span aria-hidden="true">{interest.icon}</span>
                    <span className="truncate">{interest.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input 4: Optional Location Hint */}
          <div className="space-y-2">
            <label htmlFor="location-input" className="text-sm font-semibold text-[#0f291e] flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[#1b5e46]" />
              Optional Location Setting
            </label>
            <input
              id="location-input"
              type="text"
              placeholder="e.g. Backyard garden, lake loop, city park, oak grove, balcony"
              value={locationHint}
              onChange={(e) => setLocationHint(e.target.value)}
              className="w-full rounded-lg border border-[#d0e0d6] bg-white px-3.5 py-2.5 text-sm text-[#0f291e] placeholder-[#8ea89a] focus:border-emerald-600 focus:outline-none"
            />
            <p className="text-[11px] text-[#5f7f70]">
              Leave blank to receive an adaptable mission suitable for any outdoor setting.
            </p>
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              onClick={() => handleGenerate(false)}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1b5e46] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#134835] transition disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-emerald-100" />
                  <span>Synthesizing Outdoor Mission...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>
                    {useOfflineEngineOverride
                      ? 'Generate with Offline Botanical Engine'
                      : 'Generate Outdoor Mission'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Results & Previews (lg:col-span-5) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Diagnostic Error Notice with 1-click fallback */}
          {error && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-amber-950 space-y-4 shadow-sm animate-fade-in">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="space-y-1.5 flex-1">
                  <h4 className="text-sm font-bold text-amber-950">
                    Ollama Service Notice
                  </h4>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    {error.message}
                  </p>
                  {error.hint && (
                    <p className="text-xs text-amber-800 bg-amber-100/60 p-2.5 rounded-lg">
                      💡 {error.hint}
                    </p>
                  )}

                  {/* Cloud preview explanation */}
                  {env.isCloudPreview && isLocalhostTarget && (
                    <div className="text-[11px] text-amber-800 border-t border-amber-200/70 pt-2 flex items-start gap-1.5">
                      <Globe className="h-3.5 w-3.5 shrink-0 mt-0.5 text-amber-700" />
                      <span>
                        <strong>Cloud Preview Environment:</strong> TerraMind is hosted on Google AI Studio Cloud Run. Because the backend runs in a remote container, it cannot access <code>http://localhost:11434</code> on your physical machine without a tunnel (e.g. ngrok).
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleGenerate(true)}
                  className="w-full text-center rounded-xl bg-[#1b5e46] py-3 text-xs font-bold text-white hover:bg-[#134835] transition shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate with Offline Botanical Engine (Instant)</span>
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('settings')}
                  className="text-xs text-center text-[#4c6b5d] hover:text-[#0f291e] underline transition py-1"
                >
                  Configure Remote Ollama URL in Settings
                </button>
              </div>
            </div>
          )}

          {/* Generated Mission Preview */}
          {generatedMission ? (
            <div className="rounded-2xl border border-[#bcdbc8] bg-white p-6 space-y-6 shadow-md animate-fade-in">
              {/* Header */}
              <div className="space-y-2 border-b border-[#e2ede5] pb-4">
                <div className="flex items-center justify-between text-xs text-[#527364]">
                  <span className="text-[#1b5e46] font-semibold">Mission Ready</span>
                  <span>{generatedMission.durationMinutes} mins · {generatedMission.energyLevel} Energy</span>
                </div>
                <h3 className="font-serif-nature text-2xl font-bold text-[#0f291e]">
                  {generatedMission.title}
                </h3>
                <p className="text-xs text-[#4c6b5d] leading-relaxed">
                  {generatedMission.description}
                </p>

                {/* Provenance Badge */}
                <div className="pt-1 flex items-center gap-1.5 text-[11px] text-[#527364] bg-[#f5f9f6] px-2.5 py-1 rounded-lg border border-[#dce7e1]">
                  <Cpu className="h-3.5 w-3.5 text-[#1b5e46]" />
                  <span>Provenance: <strong>{generatedMission.modelUsed || generatedMission.source}</strong></span>
                </div>
              </div>

              {/* Personalized Intro & Purpose */}
              {generatedMission.personalizedIntro && (
                <div className="rounded-xl bg-[#f5f9f6] border border-[#dce7e1] p-3.5 text-xs text-[#2e4d3e] leading-relaxed italic">
                  "{generatedMission.personalizedIntro}"
                </div>
              )}

              {/* Steps Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#527364]">
                  Expedition Phases ({generatedMission.instructions.length})
                </h4>
                <div className="space-y-2">
                  {generatedMission.instructions.map((step) => (
                    <div
                      key={step.stepNumber}
                      className="rounded-lg border border-[#e2ede5] bg-[#fcfdfc] p-3 text-xs space-y-1"
                    >
                      <span className="font-semibold text-[#1b5e46] text-[11px] block">
                        Phase {step.stepNumber}: {step.phase}
                      </span>
                      <p className="text-[#2f4d3e] leading-relaxed">
                        {step.instruction}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sensory Prompts */}
              {generatedMission.sensoryPrompts && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-[#527364]">
                    Sensory Grounding Prompts
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2.5 rounded-lg bg-[#f5f9f6] border border-[#dce7e1] text-[#2f4d3e]">
                      <strong className="text-[#1b5e46] block">Sight:</strong>
                      {generatedMission.sensoryPrompts.sight}
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#f5f9f6] border border-[#dce7e1] text-[#2f4d3e]">
                      <strong className="text-[#1b5e46] block">Sound:</strong>
                      {generatedMission.sensoryPrompts.sound}
                    </div>
                  </div>
                </div>
              )}

              {/* Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#527364]">
                  Field Checklist ({generatedMission.checklist.length} items)
                </h4>
                <ul className="space-y-1.5 text-xs text-[#2f4d3e]">
                  {generatedMission.checklist.map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <span className="h-4 w-4 rounded-full border border-[#bcdbc8] bg-white flex items-center justify-center shrink-0 text-[#1b5e46] text-[10px]">
                        ○
                      </span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Field Notes Prompt */}
              {generatedMission.fieldNotesPrompt && (
                <div className="rounded-xl border border-[#bcdbc8] bg-[#eef6f1] p-3 text-xs text-[#1b5e46]">
                  <strong>Notebook Prompt:</strong> {generatedMission.fieldNotesPrompt}
                </div>
              )}

              {/* Start Expedition Action */}
              <button
                onClick={handleStartDistractionFree}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#1b5e46] py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#134835] transition"
              >
                <span>Begin Distraction-Free Outdoor Mission</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#bcdbc8] bg-[#fbfdfb] p-8 text-center space-y-4 text-[#557766]">
              <div className="h-12 w-12 rounded-full bg-[#eef6f1] border border-[#bcdbc8] mx-auto flex items-center justify-center text-[#1b5e46]">
                <Sparkles className="h-6 w-6" />
              </div>
              <div className="space-y-1 max-w-xs mx-auto">
                <h4 className="font-serif-nature text-lg font-bold text-[#0f291e]">
                  Ready for Exploration
                </h4>
                <p className="text-xs text-[#5c806f] leading-relaxed">
                  Adjust your parameters on the left and tap Generate to receive a tailored outdoor mission.
                </p>
              </div>

              <div className="pt-2 text-[11px] text-[#6b8c7c]">
                <span>Designed for Hacktoberfest 2026 Touch Grass</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
