import React, { useState, useMemo } from 'react';
import { CalendarEvent, Task, EventCategory } from '../../types';
import { storage } from '../../services/storage';
import { sound } from '../../services/audio';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  MapPin, 
  Users, 
  Calendar as CalendarIcon,
  X,
  Trash2
} from 'lucide-react';

interface Props {
  events: CalendarEvent[];
  tasks: Task[];
}

export const CalendarView: React.FC<Props> = ({ events, tasks }) => {
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // New/Edit Event Form State
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStart, setEventStart] = useState('10:00');
  const [eventEnd, setEventEnd] = useState('11:00');
  const [eventCategory, setEventCategory] = useState<EventCategory>('meeting');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');

  const currentDateStr = currentDate.toISOString().split('T')[0];

  // Navigate dates
  const handlePrev = () => {
    sound.playTap();
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (viewMode === 'day' ? 1 : 7));
    setCurrentDate(d);
  };

  const handleNext = () => {
    sound.playTap();
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (viewMode === 'day' ? 1 : 7));
    setCurrentDate(d);
  };

  const handleToday = () => {
    sound.playTap();
    setCurrentDate(new Date());
  };

  // Day strip (7 days centered around selected date)
  const weekDays = useMemo(() => {
    const list = [];
    const base = new Date(currentDate);
    // Find Monday of the current week
    const dayOfWeek = base.getDay();
    const diff = base.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(base.setDate(diff));

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      list.push(d);
    }
    return list;
  }, [currentDate]);

  // Events & Tasks for the selected day
  const dayEvents = useMemo(() => {
    return events.filter((e) => e.date === currentDateStr);
  }, [events, currentDateStr]);

  const dayTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === currentDateStr && !t.isCompleted);
  }, [tasks, currentDateStr]);

  const openNewEventModal = (time?: string) => {
    setSelectedEvent(null);
    setEventTitle('');
    setEventDate(currentDateStr);
    setEventStart(time || '10:00');
    setEventEnd(time ? calculateEndTime(time, 60) : '11:00');
    setEventCategory('deep_work');
    setEventLocation('');
    setEventDescription('');
    setIsEventModalOpen(true);
    sound.playTap();
  };

  const openEditEventModal = (ev: CalendarEvent) => {
    setSelectedEvent(ev);
    setEventTitle(ev.title);
    setEventDate(ev.date);
    setEventStart(ev.startTime);
    setEventEnd(ev.endTime);
    setEventCategory(ev.category);
    setEventLocation(ev.location || '');
    setEventDescription(ev.description || '');
    setIsEventModalOpen(true);
    sound.playTap();
  };

  const calculateEndTime = (start: string, durationMinutes: number): string => {
    const [h, m] = start.split(':').map(Number);
    const total = h * 60 + m + durationMinutes;
    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    sound.playSuccess();

    if (selectedEvent) {
      storage.updateEvent(selectedEvent.id, {
        title: eventTitle.trim(),
        date: eventDate,
        startTime: eventStart,
        endTime: eventEnd,
        category: eventCategory,
        location: eventLocation.trim() || undefined,
        description: eventDescription.trim() || undefined,
      });
    } else {
      storage.addEvent({
        title: eventTitle.trim(),
        date: eventDate,
        startTime: eventStart,
        endTime: eventEnd,
        category: eventCategory,
        location: eventLocation.trim() || undefined,
        description: eventDescription.trim() || undefined,
      });
    }

    setIsEventModalOpen(false);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      storage.deleteEvent(selectedEvent.id);
      sound.playTap();
      setIsEventModalOpen(false);
    }
  };

  const categoryStyles: Record<EventCategory, { bg: string; text: string; border: string }> = {
    meeting: { bg: 'bg-indigo-500/15', text: 'text-indigo-300', border: 'border-indigo-500/30' },
    deep_work: { bg: 'bg-cyan-500/15', text: 'text-cyan-300', border: 'border-cyan-500/30' },
    personal: { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    health: { bg: 'bg-teal-500/15', text: 'text-teal-300', border: 'border-teal-500/30' },
    review: { bg: 'bg-amber-500/15', text: 'text-amber-300', border: 'border-amber-500/30' },
  };

  // Timeline hours to display (8am - 8pm)
  const timelineHours = Array.from({ length: 14 }, (_, i) => i + 8);

  const formattedDateHeader = currentDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Calendar Header */}
      <div className="p-4 pb-2 space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">{formattedDateHeader}</h2>
            <button
              onClick={handleToday}
              className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-slate-300 hover:text-white"
            >
              Today
            </button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-[#161a29] border border-white/5 rounded-xl">
            <button
              onClick={() => {
                setViewMode('day');
                sound.playTap();
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'day' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => {
                setViewMode('week');
                sound.playTap();
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                viewMode === 'week' ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Date Navigation & Day Strip */}
        <div className="flex items-center justify-between gap-1">
          <button
            onClick={handlePrev}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-between flex-1 px-1 gap-1">
            {weekDays.map((d) => {
              const dStr = d.toISOString().split('T')[0];
              const isSelected = dStr === currentDateStr;
              const isToday = dStr === new Date().toISOString().split('T')[0];
              const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
              const dayNum = d.getDate();

              return (
                <button
                  key={dStr}
                  onClick={() => {
                    setCurrentDate(d);
                    sound.playTap();
                  }}
                  className={`flex-1 py-1.5 rounded-xl flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 shadow-sm'
                      : isToday
                      ? 'text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="text-[10px] uppercase font-mono">{dayName}</span>
                  <span className="text-xs font-semibold mt-0.5">{dayNum}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleNext}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main View Area (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4">
        {viewMode === 'day' ? (
          <div>
            {/* Scheduled Tasks for Today Kicker */}
            {dayTasks.length > 0 && (
              <div className="mb-4 space-y-1.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  Target Milestones Today ({dayTasks.length})
                </span>
                <div className="space-y-1.5">
                  {dayTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-2.5 rounded-xl bg-[#131726] border border-white/5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                        <span className="text-slate-200 truncate">{task.title}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 shrink-0">
                        {task.dueTime || `${task.estimatedMinutes}m`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Hourly Schedule Timeline */}
            <div className="relative border-l border-white/10 ml-8 space-y-3 pt-2">
              {timelineHours.map((hour) => {
                const hourFormatted = `${hour.toString().padStart(2, '0')}:00`;
                const matchingEvents = dayEvents.filter((ev) => {
                  const evHour = parseInt(ev.startTime.split(':')[0], 10);
                  return evHour === hour;
                });

                return (
                  <div key={hour} className="relative pl-4 min-h-[48px] group">
                    {/* Time marker label */}
                    <span className="absolute -left-10 top-0 text-[10px] font-mono text-slate-500 group-hover:text-slate-300">
                      {hourFormatted}
                    </span>

                    {/* Small dot on the axis */}
                    <div className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-[#1e2337] border border-slate-600" />

                    {/* Event Blocks or Empty clickable slot */}
                    {matchingEvents.length > 0 ? (
                      <div className="space-y-2">
                        {matchingEvents.map((ev) => {
                          const style = categoryStyles[ev.category] || categoryStyles.meeting;
                          return (
                            <div
                              key={ev.id}
                              onClick={() => openEditEventModal(ev)}
                              className={`p-3 rounded-xl border ${style.bg} ${style.border} cursor-pointer hover:brightness-110 transition-all`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`text-xs font-semibold ${style.text}`}>{ev.title}</h4>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {ev.startTime} – {ev.endTime}
                                </span>
                              </div>
                              {ev.description && (
                                <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{ev.description}</p>
                              )}
                              {ev.location && (
                                <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate">{ev.location}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        onClick={() => openNewEventModal(hourFormatted)}
                        className="h-9 border border-dashed border-white/5 rounded-xl hover:border-cyan-500/30 hover:bg-white/[0.02] transition-colors cursor-pointer flex items-center pl-3 text-[11px] text-slate-600 hover:text-cyan-400"
                      >
                        + Block time slot
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Week View */
          <div className="space-y-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
              Weekly Overview
            </span>
            <div className="space-y-2">
              {weekDays.map((d) => {
                const dStr = d.toISOString().split('T')[0];
                const dEvents = events.filter((e) => e.date === dStr);
                const isSelected = dStr === currentDateStr;

                return (
                  <div
                    key={dStr}
                    onClick={() => {
                      setCurrentDate(d);
                      setViewMode('day');
                      sound.playTap();
                    }}
                    className={`p-3 rounded-2xl glass-card border transition-all cursor-pointer ${
                      isSelected ? 'border-cyan-500/40 bg-cyan-500/10' : 'hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-semibold text-white">
                        {d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-[11px] text-slate-400">{dEvents.length} scheduled</span>
                    </div>

                    {dEvents.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {dEvents.map((ev) => (
                          <span
                            key={ev.id}
                            className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                              categoryStyles[ev.category]?.bg || 'bg-white/5'
                            } ${categoryStyles[ev.category]?.text || 'text-slate-300'} ${
                              categoryStyles[ev.category]?.border || 'border-white/10'
                            }`}
                          >
                            {ev.startTime} {ev.title}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">No events scheduled</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button: Add Event */}
      <div className="p-3 border-t border-white/5 bg-[#0f121d]/90 flex items-center justify-between shrink-0">
        <span className="text-xs text-slate-400">
          {dayEvents.length} event(s) on {formattedDateHeader}
        </span>
        <button
          onClick={() => openNewEventModal()}
          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 hover:brightness-110 active:scale-95 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Event</span>
        </button>
      </div>

      {/* Event Create / Edit Modal */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full sm:max-w-md bg-[#0f121d] border border-white/10 rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#131726]/60">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                {selectedEvent ? 'Edit Calendar Block' : 'New Calendar Block'}
              </span>
              <button
                onClick={() => setIsEventModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-5 overflow-y-auto space-y-4 text-sm">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Title</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Mobile Architecture Review"
                  className="w-full bg-[#161a29] border border-white/10 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 text-xs"
                  required
                  autoFocus
                />
              </div>

              {/* Category picker */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Category</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['meeting', 'deep_work', 'review', 'personal', 'health'] as EventCategory[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setEventCategory(cat);
                        sound.playTap();
                      }}
                      className={`py-1.5 text-[11px] rounded-lg capitalize border font-medium transition-colors ${
                        eventCategory === cat
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                          : 'bg-[#161a29] text-slate-400 border-white/5 hover:text-slate-200'
                      }`}
                    >
                      {cat.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Date</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-[#161a29] border border-white/10 rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">Start</label>
                  <input
                    type="time"
                    value={eventStart}
                    onChange={(e) => setEventStart(e.target.value)}
                    className="w-full bg-[#161a29] border border-white/10 rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-400">End</label>
                  <input
                    type="time"
                    value={eventEnd}
                    onChange={(e) => setEventEnd(e.target.value)}
                    className="w-full bg-[#161a29] border border-white/10 rounded-xl px-2 py-1.5 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Location / Meeting Link</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="e.g. Google Meet or Room 4A"
                  className="w-full bg-[#161a29] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">Notes</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={2}
                  placeholder="Agenda, prerequisites, or preparation..."
                  className="w-full bg-[#161a29] border border-white/10 rounded-xl px-3.5 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 text-xs"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {selectedEvent ? (
                  <button
                    type="button"
                    onClick={handleDeleteEvent}
                    className="p-2 text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-indigo-600 text-white shadow-lg shadow-cyan-500/20"
                  >
                    {selectedEvent ? 'Update' : 'Schedule'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
