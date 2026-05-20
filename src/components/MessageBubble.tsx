import React, { useState, useCallback } from 'react';
import { Sparkles, User, Copy, Check, Bot, Pencil } from 'lucide-react';
import type { Message } from '../types';

// ─── Inline renderer: **bold** and `code` ────────────────────────────────────
function renderInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, key = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(<span key={key++}>{text.slice(last, match.index)}</span>);
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={key++} className="font-semibold text-white">{token.slice(2, -2)}</strong>);
    } else {
      parts.push(
        <code key={key++} className="px-1.5 py-0.5 rounded text-sm font-mono text-orange-300"
          style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.2)' }}>
          {token.slice(1, -1)}
        </code>
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) parts.push(<span key={key++}>{text.slice(last)}</span>);
  return parts;
}

// ─── Markdown → React (no dangerouslySetInnerHTML) ───────────────────────────
function renderMarkdown(content: string): React.ReactNode {
  const lines = content.split('\n');
  const els: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const t = line.trim();

    if (!t) { els.push(<div key={i} className="h-2" />); i++; continue; }

    if (t.startsWith('### ')) {
      els.push(<h3 key={i} className="text-base font-bold mt-4 mb-1.5 flex items-center gap-2" style={{ color: '#fb923c' }}>
        <Sparkles className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#f97316' }} />
        {renderInline(t.slice(4))}
      </h3>);
      i++; continue;
    }
    if (t.startsWith('## ')) {
      els.push(<h2 key={i} className="text-lg font-bold mt-5 mb-2 flex items-center gap-2" style={{ color: '#f97316' }}>
        <Sparkles className="w-4 h-4 flex-shrink-0" style={{ color: '#fb923c' }} />
        {renderInline(t.slice(3))}
      </h2>);
      i++; continue;
    }
    if (t.startsWith('# ')) {
      els.push(<h1 key={i} className="hero-orange text-xl font-extrabold mt-5 mb-2">{renderInline(t.slice(2))}</h1>);
      i++; continue;
    }

    if (t === '---' || t === '***') {
      els.push(<hr key={i} className="my-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />);
      i++; continue;
    }

    if (/^[-•*] /.test(t)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[-•*] /.test(lines[i].trim())) {
        items.push(
          <li key={i} className="flex items-start gap-2 mb-1">
            <span className="mt-1 flex-shrink-0 text-sm" style={{ color: '#f97316' }}>▸</span>
            <span className="text-gray-200">{renderInline(lines[i].trim().slice(2))}</span>
          </li>
        );
        i++;
      }
      els.push(<ul key={`ul-${i}`} className="my-2 space-y-0.5">{items}</ul>);
      continue;
    }

    if (/^\d+\. /.test(t)) {
      const items: React.ReactNode[] = [];
      let n = 1;
      while (i < lines.length && /^\d+\. /.test(lines[i].trim())) {
        items.push(
          <li key={i} className="flex items-start gap-2 mb-1.5">
            <span className="font-bold flex-shrink-0 min-w-[1.2rem]" style={{ color: '#fb923c' }}>{n}.</span>
            <span className="text-gray-200">{renderInline(lines[i].trim().replace(/^\d+\. /, ''))}</span>
          </li>
        );
        i++; n++;
      }
      els.push(<ol key={`ol-${i}`} className="my-2 space-y-0.5">{items}</ol>);
      continue;
    }

    if (t.startsWith('```')) {
      const lang = t.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++;
      els.push(
        <div key={`code-${i}`} className="my-3 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(249,115,22,0.2)' }}>
          {lang && (
            <div className="px-3 py-1 text-xs font-mono" style={{ background: 'rgba(249,115,22,0.08)', color: '#fb923c', borderBottom: '1px solid rgba(249,115,22,0.15)' }}>
              {lang}
            </div>
          )}
          <pre className="p-4 text-sm font-mono overflow-x-auto whitespace-pre leading-relaxed" style={{ background: 'rgba(0,0,0,0.55)', color: '#e5e7eb' }}>
            {codeLines.join('\n')}
          </pre>
        </div>
      );
      continue;
    }

    if (t.endsWith(':') && t.length < 60 && !t.includes('.')) {
      els.push(
        <div key={i} className="font-semibold mt-4 mb-1.5 text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: '#f97316' }}>
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          {renderInline(t)}
        </div>
      );
      i++; continue;
    }

    els.push(<p key={i} className="text-gray-200 leading-relaxed mb-2">{renderInline(t)}</p>);
    i++;
  }

  return <>{els}</>;
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
const TypingIndicator: React.FC = () => (
  <div className="flex items-start gap-3 mb-6">
    <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)', boxShadow: '0 4px 14px rgba(249,115,22,0.35)' }}>
      <Bot className="w-4 h-4 text-white" />
    </div>
    <div className="rounded-2xl rounded-tl-sm px-5 py-3"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
      <div className="flex items-center gap-1.5">
        {[0, 150, 300].map(d => (
          <div key={d} className="w-2 h-2 rounded-full animate-bounce"
            style={{ animationDelay: `${d}ms`, background: d === 0 ? '#f97316' : d === 150 ? '#fb923c' : '#14b8a6' }} />
        ))}
      </div>
    </div>
  </div>
);

// ─── MessageBubble ────────────────────────────────────────────────────────────
export const MessageBubble: React.FC<{
  message: Message;
  onEdit?: (messageId: string, newContent: string) => void;
}> = ({ message, onEdit }) => {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editVal, setEditVal] = useState(message.content);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  }, [message.content]);

  if (message.isTyping) return <TypingIndicator />;

  return (
    <div className={`flex items-start gap-3 mb-6 ${message.isUser ? 'flex-row-reverse' : ''}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: message.isUser ? 'linear-gradient(135deg,#f97316,#fb923c)' : 'linear-gradient(135deg,#1e293b,#334155)',
          boxShadow: message.isUser ? '0 4px 14px rgba(249,115,22,0.35)' : '0 4px 14px rgba(0,0,0,0.3)',
        }}>
        {message.isUser ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      {/* Bubble + Action Controls Container */}
      <div className="group relative flex items-center gap-2">
        {/* Edit trigger button (Users only, only when not currently editing) */}
        {message.isUser && !isEditing && (
          <button
            onClick={() => { setIsEditing(true); setEditVal(message.content); }}
            title="Edit message"
            className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/10 text-gray-400 hover:text-white"
          >
            <Pencil className="w-4 h-4" />
          </button>
        )}

        {/* Message Bubble Body */}
        <div className="px-5 py-4 transition-all duration-200"
          style={{
            background: message.isUser ? 'linear-gradient(135deg,rgba(249,115,22,0.85),rgba(251,146,60,0.85))' : 'rgba(255,255,255,0.05)',
            border: message.isUser ? '1px solid rgba(249,115,22,0.35)' : '1px solid rgba(255,255,255,0.07)',
            borderRadius: message.isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            backdropFilter: message.isUser ? 'none' : 'blur(14px)',
            boxShadow: message.isUser ? '0 4px 20px rgba(249,115,22,0.2)' : 'none',
          }}>
          <div className="text-sm leading-relaxed">
            {message.isUser ? (
              isEditing ? (
                <div className="flex flex-col gap-2 min-w-[260px] sm:min-w-[320px]">
                  <textarea
                    value={editVal}
                    onChange={e => setEditVal(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white resize-y focus:outline-none focus:border-white/30"
                    rows={Math.max(editVal.split('\n').length, 2)}
                  />
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-2.5 py-1.5 rounded bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-all duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const trimmed = editVal.trim();
                        if (!trimmed || trimmed === message.content) {
                          setIsEditing(false);
                          return;
                        }
                        onEdit?.(message.id, trimmed);
                        setIsEditing(false);
                      }}
                      className="px-2.5 py-1.5 rounded font-medium text-white transition-all duration-200"
                      style={{ background: 'linear-gradient(135deg,#f97316,#fb923c)' }}
                    >
                      Save & Submit
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {message.imageUrl && (
                    <div className="max-w-xs sm:max-w-sm rounded-lg overflow-hidden border border-white/20 shadow-md mb-1">
                      <img src={message.imageUrl} alt="Uploaded attachment" className="w-full h-auto object-cover max-h-60" />
                    </div>
                  )}
                  {message.content && <p className="text-white whitespace-pre-wrap">{message.content}</p>}
                </div>
              )
            ) : (
              message.isGeneratedImage ? (
                <div className="flex flex-col gap-3 min-w-[260px] sm:min-w-[340px]">
                  <p className="text-gray-200">Here is the image I generated for you based on your description:</p>
                  <div className="rounded-xl overflow-hidden border border-orange-500/20 max-w-lg shadow-lg relative group/img">
                    <img src={message.content} alt="AI Generated" className="w-full h-auto object-cover max-h-[400px] transition-transform duration-300 group-hover/img:scale-[1.02]" />
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">{renderMarkdown(message.content)}</div>
              )
            )}
          </div>

          {!message.isUser && !message.isGeneratedImage && (
            <button onClick={copy} title="Copy"
              className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/10">
              {copied
                ? <Check className="w-4 h-4" style={{ color: '#f97316' }} />
                : <Copy className="w-4 h-4 text-gray-400" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};