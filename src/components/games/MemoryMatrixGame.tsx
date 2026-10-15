import React, { useState, useEffect } from 'react';
import { mindAudio } from '../../services/mindAudio';
import { ArrowLeft, Brain, Heart, RotateCcw, Award } from 'lucide-react';

interface Props {
  onFinish: (maxLevel: number) => void;
  onExit: () => void;
}

export const MemoryMatrixGame: React.FC<Props> = ({ onFinish, onExit }) => {
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [isMemorizing, setIsMemorizing] = useState(true);
  const [targetTiles, setTargetTiles] = useState<number[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [wrongTiles, setWrongTiles] = useState<number[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // Determine grid dimension: 3x3 for levels 1-2, 4x4 for 3-5, 5x5 for 6+
  const gridSize = level <= 2 ? 3 : level <= 5 ? 4 : 5;
  const tileCount = gridSize * gridSize;
  const targetCount = level <= 2 ? level + 2 : Math.min(10, 3 + level);

  const startLevel = (lvl: number) => {
    const size = lvl <= 2 ? 3 : lvl <= 5 ? 4 : 5;
    const total = size * size;
    const count = lvl <= 2 ? lvl + 2 : Math.min(10, 3 + lvl);

    // Pick random indices
    const picked = new Set<number>();
    while (picked.size < count) {
      picked.add(Math.floor(Math.random() * total));
    }
    const targetArr = Array.from(picked);
    setTargetTiles(targetArr);
    setSelectedTiles([]);
    setWrongTiles([]);
    setIsMemorizing(true);

    // Hide after 1.4s
    setTimeout(() => {
      setIsMemorizing(false);
    }, 1400);
  };

  useEffect(() => {
    startLevel(level);
  }, [level]);

  const handleTileClick = (index: number) => {
    if (isMemorizing || isGameOver || selectedTiles.includes(index) || wrongTiles.includes(index)) return;

    if (targetTiles.includes(index)) {
      const updated = [...selectedTiles, index];
      setSelectedTiles(updated);
      mindAudio.playCorrect(updated.length);
      mindAudio.triggerHaptic('light');

      // Check level cleared
      if (updated.length === targetTiles.length) {
        mindAudio.playComplete();
        setTimeout(() => {
          setLevel((l) => l + 1);
        }, 500);
      }
    } else {
      setWrongTiles((w) => [...w, index]);
      mindAudio.playWrong();
      mindAudio.triggerHaptic('medium');

      const nextLives = lives - 1;
      setLives(nextLives);
      if (nextLives <= 0) {
        setIsGameOver(true);
      }
    }
  };

  const handleRestart = () => {
    setLevel(1);
    setLives(3);
    setIsGameOver(false);
  };

  return (
    <div className="relative w-full h-full bg-[#0a0c12] text-slate-100 flex flex-col p-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0 mb-4">
        <button
          onClick={onExit}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1.5 text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-mono text-xs font-bold">
            <Brain className="w-3.5 h-3.5 text-emerald-400" />
            <span>Level {level}</span>
          </div>

          <div className="flex items-center gap-1">
            {[1, 2, 3].map((heart) => (
              <Heart
                key={heart}
                className={`w-4 h-4 ${heart <= lives ? 'text-rose-500 fill-rose-500' : 'text-slate-700'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      {!isGameOver ? (
        <div className="flex-1 flex flex-col items-center justify-center max-w-xs mx-auto w-full">
          <div className="text-center mb-6">
            <span className="text-xs font-bold font-mono tracking-wide uppercase px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
              {isMemorizing ? 'Memorize Tiles...' : `Recall ${targetTiles.length - selectedTiles.length} Tiles`}
            </span>
          </div>

          {/* Dynamic Grid */}
          <div
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            }}
            className="grid gap-2.5 w-full aspect-square p-3 bg-[#131724] border border-white/10 rounded-3xl shadow-2xl"
          >
            {Array.from({ length: tileCount }).map((_, idx) => {
              const isTargetAndMemorizing = isMemorizing && targetTiles.includes(idx);
              const isCorrectlySelected = selectedTiles.includes(idx);
              const isWrong = wrongTiles.includes(idx);

              return (
                <button
                  key={idx}
                  onClick={() => handleTileClick(idx)}
                  disabled={isMemorizing}
                  className={`w-full h-full rounded-2xl transition-all duration-150 border active:scale-95 cursor-pointer ${
                    isTargetAndMemorizing || isCorrectlySelected
                      ? 'bg-emerald-500 border-emerald-400 shadow-lg shadow-emerald-500/40 scale-[1.02]'
                      : isWrong
                      ? 'bg-rose-500 border-rose-400 shadow-lg shadow-rose-500/40'
                      : 'bg-[#1b2032] border-white/5 hover:border-white/20'
                  }`}
                />
              );
            })}
          </div>
        </div>
      ) : (
        /* Game Over */
        <div className="flex-1 flex flex-col items-center justify-center max-w-xs mx-auto text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-300 shadow-xl">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              MEMORY BENCHMARK
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Level {level} Reached
            </h3>
            <p className="text-xs text-slate-400 mt-1">Spatial working memory calibrated!</p>
          </div>

          <div className="flex items-center gap-2 w-full pt-2">
            <button
              onClick={() => onFinish(level)}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
            >
              Done
            </button>
            <button
              onClick={handleRestart}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
