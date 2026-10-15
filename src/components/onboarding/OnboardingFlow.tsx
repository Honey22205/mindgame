import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Zap, ArrowRight, Check } from 'lucide-react';
import { sound } from '../../services/audio';

interface Props {
  isOpen: boolean;
  onComplete: () => void;
}

export const OnboardingFlow: React.FC<Props> = ({ isOpen, onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const slides = [
    {
      badge: 'PERSONAL COMMAND CENTER',
      title: 'Execute with clarity and zero clutter',
      description: 'NEXUS combines high-signal task architecture, calendar time blocking, and AI synthesis into an executive mobile interface inspired by Linear and Arc.',
      icon: Zap,
      gradient: 'from-cyan-500 to-indigo-600',
    },
    {
      badge: 'NATURAL LANGUAGE ENGINE',
      title: 'From raw thought to structured milestone',
      description: 'Type or speak naturally. Gemini 3.8 Flash extracts urgency, deadlines, effort estimates, and subtask checklists with sub-250ms latency.',
      icon: Sparkles,
      gradient: 'from-indigo-500 to-cyan-500',
    },
    {
      badge: 'OFFLINE-FIRST RESILIENCE',
      title: 'Full functionality anywhere on Earth',
      description: 'Operate completely offline with local SQLite/IndexedDB caching. Automatic conflict-free synchronization reconciles changes as soon as connectivity resumes.',
      icon: ShieldCheck,
      gradient: 'from-cyan-500 to-emerald-500',
    },
  ];

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  const handleNext = () => {
    sound.playTap();
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      sound.playComplete();
      onComplete();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0e111a] border border-cyan-500/30 rounded-3xl p-6 shadow-2xl flex flex-col justify-between min-h-[460px] relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Indicators */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {slides.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentSlide ? 'w-6 bg-cyan-400' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => {
              sound.playTap();
              onComplete();
            }}
            className="text-[11px] text-slate-400 hover:text-white"
          >
            Skip
          </button>
        </div>

        {/* Slide Graphic & Text */}
        <div className="py-6 space-y-4 my-auto">
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${slide.gradient} flex items-center justify-center text-white shadow-lg shadow-cyan-500/20`}>
            <Icon className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
              {slide.badge}
            </span>
            <h3 className="text-xl font-bold text-white tracking-tight leading-snug">
              {slide.title}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              {slide.description}
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          <span className="text-[10px] font-mono text-slate-400">
            Step {currentSlide + 1} of {slides.length}
          </span>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <span>{currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
