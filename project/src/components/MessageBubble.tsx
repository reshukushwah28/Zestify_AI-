import React, { useState, useCallback } from 'react';
import { Sparkles, User, Copy, Check, Bot } from 'lucide-react';
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

    // Empty line → spacer
    if (!t) { els.push(<div key={i} className="h-2" />); i++; continue; }

    // Headings
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

    // Horizontal rule
    if (t === '---' || t === '***') {
      els.push(<hr key={i} className="my-3" style={{ borderColor: 'rgba(255,255,255,0.1)' }} />);
      i++; continue;
    }

    // Bullet list
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

    // Numbered list
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

    // Fenced code block
    if (t.startsWith('```')) {
      const lang = t.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) { codeLines.push(lines[i]); i++; }
      i++; // consume closing ```
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

    // Section label ending with ":"
    if (t.endsWith(':') && t.length < 60 && !t.includes('.')) {
      els.push(
        <div key={i} className="font-semibold mt-4 mb-1.5 text-sm uppercase tracking-wider flex items-center gap-2" style={{ color: '#f97316' }}>
          <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
          {renderInline(t)}
        </div>
      );
      i++; continue;
    }

    // Regular paragraph
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
export const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const [copied, setCopied] = useState(false);

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

      {/* Bubble */}
      <div className="group relative max-w-3xl px-5 py-4 transition-all duration-200"
        style={{
          background: message.isUser ? 'linear-gradient(135deg,rgba(249,115,22,0.85),rgba(251,146,60,0.85))' : 'rgba(255,255,255,0.05)',
          border: message.isUser ? '1px solid rgba(249,115,22,0.35)' : '1px solid rgba(255,255,255,0.07)',
          borderRadius: message.isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
          backdropFilter: message.isUser ? 'none' : 'blur(14px)',
          boxShadow: message.isUser ? '0 4px 20px rgba(249,115,22,0.2)' : 'none',
        }}>
        <div className="text-sm leading-relaxed">
          {message.isUser
            ? <p className="text-white">{message.content}</p>
            : <div className="space-y-0.5">{renderMarkdown(message.content)}</div>}
        </div>

        {!message.isUser && (
          <button onClick={copy} title="Copy"
            className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-white/10">
            {copied
              ? <Check className="w-4 h-4" style={{ color: '#f97316' }} />
              : <Copy className="w-4 h-4 text-gray-400" />}
          </button>
        )}
      </div>
    </div>
  );
};