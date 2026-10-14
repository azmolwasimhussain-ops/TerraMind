import React, { useState, useEffect } from 'react';
import {
  Settings,
  Server,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
  Shield,
  Info,
  Globe,
} from 'lucide-react';
import { AppSettings, OllamaConnectionMode, OllamaModelInfo } from '../types/settings';
import {
  testOllamaConnection,
  fetchOllamaModels,
  matchesModelName,
  resolveActualModelName,
  OllamaTestResult,
} from '../services/ollamaClient';
import {
  exportAllData,
  clearAllData,
  saveSettings,
} from '../db/indexedDb';
import { getAppEnvironment, normalizeOllamaUrl } from '../services/environment';

interface SettingsPageProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

const COMMON_MODELS = ['llama3.2', 'llama3.1', 'mistral', 'gemma2', 'phi3'];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const env = getAppEnvironment();
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<OllamaTestResult | null>(null);
  const [discoveredModels, setDiscoveredModels] = useState<OllamaModelInfo[]>([]);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState<boolean>(false);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Refresh model availability on mount or when URL / mode changes
  useEffect(() => {
    let isMounted = true;
    if (formData.connectionMode !== 'offline_demo') {
      fetchOllamaModels(formData.ollamaBaseUrl, formData.connectionMode)
        .then((models) => {
          if (isMounted && models.length > 0) {
            setDiscoveredModels(models);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [formData.ollamaBaseUrl, formData.connectionMode]);

  const handleFieldChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    onUpdateSettings(updated);
  };

  const handleSaveExplicit = async () => {
    const cleanedData: AppSettings = {
      ...formData,
      ollamaBaseUrl: normalizeOllamaUrl(formData.ollamaBaseUrl),
    };
    setFormData(cleanedData);
    await saveSettings(cleanedData);
    onUpdateSettings(cleanedData);
    setSaveFeedback('Preferences saved successfully to local storage.');
    setTimeout(() => setSaveFeedback(null), 3000);
  };

  const handleTestConnection = async () => {
    if (formData.connectionMode !== 'offline_demo') {
      const url = formData.ollamaBaseUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        setTestResult({
          ok: false,
          error: 'Invalid Ollama URL: Base URL must begin with http:// or https:// (e.g. http://localhost:11434).',
          hint: 'Enter a valid URL or select "Offline Botanical Engine" mode.',
        });
        return;
      }
      if (!formData.ollamaModel.trim()) {
        setTestResult({
          ok: false,
          error: 'Model name cannot be empty.',
          hint: 'Enter a model name such as llama3.2, mistral, or gemma2.',
        });
        return;
      }
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const result = await testOllamaConnection(
        formData.ollamaBaseUrl,
        formData.connectionMode
      );
      setTestResult(result);

      if (result.ok && formData.connectionMode !== 'offline_demo') {
        const models = await fetchOllamaModels(
          formData.ollamaBaseUrl,
          formData.connectionMode
        );
        setDiscoveredModels(models);
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        error: err.message || 'Connection test encountered an error.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleExportData = async () => {
    try {
      setIsExporting(true);
      const data = await exportAllData();
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terramind-archive-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearAllData = async () => {
    try {
      setIsClearing(true);
      await clearAllData();
      setIsClearModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Failed to clear database:', err);
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-10">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#1b5e46]">
          <Settings className="h-4 w-4" />
          <span>Configuration & Privacy</span>
        </div>
        <h1 className="font-serif-nature text-3xl sm:text-4xl font-bold text-[#0f291e]">
          Settings & Local AI
        </h1>
        <p className="text-xs sm:text-sm text-[#4c6b5d] mt-1">
          Configure your local Ollama connection, offline engine preferences, and local data.
        </p>
      </div>

      {saveFeedback && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-[#1b5e46]" />
          <span>{saveFeedback}</span>
        </div>
      )}

      {/* Section 1: AI Provider & Ollama Setup */}
      <section className="rounded-2xl border border-[#dce7e1] bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-[#e2ede5] pb-4">
          <h2 className="font-serif-nature text-xl font-bold text-[#0f291e] flex items-center gap-2">
            <Server className="h-5 w-5 text-[#1b5e46]" />
            AI Engine Configuration
          </h2>
          <p className="text-xs text-[#527364] mt-1 leading-relaxed">
            TerraMind prioritizes local, private inference via Ollama, or operates standalone with our offline botanical engine.
          </p>
        </div>

        {/* Cloud Environment Diagnostic Banner */}
        {env.isCloudPreview && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-4 text-xs text-blue-900 space-y-1.5 shadow-xs">
            <div className="flex items-center gap-2 font-semibold text-blue-950">
              <Globe className="h-4 w-4 text-blue-700 shrink-0" />
              <span>Cloud Preview Environment ({env.hostname})</span>
            </div>
            <p className="text-blue-800 leading-relaxed text-[11px]">
              TerraMind is executing inside a cloud container. Connecting to <code>http://localhost:11434</code> will attempt to connect to the cloud container's localhost, not your local machine.
            </p>
            <p className="text-blue-800 leading-relaxed text-[11px]">
              • For instant offline mission creation with no daemon required, choose <strong>Offline Botanical Engine</strong> below.<br />
              • If using local Ollama from this preview, tunnel your local port (e.g. <code>ngrok http 11434</code>) and paste the HTTPS URL below.
            </p>
          </div>
        )}

        {/* Connection Mode Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#0f291e]">
            Connection Mode
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              {
                mode: 'proxy' as OllamaConnectionMode,
                title: 'Backend Proxy (Recommended)',
                desc: 'Routes via local Express server. Avoids browser CORS.',
              },
              {
                mode: 'direct' as OllamaConnectionMode,
                title: 'Direct Browser Fetch',
                desc: 'Calls Ollama directly. Requires OLLAMA_ORIGINS="*".',
              },
              {
                mode: 'offline_demo' as OllamaConnectionMode,
                title: 'Offline Botanical Engine',
                desc: 'Standalone deterministic rule engine. No daemon needed.',
              },
            ].map((option) => {
              const isSelected = formData.connectionMode === option.mode;
              return (
                <button
                  key={option.mode}
                  type="button"
                  onClick={() => handleFieldChange('connectionMode', option.mode)}
                  className={`flex flex-col p-3.5 rounded-xl border text-left transition ${
                    isSelected
                      ? 'border-emerald-600 bg-[#eef6f1] text-[#0f291e] shadow-sm font-semibold'
                      : 'border-[#dce7e1] bg-[#fbfdfb] text-[#527364] hover:border-[#bcdbc8]'
                  }`}
                >
                  <span className="text-xs font-semibold text-[#0f291e]">
                    {option.title}
                  </span>
                  <span className="text-[11px] text-[#5a7b6c] mt-1 leading-tight">
                    {option.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {formData.connectionMode !== 'offline_demo' && (
          <>
            {/* Ollama Base URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0f291e]">
                Ollama Base URL
              </label>
              <input
                type="text"
                value={formData.ollamaBaseUrl}
                onChange={(e) => handleFieldChange('ollamaBaseUrl', e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full rounded-xl border border-[#d0e0d6] bg-white px-3.5 py-2.5 text-xs text-[#0f291e] font-mono focus:border-emerald-600 focus:outline-none"
              />
              <p className="text-[11px] text-[#5f7f70]">
                Default is http://localhost:11434 when running `ollama serve` locally.
              </p>
            </div>

            {/* Model Name */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#0f291e]">
                Model Name
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.ollamaModel}
                  onChange={(e) => handleFieldChange('ollamaModel', e.target.value)}
                  placeholder="llama3.2"
                  className="flex-1 rounded-xl border border-[#d0e0d6] bg-white px-3.5 py-2.5 text-xs text-[#0f291e] font-mono focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {/* Validation status against discovered library models */}
              {discoveredModels.length > 0 && (
                <div className="text-[11px] pt-0.5">
                  {discoveredModels.some((m) =>
                    matchesModelName(formData.ollamaModel, m.name || m.model || '')
                  ) ? (
                    <p className="text-emerald-700 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#1b5e46]" />
                      <span>
                        Verified in local library:{' '}
                        <code className="font-bold">
                          {
                            discoveredModels.find((m) =>
                              matchesModelName(formData.ollamaModel, m.name || m.model || '')
                            )?.name
                          }
                        </code>
                      </span>
                    </p>
                  ) : (
                    <p className="text-amber-800 flex items-center gap-1 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-md">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>
                        Model "{formData.ollamaModel}" not found in local Ollama library. Run{' '}
                        <code>ollama pull {formData.ollamaModel}</code> or choose an installed model below.
                      </span>
                    </p>
                  )}
                </div>
              )}

              {/* Quick model preset chips */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[11px] text-[#5c806f]">Presets:</span>
                {COMMON_MODELS.map((modelName) => {
                  const isInstalled = discoveredModels.some((m) =>
                    matchesModelName(modelName, m.name || m.model || '')
                  );
                  const isSelected = matchesModelName(formData.ollamaModel, modelName);
                  return (
                    <button
                      key={modelName}
                      type="button"
                      onClick={() => {
                        const matched = discoveredModels.find((m) =>
                          matchesModelName(modelName, m.name || m.model || '')
                        );
                        handleFieldChange('ollamaModel', matched ? matched.name : modelName);
                      }}
                      className={`px-2 py-0.5 rounded text-[11px] transition flex items-center gap-1 ${
                        isSelected
                          ? 'bg-[#1b5e46] text-white font-medium shadow-sm'
                          : 'bg-[#f0f5f2] text-[#486657] hover:text-[#0f291e] border border-[#dce7e1]'
                      }`}
                    >
                      <span>{modelName}</span>
                      {isInstalled && (
                        <span
                          className={`text-[9px] px-1 rounded font-medium ${
                            isSelected ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          installed
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Live Installed Ollama Models List */}
              {discoveredModels.length > 0 && (
                <div className="pt-2 border-t border-[#e2ede5] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-[#1b5e46]">
                      Installed Ollama Library Models ({discoveredModels.length}):
                    </span>
                    <span className="text-[10px] text-[#5c806f]">
                      Click to select
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {discoveredModels.map((m) => {
                      const isSelected = matchesModelName(formData.ollamaModel, m.name || m.model || '');
                      return (
                        <button
                          key={m.name}
                          type="button"
                          onClick={() => handleFieldChange('ollamaModel', m.name)}
                          className={`px-2 py-1 rounded text-xs font-mono transition flex items-center gap-1 ${
                            isSelected
                              ? 'bg-[#1b5e46] text-white font-bold shadow-xs'
                              : 'bg-white border border-[#bcdbc8] text-[#1b5e46] hover:bg-[#eef6f1]'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="h-3 w-3" />}
                          <span>{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Test Connection Button & Readout */}
        <div className="pt-2 border-t border-[#e2ede5] space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-2 rounded-xl border border-[#bcdbc8] bg-[#eef6f1] px-4 py-2.5 text-xs font-semibold text-[#1b5e46] hover:bg-[#dff0e6] transition disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'Testing Connection...' : 'Test Ollama Connection'}</span>
            </button>

            <button
              onClick={handleSaveExplicit}
              className="rounded-xl bg-[#1b5e46] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#134835] transition shadow-sm"
            >
              Save Settings
            </button>
          </div>

          {/* Test Result Display */}
          {testResult && (
            <div
              className={`rounded-xl p-4 text-xs space-y-2 border ${
                testResult.ok
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-950'
                  : 'border-amber-300 bg-amber-50 text-amber-950'
              }`}
            >
              <div className="flex items-center gap-2 font-semibold">
                {testResult.ok ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-[#1b5e46]" />
                    <span>Connection Verified Successfully</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-700" />
                    <span>Connection Diagnostic Notice</span>
                  </>
                )}
                {testResult.latencyMs && (
                  <span className="text-[11px] opacity-75 font-mono ml-auto">
                    {testResult.latencyMs}ms
                  </span>
                )}
              </div>

              {testResult.version && (
                <p>
                  Ollama Version: <strong className="font-mono">{testResult.version}</strong>
                </p>
              )}

              {testResult.error && (
                <p className="text-amber-900 leading-relaxed">
                  {testResult.error}
                </p>
              )}

              {testResult.hint && (
                <p className="text-[11px] opacity-90 leading-relaxed pt-1">
                  💡 {testResult.hint}
                </p>
              )}

              {/* Discovered models picker */}
              {discoveredModels.length > 0 && (
                <div className="pt-2 border-t border-emerald-200 space-y-1.5">
                  <span className="text-[11px] font-semibold text-[#1b5e46] block">
                    Discovered Installed Models ({discoveredModels.length}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {discoveredModels.map((m) => {
                      const isSelected = matchesModelName(formData.ollamaModel, m.name || m.model || '');
                      return (
                        <button
                          key={m.name}
                          type="button"
                          onClick={() => handleFieldChange('ollamaModel', m.name)}
                          className={`px-2 py-1 rounded text-xs font-mono transition flex items-center gap-1 ${
                            isSelected
                              ? 'bg-[#1b5e46] text-white font-bold'
                              : 'bg-white border border-[#bcdbc8] text-[#1b5e46] hover:bg-[#eef6f1]'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="h-3 w-3" />}
                          <span>{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Section 2: Preferences & Accessibility */}
      <section className="rounded-2xl border border-[#dce7e1] bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-[#e2ede5] pb-4">
          <h2 className="font-serif-nature text-xl font-bold text-[#0f291e]">
            Interface & Accessibility
          </h2>
          <p className="text-xs text-[#527364] mt-1">
            Display name and exploration audio feedback.
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#0f291e]">
              Naturalist Display Name (Optional)
            </label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => handleFieldChange('displayName', e.target.value)}
              placeholder="e.g. Robin or Field Naturalist"
              className="w-full rounded-xl border border-[#d0e0d6] bg-white px-3.5 py-2.5 text-xs text-[#0f291e] focus:border-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-semibold text-[#0f291e] block">
                Audio Chime Feedback
              </span>
              <span className="text-[11px] text-[#5a7b6c]">
                Plays a subtle resonant sine chime when checking off discoveries in the field.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.screenFreeVoiceChime}
              onChange={(e) =>
                handleFieldChange('screenFreeVoiceChime', e.target.checked)
              }
              className="h-4 w-4 accent-[#1b5e46] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-semibold text-[#0f291e] block">
                Prefer Reduced Motion
              </span>
              <span className="text-[11px] text-[#5a7b6c]">
                Disables transitions and micro-animations across all pages.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.prefersReducedMotion}
              onChange={(e) =>
                handleFieldChange('prefersReducedMotion', e.target.checked)
              }
              className="h-4 w-4 accent-[#1b5e46] cursor-pointer"
            />
          </div>
        </div>
      </section>

      {/* Section 3: Data Management */}
      <section className="rounded-2xl border border-[#dce7e1] bg-white p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="border-b border-[#e2ede5] pb-4">
          <h2 className="font-serif-nature text-xl font-bold text-[#0f291e] flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#1b5e46]" />
            Local Data & Privacy Management
          </h2>
          <p className="text-xs text-[#527364] mt-1 leading-relaxed">
            All missions and journal entries exist solely on your physical device. Export your data for safekeeping or wipe everything clean.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={handleExportData}
            disabled={isExporting}
            className="flex items-center gap-2 rounded-xl border border-[#bcdbc8] bg-[#eef6f1] px-4 py-2.5 text-xs font-semibold text-[#1b5e46] hover:bg-[#dff0e6] transition"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? 'Exporting...' : 'Export Complete JSON Archive'}</span>
          </button>

          <button
            onClick={() => setIsClearModalOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 hover:bg-red-100 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear All Local Data</span>
          </button>
        </div>
      </section>

      {/* Section 4: Technology & Hacktoberfest Notes */}
      <section className="rounded-2xl border border-[#dce7e1] bg-[#f8faf8] p-6 space-y-3 text-xs text-[#527364]">
        <h3 className="font-semibold text-[#0f291e] flex items-center gap-2">
          <Info className="h-4 w-4 text-[#1b5e46]" />
          About TerraMind · Hacktoberfest 2026 "Touch Grass"
        </h3>
        <p className="leading-relaxed">
          TerraMind was designed for the DEV Challenge to challenge screen addiction. Rather than using AI to keep you hooked to a chat interface, TerraMind uses AI to plan thoughtful outdoor expeditions and immediately sends you outside.
        </p>
        <p className="leading-relaxed">
          <strong>Architecture:</strong> React 19, TypeScript, Tailwind CSS, IndexedDB, Progressive Web App (PWA) with Service Worker, and Ollama HTTP API (llama3.2).
        </p>
      </section>

      {/* Clear Data Modal */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-red-200 bg-white p-6 text-center space-y-4 shadow-2xl text-stone-900">
            <div className="h-12 w-12 rounded-full bg-red-50 border border-red-200 mx-auto flex items-center justify-center text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-serif-nature text-lg font-bold text-stone-900">
                Clear All Local Data?
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                This will delete every saved mission, all checklist progress, and all field journal entries from your IndexedDB database.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={handleClearAllData}
                disabled={isClearing}
                className="w-full rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition shadow-sm"
              >
                {isClearing ? 'Clearing...' : 'Yes, Delete Everything'}
              </button>
              <button
                onClick={() => setIsClearModalOpen(false)}
                className="w-full rounded-xl border border-stone-200 bg-stone-100 py-2 text-xs font-medium text-stone-700 hover:bg-stone-200 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
