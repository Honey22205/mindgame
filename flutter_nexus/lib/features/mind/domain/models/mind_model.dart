// lib/features/mind/domain/models/mind_model.dart
class BrainScoreModel {
  final int overall;
  final int math;
  final int memory;
  final int focus;
  final int language;

  const BrainScoreModel({
    required this.overall,
    required this.math,
    required this.memory,
    required this.focus,
    required this.language,
  });

  factory BrainScoreModel.initial() => const BrainScoreModel(
    overall: 840,
    math: 820,
    memory: 890,
    focus: 810,
    language: 840,
  );
}

class HabitModel {
  final String id;
  final String title;
  final String category;
  final bool isCompleted;
  final int streak;

  const HabitModel({
    required this.id,
    required this.title,
    required this.category,
    required this.isCompleted,
    required this.streak,
  });
}
