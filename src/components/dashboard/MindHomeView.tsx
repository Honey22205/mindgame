import React, { useState, useEffect } from 'react';
import { MindState } from '../../services/mindStorage';
import { mindAudio } from '../../services/mindAudio';
import { 
  Brain, 
  Flame, 
  Zap, 
  Sparkles, 
  TreePine, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Play, 
  Pause,
  ArrowRight,
  Target
} from 'lucide-react';

interface Props {
  state: MindState;
  onStartGame: (gameId: 'math' | 'memory' | 'stroop' | 'garden') => void;
  onOpenHabits: () => void;
  onToggleHabit: (id: string) => void;
}

export const MindHomeView: React.FC<Props> = ({
  state,
  onStartGame,
  onOpenHabits,
  onToggleHabit,
}) => {
  const { scores, streak, habits, totalFocusMinutes } = state;
  const completedHabitsCount = habits.filter((h) => h.isCompleted).length;

  const [, setAudioTick] = useState(0);
  useEffect(() => {
    return mindAudio.subscribe(() => {
      setAudioTick((t) => t + 1);
    });
  }, []);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm select-none">
      {/* Top Greeting & Streak Kicker */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
            COGNITIVE FITNESS
          </span>
          <h1 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Today's Mind Gym
          </h1>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-bold shadow-sm">
          <Flame className="w-4 h-4 text-amber-400 fill-amber-500/20" />
          <span>{streak} Day Streak</span>
        </div>
      </div>

      {/* Main Brain Index Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-tr from-[#121626] to-[#181d30] border border-white/10 shadow-xl space-y-4 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono uppercase text-slate-400">Composite Brain Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tracking-tight font-mono">
                {scores.overall}
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                Top 8% Tier
              </span>
            </div>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shadow-md">
            <Brain className="w-6 h-6" />
          </div>
        </div>

        {/* 4 Pillars Progress Meters */}
        <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/5 text-[11px] font-mono">
          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Agility</span>
              <span className="text-amber-400">{scores.math}</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div style={{ width: `${(scores.math / 1000) * 100}%` }} className="h-full bg-amber-400" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Memory</span>
              <span className="text-emerald-400">{scores.memory}</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div style={{ width: `${(scores.memory / 1000) * 100}%` }} className="h-full bg-emerald-400" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Focus</span>
              <span className="text-cyan-400">{scores.focus}</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden">
              <div style={{ width: `${(scores.focus / 1000) * 100}%` }} className="h-full bg-cyan-400" />
            </div>
          </div>
        </div>

        {/* Big Start Daily Workout CTA */}
        <button
          onClick={() => {
            mindAudio.playTap();
            onStartGame('math');
          }}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-indigo-600 hover:brightness-110 active:scale-[0.98] transition-all text-white font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Start Daily 3-Min Workout</span>
        </button>
      </div>

      {/* Quick Ambient Music & Soundscape Player */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-[#121629] to-[#0f1422] border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5 truncate">
          <button
            onClick={async () => {
              await mindAudio.unlockAudio();
              mindAudio.playTap();
              if (mindAudio.isPlaying()) {
                mindAudio.stopAmbient();
              } else {
                mindAudio.playAmbient('lofi');
              }
            }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-md shrink-0 ${
              mindAudio.isPlaying()
                ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-emerald-500/30'
                : 'bg-white/10 hover:bg-white/15 text-white'
            }`}
            title={mindAudio.isPlaying() ? 'Pause focus music' : 'Play Lo-Fi chill beats'}
          >
            {mindAudio.isPlaying() ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <div className="truncate">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white truncate">
                {mindAudio.isPlaying() 
                  ? (mindAudio.getCurrentAmbient() === 'lofi' ? '🎧 Lo-Fi Study Beats' :
                     mindAudio.getCurrentAmbient() === 'waves' ? '🌊 Ocean Waves' :
                     mindAudio.getCurrentAmbient() === 'fire' ? '🔥 Cozy Campfire' :
                     mindAudio.getCurrentAmbient() === 'rain' ? '🌧️ Monsoon Rain' : '🧘 Zen Bowls')
                  : 'Lo-Fi Chill & Focus Beats'}
              </span>
              {mindAudio.isPlaying() && (
                <span className="flex items-end gap-0.5 h-2.5">
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce h-2.5" />
                  <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-1.5" />
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-mono block">
              {mindAudio.isPlaying() ? 'Playing for focus · tap to pause' : 'Tap play for instant study music'}
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            mindAudio.playTap();
            onStartGame('garden');
          }}
          className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold flex items-center gap-1 shrink-0 border border-emerald-500/20"
        >
          <span>Pomodoro</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* 4 Quick Cognitive Training Workouts */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Targeted Workouts</span>
          </span>
          <span className="text-[10px] font-mono text-slate-400">Quick play</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Speed Math */}
          <button
            onClick={() => {
              mindAudio.playTap();
              onStartGame('math');
            }}
            className="p-3.5 rounded-2xl bg-[#131724] border border-white/5 hover:border-amber-500/40 hover:scale-[1.02] active:scale-95 transition-all text-left shadow-md cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
              Speed Math
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Arithmetic sprint · 45s
            </p>
            <span className="text-[10px] font-mono text-amber-400/90 block mt-2 font-semibold">
              Best: {state.highScores.speedMath} pts
            </span>
          </button>

          {/* Memory Matrix */}
          <button
            onClick={() => {
              mindAudio.playTap();
              onStartGame('memory');
            }}
            className="p-3.5 rounded-2xl bg-[#131724] border border-white/5 hover:border-emerald-500/40 hover:scale-[1.02] active:scale-95 transition-all text-left shadow-md cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
              <Brain className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
              Memory Matrix
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Pattern recall test
            </p>
            <span className="text-[10px] font-mono text-emerald-400/90 block mt-2 font-semibold">
              Best: Level {state.highScores.memoryMatrixLevel}
            </span>
          </button>

          {/* Stroop Focus */}
          <button
            onClick={() => {
              mindAudio.playTap();
              onStartGame('stroop');
            }}
            className="p-3.5 rounded-2xl bg-[#131724] border border-white/5 hover:border-rose-500/40 hover:scale-[1.02] active:scale-95 transition-all text-left shadow-md cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-2">
              <Target className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-rose-300 transition-colors">
              Stroop Focus
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Reflex & inhibition
            </p>
            <span className="text-[10px] font-mono text-rose-400/90 block mt-2 font-semibold">
              Best: {state.highScores.stroopAccuracy}%
            </span>
          </button>

          {/* Focus Garden */}
          <button
            onClick={() => {
              mindAudio.playTap();
              onStartGame('garden');
            }}
            className="p-3.5 rounded-2xl bg-[#131724] border border-white/5 hover:border-teal-500/40 hover:scale-[1.02] active:scale-95 transition-all text-left shadow-md cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mb-2">
              <TreePine className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-bold text-white group-hover:text-teal-300 transition-colors">
              Focus Garden
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
              Ambient tree timer
            </p>
            <span className="text-[10px] font-mono text-teal-400/90 block mt-2 font-semibold">
              {totalFocusMinutes} mins total
            </span>
          </button>
        </div>
      </div>

      {/* Today's Habits Snapshot */}
      <div className="p-4 rounded-3xl bg-[#121522] border border-white/5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-white">Daily Routine Quests</h4>
            <span className="text-[10px] text-slate-400 font-mono">
              {completedHabitsCount} of {habits.length} completed
            </span>
          </div>
          <button
            onClick={onOpenHabits}
            className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
          >
            <span>All Habits</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {habits.slice(0, 3).map((h) => (
            <div
              key={h.id}
              onClick={() => onToggleHabit(h.id)}
              className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 truncate">
                {h.isCompleted ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600 shrink-0" />
                )}
                <span className={`text-xs truncate ${h.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                  {h.title}
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 font-bold shrink-0">
                {h.streak}d
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Credit */}
      <div className="text-center pt-3 pb-3 text-[11px] text-slate-500 font-mono">
        Made with ❤️ by <span className="text-emerald-400 font-semibold">Honey</span>
      </div>
    </div>
  );
};
