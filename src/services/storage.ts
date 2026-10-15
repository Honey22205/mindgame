import { Task, CalendarEvent, UserPreferences, DailyBriefing, SyncQueueItem } from '../types';
import { INITIAL_TASKS, INITIAL_EVENTS, INITIAL_USER_PREFERENCES, INITIAL_BRIEFING } from '../data/initialData';
import { notificationManager } from './notification';

const STORAGE_KEYS = {
  TASKS: 'nexus_tasks_v1',
  EVENTS: 'nexus_events_v1',
  PREFERENCES: 'nexus_prefs_v1',
  BRIEFING: 'nexus_briefing_v1',
  SYNC_QUEUE: 'nexus_sync_queue_v1',
  LAST_SYNC: 'nexus_last_sync_timestamp',
};

type StorageEventCallback = () => void;

class StorageService {
  private listeners: Set<StorageEventCallback> = new Set();
  private syncStatus: 'synced' | 'syncing' | 'offline' | 'queued' = 'synced';
  private syncListeners: Set<(status: 'synced' | 'syncing' | 'offline' | 'queued', count: number) => void> = new Set();

  constructor() {
    this.initNetworkListener();
  }

  private initNetworkListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        const prefs = this.getPreferences();
        if (!prefs.offlineMode) {
          this.processSyncQueue();
        }
      });
      window.addEventListener('offline', () => {
        this.syncStatus = 'offline';
        this.notifySyncListeners();
      });
    }
  }

  public subscribe(cb: StorageEventCallback) {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  public subscribeSync(cb: (status: 'synced' | 'syncing' | 'offline' | 'queued', count: number) => void) {
    this.syncListeners.add(cb);
    cb(this.getSyncStatus(), this.getSyncQueue().length);
    return () => {
      this.syncListeners.delete(cb);
    };
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private notifySyncListeners() {
    const queue = this.getSyncQueue();
    this.syncListeners.forEach((cb) => cb(this.syncStatus, queue.length));
  }

  public getSyncStatus() {
    const prefs = this.getPreferences();
    if (prefs.offlineMode) return 'offline';
    const queue = this.getSyncQueue();
    if (queue.length > 0) return 'queued';
    return this.syncStatus;
  }

  // ---- Tasks CRUD ----

  public getTasks(): Task[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        this.saveTasks(INITIAL_TASKS, false);
        return INITIAL_TASKS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_TASKS;
    }
  }

  private saveTasks(tasks: Task[], notifyMutation: boolean = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
      if (notifyMutation) {
        this.notify();
      }
    } catch (e) {
      console.error('Storage quota or parse error', e);
    }
  }

  public addTask(taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'syncVersion'>): Task {
    const tasks = this.getTasks();
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      syncVersion: 1,
      synced: false,
    };

    const updated = [newTask, ...tasks];
    this.saveTasks(updated);
    this.enqueueMutation('task', 'create', newTask);

    // Schedule notification if reminder is set
    notificationManager.scheduleTaskReminder(newTask);

    return newTask;
  }

  public updateTask(id: string, updates: Partial<Task>): Task | null {
    const tasks = this.getTasks();
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const current = tasks[index];
    const updatedTask: Task = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
      syncVersion: current.syncVersion + 1,
      synced: false,
    };

    tasks[index] = updatedTask;
    this.saveTasks(tasks);
    this.enqueueMutation('task', 'update', updatedTask);

    if (updatedTask.isCompleted) {
      notificationManager.cancelReminder(id);
    } else {
      notificationManager.scheduleTaskReminder(updatedTask);
    }

    return updatedTask;
  }

  public toggleTaskCompletion(id: string): Task | null {
    const tasks = this.getTasks();
    const task = tasks.find((t) => t.id === id);
    if (!task) return null;

    const isNowCompleted = !task.isCompleted;
    return this.updateTask(id, {
      isCompleted: isNowCompleted,
      completedAt: isNowCompleted ? new Date().toISOString() : undefined,
    });
  }

  public deleteTask(id: string): boolean {
    const tasks = this.getTasks();
    const filtered = tasks.filter((t) => t.id !== id);
    if (filtered.length === tasks.length) return false;

    this.saveTasks(filtered);
    this.enqueueMutation('task', 'delete', { id });
    notificationManager.cancelReminder(id);
    return true;
  }

  // ---- Calendar Events CRUD ----

  public getEvents(): CalendarEvent[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENTS);
      if (!data) {
        this.saveEvents(INITIAL_EVENTS, false);
        return INITIAL_EVENTS;
      }
      return JSON.parse(data);
    } catch {
      return INITIAL_EVENTS;
    }
  }

  private saveEvents(events: CalendarEvent[], notifyMutation: boolean = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.EVENTS, JSON.stringify(events));
      if (notifyMutation) this.notify();
    } catch (e) {
      console.error(e);
    }
  }

  public addEvent(eventData: Omit<CalendarEvent, 'id'>): CalendarEvent {
    const events = this.getEvents();
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    const updated = [...events, newEvent];
    this.saveEvents(updated);
    this.enqueueMutation('event', 'create', newEvent);
    return newEvent;
  }

  public updateEvent(id: string, updates: Partial<CalendarEvent>): CalendarEvent | null {
    const events = this.getEvents();
    const idx = events.findIndex((e) => e.id === id);
    if (idx === -1) return null;

    events[idx] = { ...events[idx], ...updates };
    this.saveEvents(events);
    this.enqueueMutation('event', 'update', events[idx]);
    return events[idx];
  }

  public deleteEvent(id: string): boolean {
    const events = this.getEvents();
    const filtered = events.filter((e) => e.id !== id);
    if (filtered.length === events.length) return false;
    this.saveEvents(filtered);
    this.enqueueMutation('event', 'delete', { id });
    return true;
  }

  // ---- User Preferences ----

  public getPreferences(): UserPreferences {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (!data) {
        this.savePreferences(INITIAL_USER_PREFERENCES, false);
        return INITIAL_USER_PREFERENCES;
      }
      return { ...INITIAL_USER_PREFERENCES, ...JSON.parse(data) };
    } catch {
      return INITIAL_USER_PREFERENCES;
    }
  }

  public savePreferences(prefs: UserPreferences, notifyMutation: boolean = true) {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(prefs));
      if (notifyMutation) {
        this.notify();
        this.enqueueMutation('preferences', 'update', prefs);
      }
    } catch (e) {
      console.error(e);
    }
  }

  public updatePreferences(partial: Partial<UserPreferences>): UserPreferences {
    const current = this.getPreferences();
    const updated = { ...current, ...partial };
    this.savePreferences(updated);
    return updated;
  }

  // ---- Daily Briefing ----

  public getBriefing(): DailyBriefing {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRIEFING);
      if (!data) return INITIAL_BRIEFING;
      return JSON.parse(data);
    } catch {
      return INITIAL_BRIEFING;
    }
  }

  public saveBriefing(briefing: DailyBriefing) {
    try {
      localStorage.setItem(STORAGE_KEYS.BRIEFING, JSON.stringify(briefing));
      this.notify();
    } catch (e) {
      console.error(e);
    }
  }

  // ---- Offline Mutation Queue & Synchronization ----

  public getSyncQueue(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveSyncQueue(queue: SyncQueueItem[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
      this.notifySyncListeners();
    } catch (e) {
      console.error(e);
    }
  }

  private enqueueMutation(entityType: SyncQueueItem['entityType'], action: SyncQueueItem['action'], payload: any) {
    const queue = this.getSyncQueue();
    const item: SyncQueueItem = {
      id: `mutation-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityType,
      action,
      payload,
      timestamp: Date.now(),
    };
    queue.push(item);
    this.saveSyncQueue(queue);

    const prefs = this.getPreferences();
    if (!prefs.offlineMode && navigator.onLine) {
      this.processSyncQueue();
    }
  }

  public async processSyncQueue(): Promise<{ success: boolean; count: number }> {
    const prefs = this.getPreferences();
    if (prefs.offlineMode || !navigator.onLine) {
      this.syncStatus = 'offline';
      this.notifySyncListeners();
      return { success: false, count: 0 };
    }

    const queue = this.getSyncQueue();
    if (queue.length === 0) {
      this.syncStatus = 'synced';
      this.notifySyncListeners();
      return { success: true, count: 0 };
    }

    this.syncStatus = 'syncing';
    this.notifySyncListeners();

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: 'nexus-mobile-client',
          lastSyncTimestamp: Number(localStorage.getItem(STORAGE_KEYS.LAST_SYNC) || 0),
          changes: queue,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sync error: ${response.statusText}`);
      }

      const result = await response.json();
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, String(result.serverTimestamp || Date.now()));

      // Mark tasks as synced
      const tasks = this.getTasks();
      const updatedTasks = tasks.map((t) => ({ ...t, synced: true }));
      this.saveTasks(updatedTasks, false);

      // Clear queue
      this.saveSyncQueue([]);
      this.syncStatus = 'synced';
      this.updatePreferences({ lastSyncedAt: new Date().toISOString() });
      this.notifySyncListeners();
      this.notify();

      return { success: true, count: result.processedCount || queue.length };
    } catch (error) {
      console.warn('Sync failed, mutations remain safely queued locally:', error);
      this.syncStatus = 'queued';
      this.notifySyncListeners();
      return { success: false, count: 0 };
    }
  }

  // ---- Export / Import / Reset ----

  public exportData(): string {
    const data = {
      version: '2026.1',
      exportedAt: new Date().toISOString(),
      tasks: this.getTasks(),
      events: this.getEvents(),
      preferences: this.getPreferences(),
      briefing: this.getBriefing(),
    };
    return JSON.stringify(data, null, 2);
  }

  public importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (Array.isArray(data.tasks)) this.saveTasks(data.tasks);
      if (Array.isArray(data.events)) this.saveEvents(data.events);
      if (data.preferences) this.savePreferences(data.preferences);
      if (data.briefing) this.saveBriefing(data.briefing);
      this.saveSyncQueue([]);
      this.notify();
      return true;
    } catch (e) {
      console.error('Import error:', e);
      return false;
    }
  }

  public resetToDemoData() {
    this.saveTasks(INITIAL_TASKS);
    this.saveEvents(INITIAL_EVENTS);
    this.savePreferences(INITIAL_USER_PREFERENCES);
    this.saveBriefing(INITIAL_BRIEFING);
    this.saveSyncQueue([]);
    this.syncStatus = 'synced';
    this.notify();
    this.notifySyncListeners();
  }

  public wipeAllData() {
    this.saveTasks([]);
    this.saveEvents([]);
    this.saveSyncQueue([]);
    this.notify();
    this.notifySyncListeners();
  }
}

export const storage = new StorageService();
