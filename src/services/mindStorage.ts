export interface BrainScores {
  overall: number; // 0 - 1000
  math: number;
  memory: number;
  focus: number;
  language: number;
}

export interface HabitItem {
  id: string;
  title: string;
  category: 'health' | 'mind' | 'learning' | 'productivity';
  isCompleted: boolean;
  streak: number;
  iconName: string;
}

export interface TreeItem {
  id: string;
  name: string;
  durationMinutes: number;
  date: string;
}

export interface MindState {
  scores: BrainScores;
  streak: number;
  bestStreak: number;
  lastActiveDate: string;
  completedDays: string[];
  habits: HabitItem[];
  trees: TreeItem[];
  totalFocusMinutes: number;
  workoutsCompleted: number;
  highScores: {
    speedMath: number;
    memoryMatrixLevel: number;
    stroopAccuracy: number;
    wordCount: number;
  };
}

const STORAGE_KEY = 'mindgym_user_data_v2';

const todayStr = new Date().toISOString().split('T')[0];

const INITIAL_HABITS: HabitItem[] = [
  { id: 'h1', title: 'Hydrate 500ml upon waking', category: 'health', isCompleted: true, streak: 8, iconName: 'droplet' },
  { id: 'h2', title: '15 mins morning reading or audio', category: 'learning', isCompleted: true, streak: 5, iconName: 'book-open' },
  { id: 'h3', title: 'Daily cognitive brain workout', category: 'mind', isCompleted: false, streak: 12, iconName: 'sparkles' },
  { id: 'h4', title: '45 mins deep work with zero phone', category: 'productivity', isCompleted: false, streak: 4, iconName: 'zap' },
  { id: 'h5', title: 'Evening digital sunset before 10pm', category: 'health', isCompleted: false, streak: 3, iconName: 'moon' },
];

const INITIAL_STATE: MindState = {
  scores: {
    overall: 840,
    math: 820,
    memory: 890,
    focus: 810,
    language: 840,
  },
  streak: 6,
  bestStreak: 14,
  lastActiveDate: todayStr,
  completedDays: [todayStr],
  habits: INITIAL_HABITS,
  trees: [
    { id: 't1', name: 'Cherry Blossom Bonsai', durationMinutes: 25, date: todayStr },
    { id: 't2', name: 'Zen Pine Tree', durationMinutes: 45, date: todayStr },
    { id: 't3', name: 'Emerald Willow', durationMinutes: 25, date: '2026-10-14' },
  ],
  totalFocusMinutes: 95,
  workoutsCompleted: 18,
  highScores: {
    speedMath: 380,
    memoryMatrixLevel: 8,
    stroopAccuracy: 94,
    wordCount: 11,
  },
};

export const mindStorage = {
  get(): MindState {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        this.save(INITIAL_STATE);
        return INITIAL_STATE;
      }
      return { ...INITIAL_STATE, ...JSON.parse(data) };
    } catch {
      return INITIAL_STATE;
    }
  },

  save(state: MindState) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  },

  toggleHabit(habitId: string): MindState {
    const state = this.get();
    const habit = state.habits.find((h) => h.id === habitId);
    if (!habit) return state;

    const nextCompleted = !habit.isCompleted;
    habit.isCompleted = nextCompleted;
    habit.streak = nextCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1);

    this.save(state);
    return state;
  },

  addTree(name: string, durationMinutes: number): MindState {
    const state = this.get();
    state.trees.unshift({
      id: `tree-${Date.now()}`,
      name,
      durationMinutes,
      date: new Date().toISOString().split('T')[0],
    });
    state.totalFocusMinutes += durationMinutes;
    state.scores.focus = Math.min(990, state.scores.focus + 5);
    state.scores.overall = Math.round(
      (state.scores.math + state.scores.memory + state.scores.focus + state.scores.language) / 4
    );
    this.save(state);
    return state;
  },

  recordMathScore(points: number): MindState {
    const state = this.get();
    state.highScores.speedMath = Math.max(state.highScores.speedMath, points);
    state.scores.math = Math.min(995, Math.max(500, state.scores.math + Math.round(points / 30)));
    state.scores.overall = Math.round(
      (state.scores.math + state.scores.memory + state.scores.focus + state.scores.language) / 4
    );
    this.save(state);
    return state;
  },

  recordMemoryLevel(level: number): MindState {
    const state = this.get();
    state.highScores.memoryMatrixLevel = Math.max(state.highScores.memoryMatrixLevel, level);
    state.scores.memory = Math.min(995, Math.max(500, state.scores.memory + level * 8));
    state.scores.overall = Math.round(
      (state.scores.math + state.scores.memory + state.scores.focus + state.scores.language) / 4
    );
    this.save(state);
    return state;
  },

  recordStroopScore(accuracy: number): MindState {
    const state = this.get();
    state.highScores.stroopAccuracy = Math.max(state.highScores.stroopAccuracy, accuracy);
    state.scores.focus = Math.min(995, Math.max(500, state.scores.focus + Math.round(accuracy / 10)));
    state.scores.overall = Math.round(
      (state.scores.math + state.scores.memory + state.scores.focus + state.scores.language) / 4
    );
    this.save(state);
    return state;
  },

  recordWordScore(count: number): MindState {
    const state = this.get();
    state.highScores.wordCount = Math.max(state.highScores.wordCount, count);
    state.scores.language = Math.min(995, Math.max(500, state.scores.language + count * 10));
    state.scores.overall = Math.round(
      (state.scores.math + state.scores.memory + state.scores.focus + state.scores.language) / 4
    );
    this.save(state);
    return state;
  },
};
