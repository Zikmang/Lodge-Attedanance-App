import React from 'react';
import { RefreshCw, Settings2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

export type SyncState = 'online' | 'offline' | 'syncing' | 'synced';

interface Props {
  hasApi: boolean;
  isOnline: boolean;
  syncState: SyncState;
  pendingCount: number;
  onRefresh: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<Props> = ({
  hasApi,
  isOnline,
  syncState,
  pendingCount,
  onRefresh,
  onOpenSettings,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#F8F8FA]/90 backdrop-blur-md border-b border-[#E5E5EA]/70 transition-colors">
      <div className="max-w-xl mx-auto px-4 sm:px-5 h-14 flex items-center justify-between gap-2">
        {/* Brand & Connection Status Indicator */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold tracking-tight text-[#1D1D1F] shrink-0">
            Lodge Attendance
          </span>

          {/* Connection status indicator */}
          {!hasApi ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#86868B] bg-[#EFEFF2] px-2 py-0.5 rounded-full shrink-0">
              Local Mode
            </span>
          ) : syncState === 'syncing' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#1D1D1F] bg-[#EAEAEF] px-2 py-0.5 rounded-full shrink-0">
              <RefreshCw className="w-2.5 h-2.5 animate-spin text-[#1D1D1F]" />
              <span>Syncing...</span>
            </span>
          ) : !isOnline || syncState === 'offline' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
              <span className="hidden sm:inline">Offline — changes will sync when connected</span>
              <span className="sm:hidden">Offline</span>
            </span>
          ) : syncState === 'synced' ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2D7D46] bg-[#EBF7EE] border border-[#D1EBD9] px-2 py-0.5 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D46]" />
              <span>Synced</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2D7D46] bg-[#EBF7EE] border border-[#D1EBD9] px-2 py-0.5 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D46]" />
              <span>Online</span>
            </span>
          )}
        </div>

        {/* Actions: Install, Refresh, Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton variant="header" />

          {hasApi && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={syncState === 'syncing' || !isOnline}
              title="Refresh from Google Sheet"
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#EAEAEF] transition-colors cursor-pointer disabled:opacity-40"
              aria-label="Refresh from Google Sheet"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${syncState === 'syncing' ? 'animate-spin text-[#1D1D1F]' : ''}`}
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

      {/* Subtle Offline Banner on Mobile when disconnected */}
      {!isOnline && hasApi && (
        <div className="sm:hidden bg-amber-50 border-t border-amber-200/50 px-4 py-1 text-[11px] font-medium text-amber-800 flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Offline — changes will sync when connected</span>
          {pendingCount > 0 && (
            <span className="text-[10px] text-amber-700 bg-amber-100/80 px-1.5 py-0.2 rounded-full ml-1">
              {pendingCount} pending
            </span>
          )}
        </div>
      )}
    </header>
  );
};
