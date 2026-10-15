import { Task, CalendarEvent, DailyBriefing, ScheduleRecommendation } from '../types';

export interface ParsedTaskResult {
  title: string;
  description: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  dueDate: string;
  dueTime: string;
  estimatedMinutes: number;
  tags: string[];
  subtasks: string[];
  reminderMinutesBefore: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  actionPayload?: any;
}

class AIService {
  public async getDailyBriefing(tasks: Task[], events: CalendarEvent[], userName: string): Promise<DailyBriefing> {
    try {
      const response = await fetch('/api/ai/briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks,
          events,
          userName,
          localTime: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Briefing API failed');
      const data = await response.json();
      return {
        summary: data.summary || 'Welcome back. Your tasks and schedule are synchronized.',
        keyPriorities: Array.isArray(data.keyPriorities) ? data.keyPriorities : ['Review tasks'],
        productivityTip: data.productivityTip || 'Execute your highest leverage task first.',
        burnoutRisk: data.burnoutRisk || 'Optimal',
        estimatedWorkMinutes: Number(data.estimatedWorkMinutes) || 120,
        generatedAt: new Date().toISOString(),
      };
    } catch (e) {
      console.warn('Using client heuristic briefing fallback:', e);
      const pendingHigh = tasks.filter((t) => !t.isCompleted && (t.priority === 'urgent' || t.priority === 'high'));
      return {
        summary: `Good morning, ${userName}. You have ${tasks.filter((t) => !t.isCompleted).length} active items and ${events.length} calendar appointments today.`,
        keyPriorities: pendingHigh.slice(0, 3).map((t) => t.title),
        productivityTip: 'Protect a 90-minute block for uninterrupted execution before your afternoon syncs.',
        burnoutRisk: pendingHigh.length > 4 ? 'Moderate' : 'Optimal',
        estimatedWorkMinutes: tasks.filter((t) => !t.isCompleted).reduce((sum, t) => sum + (t.estimatedMinutes || 30), 0),
        generatedAt: new Date().toISOString(),
      };
    }
  }

  public async parseNaturalLanguageTask(prompt: string): Promise<ParsedTaskResult> {
    try {
      const res = await fetch('/api/ai/parse-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) throw new Error('Parse task failed');
      return await res.json();
    } catch {
      // Robust client fallback
      const isUrgent = /urgent|asap|critical|highest|p0/i.test(prompt);
      const isHigh = /high|important|p1/i.test(prompt);
      const priority = isUrgent ? 'urgent' : isHigh ? 'high' : 'medium';

      const tagMatches = prompt.match(/#(\w+)/g);
      const tags = tagMatches ? tagMatches.map((t) => t.replace('#', '').toLowerCase()) : ['work'];

      let title = prompt.replace(/#\w+/g, '').replace(/urgent|asap|today|tomorrow|high priority/gi, '').trim();
      if (!title) title = prompt.trim();

      const today = new Date();
      if (/tomorrow/i.test(prompt)) {
        today.setDate(today.getDate() + 1);
      }
      const dueDate = today.toISOString().split('T')[0];

      return {
        title: title.charAt(0).toUpperCase() + title.slice(1),
        description: `Natural language input: "${prompt}"`,
        priority,
        dueDate,
        dueTime: '15:00',
        estimatedMinutes: 45,
        tags,
        subtasks: ['Clarify requirements', 'Build implementation', 'Verify & test'],
        reminderMinutesBefore: 15,
      };
    }
  }

  public async optimizeSchedule(
    tasks: Task[],
    events: CalendarEvent[]
  ): Promise<{ recommendedSlots: ScheduleRecommendation[]; totalFocusMinutes: number; advice: string }> {
    try {
      const res = await fetch('/api/ai/optimize-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tasks, events }),
      });
      if (!res.ok) throw new Error('Schedule API failed');
      return await res.json();
    } catch {
      const uncompleted = tasks.filter((t) => !t.isCompleted);
      const slots: ScheduleRecommendation[] = uncompleted.slice(0, 4).map((task, i) => {
        const start = 10 + i * 2;
        return {
          taskId: task.id,
          taskTitle: task.title,
          slotStart: `${start.toString().padStart(2, '0')}:00`,
          slotEnd: `${(start + 1).toString().padStart(2, '0')}:30`,
          focusRationale: `Prioritized due to ${task.priority} urgency and ${task.estimatedMinutes}m duration.`,
          energyLevel: i === 0 ? 'Peak' : 'Deep Work',
        };
      });

      return {
        recommendedSlots: slots,
        totalFocusMinutes: uncompleted.slice(0, 4).reduce((sum, t) => sum + (t.estimatedMinutes || 45), 0),
        advice: 'Tackle the top objective during morning peak cognitive capacity to prevent context switching.',
      };
    }
  }

  public async chatCopilot(
    message: string,
    history: Array<{ role: 'user' | 'model'; content: string }>,
    context: { tasksCount: number; pendingTasks: string[]; nextEvents: string[] }
  ): Promise<string> {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, context }),
      });
      if (!res.ok) throw new Error('Chat API failed');
      const data = await res.json();
      return data.response;
    } catch {
      return `I've analyzed your schedule and active workload (${context.tasksCount} active tasks). For highest leverage, focus on your urgent milestones first and protect your 90-minute focus window.`;
    }
  }
}

export const aiService = new AIService();
