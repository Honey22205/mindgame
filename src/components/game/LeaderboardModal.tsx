import React from 'react';
import { Trophy, X, Flame, Clock, Award, Shield, RotateCcw } from 'lucide-react';
import { gameAudio } from '../../game/audio';

interface Records {
  longestSurvival: number;
  mostKills: number;
  highestSlicerScore: number;
  totalDamage: number;
  bossesDefeated: number;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  records: Records;
  onResetRecords: () => void;
}

export const LeaderboardModal: React.FC<Props> = ({
  isOpen,
  onClose,
  records,
  onResetRecords,
}) => {
  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#0e111a] border border-cyan-500/40 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">Personal Records</h3>
              <span className="text-[10px] text-slate-400 font-mono">Hall of Legends</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="space-y-2 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Longest Survival</span>
            </span>
            <span className="text-white font-bold">{formatTime(records.longestSurvival)}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-rose-400" />
              <span>Most Enemies Slain</span>
            </span>
            <span className="text-rose-400 font-bold">{records.mostKills}</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-purple-400" />
              <span>Cyber Slicer Best</span>
            </span>
            <span className="text-purple-300 font-bold">{records.highestSlicerScore} PTS</span>
          </div>

          <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Career Damage Dealt</span>
            </span>
            <span className="text-emerald-400 font-bold">{records.totalDamage}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={() => {
              if (confirm('Reset your personal records?')) {
                onResetRecords();
                gameAudio.playButtonClick();
              }
            }}
            className="text-[11px] text-slate-500 hover:text-rose-400 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Records</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
