import React, { useState } from 'react';
import { Download, Check, HelpCircle, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  if (isInstalled || justInstalled) {
    return (
      <span className="hidden lg:flex items-center gap-1.5 text-xs text-[#1b5e46] font-medium px-2.5 py-1 bg-[#eef6f1] rounded-lg border border-[#bcdbc8]">
        <Check className="h-3.5 w-3.5" />
        Installed
      </span>
    );
  }

  if (isInstallable) {
    return (
      <button
        onClick={async () => {
          const success = await install();
          if (success) setJustInstalled(true);
        }}
        className="flex items-center gap-1.5 rounded-lg border border-[#bcdbc8] bg-[#eef6f1] px-3 py-1.5 text-xs font-semibold text-[#1b5e46] hover:bg-[#dff0e6] transition whitespace-nowrap shadow-xs"
        title="Install TerraMind for offline home-screen access"
      >
        <Download className="h-3.5 w-3.5 text-[#1b5e46]" />
        Install App
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#bcdbc8] bg-[#eef6f1] px-3 py-1.5 text-xs font-semibold text-[#1b5e46] hover:bg-[#dff0e6] transition whitespace-nowrap shadow-xs"
        >
          <Download className="h-3.5 w-3.5 text-[#1b5e46]" />
          Install iOS
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl border border-[#bcdbc8] bg-white p-6 shadow-2xl text-[#0f291e]">
              <div className="flex items-center justify-between mb-3 border-b border-[#e2ede5] pb-3">
                <h3 className="text-base font-semibold text-[#0f291e] flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-[#1b5e46]" />
                  Install on iOS Safari
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-[#527364] hover:text-[#0f291e]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="text-xs text-[#385646] leading-relaxed mb-4">
                1. Tap the <strong className="text-[#0f291e]">Share</strong> button (square with arrow) in your Safari toolbar.<br />
                2. Scroll down and tap <strong className="text-[#0f291e]">Add to Home Screen</strong>.<br />
                3. Open TerraMind directly from your home screen for full offline support outdoors!
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-[#1b5e46] py-2.5 text-xs font-semibold text-white hover:bg-[#134835] transition shadow-sm"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
