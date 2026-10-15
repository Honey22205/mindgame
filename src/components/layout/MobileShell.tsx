import React, { useState, useEffect } from 'react';
import { UserPreferences } from '../../types';
import { sound } from '../../services/audio';
import { 
  Wifi, 
  Battery, 
  Signal, 
  Brain, 
  TreePine, 
  CheckSquare, 
  Zap, 
  Layers,
  HelpCircle,
  Volume2,
  VolumeX,
  Code2
} from 'lucide-react';

interface Props {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  activeTab: 'today' | 'workouts' | 'garden' | 'habits' | 'hub';
  onChangeTab: (tab: 'today' | 'workouts' | 'garden' | 'habits' | 'hub') => void;
  onOpenArchitecture: () => void;
  children: React.ReactNode;
}

export const MobileShell: React.FC<Props> = ({
  preferences,
  onUpdatePreferences,
  activeTab,
  onChangeTab,
  onOpenArchitecture,
  children,
}) => {
  const [timeStr, setTimeStr] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }));
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const frame = preferences.deviceFrame;
  const isEdgeToEdge = frame === 'edge-to-edge';

  const navItems = [
    { id: 'today', label: 'Today', icon: Brain },
    { id: 'workouts', label: 'Workouts', icon: Zap },
    { id: 'garden', label: 'Garden', icon: TreePine },
    { id: 'habits', label: 'Habits', icon: CheckSquare },
    { id: 'hub', label: 'Hub', icon: Layers },
  ] as const;

  return (
    <div className="min-h-screen bg-[#07080d] flex flex-col items-center justify-center p-0 sm:p-4 text-slate-100 selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Device Switcher Toolbar (Visible on desktop/tablet) */}
      <div className="hidden sm:flex items-center justify-between w-full max-w-[420px] mb-3 px-2 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold tracking-tight text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            NEXUS · MindGym
          </span>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold">by Honey</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Architecture inspect button */}
          <button
            onClick={onOpenArchitecture}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-[11px] font-medium transition-colors"
            title="Inspect Clean Architecture & Flutter Specs"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>

          {/* Device frame switch */}
          <div className="flex items-center bg-[#111420] border border-white/10 rounded-lg p-0.5">
            {(['iphone', 'pixel', 'edge-to-edge'] as const).map((f) => (
              <button
                key={f}
                onClick={() => {
                  onUpdatePreferences({ deviceFrame: f });
                  sound.playTap();
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition-colors ${
                  frame === f ? 'bg-emerald-500 text-black font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f === 'edge-to-edge' ? 'Full' : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Device Frame Container */}
      <div
        className={`w-full relative flex flex-col overflow-hidden transition-all duration-300 ${
          isEdgeToEdge
            ? 'h-screen max-w-md sm:border sm:border-white/10 sm:rounded-3xl sm:h-[860px] bg-[#090b10]'
            : frame === 'iphone'
            ? 'h-screen sm:h-[860px] max-w-[400px] bg-[#090b10] sm:rounded-[52px] sm:border-[10px] sm:border-[#1e212b] sm:shadow-[0_0_60px_rgba(16,185,129,0.12),0_20px_50px_rgba(0,0,0,0.8)]'
            : 'h-screen sm:h-[860px] max-w-[400px] bg-[#090b10] sm:rounded-[44px] sm:border-[8px] sm:border-[#171922] sm:shadow-[0_0_50px_rgba(99,102,241,0.12),0_20px_50px_rgba(0,0,0,0.8)]'
        }`}
      >
        {/* Mobile Status Bar */}
        <div className="h-11 px-6 pt-2 flex items-center justify-between shrink-0 select-none z-30 bg-[#090b10]/90 backdrop-blur-md">
          {/* Left: Clock */}
          <span className="text-xs font-semibold tracking-tight text-slate-200 font-mono">
            {timeStr || '09:41'}
          </span>

          {/* Center: Dynamic Island */}
          {frame === 'iphone' ? (
            <div className="h-6 px-3 bg-black border border-white/10 rounded-full flex items-center justify-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono text-slate-300">MindGym</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>MindGym</span>
            </div>
          )}

          {/* Right: Cellular, WiFi, Battery */}
          <div className="flex items-center gap-1.5 text-slate-300">
            <Signal className="w-3 h-3 text-slate-300" />
            <Wifi className="w-3 h-3 text-slate-300" />
            <div className="flex items-center gap-0.5">
              <span className="text-[10px] font-mono text-slate-400">98%</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-hidden relative flex flex-col bg-[#090b10]">
          {children}
        </main>

        {/* Bottom Floating Navigation Bar & Home Indicator */}
        <div className="shrink-0 bg-[#0d0f17]/95 backdrop-blur-xl border-t border-white/8 z-30 select-none pb-safe">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeTab(item.id);
                    sound.playTap();
                  }}
                  className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all cursor-pointer ${
                    isActive ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-emerald-400' : ''}`} />
                  <span className={`text-[10px] font-medium mt-0.5 tracking-tight ${isActive ? 'text-white font-semibold' : ''}`}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Bottom Home Indicator Bar (iOS style) */}
          <div className="h-4 flex items-center justify-center pb-1">
            <div className="w-32 h-1 rounded-full bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
};
