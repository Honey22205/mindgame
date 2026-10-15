export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: number;
  taskId?: string;
  priority?: string;
}

type NotificationListener = (notification: InAppNotification) => void;

class NotificationManager {
  private listeners: Set<NotificationListener> = new Set();
  private scheduledTimers: Map<string, number> = new Map();
  private hasRequested: boolean = false;

  public subscribe(listener: NotificationListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      this.hasRequested = true;
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }

  public notify(title: string, body: string, taskId?: string, priority?: string) {
    const item: InAppNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      body,
      timestamp: Date.now(),
      taskId,
      priority,
    };

    // Emit to in-app banners
    this.listeners.forEach((listener) => listener(item));

    // Also trigger native browser notification if allowed
    try {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      }
    } catch {
      // Ignore background restrictions
    }
  }

  /**
   * Schedule reminder for a task
   */
  public scheduleTaskReminder(task: { id: string; title: string; dueDate: string; dueTime?: string; reminderMinutesBefore?: number; priority?: string }) {
    if (!task.dueDate || !task.dueTime || !task.reminderMinutesBefore) return;

    // Clear existing
    if (this.scheduledTimers.has(task.id)) {
      clearTimeout(this.scheduledTimers.get(task.id));
      this.scheduledTimers.delete(task.id);
    }

    try {
      const [year, month, day] = task.dueDate.split('-').map(Number);
      const [hour, minute] = task.dueTime.split(':').map(Number);
      const targetTime = new Date(year, month - 1, day, hour, minute).getTime();
      const remindAt = targetTime - task.reminderMinutesBefore * 60 * 1000;
      const delay = remindAt - Date.now();

      if (delay > 0 && delay < 86400000 * 7) { // within 7 days
        const timerId = window.setTimeout(() => {
          this.notify(
            `Reminder: ${task.title}`,
            `Due in ${task.reminderMinutesBefore} minutes (${task.dueTime})`,
            task.id,
            task.priority
          );
          this.scheduledTimers.delete(task.id);
        }, delay);
        this.scheduledTimers.set(task.id, timerId);
      }
    } catch (e) {
      console.warn('Could not schedule reminder', e);
    }
  }

  public cancelReminder(taskId: string) {
    if (this.scheduledTimers.has(taskId)) {
      clearTimeout(this.scheduledTimers.get(taskId));
      this.scheduledTimers.delete(taskId);
    }
  }
}

export const notificationManager = new NotificationManager();
