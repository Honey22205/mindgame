import React, { useState } from 'react';
import { HabitItem } from '../../services/mindStorage';
import { mindAudio } from '../../services/mindAudio';
import { 
  CheckCircle2, 
  Circle, 
  Flame, 
  Plus, 
  X, 
  Sparkles, 
  BookOpen, 
  Droplet, 
  Zap, 
  Moon,
  Heart
} from 'lucide-react';

interface Props {
  habits: HabitItem[];
  onToggleHabit: (id: string) => void;
  onAddHabit: (title: string, category: HabitItem['category']) => void;
}

export const HabitsView: React.FC<Props> = ({
  habits,
  onToggleHabit,
  onAddHabit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<HabitItem['category']>('health');

  const completedCount = habits.filter((h) => h.isCompleted).length;

  const handleToggle = (id: string, isCompleted: boolean) => {
    if (!isCompleted) {
      mindAudio.playComplete();
      mindAudio.triggerHaptic('success');
    } else {
      mindAudio.playTap();
      mindAudio.triggerHaptic('light');
    }
    onToggleHabit(id);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddHabit(newTitle.trim(), newCategory);
    setNewTitle('');
    setIsModalOpen(false);
    mindAudio.playTap();
  };

  const categoryIcons: Record<string, any> = {
    health: Droplet,
    learning: BookOpen,
    mind: Sparkles,
    productivity: Zap,
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 font-bold">
            DAILY HABIT MASTERY
          </span>
          <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
            Routine Quests
          </h2>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-500/25 transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Progress Card */}
      <div className="p-4 rounded-3xl bg-[#131726] border border-white/5 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-white">Daily Completion</span>
          <span className="font-mono text-cyan-400 font-bold">
            {completedCount} of {habits.length} done
          </span>
        </div>

        <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
          <div
            style={{ width: `${(completedCount / Math.max(1, habits.length)) * 100}%` }}
            className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-300"
          />
        </div>
      </div>

      {/* Habit Cards */}
      <div className="space-y-2.5">
        {habits.map((habit) => {
          const Icon = categoryIcons[habit.category] || Sparkles;
          return (
            <div
              key={habit.id}
              onClick={() => handleToggle(habit.id, habit.isCompleted)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                habit.isCompleted
                  ? 'bg-[#101423]/60 border-emerald-500/30'
                  : 'bg-[#121626] border-white/5 hover:border-white/15'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  type="button"
                  className="shrink-0 text-slate-400 hover:text-emerald-400 transition-colors"
                >
                  {habit.isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-600" />
                  )}
                </button>

                <div className="min-w-0">
                  <h4
                    className={`text-xs font-semibold truncate ${
                      habit.isCompleted ? 'text-slate-400 line-through' : 'text-white'
                    }`}
                  >
                    {habit.title}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono capitalize">
                    {habit.category}
                  </span>
                </div>
              </div>

              {/* Streak */}
              <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 shrink-0">
                <Flame className="w-3.5 h-3.5 fill-amber-500/20" />
                <span>{habit.streak}d</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Habit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-[#0f121e] border border-white/10 rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <h3 className="text-sm font-bold text-white">Create Daily Habit</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Habit Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 10 mins meditation"
                  className="w-full bg-[#161a29] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500"
                  autoFocus
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Domain Category</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#161a29] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none"
                >
                  <option value="health">Health & Body</option>
                  <option value="mind">Mindfulness & Mental</option>
                  <option value="learning">Learning & Books</option>
                  <option value="productivity">Deep Productivity</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Add Habit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
