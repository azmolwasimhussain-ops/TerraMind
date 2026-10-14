import React, { useState, useEffect } from 'react';
import {
  OutdoorMission,
  ChecklistItem,
} from '../types/mission';
import {
  toggleChecklistItem,
  updateMissionStatus,
  saveMission,
} from '../db/indexedDb';
import {
  ArrowLeft,
  Check,
  PhoneOff,
  AlertTriangle,
  Backpack,
  CheckCircle2,
  BookOpen,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface MissionActivePageProps {
  mission: OutdoorMission;
  initialSoundEnabled?: boolean;
  onExit: () => void;
  onOpenJournalWithMission: (mission: OutdoorMission) => void;
}

export const MissionActivePage: React.FC<MissionActivePageProps> = ({
  mission: initialMission,
  initialSoundEnabled = true,
  onExit,
  onOpenJournalWithMission,
}) => {
  const [mission, setMission] = useState<OutdoorMission>(initialMission);
  const [isCompletedModalOpen, setIsCompletedModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState(initialSoundEnabled);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Reusable audio context ref to prevent resource leaks
  const audioContextRef = React.useRef<AudioContext | null>(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Outdoor session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Auto-start mission if not started
  useEffect(() => {
    if (mission.status === 'not_started') {
      updateMissionStatus(mission.id, 'in_progress').then((updated) => {
        if (updated) setMission(updated);
      });
    }
  }, [mission.id, mission.status]);

  const completedCount = mission.checklist.filter((c) => c.completed).length;
  const totalCount = mission.checklist.length;
  const isAllChecklistDone = totalCount > 0 && completedCount === totalCount;

  // Gentle audio chime for completing checklist items (reusing audio context)
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtxClass();
      }

      const audioCtx = audioContextRef.current;
      if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {});
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch {
      // Audio context may be restricted without user gesture
    }
  };

  const handleToggleCheck = async (item: ChecklistItem) => {
    const nextState = !item.completed;
    if (nextState) {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(25);
      }
      playChime();
    }

    try {
      const updated = await toggleChecklistItem(mission.id, item.id, nextState);
      if (updated) {
        setMission(updated);
      } else {
        // Fallback local update
        const updatedChecklist = mission.checklist.map((c) =>
          c.id === item.id ? { ...c, completed: nextState } : c
        );
        const updatedM: OutdoorMission = {
          ...mission,
          checklist: updatedChecklist,
          status: 'in_progress',
        };
        await saveMission(updatedM);
        setMission(updatedM);
      }
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
    }
  };

  const handleCompleteMission = async () => {
    const nowIso = new Date().toISOString();
    try {
      const updated = await updateMissionStatus(mission.id, 'completed', nowIso);
      if (updated) setMission(updated);
      setIsCompletedModalOpen(true);
    } catch (err) {
      console.error('Failed to complete mission:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf7] text-[#1a3328] flex flex-col justify-between selection:bg-emerald-100">
      {/* Top Distraction-Free Bar */}
      <header className="border-b border-[#dce7e1] bg-white/95 px-4 py-3 sm:px-6 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          <button
            onClick={() => {
              if (completedCount > 0 && !isAllChecklistDone) {
                setIsExitModalOpen(true);
              } else {
                onExit();
              }
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#527364] hover:bg-[#eef6f1] hover:text-[#0f291e] transition"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Exit Distraction-Free</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-[#1b5e46] font-semibold px-2.5 py-1 bg-[#eef6f1] rounded-lg border border-[#bcdbc8] flex items-center gap-1.5">
              <span>⏱️</span>
              <span>{formatTimer(elapsedSeconds)}</span>
            </span>

            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-md text-[#527364] hover:text-[#0f291e]"
              title={soundEnabled ? 'Mute checklist audio' : 'Enable checklist audio'}
            >
              {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <span className="font-mono text-xs text-[#1b5e46] font-semibold px-2.5 py-1 bg-[#eef6f1] rounded-lg border border-[#bcdbc8]">
              {completedCount}/{totalCount} Done
            </span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 py-8 flex-1 w-full space-y-8">
        {/* Screen-Free Reminder Banner */}
        <div className="rounded-2xl border border-[#bcdbc8] bg-[#eef6f1] p-4 flex items-center gap-3 text-[#1b5e46]">
          <div className="h-9 w-9 rounded-xl bg-white border border-[#bcdbc8] flex items-center justify-center shrink-0 text-[#1b5e46] shadow-sm">
            <PhoneOff className="h-5 w-5" />
          </div>
          <div className="text-xs leading-relaxed text-[#2d4b3b]">
            <strong className="text-[#0f291e] block font-semibold">Touch Grass Mode Active</strong>
            Review your instructions below, put your phone in your pocket, and explore the outdoors. Pull out only to mark discoveries.
          </div>
        </div>

        {/* Mission Title Header */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#527364]">
            <span>{mission.durationMinutes} Minutes</span>
            <span aria-hidden="true">·</span>
            <span>{mission.energyLevel} Energy</span>
            {mission.locationHint && (
              <>
                <span aria-hidden="true">·</span>
                <span>{mission.locationHint}</span>
              </>
            )}
          </div>
          <h1 className="font-serif-nature text-3xl sm:text-4xl font-bold tracking-tight text-[#0f291e] leading-tight">
            {mission.title}
          </h1>
          {mission.purpose && (
            <p className="text-xs text-[#1b5e46] font-semibold">
              Purpose: {mission.purpose}
            </p>
          )}
          <p className="text-sm text-[#385646] leading-relaxed">
            {mission.description}
          </p>
        </div>

        {/* Outdoor Instructions Stepper */}
        <div className="rounded-2xl border border-[#dce7e1] bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-[#e2ede5] pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#1b5e46]">
              Field Instructions ({mission.instructions.length} Phases)
            </h2>
            <div className="flex gap-1.5">
              {mission.instructions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveStepTab(i)}
                  className={`h-2.5 w-6 rounded-full transition ${
                    activeStepTab === i ? 'bg-[#1b5e46]' : 'bg-[#e2ede5]'
                  }`}
                  aria-label={`View Phase ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Active Phase Card */}
          {mission.instructions[activeStepTab] && (
            <div className="space-y-2 py-2">
              <div className="flex items-center gap-2 text-xs text-[#1b5e46] font-semibold">
                <span className="font-mono">PHASE 0{mission.instructions[activeStepTab].stepNumber}</span>
                <span>—</span>
                <span className="text-[#0f291e] text-sm font-bold">
                  {mission.instructions[activeStepTab].phase}
                </span>
              </div>
              <p className="text-sm sm:text-base text-[#2c4939] leading-relaxed pl-1">
                {mission.instructions[activeStepTab].instruction}
              </p>
            </div>
          )}

          {/* Stepper Navigation */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={() => setActiveStepTab((prev) => Math.max(0, prev - 1))}
              disabled={activeStepTab === 0}
              className="text-xs font-medium text-[#527364] hover:text-[#0f291e] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Previous Phase
            </button>
            <button
              onClick={() =>
                setActiveStepTab((prev) =>
                  Math.min(mission.instructions.length - 1, prev + 1)
                )
              }
              disabled={activeStepTab === mission.instructions.length - 1}
              className="text-xs font-semibold text-[#1b5e46] hover:text-[#0f3d2e] disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next Phase →
            </button>
          </div>
        </div>

        {/* Sensory Observation Prompts in Field */}
        {mission.sensoryPrompts && (
          <div className="rounded-2xl border border-[#dce7e1] bg-[#f8faf8] p-5 space-y-3">
            <h3 className="text-xs font-semibold text-[#1b5e46] uppercase tracking-wider">
              Field Sensory Cues (Touch Grass)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {mission.sensoryPrompts.sight && (
                <div className="p-3 rounded-xl bg-white border border-[#e2ede5] shadow-xs">
                  <span className="text-[#1b5e46] font-semibold block mb-0.5">👁️ Sight</span>
                  <span className="text-[#3b594b]">{mission.sensoryPrompts.sight}</span>
                </div>
              )}
              {mission.sensoryPrompts.sound && (
                <div className="p-3 rounded-xl bg-white border border-[#e2ede5] shadow-xs">
                  <span className="text-[#1b5e46] font-semibold block mb-0.5">👂 Sound</span>
                  <span className="text-[#3b594b]">{mission.sensoryPrompts.sound}</span>
                </div>
              )}
              {mission.sensoryPrompts.touch && (
                <div className="p-3 rounded-xl bg-white border border-[#e2ede5] shadow-xs">
                  <span className="text-[#1b5e46] font-semibold block mb-0.5">✋ Touch</span>
                  <span className="text-[#3b594b]">{mission.sensoryPrompts.touch}</span>
                </div>
              )}
              {mission.sensoryPrompts.smell && (
                <div className="p-3 rounded-xl bg-white border border-[#e2ede5] shadow-xs">
                  <span className="text-[#1b5e46] font-semibold block mb-0.5">👃 Smell</span>
                  <span className="text-[#3b594b]">{mission.sensoryPrompts.smell}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Large Touch-Friendly Checklist */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif-nature text-xl font-semibold text-[#0f291e]">
              Outdoor Field Checklist
            </h2>
            <span className="text-xs text-[#527364]">
              Tap items as you discover them
            </span>
          </div>

          <div className="space-y-3">
            {mission.checklist.map((item) => {
              const isChecked = item.completed;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleToggleCheck(item)}
                  className={`w-full flex items-start gap-4 p-4 sm:p-5 rounded-2xl border text-left transition-all active:scale-[0.99] min-h-[64px] shadow-xs ${
                    isChecked
                      ? 'border-emerald-600 bg-[#eef6f1] text-[#0f291e] shadow-sm'
                      : 'border-[#dce7e1] bg-white text-[#0f291e] hover:border-[#bcdbc8] hover:bg-[#fafcfa]'
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-colors border ${
                      isChecked
                        ? 'border-[#1b5e46] bg-[#1b5e46] text-white'
                        : 'border-[#97b8a5] bg-[#f8faf8] text-transparent'
                    }`}
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                  </div>
                  <div className="flex-1">
                    <span
                      className={`text-sm sm:text-base leading-relaxed ${
                        isChecked ? 'line-through text-[#688a78]' : 'text-[#0f291e] font-medium'
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Collapsible Equipment & Safety Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* Equipment */}
          <div className="rounded-2xl border border-[#dce7e1] bg-white p-5 space-y-2 shadow-sm">
            <h3 className="text-xs font-semibold text-[#1b5e46] uppercase tracking-wider flex items-center gap-1.5">
              <Backpack className="h-3.5 w-3.5" />
              Suggested Items
            </h3>
            <ul className="text-xs text-[#486657] space-y-1">
              {mission.equipment.map((eq, i) => (
                <li key={i}>· {eq}</li>
              ))}
            </ul>
          </div>

          {/* Safety */}
          <div className="rounded-2xl border border-[#dce7e1] bg-white p-5 space-y-2 shadow-sm">
            <h3 className="text-xs font-semibold text-[#1b5e46] uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Outdoor Safety
            </h3>
            <ul className="text-xs text-[#486657] space-y-1">
              {mission.safetyTips.map((tip, i) => (
                <li key={i}>· {tip}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Completion Action */}
        <div className="pt-6 pb-12 border-t border-[#e2ede5] flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={handleCompleteMission}
            className={`w-full sm:flex-1 flex items-center justify-center gap-2 rounded-xl py-4 text-base font-bold transition shadow-sm active:scale-[0.98] ${
              isAllChecklistDone || mission.status === 'completed'
                ? 'bg-[#1b5e46] text-white hover:bg-[#134835] shadow-md shadow-[#1b5e46]/20'
                : 'border-2 border-[#1b5e46] bg-white text-[#1b5e46] hover:bg-[#eef6f1]'
            }`}
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>
              {mission.status === 'completed'
                ? 'Mission Completed ✓'
                : isAllChecklistDone
                ? 'All Done! Mark Mission Complete'
                : 'Mark Mission Complete'}
            </span>
          </button>

          <button
            onClick={() => onOpenJournalWithMission(mission)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl border border-[#bcdbc8] bg-[#eef6f1] px-6 py-4 text-sm font-semibold text-[#1b5e46] hover:bg-[#dff0e6] transition shadow-xs"
          >
            <BookOpen className="h-4 w-4" />
            <span>Write in Journal</span>
          </button>
        </div>
      </main>

      {/* Completion Modal / Celebration */}
      {isCompletedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-[#bcdbc8] bg-white p-6 sm:p-8 text-center space-y-5 shadow-2xl text-[#0f291e]">
            <div className="h-16 w-16 rounded-full bg-[#eef6f1] border border-[#bcdbc8] mx-auto flex items-center justify-center text-[#1b5e46]">
              <Check className="h-8 w-8 stroke-[3]" />
            </div>

            <div className="space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1b5e46]">
                Expedition Accomplished
              </span>
              <h3 className="font-serif-nature text-2xl font-bold text-[#0f291e]">
                You Touched Grass!
              </h3>
              <p className="text-xs text-[#527364] leading-relaxed">
                You spent approximately {mission.durationMinutes} minutes disconnected from digital noise and connected to the natural world.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2.5">
              <button
                onClick={() => {
                  setIsCompletedModalOpen(false);
                  onOpenJournalWithMission(mission);
                }}
                className="w-full rounded-xl bg-[#1b5e46] py-3 text-sm font-bold text-white hover:bg-[#134835] transition shadow-sm"
              >
                Log Findings in Private Journal
              </button>

              <button
                onClick={() => {
                  setIsCompletedModalOpen(false);
                  onExit();
                }}
                className="w-full rounded-xl border border-[#dce7e1] bg-[#f8faf8] py-2.5 text-xs font-medium text-[#527364] hover:text-[#0f291e] transition"
              >
                Return to Missions History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit In-Progress Confirmation Modal */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-[#bcdbc8] bg-white p-6 text-center space-y-4 shadow-2xl text-[#0f291e]">
            <h3 className="font-serif-nature text-xl font-bold text-[#0f291e]">
              Leave Distraction-Free Mode?
            </h3>
            <p className="text-xs text-[#527364] leading-relaxed">
              Your checklist progress is safely saved in your local database. You can resume this expedition anytime from Mission History.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={() => {
                  setIsExitModalOpen(false);
                  onExit();
                }}
                className="w-full rounded-xl bg-[#1b5e46] py-2.5 text-xs font-bold text-white hover:bg-[#134835] transition shadow-sm"
              >
                Yes, Save & Exit Mode
              </button>
              <button
                onClick={() => setIsExitModalOpen(false)}
                className="w-full rounded-xl border border-[#dce7e1] bg-[#f8faf8] py-2 text-xs font-medium text-[#527364] hover:text-[#0f291e] transition"
              >
                Continue Exploring Outside
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
