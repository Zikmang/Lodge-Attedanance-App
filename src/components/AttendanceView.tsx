import React, { useState, useMemo, useRef } from 'react';
import { ChevronLeft, Search, RotateCcw, FileText, RefreshCw } from 'lucide-react';
import { Occupant, AttendanceMap, AttendanceStatus, ExcuseStatus, getAttendanceRecord } from '../types/attendance';
import { formatDateSimple, getTodayKey } from '../services/storage';

interface Props {
  occupants: Occupant[];
  attendance: AttendanceMap;
  isSyncing: boolean;
  onUpdateStatus: (
    occupant: Occupant,
    status: AttendanceStatus,
    excuseStatus?: ExcuseStatus,
    excuseReason?: string
  ) => void;
  onResetAllPresent: () => void;
  onGenerateReport: () => void;
  onRefresh: () => void;
  onBackToMenu: () => void;
}

export const AttendanceView: React.FC<Props> = ({
  occupants,
  attendance,
  isSyncing,
  onUpdateStatus,
  onResetAllPresent,
  onGenerateReport,
  onRefresh,
  onBackToMenu,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({});
  const reasonDebounceRef = useRef<Record<string, NodeJS.Timeout>>({});

  const dateKey = getTodayKey();
  const simpleDate = formatDateSimple(dateKey);

  // Filtered occupants
  const filteredOccupants = useMemo(() => {
    if (!searchQuery.trim()) return occupants;
    const q = searchQuery.toLowerCase();
    return occupants.filter((o) => o.name.toLowerCase().includes(q));
  }, [occupants, searchQuery]);

  // Compute live totals based on occupant.name or occupant.id
  const totals = useMemo(() => {
    let present = 0;
    let absent = 0;
    let pass = 0;
    let duty = 0;
    let excused = 0;
    let unexcused = 0;

    occupants.forEach((o) => {
      const record = getAttendanceRecord(attendance[o.name] || attendance[o.id]);
      if (record.status === 'PRESENT') {
        present++;
      } else if (record.status === 'ABSENT') {
        absent++;
        if (record.excuseStatus === 'provided') {
          excused++;
        } else {
          unexcused++;
        }
      } else if (record.status === 'PASS') {
        pass++;
      } else if (record.status === 'DUTY') {
        duty++;
      }
    });

    return {
      present,
      absent,
      pass,
      duty,
      excused,
      unexcused,
      total: occupants.length,
    };
  }, [occupants, attendance]);

  const handleStatusClick = (occupant: Occupant, newStatus: AttendanceStatus) => {
    // If selecting ABSENT and occupant wasn't already absent, default excuse is "none"
    if (newStatus === 'ABSENT') {
      const currentRecord = getAttendanceRecord(attendance[occupant.name] || attendance[occupant.id]);
      if (currentRecord.status === 'ABSENT') {
        // Keep existing excuse if already absent
        return;
      }
      onUpdateStatus(occupant, 'ABSENT', 'none', '');
    } else {
      // For Present, Pass, Duty: clear excuse state immediately
      setReasonInputs((prev) => {
        const next = { ...prev };
        delete next[occupant.name];
        return next;
      });
      onUpdateStatus(occupant, newStatus, 'none', '');
    }
  };

  const handleExcuseToggle = (occupant: Occupant, newExcuseStatus: ExcuseStatus) => {
    if (newExcuseStatus === 'none') {
      // Clear excuse reason when changing back to "Without excuse"
      setReasonInputs((prev) => {
        const next = { ...prev };
        delete next[occupant.name];
        return next;
      });
      onUpdateStatus(occupant, 'ABSENT', 'none', '');
    } else {
      const currentReason = reasonInputs[occupant.name] ?? '';
      onUpdateStatus(occupant, 'ABSENT', 'provided', currentReason);
    }
  };

  const handleReasonChange = (occupant: Occupant, newReason: string) => {
    setReasonInputs((prev) => ({ ...prev, [occupant.name]: newReason }));

    if (reasonDebounceRef.current[occupant.name]) {
      clearTimeout(reasonDebounceRef.current[occupant.name]);
    }

    reasonDebounceRef.current[occupant.name] = setTimeout(() => {
      onUpdateStatus(occupant, 'ABSENT', 'provided', newReason);
    }, 500);
  };

  const handleReasonBlur = (occupant: Occupant) => {
    if (reasonDebounceRef.current[occupant.name]) {
      clearTimeout(reasonDebounceRef.current[occupant.name]);
    }
    const val = reasonInputs[occupant.name];
    if (val !== undefined) {
      onUpdateStatus(occupant, 'ABSENT', 'provided', val);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full px-5 pt-4 pb-28 min-h-[calc(100vh-56px)] flex flex-col">
      {/* Back button & quick action */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToMenu}
          type="button"
          className="inline-flex items-center gap-0.5 text-sm font-normal text-[#1D1D1F] hover:text-[#86868B] transition-colors -ml-1.5 px-1 py-1 cursor-pointer"
        >
          <ChevronLeft className="w-5 h-5 text-[#86868B]" />
          <span>Home</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={isSyncing}
            type="button"
            className="text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full hover:bg-[#EAEAEF] cursor-pointer disabled:opacity-50"
            title="Check for updates from other phones"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-[#1D1D1F]' : ''}`} />
            <span>Sync</span>
          </button>

          <button
            onClick={onResetAllPresent}
            type="button"
            className="text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full hover:bg-[#EAEAEF] cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Set all Present</span>
          </button>
        </div>
      </div>

      {/* Screen Title */}
      <div className="space-y-1 mb-5">
        <h1 className="text-2xl sm:text-[28px] font-semibold text-[#1D1D1F] tracking-tight">
          Today's Attendance
        </h1>
        <p className="text-sm font-medium text-[#86868B]">{simpleDate}</p>
      </div>

      {/* Compact Horizontal Summary */}
      <div className="bg-white rounded-2xl px-3 sm:px-4 py-3 border border-[#E5E5EA] shadow-2xs mb-5 flex items-center justify-between text-xs sm:text-sm">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2D7D46]" />
          <span className="font-semibold text-[#1D1D1F]">{totals.present}</span>
          <span className="text-[#86868B] font-normal">Present</span>
        </div>

        <span className="text-[#E5E5EA]">|</span>

        <div className="flex flex-col items-center">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#C24138]" />
            <span className="font-semibold text-[#1D1D1F]">{totals.absent}</span>
            <span className="text-[#86868B] font-normal">Absent</span>
          </div>
          {totals.absent > 0 && (
            <span className="text-[10px] text-[#86868B] font-normal tracking-tight mt-0.5">
              ({totals.excused} excused, {totals.unexcused} no excuse)
            </span>
          )}
        </div>

        <span className="text-[#E5E5EA]">|</span>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#B46800]" />
          <span className="font-semibold text-[#1D1D1F]">{totals.pass}</span>
          <span className="text-[#86868B] font-normal">Pass</span>
        </div>

        <span className="text-[#E5E5EA]">|</span>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
          <span className="font-semibold text-[#1D1D1F]">{totals.duty}</span>
          <span className="text-[#86868B] font-normal">Duty</span>
        </div>
      </div>

      {/* Search Input (Subtle) */}
      {occupants.length > 5 && (
        <div className="relative mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search occupants"
            className="w-full pl-9 pr-4 py-2 bg-[#EBEBEF]/70 focus:bg-white text-sm text-[#1D1D1F] placeholder:text-[#86868B] rounded-xl border border-transparent focus:border-[#E5E5EA] focus:outline-none transition-all"
          />
          <Search className="w-4 h-4 text-[#86868B] absolute left-3 top-2.5 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-[#86868B] hover:text-[#1D1D1F] cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Occupants List: Clean, Spacious Rows with Apple-style Segmented Controls */}
      <div className="bg-white rounded-2xl border border-[#E5E5EA] shadow-2xs divide-y divide-[#E5E5EA]/70 overflow-hidden">
        {filteredOccupants.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#86868B]">
            No occupants found
          </div>
        ) : (
          filteredOccupants.map((occupant) => {
            const record = getAttendanceRecord(
              attendance[occupant.name] || attendance[occupant.id]
            );
            const currentStatus = record.status;
            const currentReasonValue =
              reasonInputs[occupant.name] !== undefined
                ? reasonInputs[occupant.name]
                : record.excuseReason || '';

            return (
              <div
                key={occupant.id || occupant.name}
                className="p-4 flex flex-col gap-3 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Person's Name: Visually dominant */}
                  <div className="min-w-0 pr-2">
                    <span className="text-base font-medium text-[#1D1D1F] truncate block">
                      {occupant.name}
                    </span>
                  </div>

                  {/* Elegant Compact Segmented Control: Present | Absent | Pass | Duty */}
                  <div
                    className="bg-[#EBEBEF] p-0.5 rounded-xl grid grid-cols-4 sm:flex items-center shrink-0 w-full sm:w-auto"
                    role="group"
                    aria-label={`Attendance status for ${occupant.name}`}
                  >
                    <button
                      type="button"
                      onClick={() => handleStatusClick(occupant, 'PRESENT')}
                      className={`px-2 sm:px-3 py-1.5 rounded-[10px] text-xs font-medium text-center transition-all cursor-pointer ${
                        currentStatus === 'PRESENT'
                          ? 'bg-white text-[#2D7D46] font-semibold shadow-2xs'
                          : 'text-[#636366] hover:text-[#1D1D1F]'
                      }`}
                    >
                      Present
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusClick(occupant, 'ABSENT')}
                      className={`px-2 sm:px-3 py-1.5 rounded-[10px] text-xs font-medium text-center transition-all cursor-pointer ${
                        currentStatus === 'ABSENT'
                          ? 'bg-white text-[#C24138] font-semibold shadow-2xs'
                          : 'text-[#636366] hover:text-[#1D1D1F]'
                      }`}
                    >
                      Absent
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusClick(occupant, 'PASS')}
                      className={`px-2 sm:px-3 py-1.5 rounded-[10px] text-xs font-medium text-center transition-all cursor-pointer ${
                        currentStatus === 'PASS'
                          ? 'bg-white text-[#B46800] font-semibold shadow-2xs'
                          : 'text-[#636366] hover:text-[#1D1D1F]'
                      }`}
                    >
                      Pass
                    </button>

                    <button
                      type="button"
                      onClick={() => handleStatusClick(occupant, 'DUTY')}
                      className={`px-2 sm:px-3 py-1.5 rounded-[10px] text-xs font-medium text-center transition-all cursor-pointer ${
                        currentStatus === 'DUTY'
                          ? 'bg-white text-[#2563EB] font-semibold shadow-2xs'
                          : 'text-[#636366] hover:text-[#1D1D1F]'
                      }`}
                    >
                      Duty
                    </button>
                  </div>
                </div>

                {/* Excuse Controls: Only revealed when status = ABSENT */}
                {currentStatus === 'ABSENT' && (
                  <div className="mt-1 pt-3 border-t border-[#E5E5EA]/70 flex flex-col gap-2.5 animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[#86868B]">
                        Excuse
                      </span>

                      {/* Segmented control: Without excuse | With excuse */}
                      <div
                        className="bg-[#EBEBEF] p-0.5 rounded-lg inline-flex items-center self-start sm:self-auto"
                        role="group"
                        aria-label={`Excuse status for ${occupant.name}`}
                      >
                        <button
                          type="button"
                          onClick={() => handleExcuseToggle(occupant, 'none')}
                          className={`px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                            record.excuseStatus === 'none'
                              ? 'bg-white text-[#1D1D1F] font-semibold shadow-2xs'
                              : 'text-[#636366] hover:text-[#1D1D1F]'
                          }`}
                        >
                          Without excuse
                        </button>

                        <button
                          type="button"
                          onClick={() => handleExcuseToggle(occupant, 'provided')}
                          className={`px-2.5 py-1 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                            record.excuseStatus === 'provided'
                              ? 'bg-white text-[#2563EB] font-semibold shadow-2xs'
                              : 'text-[#636366] hover:text-[#1D1D1F]'
                          }`}
                        >
                          With excuse
                        </button>
                      </div>
                    </div>

                    {/* If "With excuse" is selected, reveal Reason for excuse */}
                    {record.excuseStatus === 'provided' && (
                      <div className="flex flex-col gap-1 pt-0.5 animate-in fade-in duration-150">
                        <label className="text-[11px] font-medium text-[#86868B]">
                          Reason for excuse
                        </label>
                        <input
                          type="text"
                          value={currentReasonValue}
                          onChange={(e) => handleReasonChange(occupant, e.target.value)}
                          onBlur={() => handleReasonBlur(occupant)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          placeholder="Enter reason (e.g. Medical appointment, Travel)"
                          className="w-full px-3 py-1.5 bg-[#F8F8FA] focus:bg-white text-xs text-[#1D1D1F] placeholder:text-[#86868B] rounded-xl border border-[#E5E5EA] focus:border-[#1D1D1F] focus:outline-none transition-all"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Prominent Primary Action: Generate Report */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#F8F8FA]/90 backdrop-blur-md border-t border-[#E5E5EA]/70 p-4 z-20">
        <div className="max-w-xl mx-auto">
          <button
            type="button"
            onClick={onGenerateReport}
            className="w-full py-4 px-6 bg-[#1D1D1F] hover:bg-[#2C2C2E] active:scale-[0.99] text-white rounded-2xl font-medium text-base tracking-tight shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <FileText className="w-4 h-4 text-white/80" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
