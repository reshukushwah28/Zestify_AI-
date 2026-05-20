import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Sparkles } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

// Auto-resize textarea as user types
function useAutoResize(value: string) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [value]);
  return ref;
}

// Speech recognition — initialised once, never re-created
function useSpeech(onResult: (t: string) => void) {
  const recogRef = useRef<any>(null);
  const [listening, setListening] = useState(false);
  const supported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;

  useEffect(() => {
    if (!supported) return;
    const SR = (window as any).webkitSpeechRecognition ?? (window as any).SpeechRecognition;
    const r = new SR();
    r.continuous = false;
    r.interimResults = false;
    r.lang = 'en-US';
    r.onresult = (e: any) => { onResult(e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false);
    r.onend = () => setListening(false);
    recogRef.current = r;
    return () => { try { r.stop(); } catch { /* ignore */ } };
  // onResult excluded intentionally — stable via useCallback at call site
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  const toggle = useCallback(() => {
    if (!recogRef.current) return;
    if (listening) { recogRef.current.stop(); setListening(false); }
    else           { recogRef.current.start(); setListening(true); }
  }, [listening]);

  return { listening, toggle, supported };
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [text, setText] = useState('');
  const [focused, setFocused] = useState(false);
  const textareaRef = useAutoResize(text);

  const appendVoice = useCallback((t: string) => {
    setText(prev => prev ? `${prev} ${t}` : t);
  }, []);

  const { listening, toggle, supported } = useSpeech(appendVoice);

  const submit = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSendMessage(trimmed);
    setText('');
  }, [text, disabled, onSendMessage]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); submit(); };
  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  const canSend = !!text.trim() && !disabled;

  return (
    <form onSubmit={handleSubmit} aria-label="Chat input">
      <div
        className="flex items-end gap-2 p-4 rounded-2xl transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: focused
            ? '2px solid rgba(249,115,22,0.6)'
            : '2px solid rgba(255,255,255,0.09)',
          boxShadow: focused ? '0 0 0 3px rgba(249,115,22,0.12)' : 'none',
          backdropFilter: 'blur(16px)',
        }}
      >
        {/* Textarea */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            id="chat-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={disabled ? 'Zestify AI is thinking…' : 'Ask me anything — code, math, recipes, writing…'}
            disabled={disabled}
            rows={1}
            className="w-full resize-none bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 text-sm min-h-[24px] max-h-[120px]"
            aria-label="Message input"
          />
          {focused && (
            <div className="absolute -top-5 left-0 flex items-center gap-1 text-xs pointer-events-none" style={{ color: '#f97316' }}>
              <Sparkles className="w-3 h-3" />
              <span>Ask me anything!</span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {supported && (
            <button
              type="button"
              id="mic-button"
              onClick={toggle}
              disabled={disabled}
              aria-label={listening ? 'Stop recording' : 'Start voice input'}
              className={`p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed ${listening ? 'animate-pulse' : ''}`}
              style={{
                background: listening ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                border:     listening ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(255,255,255,0.08)',
                color:      listening ? '#f87171' : '#9ca3af',
              }}
            >
              {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <button
            type="submit"
            id="send-button"
            disabled={!canSend}
            aria-label="Send message"
            className="p-2 rounded-lg text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
            style={{
              background: canSend
                ? 'linear-gradient(135deg,#f97316,#fb923c)'
                : 'rgba(255,255,255,0.08)',
              boxShadow: canSend ? '0 0 16px rgba(249,115,22,0.35)' : 'none',
            }}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </form>
  );
};