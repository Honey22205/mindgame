import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../../game/engine';
import { UpgradeCard, GameStats, MetaUpgrades } from '../../game/types';
import { VirtualJoystick } from './VirtualJoystick';
import { gameAudio } from '../../game/audio';
import { 
  Heart, 
  Flame, 
  Clock, 
  Coins, 
  Volume2, 
  VolumeX, 
  Pause, 
  Play, 
  RotateCcw, 
  ArrowLeft,
  Sparkles,
  Zap,
  Shield,
  Crosshair,
  Award
} from 'lucide-react';

interface Props {
  selectedHeroId: string;
  metaUpgrades: MetaUpgrades;
  onExit: () => void;
  onRunFinished: (stats: GameStats) => void;
}

export const SurvivorGameView: React.FC<Props> = ({
  selectedHeroId,
  metaUpgrades,
  onExit,
  onRunFinished,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // HUD State
  const [hp, setHp] = useState({ current: 100, max: 100 });
  const [xp, setXp] = useState({ current: 0, needed: 25, level: 1 });
  const [score, setScore] = useState({ kills: 0, time: 0, credits: 0 });
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Modals & Banners
  const [levelUpChoices, setLevelUpChoices] = useState<UpgradeCard[] | null>(null);
  const [bossAlert, setBossAlert] = useState<string | null>(null);
  const [gameOverStats, setGameOverStats] = useState<{ victory: boolean; stats: GameStats } | null>(null);

  // Resize canvas to match container
  const updateSize = useCallback(() => {
    if (canvasRef.current && engineRef.current) {
      const container = canvasRef.current.parentElement;
      if (container) {
        const w = container.clientWidth;
        const h = container.clientHeight;
        engineRef.current.resize(w, h);
      }
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(
      canvasRef.current,
      selectedHeroId,
      metaUpgrades,
      {
        onHpChange: (current, max) => setHp({ current, max }),
        onXpChange: (current, needed, level) => setXp({ current, needed, level }),
        onScoreUpdate: (kills, time, credits) => setScore({ kills, time, credits }),
        onBossAlert: (bossName) => {
          setBossAlert(bossName);
          setTimeout(() => setBossAlert(null), 4000);
        },
        onLevelUp: (choices) => setLevelUpChoices(choices),
        onGameOver: (victory, stats) => {
          setGameOverStats({ victory, stats });
          onRunFinished(stats);
        },
      }
    );

    engineRef.current = engine;
    updateSize();
    engine.start();

    window.addEventListener('resize', updateSize);
    return () => {
      engine.stop();
      window.removeEventListener('resize', updateSize);
    };
  }, [selectedHeroId, metaUpgrades, updateSize, onRunFinished]);

  const handleJoystickMove = (x: number, y: number) => {
    engineRef.current?.setInput(x, y);
  };

  const handleSelectUpgrade = (card: UpgradeCard) => {
    gameAudio.playButtonClick();
    setLevelUpChoices(null);
    engineRef.current?.applyUpgrade(card);
  };

  const togglePause = () => {
    if (!engineRef.current) return;
    if (isPaused) {
      engineRef.current.resume();
      setIsPaused(false);
    } else {
      engineRef.current.pause();
      setIsPaused(true);
    }
    gameAudio.playButtonClick();
  };

  const toggleAudio = () => {
    const muted = gameAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleRestart = () => {
    setGameOverStats(null);
    setLevelUpChoices(null);
    engineRef.current?.stop();
    if (canvasRef.current) {
      const engine = new GameEngine(
        canvasRef.current,
        selectedHeroId,
        metaUpgrades,
        {
          onHpChange: (current, max) => setHp({ current, max }),
          onXpChange: (current, needed, level) => setXp({ current, needed, level }),
          onScoreUpdate: (kills, time, credits) => setScore({ kills, time, credits }),
          onBossAlert: (bossName) => {
            setBossAlert(bossName);
            setTimeout(() => setBossAlert(null), 4000);
          },
          onLevelUp: (choices) => setLevelUpChoices(choices),
          onGameOver: (victory, stats) => {
            setGameOverStats({ victory, stats });
            onRunFinished(stats);
          },
        }
      );
      engineRef.current = engine;
      updateSize();
      engine.start();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const rarityColors = {
    common: 'border-slate-500/40 bg-slate-800/40 text-slate-300',
    rare: 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300 shadow-cyan-500/20',
    epic: 'border-purple-500/50 bg-purple-950/40 text-purple-300 shadow-purple-500/20',
    legendary: 'border-amber-500/60 bg-amber-950/40 text-amber-300 shadow-amber-500/30',
  };

  const hpPct = Math.max(0, Math.min(100, (hp.current / hp.max) * 100));
  const xpPct = Math.max(0, Math.min(100, (xp.current / xp.needed) * 100));

  return (
    <div className="relative w-full h-full bg-[#06070c] overflow-hidden select-none touch-none flex flex-col">
      {/* Top XP Bar */}
      <div className="w-full h-1.5 bg-slate-900 overflow-hidden relative z-20">
        <div
          style={{ width: `${xpPct}%` }}
          className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 shadow-sm shadow-cyan-400 transition-all duration-150"
        />
      </div>

      {/* Main Game HUD Header */}
      <div className="p-3 flex items-center justify-between text-xs z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        {/* Left: Health Bar & Level */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 font-mono text-cyan-300 font-bold">
            <span>LV.{xp.level}</span>
          </div>

          <div className="w-28 sm:w-36 h-4 bg-black/60 border border-white/20 rounded-full overflow-hidden relative flex items-center px-1.5">
            <div
              style={{ width: `${hpPct}%` }}
              className={`absolute left-0 top-0 bottom-0 transition-all duration-200 ${
                hpPct > 50 ? 'bg-emerald-500' : hpPct > 25 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
            />
            <span className="relative z-10 text-[9px] font-mono text-white font-bold">
              {Math.round(hp.current)} / {hp.max}
            </span>
          </div>
        </div>

        {/* Center: Wave Timer */}
        <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-black/50 border border-white/10 font-mono text-sm text-white font-bold shadow-md">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{formatTime(score.time)}</span>
        </div>

        {/* Right: Kills, Gold, Audio, Pause */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-1 text-[11px] font-mono text-rose-400">
            <Flame className="w-3.5 h-3.5" />
            <span>{score.kills}</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] font-mono text-amber-400">
            <Coins className="w-3.5 h-3.5" />
            <span>{score.credits}</span>
          </div>

          <button
            onClick={toggleAudio}
            className="p-1 rounded-lg bg-black/40 border border-white/10 text-slate-300 hover:text-white"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={togglePause}
            className="p-1 rounded-lg bg-black/40 border border-white/10 text-slate-300 hover:text-white"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div className="flex-1 relative w-full h-full overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* Boss Warning Banner */}
        {bossAlert && (
          <div className="absolute top-12 left-0 right-0 z-30 flex justify-center animate-bounce">
            <div className="px-6 py-2.5 rounded-2xl bg-rose-950/90 border-2 border-rose-500 shadow-2xl text-rose-300 text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <span>WARNING: {bossAlert} IMMINENT</span>
            </div>
          </div>
        )}

        {/* Virtual Joystick for Mobile (Bottom-Left) */}
        <div className="absolute bottom-6 left-6 z-20">
          <VirtualJoystick onMove={handleJoystickMove} />
        </div>

        {/* Desktop Controls Hint (Bottom-Right) */}
        <div className="hidden sm:block absolute bottom-6 right-6 z-20 pointer-events-none text-[10px] font-mono text-slate-400 bg-black/40 border border-white/10 rounded-xl px-3 py-1.5 backdrop-blur-sm">
          <span>Controls: [WASD] or [Arrow Keys] or Virtual Stick</span>
        </div>
      </div>

      {/* Level-Up Modal Overlay */}
      {levelUpChoices && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0f121e] border-2 border-cyan-500/50 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                SYSTEM LEVEL UP
              </span>
              <h3 className="text-xl font-extrabold text-white tracking-tight">Choose Upgrade</h3>
              <p className="text-xs text-slate-400">Enhance your combat frame to survive deeper waves</p>
            </div>

            <div className="space-y-2.5">
              {levelUpChoices.map((card) => (
                <button
                  key={card.id}
                  onClick={() => handleSelectUpgrade(card)}
                  className={`w-full p-3.5 rounded-2xl border text-left transition-all hover:scale-[1.02] active:scale-98 shadow-md flex items-center justify-between cursor-pointer ${
                    rarityColors[card.rarity] || rarityColors.common
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{card.title}</span>
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/10 font-semibold">
                        {card.rarity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">{card.description}</p>
                  </div>
                  <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 ml-2">
                    <Zap className="w-4 h-4" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Game Over / Victory Modal */}
      {gameOverStats && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
          <div className="w-full max-w-sm bg-[#0e111a] border border-cyan-500/40 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mx-auto">
              {gameOverStats.victory ? <Award className="w-8 h-8" /> : <Flame className="w-8 h-8 text-rose-400" />}
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                {gameOverStats.victory ? 'SECTOR PURGED' : 'COMBAT CHASSIS OFFLINE'}
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {gameOverStats.victory ? 'VICTORY' : 'DEFEATED'}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-black/40 border border-white/5 text-left text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block">Time Survived</span>
                <span className="text-sm font-bold text-white">{formatTime(gameOverStats.stats.timeSurvived)}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Enemies Slain</span>
                <span className="text-sm font-bold text-rose-400">{gameOverStats.stats.enemiesKilled}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Damage Dealt</span>
                <span className="text-sm font-bold text-cyan-400">{gameOverStats.stats.damageDealt}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Credits Earned</span>
                <span className="text-sm font-bold text-amber-400">+{gameOverStats.stats.creditsEarned} 🪙</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={onExit}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Armoury</span>
              </button>

              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pause Menu Overlay */}
      {isPaused && !levelUpChoices && !gameOverStats && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#0f121e] border border-white/20 rounded-3xl p-6 text-center space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight">System Paused</h3>
            <div className="space-y-2">
              <button
                onClick={togglePause}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-bold"
              >
                Resume Combat
              </button>
              <button
                onClick={handleRestart}
                className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 text-xs font-semibold"
              >
                Restart Sector
              </button>
              <button
                onClick={onExit}
                className="w-full py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold border border-rose-500/30"
              >
                Abort to Hub
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
