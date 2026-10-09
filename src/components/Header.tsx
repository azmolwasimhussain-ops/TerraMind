import React, { useState } from 'react';
import { Compass, Menu, X, ArrowUpRight, Leaf } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', label: 'Overview' },
    { id: 'generator', label: 'Missions' },
    { id: 'journal', label: 'Nature Journal' },
    { id: 'history', label: 'History' },
    { id: 'settings', label: 'Settings' },
  ];

  const handleNavClick = (routeId: string) => {
    onNavigate(routeId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="w-full border-b border-[#e2ece5] bg-white/90 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 py-4 sm:px-6 lg:px-8">
        {/* Brand Logo & Name */}
        <button
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-2.5 text-left transition hover:opacity-90 group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef6f1] border border-[#b8ddcb] text-[#1b5e46] group-hover:bg-[#1b5e46] group-hover:text-white transition-colors">
            <Leaf className="h-5 w-5" />
          </div>
          <span className="font-serif-nature text-2xl font-bold tracking-tight text-[#0f291e] whitespace-nowrap shrink-0">
            TerraMind
          </span>
        </button>

        {/* Clean Editorial Nav Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#466557]">
          {navItems.map((item) => {
            const isActive = currentRoute === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`transition-colors whitespace-nowrap shrink-0 py-1 ${
                  isActive
                    ? 'text-[#1b5e46] font-semibold border-b-2 border-[#1b5e46]'
                    : 'text-[#466557] hover:text-[#0f291e]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Primary Action Button */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <PWAInstallButton />
          <button
            onClick={() => handleNavClick('generator')}
            className="flex items-center gap-1.5 rounded-full bg-[#1b5e46] hover:bg-[#134835] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all active:scale-[0.98]"
          >
            <span>Start Mission</span>
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-100" />
          </button>
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-[#466557] hover:bg-[#eef4f0] hover:text-[#0f291e]"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#e2ece5] bg-white px-4 py-4 sm:px-6 shadow-xl">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`text-left py-2.5 px-3 rounded-xl text-sm font-medium transition ${
                  currentRoute === item.id
                    ? 'bg-[#eef6f1] text-[#1b5e46] font-semibold border border-[#b8ddcb]'
                    : 'text-[#466557] hover:bg-[#f3f7f4] hover:text-[#0f291e]'
                }`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-3 border-t border-[#e2ece5] flex flex-col gap-2">
              <PWAInstallButton />
              <button
                onClick={() => handleNavClick('generator')}
                className="w-full text-center rounded-full bg-[#1b5e46] py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#134835] transition"
              >
                Start Outdoor Mission
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
