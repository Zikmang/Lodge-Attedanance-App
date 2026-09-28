import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Occupant,
  AttendanceMap,
  AttendanceStatus,
  ExcuseStatus,
  AttendanceRecord,
} from './types/attendance';
import {
  apiFetchOccupants,
  apiFetchAttendance,
  apiSetAttendance,
  apiAddOccupant,
  apiEditOccupant,
  apiRemoveOccupant,
} from './services/api';
import {
  getCachedOccupants,
  saveCachedOccupants,
  getCachedAttendance,
  saveCachedAttendance,
  getTodayKey,
  getWebAppUrl,
  saveWebAppUrl,
  enqueuePendingSync,
  getPendingSyncQueue,
  removePendingSyncItem,
  getPendingSyncCount,
} from './services/storage';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Header, SyncState } from './components/Header';
import { MainMenuView } from './components/MainMenuView';
import { AttendanceView } from './components/AttendanceView';
import { ManageOccupantsView } from './components/ManageOccupantsView';
import { ReportModal } from './components/ReportModal';
import { SheetConfigModal } from './components/SheetConfigModal';
import { Toast } from './components/Toast';

type AppView = 'MENU' | 'ATTENDANCE' | 'MANAGE_OCCUPANTS';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('MENU');
  const [webAppUrl, setWebAppUrlState] = useState<string | null>(() => getWebAppUrl());

  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState<number>(() => getPendingSyncCount());
  const [syncState, setSyncState] = useState<SyncState>(() => (!navigator.onLine ? 'offline' : 'online'));
  const syncStateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFlushingQueueRef = useRef(false);

  // Occupants & Attendance
  const [occupants, setOccupants] = useState<Occupant[]>(() => getCachedOccupants());
  const [attendance, setAttendance] = useState<AttendanceMap>(() =>
    getCachedAttendance(getTodayKey())
  );

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isInitialMount = useRef(true);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 2400);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Flush pending offline changes to Google Sheets
  const flushPendingQueue = useCallback(
    async (urlToUse?: string) => {
      const targetUrl = urlToUse || webAppUrl;
      if (!targetUrl || !navigator.onLine || isFlushingQueueRef.current) return;

      const queue = getPendingSyncQueue();
      if (queue.length === 0) return;

      isFlushingQueueRef.current = true;
      setSyncState('syncing');

      let successCount = 0;
      for (const item of queue) {
        try {
          await apiSetAttendance(
            targetUrl,
            item.date,
            item.occupantName,
            item.status,
            item.excuseStatus,
            item.excuseReason
          );
          removePendingSyncItem(item.id);
          successCount++;
        } catch (err) {
          console.warn('Could not sync pending item for', item.occupantName, err);
          break;
        }
      }

      const remaining = getPendingSyncCount();
      setPendingCount(remaining);
      isFlushingQueueRef.current = false;

      if (remaining === 0 && successCount > 0) {
        setSyncState('synced');
        if (syncStateTimerRef.current) clearTimeout(syncStateTimerRef.current);
        syncStateTimerRef.current = setTimeout(() => {
          setSyncState('online');
        }, 2500);
        showToast('Offline changes synced with Google Sheet');
      } else if (!navigator.onLine) {
        setSyncState('offline');
      } else {
        setSyncState('online');
      }
    },
    [webAppUrl, showToast]
  );

  // Synchronize from Google Sheets (Active occupants + Today's attendance)
  const syncFromSheet = useCallback(
    async (urlToUse?: string, showSuccessToast = false) => {
      const targetUrl = urlToUse || webAppUrl;
      if (!targetUrl) return;

      if (!navigator.onLine) {
        setSyncState('offline');
        if (showSuccessToast) {
          showToast('Offline — changes will sync when connected');
        }
        return;
      }

      setSyncState('syncing');
      const todayKey = getTodayKey();

      try {
        // First flush any pending offline items
        if (getPendingSyncCount() > 0) {
          await flushPendingQueue(targetUrl);
        }

        // Parallel fetch for speed
        const [sheetOccupants, sheetAttendance] = await Promise.all([
          apiFetchOccupants(targetUrl),
          apiFetchAttendance(targetUrl, todayKey),
        ]);

        if (Array.isArray(sheetOccupants) && sheetOccupants.length > 0) {
          setOccupants(sheetOccupants);
          saveCachedOccupants(sheetOccupants);
        }

        if (sheetAttendance && typeof sheetAttendance === 'object') {
          // Merge with any locally pending items for today so local changes aren't wiped
          const pending = getPendingSyncQueue();
          const mergedAttendance = { ...sheetAttendance };
          pending.forEach((item) => {
            if (item.date === todayKey) {
              const record: AttendanceRecord = {
                status: item.status,
                excuseStatus: item.excuseStatus,
                excuseReason: item.excuseReason,
              };
              mergedAttendance[item.occupantName] = record;
            }
          });

          setAttendance(mergedAttendance);
          saveCachedAttendance(todayKey, mergedAttendance);
        }

        setSyncState('synced');
        if (syncStateTimerRef.current) clearTimeout(syncStateTimerRef.current);
        syncStateTimerRef.current = setTimeout(() => {
          setSyncState('online');
        }, 2500);

        if (showSuccessToast) {
          showToast('Synced with Google Sheet');
        }
      } catch (err: any) {
        console.error('Failed to sync from Google Sheet:', err);
        if (!navigator.onLine) {
          setSyncState('offline');
        } else {
          setSyncState('online');
        }
        if (showSuccessToast) {
          showToast('Failed to sync: ' + (err.message || 'Check connection'));
        }
      }
    },
    [webAppUrl, showToast, flushPendingQueue]
  );

  // Connectivity listener: flush queue and sync when online
  useEffect(() => {
    if (isOnline) {
      if (webAppUrl) {
        if (getPendingSyncCount() > 0) {
          flushPendingQueue(webAppUrl);
        } else {
          setSyncState('online');
          syncFromSheet(webAppUrl);
        }
      } else {
        setSyncState('online');
      }
    } else {
      setSyncState('offline');
    }
  }, [isOnline, webAppUrl, flushPendingQueue, syncFromSheet]);

  // Auto-refresh when user returns to app/tab
  useEffect(() => {
    const handleFocus = () => {
      if (webAppUrl && navigator.onLine) {
        syncFromSheet(webAppUrl);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [webAppUrl, syncFromSheet]);

  // Save attendance status and optional excuse for an occupant
  const handleUpdateStatus = useCallback(
    async (
      occupant: Occupant,
      status: AttendanceStatus,
      excuseStatus: ExcuseStatus = 'none',
      excuseReason: string = ''
    ) => {
      const todayKey = getTodayKey();
      const occupantKey = occupant.name;

      const cleanExcuseStatus: ExcuseStatus = status === 'ABSENT' ? excuseStatus : 'none';
      const cleanExcuseReason: string =
        status === 'ABSENT' && cleanExcuseStatus === 'provided' ? excuseReason : '';

      const record: AttendanceRecord = {
        status,
        excuseStatus: cleanExcuseStatus,
        excuseReason: cleanExcuseReason,
      };

      // 1. Immediately update local state & fast cache (optimistic / offline-first)
      setAttendance((prev) => {
        const next = { ...prev, [occupantKey]: record, [occupant.id]: record };
        saveCachedAttendance(todayKey, next);
        return next;
      });

      // 2. If disconnected or no Web App URL configured, queue locally
      if (!navigator.onLine || !webAppUrl) {
        enqueuePendingSync({
          date: todayKey,
          occupantName: occupant.name,
          status,
          excuseStatus: cleanExcuseStatus,
          excuseReason: cleanExcuseReason,
        });
        setPendingCount(getPendingSyncCount());
        setSyncState('offline');
        return;
      }

      // 3. Online with backend: send to Google Sheet
      setSyncState('syncing');
      try {
        await apiSetAttendance(
          webAppUrl,
          todayKey,
          occupant.name,
          status,
          cleanExcuseStatus,
          cleanExcuseReason
        );
        removePendingSyncItem(`${todayKey}:${occupant.name}`);
        setPendingCount(getPendingSyncCount());
        setSyncState('synced');
        if (syncStateTimerRef.current) clearTimeout(syncStateTimerRef.current);
        syncStateTimerRef.current = setTimeout(() => {
          setSyncState('online');
        }, 2000);
      } catch (err: any) {
        console.warn('Network issue saving attendance, enqueuing for offline sync:', err);
        enqueuePendingSync({
          date: todayKey,
          occupantName: occupant.name,
          status,
          excuseStatus: cleanExcuseStatus,
          excuseReason: cleanExcuseReason,
        });
        setPendingCount(getPendingSyncCount());
        if (!navigator.onLine) {
          setSyncState('offline');
        } else {
          setSyncState('online');
        }
      }
    },
    [webAppUrl]
  );

  // Set all to Present
  const handleResetAllPresent = useCallback(async () => {
    const todayKey = getTodayKey();
    const resetMap: AttendanceMap = {};

    occupants.forEach((o) => {
      const record: AttendanceRecord = {
        status: 'PRESENT',
        excuseStatus: 'none',
        excuseReason: '',
      };
      resetMap[o.name] = record;
      resetMap[o.id] = record;
    });

    setAttendance(resetMap);
    saveCachedAttendance(todayKey, resetMap);
    showToast('All set to Present');

    if (!webAppUrl || !navigator.onLine) {
      occupants.forEach((o) => {
        enqueuePendingSync({
          date: todayKey,
          occupantName: o.name,
          status: 'PRESENT',
          excuseStatus: 'none',
          excuseReason: '',
        });
      });
      setPendingCount(getPendingSyncCount());
      if (!navigator.onLine) {
        setSyncState('offline');
      }
      return;
    }

    setSyncState('syncing');
    try {
      const promises = occupants.map((o) =>
        apiSetAttendance(webAppUrl, todayKey, o.name, 'PRESENT', 'none', '')
      );
      await Promise.all(promises);

      occupants.forEach((o) => {
        removePendingSyncItem(`${todayKey}:${o.name}`);
      });
      setPendingCount(getPendingSyncCount());
      setSyncState('synced');
      if (syncStateTimerRef.current) clearTimeout(syncStateTimerRef.current);
      syncStateTimerRef.current = setTimeout(() => {
        setSyncState('online');
      }, 2500);
    } catch (err: any) {
      console.warn('Failed to update all online, queued for sync:', err);
      occupants.forEach((o) => {
        enqueuePendingSync({
          date: todayKey,
          occupantName: o.name,
          status: 'PRESENT',
          excuseStatus: 'none',
          excuseReason: '',
        });
      });
      setPendingCount(getPendingSyncCount());
      if (!navigator.onLine) {
        setSyncState('offline');
      } else {
        setSyncState('online');
      }
    }
  }, [occupants, webAppUrl, showToast]);

  // Add Occupant: updates Google Sheet and refreshes list
  const handleAddOccupant = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    if (webAppUrl) {
      await apiAddOccupant(webAppUrl, trimmed);
      // Immediately reload list from sheet to ensure source-of-truth consistency
      await syncFromSheet(webAppUrl);
    } else {
      const newOccupant: Occupant = {
        id: `occ-${encodeURIComponent(trimmed)}`,
        name: trimmed,
        active: true,
        rowIndex: occupants.length + 2,
      };
      const updated = [...occupants, newOccupant];
      setOccupants(updated);
      saveCachedOccupants(updated);
    }
  };

  // Edit Occupant: updates Google Sheet and refreshes list
  const handleEditOccupant = async (occupant: Occupant, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    if (webAppUrl) {
      await apiEditOccupant(webAppUrl, occupant.name, trimmed);
      await syncFromSheet(webAppUrl);
    } else {
      const updated = occupants.map((o) =>
        o.name === occupant.name ? { ...o, name: trimmed } : o
      );
      setOccupants(updated);
      saveCachedOccupants(updated);
    }
  };

  // Remove Occupant: deactivates in Google Sheet (Active = FALSE) and refreshes
  const handleRemoveOccupant = async (occupant: Occupant) => {
    if (webAppUrl) {
      await apiRemoveOccupant(webAppUrl, occupant.name);
      await syncFromSheet(webAppUrl);
    } else {
      const updated = occupants.filter((o) => o.name !== occupant.name);
      setOccupants(updated);
      saveCachedOccupants(updated);
    }

    // Clean up attendance entry
    setAttendance((prev) => {
      const next = { ...prev };
      delete next[occupant.name];
      delete next[occupant.id];
      saveCachedAttendance(getTodayKey(), next);
      return next;
    });
  };

  const handleSaveWebAppUrl = async (newUrl: string | null) => {
    saveWebAppUrl(newUrl);
    setWebAppUrlState(newUrl);
    if (newUrl) {
      await syncFromSheet(newUrl, true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8FA] flex flex-col font-sans text-[#1D1D1F] antialiased">
      {/* Calm Apple HIG Header */}
      <Header
        hasApi={Boolean(webAppUrl)}
        isOnline={isOnline}
        syncState={syncState}
        pendingCount={pendingCount}
        onRefresh={() => syncFromSheet(undefined, true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {currentView === 'MENU' && (
          <MainMenuView
            occupants={occupants}
            hasApi={Boolean(webAppUrl)}
            attendance={attendance}
            onSelectTakeAttendance={() => setCurrentView('ATTENDANCE')}
            onSelectManageOccupants={() => setCurrentView('MANAGE_OCCUPANTS')}
            onOpenSheetConfig={() => setIsSettingsOpen(true)}
          />
        )}

        {currentView === 'ATTENDANCE' && (
          <AttendanceView
            occupants={occupants}
            attendance={attendance}
            isSyncing={syncState === 'syncing'}
            onUpdateStatus={handleUpdateStatus}
            onResetAllPresent={handleResetAllPresent}
            onGenerateReport={() => setIsReportOpen(true)}
            onRefresh={() => syncFromSheet(undefined, true)}
            onBackToMenu={() => setCurrentView('MENU')}
          />
        )}

        {currentView === 'MANAGE_OCCUPANTS' && (
          <ManageOccupantsView
            occupants={occupants}
            hasApi={Boolean(webAppUrl)}
            isSyncing={syncState === 'syncing'}
            onAddOccupant={handleAddOccupant}
            onEditOccupant={handleEditOccupant}
            onRemoveOccupant={handleRemoveOccupant}
            onRefreshFromSheet={() => syncFromSheet(undefined, true)}
            onOpenSheetConfig={() => setIsSettingsOpen(true)}
            onBackToMenu={() => setCurrentView('MENU')}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* Document Report Modal */}
      <ReportModal
        isOpen={isReportOpen}
        dateKey={getTodayKey()}
        occupants={occupants}
        attendance={attendance}
        onClose={() => setIsReportOpen(false)}
        onShowToast={showToast}
      />

      {/* Google Sheet Web App Sync Settings Modal */}
      <SheetConfigModal
        isOpen={isSettingsOpen}
        currentUrl={webAppUrl}
        onSaveUrl={handleSaveWebAppUrl}
        onClose={() => setIsSettingsOpen(false)}
        onShowToast={showToast}
      />

      {/* Subtle Toast Feedback */}
      <Toast message={toastMessage} />
    </div>
  );
}
