import React, { useState, useEffect } from 'react';
import {
  ArrowRight,
  BookOpen,
  Compass,
  Sparkles,
  PhoneOff,
  Database,
  ShieldCheck,
  Leaf,
  Clock,
  CheckCircle2,
  Cpu,
  RefreshCw,
  AlertCircle,
  Layers,
} from 'lucide-react';
import { NatureImages } from '../assets/images';
import { getAllMissions, getAllJournalEntries, getSettings } from '../db/indexedDb';
import { testOllamaConnection, OllamaTestResult } from '../services/ollamaClient';
import { AppSettings, DEFAULT_SETTINGS } from '../types/settings';

interface HomePageProps {
  onNavigate: (route: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  // Real stored data states
  const [missionCount, setMissionCount] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [totalMinutes, setTotalMinutes] = useState<number>(0);
  const [journalCount, setJournalCount] = useState<number>(0);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(true);

  // Live Ollama / AI connection status
  const [connectionStatus, setConnectionStatus] = useState<
    'checking' | 'connected' | 'disconnected' | 'offline_engine'
  >('checking');
  const [statusDetails, setStatusDetails] = useState<string>('Testing local connection...');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [missions, journals, userSettings] = await Promise.all([
          getAllMissions(),
          getAllJournalEntries(),
          getSettings(),
        ]);

        if (!isMounted) return;

        setSettings(userSettings);
        setMissionCount(missions.length);
        const completed = missions.filter((m) => m.status === 'completed');
        setCompletedCount(completed.length);
        const mins = completed.reduce((sum, m) => sum + (m.durationMinutes || 0), 0);
        setTotalMinutes(mins);
        setJournalCount(journals.length);
        setIsLoadingMetrics(false);

        // Check connection
        if (userSettings.connectionMode === 'offline_demo') {
          setConnectionStatus('offline_engine');
          setStatusDetails('Offline Botanical Engine Ready');
        } else {
          setConnectionStatus('checking');
          testOllamaConnection(userSettings.ollamaBaseUrl, userSettings.connectionMode).then(
            (res) => {
              if (!isMounted) return;
              if (res.ok) {
                setConnectionStatus('connected');
                setStatusDetails(`Ollama ${res.version || 'Connected'} (${userSettings.ollamaModel})`);
              } else {
                setConnectionStatus('disconnected');
                setStatusDetails('Local Ollama Offline · Heuristic Fallback Active');
              }
            }
          );
        }
      } catch (err) {
        console.error('Error loading overview data:', err);
        if (isMounted) setIsLoadingMetrics(false);
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* 1. Hero Section — Reference-Inspired Rounded Composition */}
      <section className="relative pt-4 sm:pt-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl lg:rounded-[2.5rem] overflow-hidden border border-[#d0e0d6] shadow-xl bg-white min-h-[640px] lg:min-h-[700px] flex items-center">
            {/* Background Nature Photography */}
            <div className="absolute inset-0 z-0">
              <img
                src={NatureImages.heroForest}
                alt="Ancient mossy forest woodland trail with morning sunlight"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000 ease-out"
                loading="eager"
              />
              {/* Soft directional gradient for editorial clarity */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/25 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none opacity-60" />
            </div>

            {/* Split / Inset Nature Vignette (Desktop) */}
            <div className="hidden xl:block absolute right-10 top-12 z-10 w-72 rounded-2xl overflow-hidden border border-white/80 shadow-xl bg-white/90 backdrop-blur-md transition-all hover:scale-[1.02]">
              <div className="relative h-44 overflow-hidden">
                <img
                  src={NatureImages.thumbFern || NatureImages.botanicalMacro}
                  alt="Close-up of vibrant old-growth forest fern canopy"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span className="absolute bottom-2.5 left-3 text-[11px] font-semibold text-emerald-200">
                  Old-growth fern canopy
                </span>
              </div>
              <div className="p-3 text-[11px] text-[#3d5a4d] leading-snug font-medium">
                Dappled morning light through 120-year cedar canopy · Touch Grass 2026
              </div>
            </div>

            {/* Floating Feature Badges on right side */}
            <div className="hidden lg:flex flex-col gap-3.5 absolute right-8 bottom-12 z-10 max-w-xs">
              {/* Card 1 */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3.5 backdrop-blur-md shadow-lg text-[#0f291e] transition hover:bg-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6f1] text-[#1b5e46] border border-[#b8ddcb]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0f291e]">Personalized Missions</div>
                  <div className="text-[11px] text-[#4d6b5e]">Adaptive 10–180 min outdoor tasks</div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3.5 backdrop-blur-md shadow-lg text-[#0f291e] transition hover:bg-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6f1] text-[#1b5e46] border border-[#b8ddcb]">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0f291e]">Field Observations</div>
                  <div className="text-[11px] text-[#4d6b5e]">Private local IndexedDB notes</div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/90 p-3.5 backdrop-blur-md shadow-lg text-[#0f291e] transition hover:bg-white">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6f1] text-[#1b5e46] border border-[#b8ddcb]">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#0f291e]">100% Offline-First Access</div>
                  <div className="text-[11px] text-[#4d6b5e]">Zero cloud tracking, works off-grid</div>
                </div>
              </div>
            </div>

            {/* Soft Ivory / Translucent Cream Floating Content Panel */}
            <div className="relative z-10 w-full max-w-xl lg:max-w-2xl rounded-2xl sm:rounded-3xl bg-[#fdfdfc]/95 sm:bg-[#fdfdfc]/92 backdrop-blur-md border border-[#e4eae4] p-6 sm:p-10 lg:p-12 shadow-2xl text-[#0d2a1e] my-8 sm:my-12 ml-4 sm:ml-8 lg:ml-12 mr-4 sm:mr-8">
              {/* Event Badge & Live Status */}
              <div className="flex flex-wrap items-center gap-2.5 mb-5">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#18533c] bg-[#e8f3ed] border border-[#b8ddcb] rounded-full px-3 py-1">
                  <Leaf className="h-3.5 w-3.5 text-[#1b5e46]" />
                  <span>Hacktoberfest 2026 · Touch Grass</span>
                </div>

                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1 border transition ${
                    connectionStatus === 'connected'
                      ? 'border-emerald-300 bg-[#e6f4ea] text-emerald-800'
                      : connectionStatus === 'checking'
                      ? 'border-amber-300 bg-[#fef7e0] text-amber-800'
                      : connectionStatus === 'offline_engine'
                      ? 'border-emerald-300 bg-[#e8f4ed] text-emerald-800'
                      : 'border-amber-300 bg-[#fef7e0] text-amber-800'
                  }`}
                >
                  <Cpu className="h-3.5 w-3.5" />
                  <span>{statusDetails}</span>
                </div>
              </div>

              {/* Reference-Inspired Editorial Headline */}
              <h1 className="font-serif-nature text-3xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-[#071f16] leading-[1.08] text-balance mb-4">
                Step Outside. Find Your Wild.
              </h1>

              {/* Purpose Description */}
              <p className="text-sm sm:text-base text-[#284f3e] leading-relaxed mb-6 max-w-lg">
                TerraMind uses local AI to create personalized outdoor missions and helps people reconnect with nature. Disconnect from screens, explore the real world phone-free, and record genuine discoveries in your private offline journal.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3.5 mb-6">
                <button
                  onClick={() => onNavigate('generator')}
                  className="flex items-center gap-2 rounded-xl bg-[#1b5e46] hover:bg-[#134835] px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#1b5e46]/25 transition active:scale-[0.98]"
                >
                  <span>Start a Mission</span>
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={() => onNavigate('journal')}
                  className="flex items-center gap-2 rounded-xl border border-[#97c3ad] bg-white/80 hover:bg-white px-6 py-3.5 text-sm font-semibold text-[#133d2d] shadow-sm transition active:scale-[0.98]"
                >
                  <BookOpen className="h-4 w-4 text-[#1b5e46]" />
                  <span>Open Nature Journal</span>
                </button>
              </div>

              {/* Privacy Statement Micro-Badge */}
              <div className="pt-4 border-t border-[#d8e4dc] flex items-center gap-2 text-xs font-medium text-[#416856]">
                <ShieldCheck className="h-4 w-4 text-[#1b5e46] shrink-0" />
                <span>Local AI · Private Journal · Less Screen Time</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Personal Expedition Progress Strip (Real Data Only) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 w-full">
        <div className="rounded-2xl border border-[#dce7e1] bg-white p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#1b5e46]">
                Your Outdoor Log
              </span>
              <h2 className="font-serif-nature text-2xl font-bold text-[#0f291e]">
                Actual Exploration Records
              </h2>
            </div>

            {completedCount > 0 && (
              <button
                onClick={() => onNavigate('history')}
                className="text-xs font-semibold text-[#1b5e46] hover:text-[#0f3d2e] flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View Full History</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {completedCount === 0 && missionCount === 0 ? (
            /* First-Time User Empty State */
            <div className="rounded-xl border border-dashed border-[#bcdbc8] bg-[#f5f9f6] p-6 text-center space-y-3">
              <div className="h-10 w-10 rounded-full bg-[#eef6f1] border border-[#b8ddcb] mx-auto flex items-center justify-center text-[#1b5e46]">
                <Compass className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[#0f291e]">
                Your outdoor journey begins with your first step outside.
              </p>
              <p className="text-xs text-[#527263] max-w-md mx-auto leading-relaxed">
                You haven't completed any missions yet. Create your first 15-minute nature exploration mission to start logging outdoor presence.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('generator')}
                  className="rounded-lg bg-[#1b5e46] px-4 py-2 text-xs font-semibold text-white hover:bg-[#134835] transition shadow-sm"
                >
                  Generate Your First Mission
                </button>
              </div>
            </div>
          ) : (
            /* Real Metrics Grid */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl bg-[#f8faf8] border border-[#e0ece4] p-4 space-y-1">
                <div className="text-[11px] text-[#527263] flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#1b5e46]" />
                  <span>Completed Expeditions</span>
                </div>
                <div className="font-serif-nature text-2xl sm:text-3xl font-bold text-[#0f291e] tabular-nums">
                  {completedCount}
                </div>
                <p className="text-[10px] text-[#6b8c7c]">Verified outdoor sessions</p>
              </div>

              <div className="rounded-xl bg-[#f8faf8] border border-[#e0ece4] p-4 space-y-1">
                <div className="text-[11px] text-[#527263] flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-[#1b5e46]" />
                  <span>Outdoor Minutes</span>
                </div>
                <div className="font-serif-nature text-2xl sm:text-3xl font-bold text-[#0f291e] tabular-nums">
                  {totalMinutes >= 60
                    ? `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`
                    : `${totalMinutes}m`}
                </div>
                <p className="text-[10px] text-[#6b8c7c]">Time spent away from screens</p>
              </div>

              <div className="rounded-xl bg-[#f8faf8] border border-[#e0ece4] p-4 space-y-1">
                <div className="text-[11px] text-[#527263] flex items-center gap-1.5 font-medium">
                  <Compass className="h-3.5 w-3.5 text-[#1b5e46]" />
                  <span>Saved Missions</span>
                </div>
                <div className="font-serif-nature text-2xl sm:text-3xl font-bold text-[#0f291e] tabular-nums">
                  {missionCount}
                </div>
                <p className="text-[10px] text-[#6b8c7c]">In progress & archived</p>
              </div>

              <div className="rounded-xl bg-[#f8faf8] border border-[#e0ece4] p-4 space-y-1">
                <div className="text-[11px] text-[#527263] flex items-center gap-1.5 font-medium">
                  <BookOpen className="h-3.5 w-3.5 text-[#1b5e46]" />
                  <span>Field Journal Notes</span>
                </div>
                <div className="font-serif-nature text-2xl sm:text-3xl font-bold text-[#0f291e] tabular-nums">
                  {journalCount}
                </div>
                <p className="text-[10px] text-[#6b8c7c]">Local sensory observations</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Core Feature Bento Grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <h2 className="font-serif-nature text-3xl font-semibold text-[#0f291e]">
            Engineered for genuine outdoor presence
          </h2>
          <p className="text-sm text-[#4c6b5d] leading-relaxed">
            Every feature is deliberately built to minimize screen time, maximize outdoor immersion, and keep your nature data completely private.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: AI Missions */}
          <div className="group rounded-2xl border border-[#dfe8e2] bg-white p-6 flex flex-col justify-between hover:border-[#b8d6c4] hover:shadow-md transition">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-[#eef6f1] border border-[#b8ddcb] flex items-center justify-center text-[#1b5e46]">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-serif-nature text-xl font-semibold text-[#0f291e]">
                AI-Powered Missions
              </h3>
              <p className="text-sm text-[#486657] leading-relaxed">
                Receive adaptive missions customized to your exact time budget (10 min to 3 hr), energy level, and natural interests — generated via local Ollama or our offline botanical engine.
              </p>
            </div>
            <div className="pt-6">
              <button
                onClick={() => onNavigate('generator')}
                className="text-xs font-semibold text-[#1b5e46] group-hover:text-[#0f3d2e] flex items-center gap-1"
              >
                Plan a mission <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Private Journal */}
          <div className="group rounded-2xl border border-[#dfe8e2] bg-white p-6 flex flex-col justify-between hover:border-[#b8d6c4] hover:shadow-md transition">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-[#eef6f1] border border-[#b8ddcb] flex items-center justify-center text-[#1b5e46]">
                <BookOpen className="h-5 w-5" />
              </div>
              <h3 className="font-serif-nature text-xl font-semibold text-[#0f291e]">
                Field Notebook
              </h3>
              <p className="text-sm text-[#486657] leading-relaxed">
                Log bird calls, leaf textures, weather, and sensory reflections. All entries are stored strictly in your browser's local IndexedDB with zero remote transmission.
              </p>
            </div>
            <div className="pt-6">
              <button
                onClick={() => onNavigate('journal')}
                className="text-xs font-semibold text-[#1b5e46] group-hover:text-[#0f3d2e] flex items-center gap-1"
              >
                Open notebook <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Offline Experience */}
          <div className="group rounded-2xl border border-[#dfe8e2] bg-white p-6 flex flex-col justify-between hover:border-[#b8d6c4] hover:shadow-md transition">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-[#eef6f1] border border-[#b8ddcb] flex items-center justify-center text-[#1b5e46]">
                <Database className="h-5 w-5" />
              </div>
              <h3 className="font-serif-nature text-xl font-semibold text-[#0f291e]">
                Offline-First PWA
              </h3>
              <p className="text-sm text-[#486657] leading-relaxed">
                Deep in a pine forest or off-grid mountain valley? Previously generated missions, checklists, and journals remain fully accessible offline without internet.
              </p>
            </div>
            <div className="pt-6">
              <button
                onClick={() => onNavigate('settings')}
                className="text-xs font-semibold text-[#1b5e46] group-hover:text-[#0f3d2e] flex items-center gap-1"
              >
                Inspect settings <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Distraction-Free */}
          <div className="group rounded-2xl border border-[#dfe8e2] bg-white p-6 flex flex-col justify-between hover:border-[#b8d6c4] hover:shadow-md transition">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-xl bg-[#eef6f1] border border-[#b8ddcb] flex items-center justify-center text-[#1b5e46]">
                <PhoneOff className="h-5 w-5" />
              </div>
              <h3 className="font-serif-nature text-xl font-semibold text-[#0f291e]">
                Distraction-Free Mode
              </h3>
              <p className="text-sm text-[#486657] leading-relaxed">
                An immersive, high-contrast, uncluttered screen-free view designed for cold fingers or bright sunlight. Big checklist targets and gentle reminders to put the device away.
              </p>
            </div>
            <div className="pt-6">
              <button
                onClick={() => onNavigate('generator')}
                className="text-xs font-semibold text-[#1b5e46] group-hover:text-[#0f3d2e] flex items-center gap-1"
              >
                Try outdoor mode <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Visual Gallery Strip */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#dce7e1] bg-white shadow-sm">
            <img
              src={NatureImages.botanicalMacro}
              alt="Fresh morning dew droplets resting on forest moss, lichen and pine needles"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-xs text-white">
              <span className="font-semibold text-emerald-200 block">Botanical Micro-Habitats</span>
              Notice delicate lichen and moss spores on the forest floor.
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#dce7e1] bg-white shadow-sm">
            <img
              src={NatureImages.tranquilLake}
              alt="Misty mountain lake trail with timber boardwalk and calm reflections"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-xs text-white">
              <span className="font-semibold text-emerald-200 block">Riparian & Lake Trails</span>
              Calm water reflections and quiet acoustic bird song corridors.
            </div>
          </div>

          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#dce7e1] bg-white shadow-sm">
            <img
              src={NatureImages.natureJournal}
              alt="Rustic open field notebook with pressed needles and pencil on wooden bench outdoors"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-xs text-white">
              <span className="font-semibold text-emerald-200 block">Sensory Field Notes</span>
              Capture personal reflections directly into your private journal.
            </div>
          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-[#dce7e1] bg-white p-8 sm:p-12 lg:p-16 shadow-sm">
          <div className="max-w-2xl mb-12 space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1b5e46]">
              The TerraMind Protocol
            </span>
            <h2 className="font-serif-nature text-3xl sm:text-4xl font-semibold text-[#0f291e]">
              How It Works
            </h2>
            <p className="text-sm text-[#4c6b5d] leading-relaxed">
              Designed from first principles to break the endless doomscroll cycle and restore genuine cognitive peace.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <span className="font-serif-nature text-3xl font-bold text-[#1b5e46]">01.</span>
              <h4 className="font-serif-nature text-lg sm:text-xl font-semibold text-[#0f291e]">Choose time & energy</h4>
              <p className="text-sm sm:text-base text-[#4a6b5c] leading-relaxed">
                Whether you have a 10-minute coffee walk or 3 hours for a deep trail, choose your pace: Low, Medium, or High.
              </p>
            </div>

            <div className="space-y-3">
              <span className="font-serif-nature text-3xl font-bold text-[#1b5e46]">02.</span>
              <h4 className="font-serif-nature text-lg sm:text-xl font-semibold text-[#0f291e]">Get your custom mission</h4>
              <p className="text-sm sm:text-base text-[#4a6b5c] leading-relaxed">
                AI synthesizes actionable steps, equipment suggestions, safety precautions, and an interactive outdoor checklist.
              </p>
            </div>

            <div className="space-y-3">
              <span className="font-serif-nature text-3xl font-bold text-[#1b5e46]">03.</span>
              <h4 className="font-serif-nature text-lg sm:text-xl font-semibold text-[#0f291e]">Head outside & explore</h4>
              <p className="text-sm sm:text-base text-[#4a6b5c] leading-relaxed">
                Switch to Distraction-Free mode. Put your phone in your pocket, breathe in the fresh air, and engage your senses.
              </p>
            </div>

            <div className="space-y-3">
              <span className="font-serif-nature text-3xl font-bold text-[#1b5e46]">04.</span>
              <h4 className="font-serif-nature text-lg sm:text-xl font-semibold text-[#0f291e]">Record your discoveries</h4>
              <p className="text-sm sm:text-base text-[#4a6b5c] leading-relaxed">
                Return home and write field observations in your private encrypted local notebook. Build a lasting connection to nature.
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-[#e2ede5] flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-[#527263]">
              Ready to disconnect? Generate your first mission in seconds.
            </div>
            <button
              onClick={() => onNavigate('generator')}
              className="flex items-center gap-2 rounded-lg bg-[#1b5e46] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#134835] transition shadow-sm"
            >
              <span>Start Planning Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
