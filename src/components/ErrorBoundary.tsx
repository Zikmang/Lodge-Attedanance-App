import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  private handleClearAndReload = () => {
    try {
      if (typeof window !== 'undefined' && 'localStorage' in window) {
        // Clear all attendance and occupant caches
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('corpers_lodge') || key.startsWith('workbox'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
      }
      if (typeof window !== 'undefined' && 'caches' in window) {
        caches.keys().then((names) => {
          names.forEach((name) => caches.delete(name));
        });
      }
    } catch (e) {
      console.warn('Error clearing caches:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#F8F8FA] flex items-center justify-center p-5 text-[#1D1D1F]">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-[#E5E5EA] shadow-xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
                Lodge Attendance
              </h1>
              <p className="text-sm text-[#86868B] leading-relaxed">
                The application encountered an unexpected issue while loading data.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="bg-[#F8F8FA] p-3 rounded-xl text-xs text-[#86868B] text-left font-mono break-all max-h-24 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-[#1D1D1F] text-white text-xs font-medium rounded-xl hover:bg-[#2C2C2E] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Try Again</span>
              </button>
              <button
                type="button"
                onClick={this.handleClearAndReload}
                className="flex-1 py-2.5 px-4 bg-[#EBEBEF] text-[#1D1D1F] text-xs font-medium rounded-xl hover:bg-[#E0E0E5] transition-colors inline-flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-[#86868B]" />
                <span>Reset Cache & Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
