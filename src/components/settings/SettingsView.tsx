import React, { useState, useEffect } from 'react';
import { UserPreferences } from '../../types';
import { storage } from '../../services/storage';
import { sound } from '../../services/audio';
import { notificationManager } from '../../services/notification';
import { 
  User, 
  Smartphone, 
  Moon, 
  Volume2, 
  VolumeX, 
  Bell, 
  Cloud, 
  CloudOff, 
  RefreshCw, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  Code2, 
  Check, 
  ShieldAlert,
  Sliders
} from 'lucide-react';

interface Props {
  preferences: UserPreferences;
  onUpdatePreferences: (updates: Partial<UserPreferences>) => void;
  onOpenArchitecture: () => void;
}

export const SettingsView: React.FC<Props> = ({
  preferences,
  onUpdatePreferences,
  onOpenArchitecture,
}) => {
  const [userName, setUserName] = useState(preferences.userName);
  const [userTitle, setUserTitle] = useState(preferences.userTitle);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'queued'>('synced');
  const [queueCount, setQueueCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  useEffect(() => {
    const unsub = storage.subscribeSync((status, count) => {
      setSyncStatus(status);
      setQueueCount(count);
    });
    return unsub;
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdatePreferences({ userName, userTitle });
    sound.playSuccess();
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    sound.playTap();
    try {
      const res = await storage.processSyncQueue();
      if (res.success) {
        sound.playSuccess();
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleOfflineMode = () => {
    const nextVal = !preferences.offlineMode;
    onUpdatePreferences({ offlineMode: nextVal });
    sound.playTap();
    if (!nextVal) {
      storage.processSyncQueue();
    }
  };

  const handleExportData = () => {
    sound.playTap();
    const jsonStr = storage.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportNotice('Backup exported successfully.');
    setTimeout(() => setExportNotice(null), 3000);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (storage.importData(content)) {
        sound.playSuccess();
        setExportNotice('Data imported successfully!');
      } else {
        setExportNotice('Failed to import JSON.');
      }
      setTimeout(() => setExportNotice(null), 3000);
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (confirm('Reset application to initial demo state? All current tasks will be restored to realistic sample data.')) {
      storage.resetToDemoData();
      sound.playSuccess();
    }
  };

  const handleWipeData = () => {
    if (confirm('Are you sure you want to delete all tasks, events, and queues? This cannot be undone.')) {
      storage.wipeAllData();
      sound.playTap();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 text-sm">
      {/* Title */}
      <div>
        <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400">
          Preferences & Runtime
        </span>
        <h2 className="text-xl font-bold text-white tracking-tight mt-0.5">
          Settings & Engine
        </h2>
      </div>

      {/* Code & Architecture Banner for Interviewers */}
      <div 
        onClick={onOpenArchitecture}
        className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-cyan-950/40 border border-cyan-500/40 cursor-pointer hover:border-cyan-400 transition-all shadow-lg shadow-cyan-950/30 group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 group-hover:scale-105 transition-transform">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white">Flutter & Mobile Architecture</h4>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                  INTERVIEW SPEC
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Inspect Riverpod, Drift SQLite schema, Clean Architecture, and Android build configs.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <form onSubmit={handleSaveProfile} className="glass-card rounded-2xl p-4 border space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <User className="w-4 h-4 text-cyan-400" />
          <span>Operator Profile</span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Name</label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full bg-[#161a29] border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Designation</label>
            <input
              type="text"
              value={userTitle}
              onChange={(e) => setUserTitle(e.target.value)}
              className="w-full bg-[#161a29] border border-white/10 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-cyan-500/50"
            />
          </div>
        </div>

        <button
          type="submit"
          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors"
        >
          Update Profile
        </button>
      </form>

      {/* Device Viewport Selector */}
      <div className="glass-card rounded-2xl p-4 border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            <Smartphone className="w-4 h-4 text-cyan-400" />
            <span>Mobile Device Shell</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {(['iphone', 'pixel', 'edge-to-edge'] as const).map((frame) => {
            const active = preferences.deviceFrame === frame;
            const labels = {
              iphone: 'iPhone 16 Pro',
              pixel: 'Pixel 9 Pro',
              'edge-to-edge': 'Edge-to-Edge',
            };
            return (
              <button
                key={frame}
                type="button"
                onClick={() => {
                  onUpdatePreferences({ deviceFrame: frame });
                  sound.playTap();
                }}
                className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                  active
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-[#161a29] text-slate-400 border-white/5 hover:text-white'
                }`}
              >
                {labels[frame]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tactile & Sound Settings */}
      <div className="glass-card rounded-2xl p-4 border space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Volume2 className="w-4 h-4 text-cyan-400" />
          <span>Feedback & Sensors</span>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-200">Synthesized Audio Effects</div>
              <div className="text-[11px] text-slate-400">Micro-interaction clicks and chime on complete</div>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = !preferences.soundEnabled;
                onUpdatePreferences({ soundEnabled: next });
                sound.setEnabled(next);
                if (next) sound.playSuccess();
              }}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                preferences.soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${preferences.soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <div>
              <div className="text-slate-200">Device Haptic Engine</div>
              <div className="text-[11px] text-slate-400">Tactile motor vibrations on completion</div>
            </div>
            <button
              type="button"
              onClick={() => {
                onUpdatePreferences({ hapticsEnabled: !preferences.hapticsEnabled });
                sound.triggerHaptic('medium');
              }}
              className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                preferences.hapticsEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white transition-transform ${preferences.hapticsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
            <div>
              <div className="text-slate-200">Smart Push Notifications</div>
              <div className="text-[11px] text-slate-400">Web Notification API permission</div>
            </div>
            <button
              type="button"
              onClick={async () => {
                const granted = await notificationManager.requestPermission();
                if (granted) {
                  sound.playSuccess();
                  notificationManager.notify('NEXUS Notifications Armed', 'You will receive reminders for scheduled deadlines.');
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-medium"
            >
              Request
            </button>
          </div>
        </div>
      </div>

      {/* Offline-First Sync Engine Section */}
      <div className="glass-card rounded-2xl p-4 border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-white">
            {preferences.offlineMode ? (
              <CloudOff className="w-4 h-4 text-amber-400" />
            ) : (
              <Cloud className="w-4 h-4 text-emerald-400" />
            )}
            <span>Offline-First Sync Engine</span>
          </div>

          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            preferences.offlineMode
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
              : queueCount > 0
              ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
              : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
          }`}>
            {preferences.offlineMode ? 'Simulated Offline' : queueCount > 0 ? `${queueCount} Queued` : 'Cloud In-Sync'}
          </span>
        </div>

        <p className="text-[11px] text-slate-300 leading-relaxed">
          NEXUS operates with a strict offline-first vector queue. All writes persist immediately to local storage and replay deterministically to the server upon reconnection.
        </p>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={handleToggleOfflineMode}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              preferences.offlineMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-white/5 text-slate-300 border-white/10 hover:text-white'
            }`}
          >
            {preferences.offlineMode ? 'Disable Offline Simulation' : 'Simulate Offline Mode'}
          </button>

          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncing || preferences.offlineMode}
            className="px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-cyan-500/30 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Force Sync</span>
          </button>
        </div>
      </div>

      {/* Data Management Section */}
      <div className="glass-card rounded-2xl p-4 border space-y-3">
        <div className="text-xs font-semibold text-white">Data Portability & State</div>

        {exportNotice && (
          <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            <span>{exportNotice}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleExportData}
            className="p-2.5 rounded-xl bg-[#161a29] border border-white/5 hover:border-white/20 text-xs text-slate-300 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          <label className="p-2.5 rounded-xl bg-[#161a29] border border-white/5 hover:border-white/20 text-xs text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-indigo-400" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleImportData} className="hidden" />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={handleResetDemo}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Demo Data</span>
          </button>

          <button
            type="button"
            onClick={handleWipeData}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/5 text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe Database</span>
          </button>
        </div>
      </div>
    </div>
  );
};
