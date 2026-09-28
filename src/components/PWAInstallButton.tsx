import React, { useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface Props {
  variant?: 'header' | 'card';
}

export const PWAInstallButton: React.FC<Props> = ({ variant = 'header' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running in standalone mode as installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Variant for Header (compact button)
  if (variant === 'header') {
    if (isInstallable) {
      return (
        <button
          type="button"
          onClick={install}
          title="Install Lodge App"
          className="text-xs font-medium text-[#1D1D1F] bg-[#EBEBEF] hover:bg-[#E0E0E5] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#1D1D1F]" />
          <span className="hidden sm:inline">Install</span>
        </button>
      );
    }

    if (isIOS) {
      return (
        <>
          <button
            type="button"
            onClick={() => setShowIOSGuide(true)}
            title="Install on iPhone / iPad"
            className="text-xs font-medium text-[#1D1D1F] bg-[#EBEBEF] hover:bg-[#E0E0E5] px-2.5 py-1 rounded-full inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Smartphone className="w-3.5 h-3.5 text-[#1D1D1F]" />
            <span className="hidden sm:inline">Install</span>
          </button>

          {showIOSGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    Install Lodge Attendance
                  </h3>
                  <button
                    onClick={() => setShowIOSGuide(false)}
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="py-4 space-y-2 text-xs text-[#636366] leading-relaxed">
                  <p>
                    1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.
                  </p>
                  <p>
                    2. Scroll down and tap <strong>Add to Home Screen</strong>.
                  </p>
                  <p>
                    3. Tap <strong>Add</strong> to use Lodge as an offline standalone app.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-full py-2.5 bg-[#1D1D1F] text-white text-xs font-medium rounded-xl hover:bg-[#2C2C2E] transition-colors cursor-pointer"
                >
                  Got it
                </button>
              </div>
            </div>
          )}
        </>
      );
    }

    return null;
  }

  // Variant for MainMenuView card
  if (isInstallable || isIOS) {
    return (
      <>
        <div className="bg-white rounded-2xl p-4 border border-[#E5E5EA] shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#1D1D1F] text-white flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#1D1D1F] truncate">
                Install Lodge Attendance
              </p>
              <p className="text-[11px] text-[#86868B] truncate">
                Work offline and launch from home screen
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={isInstallable ? install : () => setShowIOSGuide(true)}
            className="px-3 py-1.5 bg-[#1D1D1F] hover:bg-[#2C2C2E] active:scale-98 text-white rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer"
          >
            Install
          </button>
        </div>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA]">
                <h3 className="text-sm font-semibold text-[#1D1D1F]">
                  Install on iPhone / iPad
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="py-4 space-y-2 text-xs text-[#636366] leading-relaxed">
                <p>
                  1. Tap the <strong>Share</strong> button in Safari's bottom toolbar.
                </p>
                <p>
                  2. Scroll down and tap <strong>Add to Home Screen</strong>.
                </p>
                <p>
                  3. Tap <strong>Add</strong> in the top right corner.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 bg-[#1D1D1F] text-white text-xs font-medium rounded-xl hover:bg-[#2C2C2E] transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
