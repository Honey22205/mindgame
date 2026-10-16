// lib/features/tasks/presentation/controllers/task_notifier.dart
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../domain/models/task_model.dart';
import '../../domain/repositories/task_repository.dart';
import '../../data/repositories/task_repository_impl.dart';
import '../../../../core/storage/local_database.dart';
import '../../../../core/sync/sync_engine.dart';

final databaseProvider = Provider<NexusDatabase>((ref) {
  return NexusDatabase();
});

final syncEngineProvider = Provider<SyncEngine>((ref) {
  final db = ref.watch(databaseProvider);
  return SyncEngine(db, 'https://api.nexus-mobile.internal');
});

final taskRepositoryProvider = Provider<TaskRepository>((ref) {
  final db = ref.watch(databaseProvider);
  return TaskRepositoryImpl(db);
});

final taskListProvider = StateNotifierProvider<TaskListNotifier, AsyncValue<List<TaskModel>>>((ref) {
  final repository = ref.watch(taskRepositoryProvider);
  final syncEngine = ref.watch(syncEngineProvider);
  return TaskListNotifier(repository, syncEngine);
});

class TaskListNotifier extends StateNotifier<AsyncValue<List<TaskModel>>> {
  final TaskRepository _repository;
  final SyncEngine _syncEngine;

  TaskListNotifier(this._repository, this._syncEngine) : super(const AsyncValue.loading()) {
    loadTasks();
  }

  Future<void> loadTasks() async {
    try {
      final tasks = await _repository.getAllTasks();
      state = AsyncValue.data(tasks);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> toggleCompletion(String taskId) async {
    final previousState = state;
    if (state is! AsyncData<List<TaskModel>>) return;

    final currentTasks = (state as AsyncData<List<TaskModel>>).value;
    final targetIndex = currentTasks.indexWhere((t) => t.id == taskId);
    if (targetIndex == -1) return;

    final target = currentTasks[targetIndex];
    final updated = target.copyWith(
      isCompleted: !target.isCompleted,
      completedAt: !target.isCompleted ? DateTime.now() : null,
      syncVersion: target.syncVersion + 1,
    );

    // 1. Optimistic instant UI transition
    final newList = List<TaskModel>.from(currentTasks)..[targetIndex] = updated;
    state = AsyncValue.data(newList);

    try {
      // 2. Persist to local Drift SQLite database
      await _repository.updateTask(updated);

      // 3. Queue mutation into offline-first sync engine
      await _syncEngine.queueMutation(
        entityType: 'task',
        action: 'update',
        payload: updated.toJson(),
      );
    } catch (error) {
      // Rollback on local storage write failure
      state = previousState;
    }
  }

  Future<void> addTask(TaskModel task) async {
    if (state is! AsyncData<List<TaskModel>>) return;
    final currentTasks = (state as AsyncData<List<TaskModel>>).value;
    state = AsyncValue.data([task, ...currentTasks]);

    await _repository.addTask(task);
    await _syncEngine.queueMutation(
      entityType: 'task',
      action: 'create',
      payload: task.toJson(),
    );
  }
}
