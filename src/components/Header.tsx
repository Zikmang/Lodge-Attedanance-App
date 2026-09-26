import React from 'react';
import { RefreshCw, Settings2, CloudCheck, CloudOff } from 'lucide-react';

interface Props {
  hasApi: boolean;
  isSyncing: boolean;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<Props> = ({
  hasApi,
  isSyncing,
  onRefresh,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F8FA]/80 backdrop-blur-md border-b border-[#E5E5EA]/70 transition-colors">
      <div className="max-w-xl mx-auto px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tracking-tight text-[#1D1D1F]">
            Lodge Attendance
          </span>
          {hasApi ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2D7D46] bg-[#EBF7EE] border border-[#D1EBD9] px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D46]" />
              Synced
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#86868B] bg-[#EFEFF2] px-2 py-0.5 rounded-full">
              Local Mode
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {hasApi && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isSyncing}
              title="Refresh from Google Sheet"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#EAEAEF] transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Refresh from Google Sheet"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-[#1D1D1F]' : ''}`}
              />
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            title="Google Sheet connection settings"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#EAEAEF] transition-colors cursor-pointer"
            aria-label="Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
