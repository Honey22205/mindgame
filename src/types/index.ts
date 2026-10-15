export type Priority = 'urgent' | 'high' | 'medium' | 'low';
export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';
export type EventCategory = 'meeting' | 'deep_work' | 'personal' | 'health' | 'review';

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedMinutes: number;
  tags: string[];
  subtasks: Subtask[];
  isCompleted: boolean;
  completedAt?: string;
  recurrence: RecurrenceType;
  reminderMinutesBefore?: number;
  createdAt: string;
  updatedAt: string;
  syncVersion: number;
  synced?: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: EventCategory;
  location?: string;
  attendees?: string[];
  isAllDay?: boolean;
  taskId?: string;
}

export interface DailyBriefing {
  summary: string;
  keyPriorities: string[];
  productivityTip: string;
  burnoutRisk: 'Optimal' | 'Moderate' | 'Elevated';
  estimatedWorkMinutes: number;
  generatedAt: string;
}

export interface ProductivityStats {
  completedToday: number;
  completionStreak: number;
  totalFocusHours: number;
  weeklyVelocity: Array<{ day: string; completed: number; target: number }>;
  tagBreakdown: Array<{ tag: string; count: number; color: string }>;
}

export interface UserPreferences {
  userName: string;
  userTitle: string;
  avatarUrl?: string;
  theme: 'dark' | 'light' | 'amoled';
  deviceFrame: 'iphone' | 'pixel' | 'edge-to-edge';
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  notificationsEnabled: boolean;
  workHoursStart: string;
  workHoursEnd: string;
  offlineMode: boolean;
  lastSyncedAt?: string;
  demoModeActive?: boolean;
}

export interface SyncQueueItem {
  id: string;
  entityType: 'task' | 'event' | 'preferences';
  action: 'create' | 'update' | 'delete';
  payload: any;
  timestamp: number;
}

export interface ScheduleRecommendation {
  taskId: string;
  taskTitle: string;
  slotStart: string;
  slotEnd: string;
  focusRationale: string;
  energyLevel: 'Peak' | 'Deep Work' | 'Moderate';
}
