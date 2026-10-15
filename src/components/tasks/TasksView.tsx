import React, { useState, useMemo } from 'react';
import { Task, Priority } from '../../types';
import { storage } from '../../services/storage';
import { sound } from '../../services/audio';
import { TaskDetailModal } from './TaskDetailModal';
import { 
  Search, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronRight, 
  SlidersHorizontal,
  Check,
  Sparkles,
  ArrowUpDown,
  Filter,
  Layers
} from 'lucide-react';

interface Props {
  tasks: Task[];
  onOpenAI: () => void;
}

export const TasksView: React.FC<Props> = ({ tasks, onOpenAI }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'today' | 'urgent' | 'pending' | 'completed'>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'due' | 'priority' | 'effort' | 'title'>('priority');
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({});

  // Modal state
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Quick inline add input
  const [quickTitle, setQuickTitle] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Distinct tags list
  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => t.tags?.forEach((tag) => set.add(tag)));
    return Array.from(set);
  }, [tasks]);

  // Filtering & Sorting
  const filteredTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesTitle = task.title.toLowerCase().includes(q);
          const matchesDesc = task.description?.toLowerCase().includes(q);
          const matchesTags = task.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchesTitle && !matchesDesc && !matchesTags) return false;
        }

        // Tag filter
        if (selectedTag && !task.tags?.includes(selectedTag)) {
          return false;
        }

        // Segment filter
        if (selectedFilter === 'today') {
          return task.dueDate === todayStr;
        }
        if (selectedFilter === 'urgent') {
          return task.priority === 'urgent' || task.priority === 'high';
        }
        if (selectedFilter === 'pending') {
          return !task.isCompleted;
        }
        if (selectedFilter === 'completed') {
          return task.isCompleted;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'priority') {
          const weights: Record<Priority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (weights[b.priority] || 0) - (weights[a.priority] || 0);
        }
        if (sortBy === 'due') {
          return a.dueDate.localeCompare(b.dueDate) || (a.dueTime || '').localeCompare(b.dueTime || '');
        }
        if (sortBy === 'effort') {
          return (b.estimatedMinutes || 0) - (a.estimatedMinutes || 0);
        }
        return a.title.localeCompare(b.title);
      });
  }, [tasks, searchQuery, selectedFilter, selectedTag, sortBy, todayStr]);

  const toggleTaskCompletion = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    if (!task.isCompleted) {
      sound.playComplete();
      sound.triggerHaptic('success');
    } else {
      sound.playTap();
      sound.triggerHaptic('light');
    }

    storage.toggleTaskCompletion(id);
  };

  const toggleExpand = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sound.playTap();
    setExpandedTasks((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubtaskToggle = (e: React.MouseEvent, taskId: string, subtaskId: string) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.subtasks) return;

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, isCompleted: !st.isCompleted } : st
    );

    const allFinished = updatedSubtasks.every((st) => st.isCompleted);
    sound.playTap();

    storage.updateTask(taskId, {
      subtasks: updatedSubtasks,
      ...(allFinished ? { isCompleted: true, completedAt: new Date().toISOString() } : {}),
    });
  };

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    sound.playSuccess();
    storage.addTask({
      title: quickTitle.trim(),
      description: '',
      priority: 'medium',
      dueDate: todayStr,
      dueTime: '17:00',
      estimatedMinutes: 30,
      tags: ['quick'],
      subtasks: [],
      isCompleted: false,
      recurrence: 'none',
      reminderMinutesBefore: 15,
    });
    setQuickTitle('');
  };

  const priorityStyles: Record<Priority, { indicator: string; text: string; bg: string }> = {
    urgent: { indicator: 'bg-rose-500', text: 'text-rose-400', bg: 'bg-rose-500/10' },
    high: { indicator: 'bg-amber-500', text: 'text-amber-400', bg: 'bg-amber-500/10' },
    medium: { indicator: 'bg-cyan-500', text: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    low: { indicator: 'bg-slate-500', text: 'text-slate-400', bg: 'bg-slate-800/40' },
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;
  const pendingCount = tasks.filter((t) => !t.isCompleted).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Search & Filter Bar */}
      <div className="p-4 pb-2 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Active Milestones</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>{pendingCount} remaining</span>
              <span aria-hidden="true">·</span>
              <span>{completedCount} completed</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingTask(null);
                setIsModalOpen(true);
                sound.playTap();
              }}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-cyan-500/25 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New</span>
            </button>
          </div>
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search objectives, context, tags..."
            className="w-full bg-[#131726] border border-white/8 rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
            >
              &times;
            </button>
          )}
        </div>

        {/* Segmented Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
          {(['all', 'today', 'urgent', 'pending', 'completed'] as const).map((filter) => {
            const active = selectedFilter === filter;
            return (
              <button
                key={filter}
                onClick={() => {
                  setSelectedFilter(filter);
                  sound.playTap();
                }}
                className={`px-3 py-1 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-white/15 text-white border border-white/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>

        {/* Secondary: Tag Filters and Sort Switcher */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {selectedTag && (
              <button
                onClick={() => setSelectedTag(null)}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline mr-1"
              >
                Clear #{selectedTag}
              </button>
            )}
            {allTags.slice(0, 5).map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  setSelectedTag(selectedTag === tag ? null : tag);
                  sound.playTap();
                }}
                className={`text-[11px] px-2 py-0.5 rounded-md transition-colors ${
                  selectedTag === tag
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ArrowUpDown className="w-3 h-3 text-slate-500" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[11px] text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="priority" className="bg-[#131726]">Priority</option>
              <option value="due" className="bg-[#131726]">Due Date</option>
              <option value="effort" className="bg-[#131726]">Effort</option>
              <option value="title" className="bg-[#131726]">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 mx-auto mb-3">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-white">No milestones match criteria</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
              {searchQuery ? 'Try clearing your search query or filters.' : 'Your pipeline is currently clear. Add a new milestone or ask NEXUS Copilot.'}
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => {
                  setEditingTask(null);
                  setIsModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold"
              >
                Create Milestone
              </button>
              <button
                onClick={onOpenAI}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-xs font-medium hover:text-white"
              >
                AI Assistance
              </button>
            </div>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isExpanded = Boolean(expandedTasks[task.id]);
            const pStyle = priorityStyles[task.priority];
            const hasSubtasks = (task.subtasks?.length || 0) > 0;
            const completedSubs = task.subtasks?.filter((s) => s.isCompleted).length || 0;
            const totalSubs = task.subtasks?.length || 0;

            const isDueToday = task.dueDate === todayStr;
            const isOverdue = task.dueDate < todayStr && !task.isCompleted;

            return (
              <div
                key={task.id}
                onClick={() => {
                  setEditingTask(task);
                  setIsModalOpen(true);
                  sound.playTap();
                }}
                className={`glass-card rounded-2xl p-3.5 transition-all cursor-pointer border group relative overflow-hidden ${
                  task.isCompleted
                    ? 'opacity-60 border-white/5 bg-[#0e111a]/40'
                    : 'hover:border-cyan-500/30 hover:bg-[#151928]/80'
                }`}
              >
                {/* Priority accent pill line on left */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${pStyle.indicator} ${
                    task.isCompleted ? 'opacity-40' : ''
                  }`}
                />

                <div className="flex items-start gap-3 pl-1">
                  {/* Tactile Checkbox */}
                  <button
                    type="button"
                    onClick={(e) => toggleTaskCompletion(e, task.id)}
                    className="mt-0.5 text-slate-400 hover:text-cyan-400 transition-colors shrink-0"
                    aria-label={task.isCompleted ? 'Mark incomplete' : 'Mark completed'}
                  >
                    {task.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                    )}
                  </button>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-xs font-medium tracking-tight ${
                          task.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                        }`}
                      >
                        {task.title}
                      </h4>

                      {/* Priority Tag */}
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize shrink-0 ${pStyle.bg} ${pStyle.text}`}>
                        {task.priority}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                    )}

                    {/* Clean unboxed metadata row */}
                    <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-400 mt-2">
                      {/* Due info */}
                      <span className={`inline-flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-semibold' : isDueToday ? 'text-cyan-400' : ''}`}>
                        <Calendar className="w-3 h-3" />
                        <span>{isDueToday ? `Today ${task.dueTime || ''}` : task.dueDate}</span>
                      </span>

                      <span aria-hidden="true" className="text-slate-600">·</span>

                      {/* Effort */}
                      <span className="inline-flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{task.estimatedMinutes}m</span>
                      </span>

                      {/* Subtasks summary */}
                      {hasSubtasks && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <button
                            type="button"
                            onClick={(e) => toggleExpand(e, task.id)}
                            className="inline-flex items-center gap-1 text-cyan-400/90 hover:text-cyan-300 font-mono"
                          >
                            <span>{completedSubs}/{totalSubs} steps</span>
                            {isExpanded ? (
                              <ChevronDown className="w-3 h-3" />
                            ) : (
                              <ChevronRight className="w-3 h-3" />
                            )}
                          </button>
                        </>
                      )}

                      {/* Tags */}
                      {task.tags && task.tags.length > 0 && (
                        <>
                          <span aria-hidden="true" className="text-slate-600">·</span>
                          <span className="text-slate-500">
                            {task.tags.map((t) => `#${t}`).join(' ')}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Expanded Subtasks Checklist */}
                    {isExpanded && hasSubtasks && (
                      <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1.5 animate-in fade-in duration-150">
                        {task.subtasks.map((st) => (
                          <div
                            key={st.id}
                            onClick={(e) => handleSubtaskToggle(e, task.id, st.id)}
                            className="flex items-center gap-2 p-1.5 rounded-lg bg-black/20 hover:bg-black/40 transition-colors"
                          >
                            <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-colors ${
                              st.isCompleted
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                : 'border-slate-600'
                            }`}>
                              {st.isCompleted && <Check className="w-2.5 h-2.5" />}
                            </div>
                            <span className={`text-[11px] ${st.isCompleted ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                              {st.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Quick Add Bar at Bottom */}
      <div className="p-3 border-t border-white/5 bg-[#0f121d]/90 shrink-0">
        <form onSubmit={handleQuickAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Quick add: e.g. Sync with product lead..."
            className="flex-1 bg-[#161a29] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-3 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-semibold hover:bg-cyan-500/30 disabled:opacity-30 transition-colors shrink-0"
          >
            Add
          </button>
        </form>
      </div>

      {/* Task Modal */}
      <TaskDetailModal
        task={editingTask}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
      />
    </div>
  );
};
