import React, { useState, useEffect, useRef } from 'react';
import { mindAudio } from '../../services/mindAudio';
import { ArrowLeft, Clock, Zap, Check, X, RotateCcw, Award } from 'lucide-react';

interface Props {
  onFinish: (accuracy: number) => void;
  onExit: () => void;
}

interface StroopTrial {
  text: string;
  inkColor: string;
  inkName: string;
  mode: 'color' | 'text';
  promptName: string;
  isMatch: boolean;
}

const COLORS = [
  { name: 'Red', hex: '#f43f5e' },
  { name: 'Blue', hex: '#38bdf8' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Yellow', hex: '#facc15' },
];

export const StroopFocusGame: React.FC<Props> = ({ onFinish, onExit }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [trial, setTrial] = useState<StroopTrial | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const startTimeRef = useRef<number>(performance.now());
  const timerRef = useRef<any>(null);

  const nextTrial = (): StroopTrial => {
    const textIdx = Math.floor(Math.random() * COLORS.length);
    const inkIdx = Math.floor(Math.random() * COLORS.length);
    const text = COLORS[textIdx].name;
    const ink = COLORS[inkIdx];

    const mode: 'color' | 'text' = Math.random() < 0.5 ? 'color' : 'text';
    const isMatch = Math.random() < 0.5;

    let promptName = '';
    if (mode === 'color') {
      promptName = isMatch
        ? ink.name
        : COLORS.filter((c) => c.name !== ink.name)[Math.floor(Math.random() * (COLORS.length - 1))].name;
    } else {
      promptName = isMatch
        ? text
        : COLORS.filter((c) => c.name !== text)[Math.floor(Math.random() * (COLORS.length - 1))].name;
    }

    startTimeRef.current = performance.now();
    return {
      text,
      inkColor: ink.hex,
      inkName: ink.name,
      mode,
      promptName,
      isMatch,
    };
  };

  useEffect(() => {
    setTrial(nextTrial());

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleAnswer = (userSaysYes: boolean) => {
    if (!trial || isGameOver) return;
    const rt = performance.now() - startTimeRef.current;
    setReactionTimes((arr) => [...arr, rt]);
    setTotalAttempts((t) => t + 1);

    const isCorrect = userSaysYes === trial.isMatch;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
      setFeedback('correct');
      mindAudio.playCorrect();
      mindAudio.triggerHaptic('light');
    } else {
      setFeedback('wrong');
      mindAudio.playWrong();
      mindAudio.triggerHaptic('medium');
    }

    setTimeout(() => {
      setFeedback(null);
      setTrial(nextTrial());
    }, 150);
  };

  const handleRestart = () => {
    setTimeLeft(30);
    setCorrectCount(0);
    setTotalAttempts(0);
    setReactionTimes([]);
    setIsGameOver(false);
    setTrial(nextTrial());

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 100;
  const avgReactionTime = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0;

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
          <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 font-mono text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-rose-400" />
            <span>{timeLeft}s</span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-slate-300 font-mono text-xs font-bold">
            <span>{accuracy}% ACC</span>
          </div>
        </div>
      </div>

      {!isGameOver && trial ? (
        <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4">
          {/* Instruction Kicker */}
          <div className="text-center">
            <span className="text-[11px] font-mono tracking-wide uppercase px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
              {trial.mode === 'color' ? 'Match INK COLOR with prompt' : 'Match TEXT with prompt'}
            </span>
          </div>

          {/* Word Card */}
          <div
            className={`p-8 rounded-3xl bg-[#121522] border transition-all text-center flex flex-col items-center justify-center min-h-[180px] shadow-2xl ${
              feedback === 'correct'
                ? 'border-emerald-500/80 bg-emerald-950/20'
                : feedback === 'wrong'
                ? 'border-rose-500/80 bg-rose-950/20'
                : 'border-white/10'
            }`}
          >
            <span
              style={{ color: trial.inkColor }}
              className="text-5xl sm:text-6xl font-black tracking-wider uppercase font-mono drop-shadow-md"
            >
              {trial.text}
            </span>

            <div className="mt-4 pt-3 border-t border-white/10 text-sm font-medium text-slate-300">
              Does the {trial.mode === 'color' ? 'color' : 'text'} match{' '}
              <span className="font-bold text-white underline">{trial.promptName}</span>?
            </div>
          </div>

          {/* YES / NO Large Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-6">
            <button
              onClick={() => handleAnswer(false)}
              className="py-5 rounded-2xl bg-[#181d2c] hover:bg-rose-950/40 active:scale-95 border border-white/10 hover:border-rose-500/50 text-rose-400 font-bold text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <X className="w-5 h-5" />
              <span>NO</span>
            </button>

            <button
              onClick={() => handleAnswer(true)}
              className="py-5 rounded-2xl bg-[#181d2c] hover:bg-emerald-950/40 active:scale-95 border border-white/10 hover:border-emerald-500/50 text-emerald-400 font-bold text-base transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>YES</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-xs mx-auto text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-300 shadow-xl">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-rose-400 font-bold">
              FOCUS CALIBRATION
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {accuracy}% Accuracy
            </h3>
            <p className="text-xs text-slate-400 mt-1">Average response time: {avgReactionTime}ms</p>
          </div>

          <div className="flex items-center gap-2 w-full pt-2">
            <button
              onClick={() => onFinish(accuracy)}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
            >
              Done
            </button>
            <button
              onClick={handleRestart}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 flex items-center justify-center gap-1.5"
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
