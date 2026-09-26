import React from 'react';
import { X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  title: string;
  message: string;
  details?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'danger' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<Props> = ({
  isOpen,
  title,
  message,
  details,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-[#1D1D1F] tracking-tight">{title}</h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#EAEAEF] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-2 text-sm text-[#86868B] leading-relaxed">{message}</p>

        {details && (
          <div className="mt-3 p-3 bg-[#F8F8FA] rounded-xl text-xs font-mono text-[#1D1D1F] break-all border border-[#E5E5EA]">
            {details}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2.5 text-sm font-medium text-[#86868B] hover:text-[#1D1D1F] transition-colors cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-5 py-2.5 text-sm font-medium rounded-xl text-white transition-all cursor-pointer flex items-center justify-center gap-2 ${
              confirmVariant === 'danger'
                ? 'bg-[#C24138] hover:bg-[#A9332B] active:scale-98'
                : 'bg-[#1D1D1F] hover:bg-[#2C2C2E] active:scale-98'
            } disabled:opacity-50`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
