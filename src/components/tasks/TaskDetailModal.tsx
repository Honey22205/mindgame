import React, { useState, useEffect } from 'react';
import { Task, Priority, RecurrenceType, Subtask } from '../../types';
import { storage } from '../../services/storage';
import { aiService } from '../../services/ai';
import { sound } from '../../services/audio';
import { 
  X, 
  Sparkles, 
  Clock, 
  Calendar as CalendarIcon, 
  Tag as TagIcon, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Repeat, 
  Bell, 
  AlertCircle,
  Loader2
} from 'lucide-react';

interface Props {
  task?: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (task: Task) => void;
}

export const TaskDetailModal: React.FC<Props> = ({ task, isOpen, onClose, onSaved }) => {
  const isEditing = Boolean(task);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('17:00');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [reminderMinutesBefore, setReminderMinutesBefore] = useState<number | undefined>(15);
  const [isParsingAI, setIsParsingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.dueDate);
      setDueTime(task.dueTime || '17:00');
      setEstimatedMinutes(task.estimatedMinutes);
      setTags(task.tags || []);
      setSubtasks(task.subtasks || []);
      setRecurrence(task.recurrence || 'none');
      setReminderMinutesBefore(task.reminderMinutesBefore);
    } else {
      // Default new task
      const today = new Date().toISOString().split('T')[0];
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate(today);
      setDueTime('17:00');
      setEstimatedMinutes(30);
      setTags(['work']);
      setSubtasks([]);
      setRecurrence('none');
      setReminderMinutesBefore(15);
    }
    setAiError(null);
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleAiParse = async () => {
    if (!title.trim()) {
      setAiError('Type what you need to do, e.g. "Prepare API docs by tomorrow 4pm #dev urgent"');
      return;
    }
    setIsParsingAI(true);
    setAiError(null);
    sound.playTap();

    try {
      const parsed = await aiService.parseNaturalLanguageTask(title);
      if (parsed.title) setTitle(parsed.title);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.priority) setPriority(parsed.priority);
      if (parsed.dueDate) setDueDate(parsed.dueDate);
      if (parsed.dueTime) setDueTime(parsed.dueTime);
      if (parsed.estimatedMinutes) setEstimatedMinutes(parsed.estimatedMinutes);
      if (parsed.tags && parsed.tags.length > 0) setTags(parsed.tags);
      if (parsed.subtasks && parsed.subtasks.length > 0) {
        setSubtasks(
          parsed.subtasks.map((st) => ({
            id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            title: st,
            isCompleted: false,
          }))
        );
      }
      sound.playSuccess();
    } catch {
      setAiError('Could not parse automatically. You can fill the fields manually.');
    } finally {
      setIsParsingAI(false);
    }
  };

  const handleAddTag = () => {
    const cleaned = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (cleaned && !tags.includes(cleaned)) {
      setTags([...tags, cleaned]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newSubtaskTitle.trim(),
      isCompleted: false,
    };
    setSubtasks([...subtasks, newSub]);
    setNewSubtaskTitle('');
    sound.playTap();
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) => (st.id === id ? { ...st, isCompleted: !st.isCompleted } : st))
    );
    sound.playTap();
  };

  const handleDeleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
  };

  const handleSave = () => {
    if (!title.trim()) return;
    sound.playComplete();

    if (isEditing && task) {
      const updated = storage.updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate,
        dueTime,
        estimatedMinutes,
        tags,
        subtasks,
        recurrence,
        reminderMinutesBefore,
      });
      if (updated) onSaved(updated);
    } else {
      const created = storage.addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate,
        dueTime,
        estimatedMinutes,
        tags,
        subtasks,
        isCompleted: false,
        recurrence,
        reminderMinutesBefore,
      });
      onSaved(created);
    }
    onClose();
  };

  const handleDelete = () => {
    if (task) {
      storage.deleteTask(task.id);
      sound.playTap();
      onClose();
    }
  };

  const priorityColors = {
    urgent: 'border-rose-500/40 bg-rose-500/10 text-rose-400',
    high: 'border-amber-500/40 bg-amber-500/10 text-amber-400',
    medium: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400',
    low: 'border-slate-600 bg-slate-800/40 text-slate-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-[#0f121d] border border-white/10 rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between shrink-0 bg-[#131726]/60">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
              {isEditing ? 'Edit Milestone' : 'New Milestone'}
            </span>
            {isEditing && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[priority]}`}>
                {priority.toUpperCase()}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {/* Title input + AI button */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Objective</label>
              <button
                type="button"
                onClick={handleAiParse}
                disabled={isParsingAI || !title.trim()}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-40 transition-colors cursor-pointer"
              >
                {isParsingAI ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                )}
                <span>AI Auto-Parse</span>
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Deploy Flutter build to staging by 4pm #mobile urgent"
              className="w-full bg-[#161a29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 text-sm"
              autoFocus={!isEditing}
            />
            {aiError && (
              <div className="text-[11px] text-amber-400/90 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Context & Rationale</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Key specifications, dependencies, or links..."
              className="w-full bg-[#161a29] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 text-xs"
            />
          </div>

          {/* Priority Segmented Control */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Urgency Level</label>
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-[#161a29] border border-white/5 rounded-xl">
              {(['urgent', 'high', 'medium', 'low'] as Priority[]).map((p) => {
                const active = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setPriority(p);
                      sound.playTap();
                    }}
                    className={`py-1.5 text-xs font-medium rounded-lg capitalize transition-colors ${
                      active
                        ? p === 'urgent'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : p === 'high'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : p === 'medium'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'bg-slate-700/60 text-slate-200 border border-slate-600'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#161a29] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500/60"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Target Time</span>
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full bg-[#161a29] border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-cyan-500/60"
              />
            </div>
          </div>

          {/* Effort Estimation */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Estimated Focus Block</label>
              <span className="text-xs font-mono text-cyan-400">{estimatedMinutes} min</span>
            </div>
            <div className="flex items-center gap-1.5">
              {[15, 30, 45, 60, 90].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => {
                    setEstimatedMinutes(mins);
                    sound.playTap();
                  }}
                  className={`flex-1 py-1.5 text-xs rounded-lg transition-colors border ${
                    estimatedMinutes === mins
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-[#161a29] text-slate-400 border-white/5 hover:text-slate-200'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>

          {/* Subtasks Roadmap */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>Actionable Steps ({subtasks.filter((s) => s.isCompleted).length}/{subtasks.length})</span>
              </label>
            </div>

            {subtasks.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-[#161a29] border border-white/5 group"
                  >
                    <input
                      type="checkbox"
                      checked={st.isCompleted}
                      onChange={() => handleToggleSubtask(st.id)}
                      className="w-3.5 h-3.5 rounded border-slate-600 accent-cyan-500 cursor-pointer"
                    />
                    <span
                      className={`text-xs flex-1 truncate ${
                        st.isCompleted ? 'line-through text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubtask(st.id)}
                      className="text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                placeholder="Add verifiable subtask..."
                className="flex-1 bg-[#161a29] border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500/60"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <TagIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Project & Tags</span>
            </label>
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 text-slate-300 text-xs border border-white/10"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-500 hover:text-white ml-0.5"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="e.g. mobile, dev, architecture"
                className="flex-1 bg-[#161a29] border border-white/10 rounded-xl px-3 py-1.5 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500/60"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* Recurrence & Reminder Controls */}
          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-white/5">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Repeat className="w-3 h-3 text-slate-500" />
                <span>Cadence</span>
              </label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full bg-[#161a29] border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
              >
                <option value="none">One-time</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Weekdays</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Bell className="w-3 h-3 text-slate-500" />
                <span>Smart Alert</span>
              </label>
              <select
                value={reminderMinutesBefore ?? ''}
                onChange={(e) => setReminderMinutesBefore(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-[#161a29] border border-white/10 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none"
              >
                <option value="">No alert</option>
                <option value="5">5 min before</option>
                <option value="15">15 min before</option>
                <option value="30">30 min before</option>
                <option value="60">1 hour before</option>
              </select>
            </div>
          </div>
        </div>

        {/* Footer CTA */}
        <div className="p-4 border-t border-white/5 bg-[#131726]/60 flex items-center justify-between gap-3 shrink-0">
          {isEditing ? (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2.5 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete milestone"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all"
            >
              {isEditing ? 'Save Changes' : 'Commit Milestone'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
