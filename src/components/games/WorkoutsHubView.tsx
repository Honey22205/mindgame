import React from 'react';
import { Zap, Brain, Target, TreePine, Play, Award, Clock } from 'lucide-react';
import { mindAudio } from '../../services/mindAudio';

interface Props {
  onStartGame: (gameId: 'math' | 'memory' | 'stroop' | 'garden') => void;
  highScores: {
    speedMath: number;
    memoryMatrixLevel: number;
    stroopAccuracy: number;
    wordCount: number;
  };
}

export const WorkoutsHubView: React.FC<Props> = ({ onStartGame, highScores }) => {
  const workouts = [
    {
      id: 'math' as const,
      title: 'Speed Math Sprint',
      subtitle: 'Mental Arithmetic & Quick Processing',
      description: 'Solve arithmetic equations against the clock. Builds fast numerical agility and concentration.',
      duration: '45 sec',
      badge: 'Mental Agility',
      best: `${highScores.speedMath} pts`,
      color: 'amber',
      icon: Zap,
    },
    {
      id: 'memory' as const,
      title: 'Memory Matrix',
      subtitle: 'Spatial Recall & Pattern Recognition',
      description: 'Memorize flashing grid tile positions, then recreate the pattern from short-term memory.',
      duration: '60 sec',
      badge: 'Working Memory',
      best: `Level ${highScores.memoryMatrixLevel}`,
      color: 'emerald',
      icon: Brain,
    },
    {
      id: 'stroop' as const,
      title: 'Stroop Focus Test',
      subtitle: 'Cognitive Reflex & Interference Control',
      description: 'Filter conflicting color words and font ink. Directly strengthens the prefrontal cortex.',
      duration: '30 sec',
      badge: 'Cognitive Focus',
      best: `${highScores.stroopAccuracy}% accuracy`,
      color: 'rose',
      icon: Target,
    },
    {
      id: 'garden' as const,
      title: 'Focus Garden & Pomodoro',
      subtitle: 'Deep Work with Lo-Fi Beats & Soundscapes',
      description: 'Set a focus block with procedural Lo-Fi study songs, ocean waves, and campfire ambience while cultivating bonsai trees.',
      duration: '15 – 60 min',
      badge: 'Sustained Flow',
      best: 'Ambient Flow',
      color: 'teal',
      icon: TreePine,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm select-none">
      {/* Header */}
      <div>
        <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
          EXECUTIVE COGNITIVE SUITE
        </span>
        <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
          Brain Workouts
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Bite-sized micro-games designed to strengthen daily memory, numerical speed, and focus.
        </p>
      </div>

      {/* Workout Cards */}
      <div className="space-y-3">
        {workouts.map((w) => {
          const Icon = w.icon;
          return (
            <div
              key={w.id}
              className="p-4 rounded-3xl bg-[#121522] border border-white/5 hover:border-white/15 transition-all shadow-md space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shrink-0 mt-0.5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">{w.title}</h3>
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-semibold">
                        {w.badge}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium block mt-0.5">
                      {w.subtitle}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {w.description}
              </p>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{w.duration}</span>
                  </span>
                  <span>·</span>
                  <span className="text-emerald-400/90 font-semibold">Best: {w.best}</span>
                </div>

                <button
                  onClick={() => {
                    mindAudio.playTap();
                    onStartGame(w.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Start</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
