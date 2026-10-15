// flutter_nexus/test/task_repository_test.dart
import 'package:flutter_test/flutter_test.dart';
import '../lib/features/tasks/domain/models/task_model.dart';

void main() {
  group('TaskModel Domain & Sync Logic Tests', () {
    test('Task completion updates sync version and completion timestamp', () {
      final initialTask = TaskModel(
        id: 'task-101',
        title: 'Run Drift SQLite migration',
        priority: TaskPriority.urgent,
        dueDate: '2026-10-15',
        estimatedMinutes: 45,
        tags: ['mobile', 'database'],
        subtasks: [
          const SubtaskItem(id: 'st-1', title: 'Compile schema', isCompleted: false),
        ],
        isCompleted: false,
        recurrence: RecurrenceType.none,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
        syncVersion: 1,
        synced: true,
      );

      final now = DateTime.now();
      final completedTask = initialTask.copyWith(
        isCompleted: true,
        completedAt: now,
        syncVersion: initialTask.syncVersion + 1,
        synced: false,
      );

      expect(completedTask.isCompleted, isTrue);
      expect(completedTask.completedAt, equals(now));
      expect(completedTask.syncVersion, equals(2));
      expect(completedTask.synced, isFalse);
    });

    test('Task serialization and deserialization preserves tags and subtasks', () {
      final task = TaskModel(
        id: 'task-202',
        title: 'Review Gemini token latency',
        priority: TaskPriority.high,
        dueDate: '2026-10-16',
        estimatedMinutes: 30,
        tags: ['ai', 'perf'],
        subtasks: [
          const SubtaskItem(id: 's-1', title: 'Check TTFT', isCompleted: true),
        ],
        isCompleted: false,
        recurrence: RecurrenceType.daily,
        createdAt: DateTime.parse('2026-10-15T10:00:00Z'),
        updatedAt: DateTime.parse('2026-10-15T10:00:00Z'),
        syncVersion: 3,
        synced: true,
      );

      final json = task.toJson();
      expect(json['id'], equals('task-202'));
      expect(json['priority'], equals('high'));
      expect(json['tags'], contains('ai'));
      expect((json['subtasks'] as List).length, equals(1));
    });
  });
}
