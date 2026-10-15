import React, { useState, useEffect } from 'react';
import { Task, CalendarEvent, ScheduleRecommendation } from '../../types';
import { aiService } from '../../services/ai';
import { storage } from '../../services/storage';
import { sound } from '../../services/audio';
import { 
  Compass, 
  X, 
  Sparkles, 
  Check, 
  Clock, 
  Zap, 
  Calendar, 
  ArrowRight,
  Loader2
} from 'lucide-react';

interface Props {
  tasks: Task[];
  events: CalendarEvent[];
  isOpen: boolean;
  onClose: () => void;
}

export const DailyPlannerModal: React.FC<Props> = ({ tasks, events, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<ScheduleRecommendation[]>([]);
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0);
  const [strategicAdvice, setStrategicAdvice] = useState('');
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPlan();
    }
  }, [isOpen]);

  const loadPlan = async () => {
    setLoading(true);
    setApplied(false);
    try {
      const plan = await aiService.optimizeSchedule(tasks, events);
      setRecommendations(plan.recommendedSlots || []);
      setTotalFocusMinutes(plan.totalFocusMinutes || 0);
      setStrategicAdvice(plan.advice || 'Schedule calibrated to protect deep focus.');
    } catch {
      // Fallback in service
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleApplyToCalendar = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    sound.playComplete();

    // Add each recommended slot as a calendar event
    recommendations.forEach((rec) => {
      storage.addEvent({
        title: `Deep Work: ${rec.taskTitle}`,
        description: `AI Focus Block: ${rec.focusRationale}`,
        date: todayStr,
        startTime: rec.slotStart,
        endTime: rec.slotEnd,
        category: 'deep_work',
        location: 'Focus Space',
        taskId: rec.taskId,
      });
    });

    setApplied(true);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const energyColors: Record<string, string> = {
    Peak: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    'Deep Work': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    Moderate: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-[#0f121d] border border-white/10 rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#131726]/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white tracking-tight">AI Schedule Optimizer</h3>
              <span className="text-[10px] text-slate-400">Context-Aware Time Blocking</span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Synthesizing calendar buffers and cognitive load...</p>
            </div>
          ) : (
            <>
              {/* Strategic Observation */}
              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div className="text-xs text-slate-200 leading-snug">
                  {strategicAdvice}
                </div>
              </div>

              {/* Focus budget summary */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#161a29] border border-white/5">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Planned Focus Budget</span>
                </div>
                <span className="text-xs font-mono font-bold text-white">
                  {(totalFocusMinutes / 60).toFixed(1)} hrs ({totalFocusMinutes} mins)
                </span>
              </div>

              {/* Recommended Slots Timeline */}
              <div className="space-y-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Recommended Time Blocks
                </span>

                {recommendations.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white/[0.02] text-center text-xs text-slate-400">
                    All high-leverage milestones are already scheduled or completed.
                  </div>
                ) : (
                  recommendations.map((slot, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#141827] border border-white/5 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-cyan-400">
                          {slot.slotStart} – {slot.slotEnd}
                        </span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${energyColors[slot.energyLevel] || energyColors['Deep Work']}`}>
                          {slot.energyLevel}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-white">{slot.taskTitle}</h4>
                      <p className="text-[11px] text-slate-400 leading-tight">{slot.focusRationale}</p>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#131726]/60 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
          >
            Close
          </button>

          <button
            onClick={handleApplyToCalendar}
            disabled={loading || recommendations.length === 0 || applied}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5"
          >
            {applied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Applied to Calendar!</span>
              </>
            ) : (
              <>
                <Calendar className="w-3.5 h-3.5" />
                <span>Block All in Calendar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
