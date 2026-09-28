import React, { useState, useMemo } from 'react';
import { ChevronLeft, Search, RotateCcw, FileText, RefreshCw } from 'lucide-react';
import { Occupant, AttendanceMap, AttendanceStatus } from '../types/attendance';
import { formatDateSimple, getTodayKey } from '../services/storage';

interface Props {
  occupants: Occupant[];
  attendance: AttendanceMap;
  isSyncing: boolean;
  onUpdateStatus: (occupant: Occupant, status: AttendanceStatus) => void;
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

    occupants.forEach((o) => {
      const status = attendance[o.name] || attendance[o.id] || 'PRESENT';
      if (status === 'PRESENT') present++;
      else if (status === 'ABSENT') absent++;
      else if (status === 'PASS') pass++;
      else if (status === 'DUTY') duty++;
    });

    return {
      present,
      absent,
      pass,
      duty,
      total: occupants.length,
    };
  }, [occupants, attendance]);

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

        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#C24138]" />
          <span className="font-semibold text-[#1D1D1F]">{totals.absent}</span>
          <span className="text-[#86868B] font-normal">Absent</span>
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
            const currentStatus =
              attendance[occupant.name] || attendance[occupant.id] || 'PRESENT';

            return (
              <div
                key={occupant.id || occupant.name}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
              >
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
                    onClick={() => onUpdateStatus(occupant, 'PRESENT')}
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
                    onClick={() => onUpdateStatus(occupant, 'ABSENT')}
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
                    onClick={() => onUpdateStatus(occupant, 'PASS')}
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
                    onClick={() => onUpdateStatus(occupant, 'DUTY')}
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
