import React from 'react';
import { Check } from 'lucide-react';

interface Props {
  message: string | null;
  onClose?: () => void;
}

export const Toast: React.FC<Props> = ({ message }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none transition-all duration-200">
      <div className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1D1D1F]/90 backdrop-blur-md text-white text-sm font-medium rounded-full shadow-lg shadow-black/10 border border-white/10">
        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
        <span>{message}</span>
      </div>
    </div>
  );
};
