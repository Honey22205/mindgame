/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserPreferences, Task, CalendarEvent, DailyBriefing } from './types';
import { storage } from './services/storage';
import { sound } from './services/audio';

// MindGym Services & State
import { mindStorage, MindState } from './services/mindStorage';
import { mindAudio } from './services/mindAudio';

// MindGym Views & Games
import { MindHomeView } from './components/dashboard/MindHomeView';
import { WorkoutsHubView } from './components/games/WorkoutsHubView';
import { SpeedMathGame } from './components/games/SpeedMathGame';
import { MemoryMatrixGame } from './components/games/MemoryMatrixGame';
import { StroopFocusGame } from './components/games/StroopFocusGame';
import { FocusGardenView } from './components/garden/FocusGardenView';
import { HabitsView } from './components/habits/HabitsView';

// Layout & Modals
import { MobileShell } from './components/layout/MobileShell';
import { ArchitectureModal } from './components/architecture/ArchitectureModal';
import { TaskDetailModal } from './components/tasks/TaskDetailModal';
import { TasksView } from './components/tasks/TasksView';
import { CalendarView } from './components/calendar/CalendarView';
import { AnalyticsView } from './components/analytics/AnalyticsView';

export default function App() {
  // Navigation Tabs: 'today' | 'workouts' | 'garden' | 'habits' | 'hub'
  const [activeTab, setActiveTab] = useState<'today' | 'workouts' | 'garden' | 'habits' | 'hub'>('today');

  // Active full-screen cognitive game: null | 'math' | 'memory' | 'stroop' | 'garden'
  const [activeGame, setActiveGame] = useState<'math' | 'memory' | 'stroop' | 'garden' | null>(null);

  // MindGym State
  const [mindState, setMindState] = useState<MindState>(() => mindStorage.get());

  // Hub / Task Storage State (preserved for Hub tab)
  const [tasks, setTasks] = useState<Task[]>(() => storage.getTasks());
  const [events, setEvents] = useState<CalendarEvent[]>(() => storage.getEvents());
  const [preferences, setPreferences] = useState<UserPreferences>(() => storage.getPreferences());
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  useEffect(() => {
    sound.setEnabled(preferences.soundEnabled);
    mindAudio.setMuted(!preferences.soundEnabled);

    const unsubStorage = storage.subscribe(() => {
      setTasks(storage.getTasks());
      setEvents(storage.getEvents());
      setPreferences(storage.getPreferences());
    });

    return () => {
      unsubStorage();
    };
  }, [preferences.soundEnabled]);

  // Game Finish Handlers
  const handleMathFinish = (score: number) => {
    const next = mindStorage.recordMathScore(score);
    setMindState(next);
    setActiveGame(null);
    mindAudio.playComplete();
  };

  const handleMemoryFinish = (maxLevel: number) => {
    const next = mindStorage.recordMemoryLevel(maxLevel);
    setMindState(next);
    setActiveGame(null);
    mindAudio.playComplete();
  };

  const handleStroopFinish = (accuracy: number) => {
    const next = mindStorage.recordStroopScore(accuracy);
    setMindState(next);
    setActiveGame(null);
    mindAudio.playComplete();
  };

  const handleTreeGrown = (treeName: string, durationMinutes: number) => {
    const next = mindStorage.addTree(treeName, durationMinutes);
    setMindState(next);
  };

  // Habits Handlers
  const handleToggleHabit = (id: string) => {
    const next = mindStorage.toggleHabit(id);
    setMindState(next);
  };

  const handleAddHabit = (title: string, category: any) => {
    const current = mindStorage.get();
    const newHabit = {
      id: `h-${Date.now()}`,
      title,
      category,
      isCompleted: false,
      streak: 0,
      iconName: 'sparkles',
    };
    current.habits.push(newHabit);
    mindStorage.save(current);
    setMindState({ ...current });
  };

  return (
    <MobileShell
      preferences={preferences}
      onUpdatePreferences={(updates) => {
        const updated = storage.updatePreferences(updates);
        setPreferences(updated);
      }}
      activeTab={activeTab}
      onChangeTab={(tab) => {
        setActiveGame(null);
        setActiveTab(tab);
      }}
      onOpenArchitecture={() => setIsArchitectureOpen(true)}
    >
      {/* 1. Full-Screen Active Mini-Games */}
      {activeGame === 'math' && (
        <SpeedMathGame
          onFinish={handleMathFinish}
          onExit={() => setActiveGame(null)}
        />
      )}

      {activeGame === 'memory' && (
        <MemoryMatrixGame
          onFinish={handleMemoryFinish}
          onExit={() => setActiveGame(null)}
        />
      )}

      {activeGame === 'stroop' && (
        <StroopFocusGame
          onFinish={handleStroopFinish}
          onExit={() => setActiveGame(null)}
        />
      )}

      {activeGame === 'garden' && (
        <FocusGardenView
          trees={mindState.trees}
          totalFocusMinutes={mindState.totalFocusMinutes}
          onTreeGrown={handleTreeGrown}
        />
      )}

      {/* 2. Main Tab Views (when not in full-screen game) */}
      {!activeGame && (
        <>
          {activeTab === 'today' && (
            <MindHomeView
              state={mindState}
              onStartGame={(gameId) => setActiveGame(gameId)}
              onOpenHabits={() => setActiveTab('habits')}
              onToggleHabit={handleToggleHabit}
            />
          )}

          {activeTab === 'workouts' && (
            <WorkoutsHubView
              onStartGame={(gameId) => setActiveGame(gameId)}
              highScores={mindState.highScores}
            />
          )}

          {activeTab === 'garden' && (
            <FocusGardenView
              trees={mindState.trees}
              totalFocusMinutes={mindState.totalFocusMinutes}
              onTreeGrown={handleTreeGrown}
            />
          )}

          {activeTab === 'habits' && (
            <HabitsView
              habits={mindState.habits}
              onToggleHabit={handleToggleHabit}
              onAddHabit={handleAddHabit}
            />
          )}

          {activeTab === 'hub' && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <TasksView
                tasks={tasks}
                onOpenAI={() => {}}
              />
            </div>
          )}
        </>
      )}

      {/* Architecture & Engineering Defense Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Task Creation & Edit Modal */}
      <TaskDetailModal
        task={taskToEdit}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
        onSaved={() => {
          setIsTaskModalOpen(false);
          setTaskToEdit(null);
        }}
      />
    </MobileShell>
  );
}
