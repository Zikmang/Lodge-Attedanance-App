import React, { useState } from 'react';
import { Copy, Share2, X, Check } from 'lucide-react';
import { Occupant, AttendanceMap, getAttendanceRecord } from '../types/attendance';
import { formatDateSimple, formatDisplayDate } from '../services/storage';

interface Props {
  isOpen: boolean;
  dateKey: string;
  occupants: Occupant[];
  attendance: AttendanceMap;
  onClose: () => void;
  onShowToast: (message: string) => void;
}

export function buildAttendanceReportText(
  dateKey: string,
  occupants: Occupant[],
  attendance: AttendanceMap,
): string {
  const displayDate = formatDisplayDate(dateKey);

  const presentList: string[] = [];
  const absentList: string[] = [];
  const excuseList: { name: string; reason?: string }[] = [];
  const passList: string[] = [];
  const dutyList: string[] = [];

  occupants.forEach((occ) => {
    const record = getAttendanceRecord(attendance[occ.name] || attendance[occ.id]);
    if (record.status === 'PRESENT') {
      presentList.push(occ.name);
    } else if (record.status === 'ABSENT') {
      if (record.excuseStatus === 'provided') {
        excuseList.push({ name: occ.name, reason: record.excuseReason });
      } else {
        absentList.push(occ.name);
      }
    } else if (record.status === 'PASS') {
      passList.push(occ.name);
    } else if (record.status === 'DUTY') {
      dutyList.push(occ.name);
    }
  });

  const formatList = (list: string[]) => {
    if (list.length === 0) return 'None';
    return list.map((name) => `- ${name}`).join('\n');
  };

  const formatExcuseList = (list: { name: string; reason?: string }[]) => {
    if (list.length === 0) return 'None';
    return list
      .map((item) => {
        const reasonText = item.reason && item.reason.trim() ? ` — ${item.reason.trim()}` : '';
        return `- ${item.name}${reasonText}`;
      })
      .join('\n');
  };

  return `LODGE ATTENDANCE
${displayDate}

PRESENT
${formatList(presentList)}

ABSENT
${formatList(absentList)}

EXCUSE
${formatExcuseList(excuseList)}

PASS
${formatList(passList)}

DUTY
${formatList(dutyList)}`;
}

export const ReportModal: React.FC<Props> = ({
  isOpen,
  dateKey,
  occupants,
  attendance,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const simpleDate = formatDateSimple(dateKey);
  const reportText = buildAttendanceReportText(dateKey, occupants, attendance);

  const presentList: string[] = [];
  const absentList: string[] = [];
  const excuseList: { name: string; reason?: string }[] = [];
  const passList: string[] = [];
  const dutyList: string[] = [];

  occupants.forEach((occ) => {
    const record = getAttendanceRecord(attendance[occ.name] || attendance[occ.id]);
    if (record.status === 'PRESENT') {
      presentList.push(occ.name);
    } else if (record.status === 'ABSENT') {
      if (record.excuseStatus === 'provided') {
        excuseList.push({ name: occ.name, reason: record.excuseReason });
      } else {
        absentList.push(occ.name);
      }
    } else if (record.status === 'PASS') {
      passList.push(occ.name);
    } else if (record.status === 'DUTY') {
      dutyList.push(occ.name);
    }
  });

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reportText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = reportText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      onShowToast('Report copied');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Attendance Report - ${simpleDate}`,
          text: reportText,
        });
        onShowToast('Report shared');
        return;
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    }
    // Fallback: copy report and open WhatsApp
    await handleCopy();
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(reportText)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/30 backdrop-blur-xs transition-opacity">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Navigation & Dismiss */}
        <div className="px-6 py-4 border-b border-[#E5E5EA]/70 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-[#86868B]">
            Document Preview
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#EAEAEF] transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Clean Document Card Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-white">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
              Attendance Report
            </h2>
            <p className="text-sm font-medium text-[#86868B]">{simpleDate}</p>
          </div>

          {/* Five Compact Summaries */}
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 p-3 sm:p-4 bg-[#F8F8FA] rounded-2xl border border-[#E5E5EA]/70">
            <div>
              <p className="text-[11px] font-medium text-[#86868B]">Present</p>
              <p className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
                {presentList.length}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#86868B]">Absent</p>
              <p className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
                {absentList.length}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#86868B]">Excuse</p>
              <p className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
                {excuseList.length}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#86868B]">Pass</p>
              <p className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
                {passList.length}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-medium text-[#86868B]">Duty</p>
              <p className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight mt-0.5">
                {dutyList.length}
              </p>
            </div>
          </div>

          {/* Grouped lists */}
          <div className="space-y-5 text-sm">
            {/* Present section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2D7D46] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D46]" />
                Present ({presentList.length})
              </h3>
              {presentList.length === 0 ? (
                <p className="text-xs text-[#86868B] italic pl-3">None</p>
              ) : (
                <ol className="divide-y divide-[#E5E5EA]/50 bg-[#F8F8FA] rounded-xl px-3 py-1 text-[#1D1D1F]">
                  {presentList.map((name, i) => (
                    <li key={i} className="py-1.5 text-xs sm:text-sm flex items-center gap-2">
                      <span className="text-[#86868B] text-xs w-4">{i + 1}.</span>
                      <span>{name}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Absent section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#C24138] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C24138]" />
                Absent ({absentList.length})
              </h3>
              {absentList.length === 0 ? (
                <p className="text-xs text-[#86868B] italic pl-3">None</p>
              ) : (
                <ol className="divide-y divide-[#E5E5EA]/50 bg-[#F8F8FA] rounded-xl px-3 py-1 text-[#1D1D1F]">
                  {absentList.map((name, i) => (
                    <li key={i} className="py-1.5 text-xs sm:text-sm flex items-center gap-2">
                      <span className="text-[#86868B] text-xs w-4">{i + 1}.</span>
                      <span>{name}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Excuse section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                Excuse ({excuseList.length})
              </h3>
              {excuseList.length === 0 ? (
                <p className="text-xs text-[#86868B] italic pl-3">None</p>
              ) : (
                <ol className="divide-y divide-[#E5E5EA]/50 bg-[#F8F8FA] rounded-xl px-3 py-1 text-[#1D1D1F]">
                  {excuseList.map((item, i) => (
                    <li key={i} className="py-1.5 text-xs sm:text-sm flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[#86868B] text-xs w-4">{i + 1}.</span>
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.reason && item.reason.trim() ? (
                        <span className="text-[11px] text-[#86868B] bg-white px-2 py-0.5 rounded-md border border-[#E5E5EA] shrink-0 max-w-[50%] truncate">
                          {item.reason.trim()}
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Pass section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B46800] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B46800]" />
                Pass ({passList.length})
              </h3>
              {passList.length === 0 ? (
                <p className="text-xs text-[#86868B] italic pl-3">None</p>
              ) : (
                <ol className="divide-y divide-[#E5E5EA]/50 bg-[#F8F8FA] rounded-xl px-3 py-1 text-[#1D1D1F]">
                  {passList.map((name, i) => (
                    <li key={i} className="py-1.5 text-xs sm:text-sm flex items-center gap-2">
                      <span className="text-[#86868B] text-xs w-4">{i + 1}.</span>
                      <span>{name}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>

            {/* Duty section */}
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                Duty ({dutyList.length})
              </h3>
              {dutyList.length === 0 ? (
                <p className="text-xs text-[#86868B] italic pl-3">None</p>
              ) : (
                <ol className="divide-y divide-[#E5E5EA]/50 bg-[#F8F8FA] rounded-xl px-3 py-1 text-[#1D1D1F]">
                  {dutyList.map((name, i) => (
                    <li key={i} className="py-1.5 text-xs sm:text-sm flex items-center gap-2">
                      <span className="text-[#86868B] text-xs w-4">{i + 1}.</span>
                      <span>{name}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>

        {/* Clear Action Buttons: Copy Report (primary) & Share Report */}
        <div className="p-4 sm:p-5 border-t border-[#E5E5EA]/70 bg-white space-y-2.5">
          <button
            onClick={handleCopy}
            type="button"
            className="w-full py-3.5 px-6 bg-[#1D1D1F] hover:bg-[#2C2C2E] active:scale-[0.99] text-white rounded-2xl font-medium text-sm sm:text-base tracking-tight shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Report Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-white/80" />
                <span>Copy Report</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            type="button"
            className="w-full py-3 px-6 bg-white hover:bg-[#F2F2F7] active:bg-[#EAEAEF] text-[#1D1D1F] border border-[#E5E5EA] rounded-2xl font-medium text-sm sm:text-base tracking-tight transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-[#86868B]" />
            <span>Share Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
