import React, { useState } from 'react';
import { Task, CalendarEvent, DailyBriefing, UserPreferences } from '../../types';
import { aiService } from '../../services/ai';
import { storage } from '../../services/storage';
import { sound } from '../../services/audio';
import { 
  Sparkles, 
  Flame, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  AlertTriangle, 
  Zap, 
  RefreshCw,
  Compass,
  Check
} from 'lucide-react';

interface Props {
  tasks: Task[];
  events: CalendarEvent[];
  briefing: DailyBriefing;
  preferences: UserPreferences;
  onOpenTasks: () => void;
  onOpenCalendar: () => void;
  onOpenAI: () => void;
  onOpenPlanner: () => void;
  onOpenTaskModal: (task?: Task) => void;
}

export const DashboardView: React.FC<Props> = ({
  tasks,
  events,
  briefing,
  preferences,
  onOpenTasks,
  onOpenCalendar,
  onOpenAI,
  onOpenPlanner,
  onOpenTaskModal,
}) => {
  const [isRefreshingBriefing, setIsRefreshingBriefing] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  // Calculations
  const completedToday = tasks.filter((t) => t.isCompleted && t.completedAt?.startsWith(todayStr)).length;
  const pendingTasks = tasks.filter((t) => !t.isCompleted);
  const highPriorityTasks = pendingTasks
    .filter((t) => t.priority === 'urgent' || t.priority === 'high')
    .slice(0, 3);

  const todayEvents = events.filter((e) => e.date === todayStr);

  const totalFocusMinutes = pendingTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0);
  const focusHours = (totalFocusMinutes / 60).toFixed(1);

  // Find next event
  const nowTime = new Date().toTimeString().substring(0, 5);
  const nextEvent = todayEvents
    .filter((e) => e.startTime >= nowTime)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))[0];

  const handleRefreshBriefing = async () => {
    setIsRefreshingBriefing(true);
    sound.playTap();
    try {
      const newBriefing = await aiService.getDailyBriefing(tasks, events, preferences.userName);
      storage.saveBriefing(newBriefing);
      sound.playSuccess();
    } catch {
      // Handled in service fallback
    } finally {
      setIsRefreshingBriefing(false);
    }
  };

  const handleToggleTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    sound.playComplete();
    sound.triggerHaptic('success');
    storage.toggleTaskCompletion(taskId);
  };

  const burnoutBadgeColors = {
    Optimal: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    Moderate: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    Elevated: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
      {/* Top Welcome Kicker */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
            System Operational · {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </span>
          <h1 className="text-xl font-extrabold text-white tracking-tight mt-0.5">
            Command Center
          </h1>
        </div>

        <button
          onClick={onOpenPlanner}
          className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-cyan-500/25 transition-all shadow-sm"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Daily Plan</span>
        </button>
      </div>

      {/* AI Daily Briefing Card */}
      <div className="glass-elevated rounded-2xl p-4 border border-cyan-500/25 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold tracking-tight text-white">NEXUS Intelligence Briefing</span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${burnoutBadgeColors[briefing.burnoutRisk] || burnoutBadgeColors.Optimal}`}>
              Load: {briefing.burnoutRisk}
            </span>
            <button
              onClick={handleRefreshBriefing}
              disabled={isRefreshingBriefing}
              className="text-slate-400 hover:text-cyan-400 transition-colors p-1"
              title="Regenerate Briefing"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingBriefing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-200 leading-relaxed font-normal">
          {briefing.summary}
        </p>

        {/* Top 3 Priorities */}
        {briefing.keyPriorities && briefing.keyPriorities.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              Strategic Focus
            </span>
            <div className="space-y-1">
              {briefing.keyPriorities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="text-cyan-400 font-mono text-[10px] font-bold">{idx + 1}.</span>
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tactical Tip */}
        {briefing.productivityTip && (
          <div className="mt-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-[11px] text-slate-300 leading-snug">
              {briefing.productivityTip}
            </span>
          </div>
        )}
      </div>

      {/* 4 Quick Stat Metric Tiles */}
      <div className="grid grid-cols-2 gap-2.5">
        <div 
          onClick={onOpenTasks}
          className="glass-card rounded-2xl p-3 border hover:border-cyan-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Pending</span>
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white tracking-tight">{pendingTasks.length}</span>
            <span className="text-[11px] text-slate-400">milestones</span>
          </div>
        </div>

        <div 
          onClick={onOpenCalendar}
          className="glass-card rounded-2xl p-3 border hover:border-indigo-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Calendar</span>
            <Calendar className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white tracking-tight">{todayEvents.length}</span>
            <span className="text-[11px] text-slate-400">events today</span>
          </div>
        </div>

        <div 
          onClick={onOpenPlanner}
          className="glass-card rounded-2xl p-3 border hover:border-amber-500/30 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Deep Work</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white tracking-tight">{focusHours}</span>
            <span className="text-[11px] text-slate-400">hours est.</span>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-3 border transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Streak</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl font-extrabold text-white tracking-tight">12</span>
            <span className="text-[11px] text-slate-400">days active</span>
          </div>
        </div>
      </div>

      {/* Next Up / Upcoming Calendar Alert */}
      {nextEvent ? (
        <div 
          onClick={onOpenCalendar}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/40 to-slate-900/60 border border-indigo-500/25 flex items-center justify-between cursor-pointer hover:border-indigo-500/40 transition-colors"
        >
          <div className="flex items-center gap-3 truncate">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div className="truncate">
              <span className="text-[10px] font-mono uppercase text-indigo-400">Upcoming Commitment</span>
              <h4 className="text-xs font-semibold text-white truncate">{nextEvent.title}</h4>
              <span className="text-[11px] text-slate-400 font-mono">{nextEvent.startTime} – {nextEvent.endTime}</span>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      ) : null}

      {/* High-Priority Focus Stack */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white tracking-tight flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>Priority Queue ({highPriorityTasks.length})</span>
          </span>
          <button
            onClick={onOpenTasks}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {highPriorityTasks.length === 0 ? (
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
            <span className="text-xs text-slate-400">No urgent items outstanding. High leverage achieved.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {highPriorityTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onOpenTaskModal(task)}
                className="glass-card rounded-2xl p-3 border hover:border-cyan-500/30 transition-all cursor-pointer flex items-center gap-3 group"
              >
                <button
                  type="button"
                  onClick={(e) => handleToggleTask(e, task.id)}
                  className="text-slate-500 group-hover:text-cyan-400 transition-colors shrink-0"
                >
                  <Circle className="w-5 h-5" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-xs font-medium text-slate-100 truncate">{task.title}</h4>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded capitalize shrink-0 ${
                      task.priority === 'urgent'
                        ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}>
                      {task.priority}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                    <span>{task.dueDate === todayStr ? 'Today' : task.dueDate}</span>
                    <span aria-hidden="true">·</span>
                    <span>{task.estimatedMinutes}m est.</span>
                    {task.subtasks && task.subtasks.length > 0 && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{task.subtasks.filter((s) => s.isCompleted).length}/{task.subtasks.length} subtasks</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Copilot Action Teaser */}
      <div 
        onClick={onOpenAI}
        className="glass-panel rounded-2xl p-3.5 border border-cyan-500/20 flex items-center justify-between cursor-pointer hover:bg-cyan-500/5 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-white">NEXUS AI Copilot</h4>
            <p className="text-[11px] text-slate-400">Ask to restructure tasks, estimate timelines, or parse voice</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0" />
      </div>
    </div>
  );
};
