import 'package:flutter/material.dart';

class NexusTheme {
  static const Color background = Color(0xFF08090E);
  static const Color surface = Color(0xFF101423);
  static const Color card = Color(0xFF141828);
  static const Color cyanAccent = Color(0xFF00F0FF);
  static const Color indigoAccent = Color(0xFF6366F1);
  static const Color emeraldAccent = Color(0xFF10B981);
  static const Color amberAccent = Color(0xFFF59E0B);
  static const Color roseAccent = Color(0xFFF43F5E);

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      scaffoldBackgroundColor: background,
      primaryColor: cyanAccent,
      colorScheme: const ColorScheme.dark(
        primary: cyanAccent,
        secondary: indigoAccent,
        surface: surface,
      ),
      fontFamily: 'Plus Jakarta Sans',
      useMaterial3: true,
    );
  }
}
