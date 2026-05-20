import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Sparkles, ImagePlus, X } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (
    message: string,
    imageFile?: { base64Data: string; mimeType: string },
    previewUrl?: string
  ) => void;
  disabled?: boolean;
}

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
  }, [supported]);

  const toggle = useCallback(() => {
    if (!recogRef.current) return;
    if (listening) { recogRef.current.stop(); setListening(false); }
    else           { recogRef.current.start(); setListening(true); }
  }, [listening]);

  return { listening, toggle, supported };
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled = false }) => {
  const [text, setText] = useState('');
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [focused, setFocused] = useState(false);
  const textareaRef = useAutoResize(text);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Guard reference to prevent dual-firing event triggers
  const isSubmittingRef = useRef(false);

  const appendVoice = useCallback((t: string) => {
    setText(prev => prev ? `${prev} ${t}` : t);
  }, []);

  const { listening, toggle, supported } = useSpeech(appendVoice);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerImageSelect = () => {
    fileInputRef.current?.click();
  };

  const clearImage = () => {
    setSelectedImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const submit = useCallback(async () => {
    if (isSubmittingRef.current) return;
    const trimmed = text.trim();
    if (!trimmed && !selectedFile) return;
    if (disabled) return;

    isSubmittingRef.current = true;

    let imageFile: { base64Data: string; mimeType: string } | undefined = undefined;
    const previewUrl = selectedImagePreview || undefined;

    if (selectedFile) {
      try {
        const base64Data = await fileToBase64(selectedFile);
        imageFile = {
          base64Data,
          mimeType: selectedFile.type,
        };
      } catch (err) {
        // Silently handle parsing errors
      }
    }

    onSendMessage(trimmed, imageFile, previewUrl);
    setText('');
    setSelectedImagePreview(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => {
      isSubmittingRef.current = false;
    }, 150);
  }, [text, selectedFile, selectedImagePreview, disabled, onSendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      submit();
    }
  };

  const canSend = (!!text.trim() || !!selectedFile) && !disabled;

  return (
    <form onSubmit={handleSubmit} aria-label="Chat input">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        style={{ display: 'none' }}
      />

      <div
        className="flex flex-col p-4 rounded-2xl transition-all duration-300"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: focused
            ? '2px solid rgba(249,115,22,0.6)'
            : '2px solid rgba(255,255,255,0.09)',
          boxShadow: focused ? '0 0 0 3px rgba(249,115,22,0.12)' : 'none',
          backdropFilter: 'blur(16px)',
        }}
      >
        {selectedImagePreview && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-white/5 rounded-xl border border-white/10 w-fit">
            <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/20">
              <img src={selectedImagePreview} alt="Selected preview" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-gray-400 font-medium">Image uploaded</span>
              <button
                type="button"
                onClick={clearImage}
                className="text-[10px] text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 hover:underline"
              >
                <X className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              id="chat-textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={disabled ? 'Zestify AI is thinking…' : 'Ask anything, upload an image, or request art ("Generate a photo of...")'}
              disabled={disabled}
              rows={1}
              className="w-full resize-none bg-transparent border-none outline-none text-gray-100 placeholder-gray-500 text-sm min-h-[24px] max-h-[120px]"
              aria-label="Message input"
            />
            {focused && (
              <div className="absolute -top-5 left-0 flex items-center gap-1 text-xs pointer-events-none" style={{ color: '#f97316' }}>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask me anything!</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={triggerImageSelect}
              disabled={disabled}
              aria-label="Upload image"
              className="p-2 rounded-lg transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#9ca3af',
              }}
            >
              <ImagePlus className="w-5 h-5" />
            </button>

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
      </div>
    </form>
  );
};