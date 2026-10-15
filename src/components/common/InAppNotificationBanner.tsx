import React, { useEffect, useState } from 'react';
import { notificationManager, InAppNotification } from '../../services/notification';
import { Bell, CheckCircle2, X } from 'lucide-react';
import { sound } from '../../services/audio';

interface Props {
  onOpenTask?: (taskId: string) => void;
}

export const InAppNotificationBanner: React.FC<Props> = ({ onOpenTask }) => {
  const [current, setCurrent] = useState<InAppNotification | null>(null);

  useEffect(() => {
    const unsubscribe = notificationManager.subscribe((notif) => {
      setCurrent(notif);
      sound.playSuccess();
      const timer = setTimeout(() => {
        setCurrent((prev) => (prev?.id === notif.id ? null : prev));
      }, 5000);
      return () => clearTimeout(timer);
    });
    return unsubscribe;
  }, []);

  if (!current) return null;

  return (
    <div className="absolute top-12 left-3 right-3 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-elevated border border-cyan-500/30 rounded-2xl p-3.5 shadow-2xl flex items-start gap-3 bg-[#0d121f]/95">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0" onClick={() => current.taskId && onOpenTask?.(current.taskId)}>
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-white tracking-tight truncate">{current.title}</h4>
            <span className="text-[10px] text-slate-400">now</span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5 line-clamp-2">{current.body}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setCurrent(null);
          }}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
