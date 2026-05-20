import React from 'react';
import { Sparkles, Heart, Code2, Calculator, PenLine, Globe } from 'lucide-react';

interface WelcomeScreenProps {
  onExampleClick: (text: string) => void;
}

const FEATURES = [
  { id: 'f1', icon: Code2,       title: 'Code & Debug',       desc: 'Any language. Write, explain, refactor, fix bugs.',    iconBg: 'linear-gradient(135deg,#06b6d4,#0284c7)', cardBg: '#0d1929' },
  { id: 'f2', icon: Calculator,  title: 'Math & Reasoning',   desc: 'Step-by-step solutions to problems big & small.',      iconBg: 'linear-gradient(135deg,#f97316,#f59e0b)', cardBg: '#0d1929' },
  { id: 'f3', icon: PenLine,     title: 'Write Anything',     desc: 'Emails, essays, summaries, taglines — your voice.',    iconBg: 'linear-gradient(135deg,#ec4899,#a855f7)', cardBg: '#130d20' },
  { id: 'f4', icon: Globe,       title: 'General Knowledge',  desc: 'Ask anything. Get clear, accurate, structured answers.',iconBg: 'linear-gradient(135deg,#8b5cf6,#6366f1)', cardBg: '#130d20' },
];

const EXAMPLES = [
  { id: 'e1', text: 'Create a weekly grocery list for a family of 4' },
  { id: 'e2', text: 'Explain how bubble sort works with code' },
  { id: 'e3', text: 'Solve: 2x² + 5x − 3 = 0 step by step' },
  { id: 'e4', text: 'Write a professional email requesting leave' },
  { id: 'e5', text: 'Suggest healthy high-protein breakfast ideas' },
  { id: 'e6', text: 'Plan my week: gym, work, and meal prep' },
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onExampleClick }) => (
  <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto px-4 py-8">
    <div className="max-w-3xl w-full">

      {/* Gemini pill */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: '#d1d5db', backdropFilter: 'blur(12px)' }}>
          <Sparkles className="w-4 h-4 text-yellow-400" />
          Powered by Gemini · multi-domain reasoning
        </div>
      </div>

      {/* Hero */}
      <div className="text-center mb-10">
        <h2 className="font-extrabold text-white leading-tight"
          style={{ fontSize: 'clamp(2.6rem,7vw,5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.08 }}>
          Ask anything.
        </h2>
        <h2 className="hero-orange font-extrabold leading-tight mb-6"
          style={{ fontSize: 'clamp(2.6rem,7vw,5rem)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.08 }}>
          Get a zesty answer.
        </h2>
        <p className="mx-auto max-w-xl leading-relaxed" style={{ color: '#9ca3af', fontSize: '1.05rem' }}>
          Zestify AI is your all-purpose assistant — built for code, math, writing, reasoning,
          and every curious question in between.
        </p>
        <div className="mt-3 flex items-center justify-center gap-2 text-sm" style={{ color: '#6b7280' }}>
          <span>Built with</span>
          <Heart className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
          <span>by <strong className="text-orange-400">Reshu Kushwah</strong></span>
        </div>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {FEATURES.map(f => (
          <div key={f.id} className="card-dark p-5 group cursor-default" style={{ background: f.cardBg }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300"
              style={{ background: f.iconBg, boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}>
              <f.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-bold text-white mb-1" style={{ fontSize: '0.95rem' }}>{f.title}</h3>
            <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Example prompts */}
      <p className="text-center text-sm font-medium mb-3" style={{ color: '#6b7280' }}>Try an example →</p>
      <div className="grid md:grid-cols-2 gap-2">
        {EXAMPLES.map(ex => (
          <button
            key={ex.id}
            onClick={() => onExampleClick(ex.text)}
            className="p-3 text-left rounded-xl text-sm transition-all duration-200 hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#9ca3af' }}
            onMouseEnter={e => {
              const b = e.currentTarget;
              b.style.borderColor = 'rgba(249,115,22,0.35)';
              b.style.color = '#fff';
              b.style.background = 'rgba(249,115,22,0.06)';
            }}
            onMouseLeave={e => {
              const b = e.currentTarget;
              b.style.borderColor = 'rgba(255,255,255,0.07)';
              b.style.color = '#9ca3af';
              b.style.background = 'rgba(255,255,255,0.04)';
            }}
          >
            "{ex.text}"
          </button>
        ))}
      </div>

    </div>
  </div>
);