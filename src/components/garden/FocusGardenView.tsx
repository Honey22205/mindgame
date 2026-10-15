import React, { useState, useEffect, useRef } from 'react';
import { TreeItem } from '../../services/mindStorage';
import { mindAudio } from '../../services/mindAudio';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  TreePine, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  CloudRain, 
  Flame, 
  Waves,
  Clock,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface Props {
  trees: TreeItem[];
  totalFocusMinutes: number;
  onTreeGrown: (name: string, duration: number) => void;
}

export const FocusGardenView: React.FC<Props> = ({
  trees,
  totalFocusMinutes,
  onTreeGrown,
}) => {
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [ambientSound, setAmbientSound] = useState<'rain' | 'fire' | 'waves' | 'none'>('rain');
  const [justFinished, setJustFinished] = useState(false);

  const timerRef = useRef<any>(null);

  const treeTypes = [
    'Cherry Blossom Bonsai',
    'Zen Jade Maple',
    'Ancient Cedar',
    'Golden Ginkgo',
  ];

  useEffect(() => {
    if (isActive) {
      if (ambientSound !== 'none') {
        mindAudio.playAmbient(ambientSound);
      } else {
        mindAudio.stopAmbient();
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            mindAudio.stopAmbient();
            mindAudio.playComplete();
            const chosenTree = treeTypes[Math.floor(Math.random() * treeTypes.length)];
            onTreeGrown(chosenTree, selectedDuration);
            setJustFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      mindAudio.stopAmbient();
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      mindAudio.stopAmbient();
    };
  }, [isActive, ambientSound, selectedDuration, onTreeGrown]);

  const handleStart = () => {
    setIsActive(true);
    setJustFinished(false);
    mindAudio.playTap();
  };

  const handlePause = () => {
    setIsActive(false);
    mindAudio.playTap();
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(selectedDuration * 60);
    setJustFinished(false);
    mindAudio.stopAmbient();
    mindAudio.playTap();
  };

  const handleSelectDuration = (mins: number) => {
    if (isActive) return;
    setSelectedDuration(mins);
    setTimeLeft(mins * 60);
    mindAudio.playTap();
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Tree growth percentage
  const totalSeconds = selectedDuration * 60;
  const progressPct = Math.min(100, Math.max(10, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 text-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
            MINDFUL DEEP WORK
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Focus Garden
          </h2>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs font-semibold">
          <TreePine className="w-4 h-4 text-emerald-400" />
          <span>{trees.length} Trees Grown</span>
        </div>
      </div>

      {/* Main Focus Bonsai Tree Arena */}
      <div className="p-6 rounded-3xl bg-gradient-to-b from-[#131926] to-[#0e121d] border border-white/10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
        {/* Soft Ambient Glow */}
        <div className="absolute w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Tree SVG Graphic Scaling With Time */}
        <div className="relative w-36 h-36 flex items-center justify-center my-2">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full transition-transform duration-700"
            style={{ transform: `scale(${0.6 + (progressPct / 100) * 0.45})` }}
          >
            {/* Pot */}
            <path d="M30 80 L70 80 L65 92 L35 92 Z" fill="#334155" />
            <rect x="28" y="77" width="44" height="4" rx="2" fill="#475569" />

            {/* Trunk */}
            <path
              d="M50 78 Q48 55 52 45 Q50 35 48 30"
              stroke="#78350f"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />

            {/* Branches & Foliage Clouds */}
            <circle cx="48" cy="30" r={progressPct > 20 ? "14" : "6"} fill="#10b981" />
            <circle cx="38" cy="40" r={progressPct > 45 ? "12" : "4"} fill="#059669" />
            <circle cx="58" cy="38" r={progressPct > 70 ? "13" : "5"} fill="#34d399" />
            <circle cx="48" cy="22" r={progressPct > 90 ? "11" : "3"} fill="#6ee7b7" />
          </svg>
        </div>

        {/* Digital Time Readout */}
        <div className="mt-2 text-center">
          <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
            {formatTimer(timeLeft)}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            {isActive ? 'Deep focus session in progress...' : 'Select duration and begin'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-6">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            title="Reset session"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={isActive ? handlePause : handleStart}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            <span>{isActive ? 'Pause' : 'Plant Tree'}</span>
          </button>
        </div>

        {/* Ambient Soundscape Switcher */}
        <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-1.5 w-full justify-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Soundscape:</span>
          {[
            { id: 'rain', label: 'Rain', icon: CloudRain },
            { id: 'fire', label: 'Fire', icon: Flame },
            { id: 'waves', label: 'Waves', icon: Waves },
            { id: 'none', label: 'Silent', icon: VolumeX },
          ].map((snd) => {
            const Icon = snd.icon;
            const active = ambientSound === snd.id;
            return (
              <button
                key={snd.id}
                onClick={() => {
                  setAmbientSound(snd.id as any);
                  mindAudio.playTap();
                }}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors ${
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-white bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{snd.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preset Duration Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Focus Duration</label>
        <div className="grid grid-cols-4 gap-2">
          {[15, 25, 45, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => handleSelectDuration(mins)}
              disabled={isActive}
              className={`py-2 rounded-xl text-xs font-mono font-bold transition-all border ${
                selectedDuration === mins
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-sm'
                  : 'bg-[#131724] border-white/5 text-slate-400 hover:text-white disabled:opacity-50'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>
      </div>

      {/* Focus Forest Gallery */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white flex items-center gap-1.5">
            <TreePine className="w-4 h-4 text-emerald-400" />
            <span>Your Forest ({totalFocusMinutes} mins logged)</span>
          </span>
        </div>

        <div className="space-y-2">
          {trees.slice(0, 4).map((tree) => (
            <div
              key={tree.id}
              className="p-3 rounded-2xl bg-[#121522] border border-white/5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
                  <TreePine className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">{tree.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{tree.date}</span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400">
                +{tree.durationMinutes}m focus
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
