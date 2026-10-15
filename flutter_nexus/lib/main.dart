import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/theme/app_theme.dart';
import 'core/storage/local_database.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Edge-to-edge transparent system navigation for Android 15/16
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  runApp(
    const ProviderScope(
      child: NexusCommandApp(),
    ),
  );
}

class NexusCommandApp extends ConsumerWidget {
  const NexusCommandApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: 'NEXUS Command Center',
      debugShowCheckedModeBanner: false,
      theme: NexusTheme.darkTheme,
      home: const Scaffold(
        body: Center(
          child: Text(
            'NEXUS Command Center Native Shell Initialized',
            style: TextStyle(color: Colors.white, fontFamily: 'Plus Jakarta Sans'),
          ),
        ),
      ),
    );
  }
}
