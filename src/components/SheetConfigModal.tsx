import React, { useState } from 'react';
import { Link2, X, Check, Copy, ExternalLink, RefreshCw, Smartphone } from 'lucide-react';
import { apiPing, apiFetchOccupants } from '../services/api';

interface Props {
  isOpen: boolean;
  currentUrl: string | null;
  onSaveUrl: (url: string | null) => Promise<void>;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const SheetConfigModal: React.FC<Props> = ({
  isOpen,
  currentUrl,
  onSaveUrl,
  onClose,
  onShowToast,
}) => {
  const [inputUrl, setInputUrl] = useState(currentUrl || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputUrl.trim();
    setErrorMsg(null);

    if (!trimmed) {
      await onSaveUrl(null);
      onShowToast('Switched to local mode');
      onClose();
      return;
    }

    if (!trimmed.startsWith('https://script.google.com/macros/s/')) {
      setErrorMsg('URL must start with https://script.google.com/macros/s/');
      return;
    }

    setIsVerifying(true);
    try {
      // Test the endpoint
      const occupants = await apiFetchOccupants(trimmed);
      await onSaveUrl(trimmed);
      onShowToast(`Connected! Synced ${occupants.length} occupants`);
      onClose();
    } catch (err: any) {
      console.error('Verification failed', err);
      setErrorMsg(
        err.message ||
          'Failed to connect to Google Apps Script. Check deployment settings (Who has access: Anyone).'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!currentUrl) return;
    try {
      const shareUrl = `${window.location.origin}${window.location.pathname}?api=${encodeURIComponent(currentUrl)}`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      onShowToast('Shareable link copied');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-lg font-semibold text-[#1D1D1F]">Google Sheet Sync</h3>
            <p className="text-xs text-[#86868B]">Shared source of truth across all phones</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#EAEAEF] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current status */}
        {currentUrl ? (
          <div className="p-4 bg-[#F8F8FA] border border-[#E5E5EA] rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#2D7D46] inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D7D46]" />
                Connected to Sheet
              </span>
              <button
                type="button"
                onClick={handleCopyShareLink}
                className="text-xs text-[#1D1D1F] font-medium hover:text-[#86868B] inline-flex items-center gap-1 cursor-pointer"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{copiedLink ? 'Copied' : 'Share to other phone'}</span>
              </button>
            </div>
            <p className="text-xs text-[#86868B] font-mono truncate">{currentUrl}</p>
          </div>
        ) : (
          <div className="p-3.5 bg-[#F8F8FA] border border-[#E5E5EA] rounded-2xl text-xs text-[#86868B] leading-relaxed">
            Enter your deployed Google Apps Script Web App URL below to connect your Google Sheet as the live shared database for all phones.
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-[#FDF1F0] border border-[#F8D7D5] text-[#C24138] rounded-xl text-xs font-medium leading-relaxed">
            {errorMsg}
          </div>
        )}

        {/* URL Form */}
        <form onSubmit={handleSave} className="space-y-3">
          <label className="block text-xs font-medium text-[#86868B]">
            Google Apps Script Web App URL
          </label>
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec"
                disabled={isVerifying}
                className="w-full pl-9 pr-3 py-2.5 bg-[#F8F8FA] border border-[#E5E5EA] focus:border-[#1D1D1F] focus:bg-white rounded-xl text-xs sm:text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none transition-all font-mono"
              />
              <Link2 className="w-4 h-4 text-[#86868B] absolute left-3 top-3" />
            </div>

            <button
              type="submit"
              disabled={isVerifying || !inputUrl.trim()}
              className="w-full py-2.5 px-4 bg-[#1D1D1F] hover:bg-[#2C2C2E] active:scale-98 text-white text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying connection...</span>
                </>
              ) : (
                <span>Save & Connect</span>
              )}
            </button>
          </div>
        </form>

        {/* Disconnect or Reset */}
        {currentUrl && (
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={async () => {
                await onSaveUrl(null);
                setInputUrl('');
                onShowToast('Disconnected from Google Sheet');
                onClose();
              }}
              className="text-xs text-[#C24138] hover:underline cursor-pointer"
            >
              Disconnect Google Sheet (Switch to Local)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
