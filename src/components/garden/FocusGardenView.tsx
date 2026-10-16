import React, { useState, useEffect, useRef } from 'react';
import { TreeItem } from '../../services/mindStorage';
import { mindAudio, AmbientSoundType, AMBIENT_TRACKS } from '../../services/mindAudio';
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
  Music,
  Radio,
  Sliders,
  Coffee,
  CheckCircle2,
  Bell
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
  // Pomodoro Modes
  const [timerMode, setTimerMode] = useState<'focus' | 'break'>('focus');
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);

  // Audio Engine State
  const [currentTrack, setCurrentTrack] = useState<AmbientSoundType>('lofi');
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(() => mindAudio.isPlaying());
  const [audioVolume, setAudioVolume] = useState<number>(() => mindAudio.getVolume());
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(() => mindAudio.getIsMuted());

  const timerRef = useRef<any>(null);

  const treeTypes = [
    'Cherry Blossom Bonsai',
    'Zen Jade Maple',
    'Ancient Cedar',
    'Golden Ginkgo',
    'Himalayan Pine',
  ];

  // Subscribe to audio engine changes
  useEffect(() => {
    const unsub = mindAudio.subscribe(() => {
      setIsAudioPlaying(mindAudio.isPlaying());
      const cur = mindAudio.getCurrentAmbient();
      if (cur) setCurrentTrack(cur);
      setAudioVolume(mindAudio.getVolume());
      setIsAudioMuted(mindAudio.getIsMuted());
    });
    return unsub;
  }, []);

  // Timer tick
  useEffect(() => {
    if (isActive) {
      // If auto-play is enabled and no music is currently playing, start the selected track
      if (autoPlayAudio && !mindAudio.isPlaying()) {
        mindAudio.playAmbient(currentTrack);
      }

      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsActive(false);
            mindAudio.playComplete();

            if (timerMode === 'focus') {
              const chosenTree = treeTypes[Math.floor(Math.random() * treeTypes.length)];
              onTreeGrown(chosenTree, selectedDuration);
              // Switch to 5m short break
              setTimerMode('break');
              setTimeLeft(5 * 60);
            } else {
              // Break finished, return to focus
              setTimerMode('focus');
              setTimeLeft(selectedDuration * 60);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timerMode, selectedDuration, currentTrack, autoPlayAudio, onTreeGrown]);

  // Controls
  const handleStart = async () => {
    await mindAudio.unlockAudio();
    setIsActive(true);
    mindAudio.playTap();
    if (autoPlayAudio && !mindAudio.isPlaying()) {
      mindAudio.playAmbient(currentTrack);
    }
  };

  const handlePause = () => {
    setIsActive(false);
    mindAudio.playTap();
  };

  const handleReset = () => {
    setIsActive(false);
    setTimeLeft(selectedDuration * 60);
    mindAudio.playTap();
  };

  const handleSelectDuration = (mins: number, mode: 'focus' | 'break' = 'focus') => {
    if (isActive) return;
    setTimerMode(mode);
    setSelectedDuration(mins);
    setTimeLeft(mins * 60);
    mindAudio.playTap();
  };

  // Instant Sound & Music Controls (Works at ANY time!)
  const handleSelectTrack = async (trackId: AmbientSoundType) => {
    await mindAudio.unlockAudio();
    setCurrentTrack(trackId);
    mindAudio.playTap();
    // Start playing this sound immediately
    mindAudio.playAmbient(trackId);
  };

  const handleToggleAudio = async () => {
    await mindAudio.unlockAudio();
    mindAudio.playTap();
    if (isAudioPlaying) {
      mindAudio.stopAmbient();
    } else {
      mindAudio.playAmbient(currentTrack);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    mindAudio.setVolume(val);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Tree growth percentage
  const totalSeconds = selectedDuration * 60;
  const progressPct = Math.min(100, Math.max(10, ((totalSeconds - timeLeft) / totalSeconds) * 100));

  const activeTrackInfo = AMBIENT_TRACKS.find((t) => t.id === currentTrack) || AMBIENT_TRACKS[0];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm select-none pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            POMODORO & FOCUS BEATS
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Focus Garden
          </h2>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs font-semibold">
          <TreePine className="w-4 h-4 text-emerald-400" />
          <span>{trees.length} Grown</span>
        </div>
      </div>

      {/* 🎵 1. EXECUTIVE SOUND & GANA PLAYER (Audible instantly on click!) */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-[#121629] via-[#101928] to-[#121422] border border-emerald-500/25 shadow-xl relative overflow-hidden space-y-3">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Player Header & Equalizer */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {/* Play/Pause Button */}
            <button
              onClick={handleToggleAudio}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-95 ${
                isAudioPlaying
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 text-black shadow-emerald-500/30'
                  : 'bg-white/10 hover:bg-white/15 text-white'
              }`}
              title={isAudioPlaying ? 'Pause sound' : 'Play sound'}
            >
              {isAudioPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white tracking-tight">
                  {activeTrackInfo.title}
                </span>
                {/* 5-bar animated audio visualizer when playing */}
                {isAudioPlaying && (
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2" />
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce h-3" />
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-1.5" />
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-bounce h-2.5" />
                    <span className="w-0.5 bg-emerald-400 rounded-full animate-pulse h-2" />
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                {isAudioPlaying ? 'Playing now · ' + activeTrackInfo.subtitle : 'Click any track to listen'}
              </span>
            </div>
          </div>

          {/* Volume Control */}
          <div className="flex items-center gap-2 bg-black/30 px-2.5 py-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => mindAudio.setMuted(!isAudioMuted)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              {isAudioMuted || audioVolume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isAudioMuted ? 0 : audioVolume}
              onChange={handleVolumeChange}
              className="w-16 h-1 accent-emerald-400 cursor-pointer bg-white/20 rounded-lg"
            />
            <span className="text-[10px] font-mono text-slate-400 w-6 text-right">
              {Math.round((isAudioMuted ? 0 : audioVolume) * 100)}%
            </span>
          </div>
        </div>

        {/* Track Pills: Lo-Fi, Piano, Ocean Waves, Cozy Fire, Rain, Zen Bowls */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {AMBIENT_TRACKS.map((track) => {
            const isSelected = currentTrack === track.id;
            const isCurrentPlaying = isSelected && isAudioPlaying;

            return (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(track.id)}
                className={`px-2 py-2 rounded-xl text-left transition-all border cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm'
                    : 'bg-[#151928] border-white/5 text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] font-bold truncate">
                    {track.id === 'lofi' && '🎧 Lo-Fi Beats'}
                    {track.id === 'piano' && '🎹 Piano Calm'}
                    {track.id === 'waves' && '🌊 Ocean Waves'}
                    {track.id === 'fire' && '🔥 Cozy Fire'}
                    {track.id === 'rain' && '🌧️ Rain & Thunder'}
                    {track.id === 'zen' && '🧘 432Hz Zen'}
                  </span>
                  {isCurrentPlaying && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>
                <span className="text-[9px] text-slate-500 truncate block">
                  {track.category === 'music' ? 'Chill Song' : 'Nature Sound'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. MAIN BONSAI FOCUS ARENA */}
      <div className="p-5 rounded-3xl bg-gradient-to-b from-[#131926] to-[#0e121d] border border-white/10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
        {/* Soft Ambient Glow */}
        <div className="absolute w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Mode Pill: Focus vs Break */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-black/40 border border-white/10 mb-2">
          <button
            onClick={() => handleSelectDuration(25, 'focus')}
            disabled={isActive}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              timerMode === 'focus'
                ? 'bg-emerald-500 text-black font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Deep Focus
          </button>
          <button
            onClick={() => handleSelectDuration(5, 'break')}
            disabled={isActive}
            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
              timerMode === 'break'
                ? 'bg-cyan-400 text-black font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Recharge Break
          </button>
        </div>

        {/* Tree Graphic Scaling With Time */}
        <div className="relative w-36 h-36 flex items-center justify-center my-1">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full transition-transform duration-700"
            style={{ transform: `scale(${0.65 + (progressPct / 100) * 0.4})` }}
          >
            {/* Bonsai Pot */}
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
            <circle cx="48" cy="30" r={progressPct > 20 ? "14" : "6"} fill={timerMode === 'focus' ? '#10b981' : '#06b6d4'} />
            <circle cx="38" cy="40" r={progressPct > 45 ? "12" : "4"} fill={timerMode === 'focus' ? '#059669' : '#0891b2'} />
            <circle cx="58" cy="38" r={progressPct > 70 ? "13" : "5"} fill={timerMode === 'focus' ? '#34d399' : '#22d3ee'} />
            <circle cx="48" cy="22" r={progressPct > 90 ? "11" : "3"} fill={timerMode === 'focus' ? '#6ee7b7' : '#67e8f9'} />
          </svg>
        </div>

        {/* Digital Time Readout */}
        <div className="mt-1 text-center">
          <span className="text-4xl sm:text-5xl font-black font-mono text-white tracking-tight">
            {formatTimer(timeLeft)}
          </span>
          <span className="text-xs text-slate-400 block mt-1">
            {isActive 
              ? `${timerMode === 'focus' ? 'Focusing' : 'Resting'} · tree is growing` 
              : 'Press Start to plant your digital tree'}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={isActive ? handlePause : handleStart}
            className={`px-8 py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg flex items-center gap-2 hover:scale-105 active:scale-95 transition-all cursor-pointer ${
              timerMode === 'focus'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 shadow-cyan-500/25'
            }`}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            <span>{isActive ? 'Pause' : timerMode === 'focus' ? 'Plant Tree' : 'Start Break'}</span>
          </button>
        </div>

        {/* Auto-Play Beats Toggle */}
        <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between w-full text-xs text-slate-400 px-2">
          <span className="text-[11px]">Auto-play beats during sessions</span>
          <button
            onClick={() => setAutoPlayAudio(!autoPlayAudio)}
            className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${
              autoPlayAudio ? 'bg-emerald-500' : 'bg-white/20'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                autoPlayAudio ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Preset Duration Buttons */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-slate-300">Focus Duration Presets</label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { mins: 15, label: 'Sprint' },
            { mins: 25, label: 'Pomodoro' },
            { mins: 45, label: 'Deep' },
            { mins: 60, label: 'Flow' },
          ].map((preset) => (
            <button
              key={preset.mins}
              onClick={() => handleSelectDuration(preset.mins, 'focus')}
              disabled={isActive}
              className={`py-2 px-1 rounded-xl text-xs font-mono transition-all border text-center cursor-pointer ${
                selectedDuration === preset.mins && timerMode === 'focus'
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold shadow-sm'
                  : 'bg-[#131724] border-white/5 text-slate-400 hover:text-white disabled:opacity-50'
              }`}
            >
              <div className="font-bold">{preset.mins}m</div>
              <div className="text-[9px] text-slate-500">{preset.label}</div>
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
          <span className="text-[10px] text-emerald-400 font-mono font-semibold">
            {trees.length} Sessions Logged
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
