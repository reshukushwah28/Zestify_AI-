import React from 'react';
import { Sparkles, Trash2 } from 'lucide-react';

interface HeaderProps {
  onClearChat: () => void;
  hasMessages: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onClearChat, hasMessages }) => (
  <header
    className="relative px-6 py-3 flex-shrink-0 z-20"
    style={{
      background: 'rgba(14,12,10,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    <div className="max-w-5xl mx-auto flex items-center justify-between">
      {/* Logo + Branding */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg,#f97316,#fb923c,#f59e0b)',
            boxShadow: '0 4px 18px rgba(249,115,22,0.40)',
          }}
        >
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white leading-tight" style={{ letterSpacing: '0.01em' }}>
            Zestify AI
          </h1>
          <p className="text-[10px] font-semibold uppercase" style={{ color: '#6b7280', letterSpacing: '0.15em' }}>
            Your All-Purpose Intelligence
          </p>
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <div
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#9ca3af' }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
          Powered by Gemini
        </div>

        {hasMessages && (
          <button
            onClick={onClearChat}
            title="Clear chat"
            className="p-2 rounded-lg text-gray-400 hover:text-white transition-all duration-200 hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  </header>
);