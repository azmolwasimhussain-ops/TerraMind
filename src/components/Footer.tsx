import React from 'react';
import { Compass, Shield } from 'lucide-react';

interface FooterProps {
  onNavigate: (route: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full border-t border-[#dbe6df] bg-[#eef4f0] text-[#466557] py-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="space-y-2 max-w-md">
          <div className="flex items-center gap-2">
            <Compass className="h-5 w-5 text-[#1b5e46]" />
            <span className="font-serif-nature text-lg font-semibold text-[#0f291e]">
              TerraMind
            </span>
            <span className="text-xs text-[#527d6a] ml-1">· Touch Grass 2026</span>
          </div>
          <p className="text-xs text-[#527263] leading-relaxed">
            AI designed to help you disconnect from screens and reconnect with the living world.
            Zero cloud telemetry, 100% private IndexedDB storage, and optional local Ollama intelligence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-[#466557]">
          <button
            onClick={() => onNavigate('home')}
            className="hover:text-[#0f291e] transition font-medium"
          >
            Overview
          </button>
          <button
            onClick={() => onNavigate('generator')}
            className="hover:text-[#0f291e] transition font-medium"
          >
            Mission Generator
          </button>
          <button
            onClick={() => onNavigate('journal')}
            className="hover:text-[#0f291e] transition font-medium"
          >
            Field Journal
          </button>
          <button
            onClick={() => onNavigate('history')}
            className="hover:text-[#0f291e] transition font-medium"
          >
            History & Progress
          </button>
          <button
            onClick={() => onNavigate('settings')}
            className="hover:text-[#0f291e] transition font-medium"
          >
            Settings & Diagnostics
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-xs text-[#5c806f]">
          <span className="flex items-center gap-1.5 font-medium">
            <Shield className="h-3.5 w-3.5 text-[#1b5e46]" />
            Local-First & Private
          </span>
          <span className="hidden sm:inline" aria-hidden="true">·</span>
          <span>DEV Challenge Hacktoberfest 2026</span>
        </div>
      </div>
    </footer>
  );
};
