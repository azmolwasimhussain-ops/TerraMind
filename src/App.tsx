import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { HomePage } from './pages/HomePage';
import { GeneratorPage } from './pages/GeneratorPage';
import { MissionActivePage } from './pages/MissionActivePage';
import { JournalPage } from './pages/JournalPage';
import { HistoryPage } from './pages/HistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import { AppSettings, DEFAULT_SETTINGS } from './types/settings';
import { OutdoorMission } from './types/mission';
import { getSettings, saveSettings } from './db/indexedDb';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [activeMission, setActiveMission] = useState<OutdoorMission | null>(null);
  const [missionToLog, setMissionToLog] = useState<OutdoorMission | null>(null);

  // Load settings on startup
  useEffect(() => {
    getSettings().then((loaded) => {
      setSettings(loaded);
      // Handle reduced motion preference
      if (loaded.prefersReducedMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    });
  }, []);

  const handleUpdateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
    if (newSettings.prefersReducedMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }
  };

  const handleStartMissionActive = (mission: OutdoorMission) => {
    setActiveMission(mission);
    setCurrentRoute('active_mission');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExitActiveMission = () => {
    setActiveMission(null);
    setCurrentRoute('history');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenJournalWithMission = (mission: OutdoorMission) => {
    setMissionToLog(mission);
    setActiveMission(null);
    setCurrentRoute('journal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7faf7] text-[#1a3328] font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* Show Top Bar unless in Screen-Free Distraction-Free Exploration Mode */}
      {currentRoute !== 'active_mission' && (
        <Header currentRoute={currentRoute} onNavigate={handleNavigate} />
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentRoute === 'home' && (
          <HomePage onNavigate={handleNavigate} />
        )}

        {currentRoute === 'generator' && (
          <GeneratorPage
            settings={settings}
            onMissionSelected={handleStartMissionActive}
            onNavigate={handleNavigate}
          />
        )}

        {currentRoute === 'active_mission' && activeMission && (
          <MissionActivePage
            mission={activeMission}
            initialSoundEnabled={settings.screenFreeVoiceChime}
            onExit={handleExitActiveMission}
            onOpenJournalWithMission={handleOpenJournalWithMission}
          />
        )}

        {currentRoute === 'journal' && (
          <JournalPage
            initialMissionToLog={missionToLog}
            onClearInitialMission={() => setMissionToLog(null)}
            onNavigateToGenerator={() => handleNavigate('generator')}
          />
        )}

        {currentRoute === 'history' && (
          <HistoryPage
            onSelectMission={handleStartMissionActive}
            onNavigateToGenerator={() => handleNavigate('generator')}
          />
        )}

        {currentRoute === 'settings' && (
          <SettingsPage
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>

      {/* Footer unless in Screen-Free Exploration Mode */}
      {currentRoute !== 'active_mission' && (
        <Footer onNavigate={handleNavigate} />
      )}

      {/* PWA / Network Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
