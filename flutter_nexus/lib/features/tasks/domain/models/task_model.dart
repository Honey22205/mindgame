enum TaskPriority { urgent, high, medium, low }
enum RecurrenceType { none, daily, weekdays, weekly, monthly }

class SubtaskItem {
  final String id;
  final String title;
  final bool isCompleted;

  const SubtaskItem({
    required this.id,
    required this.title,
    required this.isCompleted,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'isCompleted': isCompleted,
  };

  factory SubtaskItem.fromJson(Map<String, dynamic> json) => SubtaskItem(
    id: json['id'] as String,
    title: json['title'] as String,
    isCompleted: json['isCompleted'] as bool? ?? false,
  );
}

class TaskModel {
  final String id;
  final String title;
  final String? description;
  final TaskPriority priority;
  final String dueDate;
  final String? dueTime;
  final int estimatedMinutes;
  final List<String> tags;
  final List<SubtaskItem> subtasks;
  final bool isCompleted;
  final DateTime? completedAt;
  final RecurrenceType recurrence;
  final int? reminderMinutesBefore;
  final DateTime createdAt;
  final DateTime updatedAt;
  final int syncVersion;
  final bool synced;

  const TaskModel({
    required this.id,
    required this.title,
    this.description,
    required this.priority,
    required this.dueDate,
    this.dueTime,
    required this.estimatedMinutes,
    required this.tags,
    required this.subtasks,
    required this.isCompleted,
    this.completedAt,
    required this.recurrence,
    this.reminderMinutesBefore,
    required this.createdAt,
    required this.updatedAt,
    required this.syncVersion,
    required this.synced,
  });

  TaskModel copyWith({
    String? id,
    String? title,
    String? description,
    TaskPriority? priority,
    String? dueDate,
    String? dueTime,
    int? estimatedMinutes,
    List<String>? tags,
    List<SubtaskItem>? subtasks,
    bool? isCompleted,
    DateTime? completedAt,
    RecurrenceType? recurrence,
    int? reminderMinutesBefore,
    DateTime? createdAt,
    DateTime? updatedAt,
    int? syncVersion,
    bool? synced,
  }) {
    return TaskModel(
      id: id ?? this.id,
      title: title ?? this.title,
      description: description ?? this.description,
      priority: priority ?? this.priority,
      dueDate: dueDate ?? this.dueDate,
      dueTime: dueTime ?? this.dueTime,
      estimatedMinutes: estimatedMinutes ?? this.estimatedMinutes,
      tags: tags ?? this.tags,
      subtasks: subtasks ?? this.subtasks,
      isCompleted: isCompleted ?? this.isCompleted,
      completedAt: completedAt ?? this.completedAt,
      recurrence: recurrence ?? this.recurrence,
      reminderMinutesBefore: reminderMinutesBefore ?? this.reminderMinutesBefore,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      syncVersion: syncVersion ?? this.syncVersion,
      synced: synced ?? this.synced,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'description': description,
    'priority': priority.name,
    'dueDate': dueDate,
    'dueTime': dueTime,
    'estimatedMinutes': estimatedMinutes,
    'tags': tags,
    'subtasks': subtasks.map((s) => s.toJson()).toList(),
    'isCompleted': isCompleted,
    'completedAt': completedAt?.toIso8601String(),
    'recurrence': recurrence.name,
    'reminderMinutesBefore': reminderMinutesBefore,
    'createdAt': createdAt.toIso8601String(),
    'updatedAt': updatedAt.toIso8601String(),
    'syncVersion': syncVersion,
    'synced': synced,
  };
}
