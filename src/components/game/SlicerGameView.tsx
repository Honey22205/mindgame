import React, { useRef, useEffect, useState } from 'react';
import { SlicerEngine } from '../../game/slicerEngine';
import { ArrowLeft, RotateCcw, Flame, Heart, Trophy, Zap } from 'lucide-react';
import { gameAudio } from '../../game/audio';

interface Props {
  onExit: () => void;
  onRewardCredits: (credits: number) => void;
}

export const SlicerGameView: React.FC<Props> = ({ onExit, onRewardCredits }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<SlicerEngine | null>(null);

  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOverScore, setGameOverScore] = useState<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const container = canvasRef.current.parentElement;
    if (container) {
      canvasRef.current.width = container.clientWidth;
      canvasRef.current.height = container.clientHeight;
    }

    const engine = new SlicerEngine(
      canvasRef.current,
      (s, c, l) => {
        setScore(s);
        setCombo(c);
        setLives(l);
      },
      (finalScore) => {
        setGameOverScore(finalScore);
        const credits = Math.floor(finalScore / 10);
        onRewardCredits(credits);
      }
    );

    engineRef.current = engine;
    engine.start();

    return () => {
      engine.stop();
    };
  }, [onRewardCredits]);

  // Touch and pointer movement for slicing
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!canvasRef.current || !engineRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    engineRef.current.addTrailPoint(x, y);
  };

  const handleRestart = () => {
    setGameOverScore(null);
    engineRef.current?.start();
  };

  return (
    <div className="relative w-full h-full bg-[#06070e] select-none touch-none overflow-hidden flex flex-col">
      {/* HUD Header */}
      <div className="p-3.5 flex items-center justify-between text-xs z-20 bg-gradient-to-b from-black/80 to-transparent">
        <button
          onClick={onExit}
          className="p-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 flex items-center gap-1 text-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        {/* Score & Combo */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-[10px] font-mono text-slate-400 block">SCORE</span>
            <span className="text-base font-extrabold font-mono text-cyan-400">{score}</span>
          </div>

          {combo > 1 && (
            <div className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold animate-pulse">
              {combo}x COMBO!
            </div>
          )}
        </div>

        {/* Hearts */}
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((heart) => (
            <Heart
              key={heart}
              className={`w-4 h-4 ${heart <= lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}`}
            />
          ))}
        </div>
      </div>

      {/* Slicing Canvas */}
      <div
        className="flex-1 relative w-full h-full cursor-crosshair"
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerMove}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        <div className="absolute top-4 left-0 right-0 text-center pointer-events-none opacity-40 text-xs font-mono text-slate-400">
          Swipe or drag to slice cyber orbs · Avoid bombs 💣
        </div>
      </div>

      {/* Game Over Modal */}
      {gameOverScore !== null && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-xs bg-[#0f121e] border border-cyan-500/40 rounded-3xl p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mx-auto">
              <Trophy className="w-6 h-6" />
            </div>

            <div>
              <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                CHALLENGE COMPLETE
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
                {gameOverScore} PTS
              </h3>
              <p className="text-xs text-amber-400 font-mono mt-1">
                +{Math.floor(gameOverScore / 10)} Credits Earned!
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={onExit}
                className="flex-1 py-2 rounded-xl bg-white/10 text-slate-300 text-xs font-semibold"
              >
                Hub
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-cyan-500/30"
              >
                Play Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
