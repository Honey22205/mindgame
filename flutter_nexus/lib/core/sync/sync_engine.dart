// lib/core/sync/sync_engine.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import '../storage/local_database.dart';

class SyncEngine {
  final NexusDatabase _db;
  final String _backendUrl;
  bool _isSyncing = false;

  SyncEngine(this._db, this._backendUrl);

  bool get isSyncing => _isSyncing;

  Future<void> queueMutation({
    required String entityType,
    required String action,
    required Map<String, dynamic> payload,
  }) async {
    // 1. Transactionally insert into local SQLite mutations buffer
    await _db.insertMutation(
      MutationsTableCompanion.insert(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        entityType: entityType,
        action: action,
        payload: jsonEncode(payload),
        timestamp: DateTime.now(),
      ),
    );

    // 2. Trigger asynchronous synchronization
    triggerSync();
  }

  Future<void> triggerSync() async {
    if (_isSyncing) return;
    _isSyncing = true;

    try {
      final pendingMutations = await _db.getPendingMutations();
      if (pendingMutations.isEmpty) {
        _isSyncing = false;
        return;
      }

      final response = await http.post(
        Uri.parse('$_backendUrl/api/sync'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'clientId': 'flutter-android-client',
          'changes': pendingMutations.map((m) => {
            'id': m.id,
            'entityType': m.entityType,
            'action': m.action,
            'payload': jsonDecode(m.payload),
          }).toList(),
        }),
      );

      if (response.statusCode == 200) {
        // Clear flushed mutations atomically on successful cloud acknowledgement
        await _db.clearMutations();
      }
    } catch (e) {
      // Offline fallback: mutations stay securely preserved in SQLite
    } finally {
      _isSyncing = false;
    }
  }
}
