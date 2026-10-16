// lib/core/storage/local_database.dart
// Type-safe SQLite database powered by Drift for offline-first resilience
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;

part 'local_database.g.dart';

@DataClassName('TaskEntry')
class TasksTable extends Table {
  TextColumn get id => text()();
  TextColumn get title => text().withLength(min: 1, max: 255)();
  TextColumn get description => text().nullable()();
  TextColumn get priority => text()(); // 'urgent', 'high', 'medium', 'low'
  TextColumn get dueDate => text()(); // ISO-8601 YYYY-MM-DD
  TextColumn get dueTime => text().nullable()();
  IntColumn get estimatedMinutes => integer().withDefault(const Constant(30))();
  TextColumn get tagsJson => text().withDefault(const Constant('[]'))();
  TextColumn get subtasksJson => text().withDefault(const Constant('[]'))();
  BoolColumn get isCompleted => boolean().withDefault(const Constant(false))();
  DateTimeColumn get completedAt => dateTime().nullable()();
  TextColumn get recurrence => text().withDefault(const Constant('none'))();
  IntColumn get syncVersion => integer().withDefault(const Constant(1))();
  BoolColumn get synced => boolean().withDefault(const Constant(false))();
  DateTimeColumn get createdAt => dateTime()();
  DateTimeColumn get updatedAt => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

@DataClassName('MutationEntry')
class MutationsTable extends Table {
  TextColumn get id => text()();
  TextColumn get entityType => text()(); // 'task', 'event', 'habit'
  TextColumn get action => text()(); // 'create', 'update', 'delete'
  TextColumn get payload => text()();
  DateTimeColumn get timestamp => dateTime()();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [TasksTable, MutationsTable])
class NexusDatabase extends _$NexusDatabase {
  NexusDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  // Reactive stream of tasks
  Stream<List<TaskEntry>> watchAllTasks() => select(tasksTable).watch();

  Future<List<TaskEntry>> getAllTasks() => select(tasksTable).get();

  Future<int> insertTask(TasksTableCompanion task) => into(tasksTable).insert(task);

  Future<bool> updateTaskEntry(TaskEntry task) => update(tasksTable).replace(task);

  Future<int> deleteTaskEntry(String id) => (delete(tasksTable)..where((t) => t.id.equals(id))).go();

  // Mutations Queue Operations
  Future<List<MutationEntry>> getPendingMutations() => select(mutationsTable).get();

  Future<int> insertMutation(MutationsTableCompanion mutation) => into(mutationsTable).insert(mutation);

  Future<int> clearMutations() => delete(mutationsTable).go();
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'nexus_mobile.sqlite'));
    return NativeDatabase.createInBackground(file);
  });
}
