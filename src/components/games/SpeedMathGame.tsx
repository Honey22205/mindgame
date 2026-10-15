import React, { useState, useEffect, useRef } from 'react';
import { mindAudio } from '../../services/mindAudio';
import { ArrowLeft, Clock, Zap, CheckCircle2, RotateCcw, Award } from 'lucide-react';

interface Props {
  onFinish: (score: number) => void;
  onExit: () => void;
}

interface MathProblem {
  question: string;
  answer: number;
  options: number[];
}

export const SpeedMathGame: React.FC<Props> = ({ onFinish, onExit }) => {
  const [timeLeft, setTimeLeft] = useState(45);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isGameOver, setIsGameOver] = useState(false);

  const timerRef = useRef<any>(null);

  const generateProblem = (): MathProblem => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = 0;
    let b = 0;
    let ans = 0;

    if (op === '+') {
      a = Math.floor(Math.random() * 40) + 10;
      b = Math.floor(Math.random() * 40) + 5;
      ans = a + b;
    } else if (op === '-') {
      a = Math.floor(Math.random() * 50) + 20;
      b = Math.floor(Math.random() * (a - 5)) + 5;
      ans = a - b;
    } else {
      a = Math.floor(Math.random() * 9) + 3;
      b = Math.floor(Math.random() * 9) + 3;
      ans = a * b;
    }

    const question = `${a} ${op} ${b}`;
    const optionsSet = new Set<number>([ans]);

    while (optionsSet.size < 4) {
      const offset = (Math.floor(Math.random() * 6) + 1) * (Math.random() < 0.5 ? -1 : 1);
      const wrong = ans + offset;
      if (wrong > 0 && wrong !== ans) {
        optionsSet.add(wrong);
      }
    }

    const options = Array.from(optionsSet).sort(() => Math.random() - 0.5);
    return { question, answer: ans, options };
  };

  useEffect(() => {
    setCurrentProblem(generateProblem());

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

  const handleSelectOption = (choice: number) => {
    if (!currentProblem || isGameOver) return;

    if (choice === currentProblem.answer) {
      const nextCombo = combo + 1;
      const pts = 10 * Math.min(nextCombo, 5);
      setScore((s) => s + pts);
      setCombo(nextCombo);
      setSolvedCount((c) => c + 1);
      setFeedback('correct');
      mindAudio.playCorrect(nextCombo);
      mindAudio.triggerHaptic('light');
    } else {
      setCombo(0);
      setMistakes((m) => m + 1);
      setFeedback('wrong');
      mindAudio.playWrong();
      mindAudio.triggerHaptic('medium');
    }

    setTimeout(() => {
      setFeedback(null);
      setCurrentProblem(generateProblem());
    }, 180);
  };

  const handleRestart = () => {
    setTimeLeft(45);
    setScore(0);
    setCombo(0);
    setSolvedCount(0);
    setMistakes(0);
    setIsGameOver(false);
    setCurrentProblem(generateProblem());

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

  return (
    <div className="relative w-full h-full bg-[#0a0c12] text-slate-100 flex flex-col p-4 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between shrink-0 mb-4">
        <button
          onClick={onExit}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1.5 text-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 font-mono text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{timeLeft}s</span>
          </div>

          <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-mono text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>{score} pts</span>
          </div>
        </div>
      </div>

      {/* Main Question Surface */}
      {!isGameOver && currentProblem ? (
        <div className="flex-1 flex flex-col justify-between max-w-sm mx-auto w-full py-4">
          {/* Combo & Progress */}
          <div className="text-center h-8 flex items-center justify-center">
            {combo > 1 ? (
              <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 animate-pulse">
                {combo}x STREAK MULTIPLIER!
              </span>
            ) : (
              <span className="text-[11px] text-slate-500 font-medium">Mental Arithmetic Sprint</span>
            )}
          </div>

          {/* Large Problem Display */}
          <div
            className={`p-8 rounded-3xl bg-[#121522] border transition-all text-center flex flex-col items-center justify-center min-h-[160px] shadow-xl ${
              feedback === 'correct'
                ? 'border-emerald-500/80 bg-emerald-950/20 scale-[1.02]'
                : feedback === 'wrong'
                ? 'border-rose-500/80 bg-rose-950/20 scale-95'
                : 'border-white/10'
            }`}
          >
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono">
              {currentProblem.question}
            </span>
            <span className="text-xs text-slate-400 mt-2 font-medium">Select the correct solution</span>
          </div>

          {/* 4 Large Clean Choice Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-6">
            {currentProblem.options.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelectOption(opt)}
                className="py-5 rounded-2xl bg-[#151928] hover:bg-[#1c2236] active:scale-95 border border-white/10 hover:border-indigo-500/50 text-xl font-bold font-mono text-white transition-all shadow-md flex items-center justify-center cursor-pointer"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Game Over Screen */}
      {isGameOver && (
        <div className="flex-1 flex flex-col items-center justify-center max-w-xs mx-auto text-center space-y-5 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-xl">
            <Award className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 font-bold">
              WORKOUT COMPLETE
            </span>
            <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
              {score} Points
            </h3>
            <p className="text-xs text-slate-400 mt-1">Excellent mental arithmetic speed!</p>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full p-4 rounded-2xl bg-[#141724] border border-white/5 text-left text-xs font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">Solved</span>
              <span className="text-sm font-bold text-emerald-400">{solvedCount}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Accuracy</span>
              <span className="text-sm font-bold text-cyan-400">
                {solvedCount + mistakes > 0
                  ? Math.round((solvedCount / (solvedCount + mistakes)) * 100)
                  : 100}
                %
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full pt-2">
            <button
              onClick={() => onFinish(score)}
              className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
            >
              Done
            </button>
            <button
              onClick={handleRestart}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 text-white text-xs font-semibold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
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
