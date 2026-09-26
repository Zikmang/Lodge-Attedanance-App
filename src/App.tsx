import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Occupant,
  AttendanceMap,
  AttendanceStatus,
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
} from './services/storage';
import { Header } from './components/Header';
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

  // Occupants & Attendance
  const [occupants, setOccupants] = useState<Occupant[]>(() => getCachedOccupants());
  const [attendance, setAttendance] = useState<AttendanceMap>(() =>
    getCachedAttendance(getTodayKey())
  );

  const [isSyncing, setIsSyncing] = useState(false);
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

  // Synchronize from Google Sheets (Active occupants + Today's attendance)
  const syncFromSheet = useCallback(
    async (urlToUse?: string, showSuccessToast = false) => {
      const targetUrl = urlToUse || webAppUrl;
      if (!targetUrl) return;

      setIsSyncing(true);
      const todayKey = getTodayKey();

      try {
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
          setAttendance(sheetAttendance);
          saveCachedAttendance(todayKey, sheetAttendance);
        }

        if (showSuccessToast) {
          showToast('Updated from Google Sheet');
        }
      } catch (err: any) {
        console.error('Failed to sync from Google Sheet:', err);
        if (showSuccessToast) {
          showToast('Failed to sync: ' + (err.message || 'Check connection'));
        }
      } finally {
        setIsSyncing(false);
      }
    },
    [webAppUrl, showToast]
  );

  // Initial load when app opens
  useEffect(() => {
    if (webAppUrl) {
      syncFromSheet(webAppUrl);
    }
  }, [webAppUrl, syncFromSheet]);

  // Auto-refresh when user returns to app/tab
  useEffect(() => {
    const handleFocus = () => {
      if (webAppUrl) {
        syncFromSheet(webAppUrl);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [webAppUrl, syncFromSheet]);

  // Save attendance status for an occupant
  const handleUpdateStatus = useCallback(
    async (occupant: Occupant, status: AttendanceStatus) => {
      const todayKey = getTodayKey();
      const occupantKey = occupant.name;

      // Optimistically update local state & cache
      setAttendance((prev) => {
        const next = { ...prev, [occupantKey]: status, [occupant.id]: status };
        saveCachedAttendance(todayKey, next);
        return next;
      });

      // Send to Google Sheets if connected
      if (webAppUrl) {
        try {
          await apiSetAttendance(webAppUrl, todayKey, occupant.name, status);
        } catch (err: any) {
          console.error('Failed to save attendance to Google Sheet:', err);
          showToast('Failed to save to Google Sheet');
        }
      }
    },
    [webAppUrl, showToast]
  );

  // Set all to Present
  const handleResetAllPresent = useCallback(async () => {
    const todayKey = getTodayKey();
    const resetMap: AttendanceMap = {};

    occupants.forEach((o) => {
      resetMap[o.name] = 'PRESENT';
      resetMap[o.id] = 'PRESENT';
    });

    setAttendance(resetMap);
    saveCachedAttendance(todayKey, resetMap);
    showToast('All set to Present');

    if (webAppUrl) {
      try {
        // Send updates to Google Sheet
        const promises = occupants.map((o) =>
          apiSetAttendance(webAppUrl, todayKey, o.name, 'PRESENT')
        );
        await Promise.all(promises);
      } catch (err: any) {
        console.error('Failed to update all in Google Sheet:', err);
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
        isSyncing={isSyncing}
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
            isSyncing={isSyncing}
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
            isSyncing={isSyncing}
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
