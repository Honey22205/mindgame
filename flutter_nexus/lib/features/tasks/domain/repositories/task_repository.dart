// lib/features/tasks/domain/repositories/task_repository.dart
import '../models/task_model.dart';

abstract class TaskRepository {
  Future<List<TaskModel>> getAllTasks();
  Stream<List<TaskModel>> watchTasks();
  Future<void> addTask(TaskModel task);
  Future<void> updateTask(TaskModel task);
  Future<void> deleteTask(String id);
}
