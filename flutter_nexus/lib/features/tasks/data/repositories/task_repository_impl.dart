// lib/features/tasks/data/repositories/task_repository_impl.dart
import 'dart:convert';
import 'package:drift/drift.dart';
import '../../domain/models/task_model.dart';
import '../../domain/repositories/task_repository.dart';
import '../../../../core/storage/local_database.dart';

class TaskRepositoryImpl implements TaskRepository {
  final NexusDatabase _db;

  TaskRepositoryImpl(this._db);

  @override
  Future<List<TaskModel>> getAllTasks() async {
    final entries = await _db.getAllTasks();
    return entries.map(_entryToModel).toList();
  }

  @override
  Stream<List<TaskModel>> watchTasks() {
    return _db.watchAllTasks().map((entries) => entries.map(_entryToModel).toList());
  }

  @override
  Future<void> addTask(TaskModel task) async {
    await _db.insertTask(
      TasksTableCompanion.insert(
        id: task.id,
        title: task.title,
        description: Value(task.description),
        priority: task.priority.name,
        dueDate: task.dueDate,
        dueTime: Value(task.dueTime),
        estimatedMinutes: Value(task.estimatedMinutes),
        tagsJson: Value(jsonEncode(task.tags)),
        subtasksJson: Value(jsonEncode(task.subtasks.map((s) => s.toJson()).toList())),
        isCompleted: Value(task.isCompleted),
        completedAt: Value(task.completedAt),
        recurrence: Value(task.recurrence.name),
        syncVersion: Value(task.syncVersion),
        synced: Value(task.synced),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      ),
    );
  }

  @override
  Future<void> updateTask(TaskModel task) async {
    await _db.updateTaskEntry(
      TaskEntry(
        id: task.id,
        title: task.title,
        description: task.description,
        priority: task.priority.name,
        dueDate: task.dueDate,
        dueTime: task.dueTime,
        estimatedMinutes: task.estimatedMinutes,
        tagsJson: jsonEncode(task.tags),
        subtasksJson: jsonEncode(task.subtasks.map((s) => s.toJson()).toList()),
        isCompleted: task.isCompleted,
        completedAt: task.completedAt,
        recurrence: task.recurrence.name,
        syncVersion: task.syncVersion,
        synced: task.synced,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
      ),
    );
  }

  @override
  Future<void> deleteTask(String id) async {
    await _db.deleteTaskEntry(id);
  }

  TaskModel _entryToModel(TaskEntry entry) {
    List<String> tags = [];
    try {
      tags = List<String>.from(jsonDecode(entry.tagsJson));
    } catch (_) {}

    List<SubtaskItem> subtasks = [];
    try {
      final decoded = jsonDecode(entry.subtasksJson) as List;
      subtasks = decoded.map((s) => SubtaskItem.fromJson(s as Map<String, dynamic>)).toList();
    } catch (_) {}

    return TaskModel(
      id: entry.id,
      title: entry.title,
      description: entry.description,
      priority: TaskPriority.values.firstWhere((p) => p.name == entry.priority, orElse: () => TaskPriority.medium),
      dueDate: entry.dueDate,
      dueTime: entry.dueTime,
      estimatedMinutes: entry.estimatedMinutes,
      tags: tags,
      subtasks: subtasks,
      isCompleted: entry.isCompleted,
      completedAt: entry.completedAt,
      recurrence: RecurrenceType.values.firstWhere((r) => r.name == entry.recurrence, orElse: () => RecurrenceType.none),
      reminderMinutesBefore: 15,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
      syncVersion: entry.syncVersion,
      synced: entry.synced,
    );
  }
}
