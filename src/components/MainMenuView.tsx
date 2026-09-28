import React from 'react';
import { ArrowRight, Users, Cloud } from 'lucide-react';
import { Occupant, AttendanceMap, getAttendanceRecord } from '../types/attendance';
import { formatDisplayDate, getGreeting, getTodayKey } from '../services/storage';

interface Props {
  occupants: Occupant[];
  hasApi: boolean;
  attendance: AttendanceMap;
  onSelectTakeAttendance: () => void;
  onSelectManageOccupants: () => void;
  onOpenSheetConfig: () => void;
}

export const MainMenuView: React.FC<Props> = ({
  occupants,
  hasApi,
  attendance,
  onSelectTakeAttendance,
  onSelectManageOccupants,
  onOpenSheetConfig,
}) => {
  const dateKey = getTodayKey();
  const greeting = getGreeting();
  const displayDate = formatDisplayDate(dateKey);

  // Status counts: check by name first (Google Sheet key), then id
  let presentCount = 0;
  let absentCount = 0;
  let passCount = 0;
  let dutyCount = 0;
  let excusedCount = 0;
  let unexcusedCount = 0;

  occupants.forEach((o) => {
    const record = getAttendanceRecord(attendance[o.name] || attendance[o.id]);
    if (record.status === 'PRESENT') {
      presentCount++;
    } else if (record.status === 'ABSENT') {
      absentCount++;
      if (record.excuseStatus === 'provided') {
        excusedCount++;
      } else {
        unexcusedCount++;
      }
    } else if (record.status === 'PASS') {
      passCount++;
    } else if (record.status === 'DUTY') {
      dutyCount++;
    }
  });

  return (
    <div className="max-w-xl mx-auto w-full px-5 pt-8 pb-12 flex flex-col justify-between min-h-[calc(100vh-56px)]">
      {/* Top Greeting & Date */}
      <div className="space-y-6">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#86868B] tracking-tight">{greeting}</p>
          <h1 className="text-3xl sm:text-[34px] font-semibold text-[#1D1D1F] tracking-tight leading-tight">
            {displayDate}
          </h1>
        </div>

        {/* Compact Attendance Summary */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E5E5EA] shadow-2xs">
          <p className="text-xs font-medium uppercase tracking-wider text-[#86868B] mb-3">
            Today's Attendance
          </p>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-0.5">
              <span className="text-xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] block">
                {presentCount}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-[#2D7D46] inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D46]" />
                Present
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] block">
                {absentCount}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-[#C24138] inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C24138]" />
                Absent
              </span>
              {absentCount > 0 && (
                <span className="text-[10px] text-[#86868B] block truncate">
                  {excusedCount} exc · {unexcusedCount} unexc
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              <span className="text-xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] block">
                {passCount}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-[#B46800] inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B46800]" />
                Pass
              </span>
            </div>

            <div className="space-y-0.5">
              <span className="text-xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] block">
                {dutyCount}
              </span>
              <span className="text-[11px] sm:text-xs font-medium text-[#2563EB] inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                Duty
              </span>
            </div>
          </div>
        </div>

        {/* Subtle setup hint if Google Sheet is not yet connected */}
        {!hasApi && (
          <button
            type="button"
            onClick={onOpenSheetConfig}
            className="w-full p-3.5 bg-white border border-dashed border-[#D1D1D6] rounded-2xl text-left hover:bg-[#F2F2F7] transition-colors cursor-pointer flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Cloud className="w-4 h-4 text-[#86868B]" />
              <div className="text-xs">
                <p className="font-medium text-[#1D1D1F]">Connect your Google Sheet</p>
                <p className="text-[#86868B]">Sync attendance live across multiple phones</p>
              </div>
            </div>
            <span className="text-xs font-medium text-[#1D1D1F] bg-[#EFEFF2] px-2.5 py-1 rounded-full">
              Connect
            </span>
          </button>
        )}
      </div>

      {/* Primary & Secondary Actions */}
      <div className="space-y-3 pt-12 pb-4">
        {/* Dominant Primary Action */}
        <button
          type="button"
          onClick={onSelectTakeAttendance}
          className="w-full py-4 px-6 bg-[#1D1D1F] hover:bg-[#2C2C2E] active:scale-[0.99] text-white rounded-2xl font-medium text-base tracking-tight shadow-xs transition-all flex items-center justify-between cursor-pointer group"
        >
          <span>Take Today's Attendance</span>
          <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:translate-x-0.5 group-hover:text-white transition-all" />
        </button>

        {/* Secondary Action */}
        <button
          type="button"
          onClick={onSelectManageOccupants}
          className="w-full py-3.5 px-6 bg-white hover:bg-[#F2F2F7] active:bg-[#EAEAEF] text-[#1D1D1F] border border-[#E5E5EA] rounded-2xl font-medium text-sm sm:text-base tracking-tight transition-all flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#86868B]" />
            <span>Manage Occupants</span>
          </div>
          <span className="text-xs font-normal text-[#86868B]">
            {occupants.length} occupants
          </span>
        </button>
      </div>
    </div>
  );
};
