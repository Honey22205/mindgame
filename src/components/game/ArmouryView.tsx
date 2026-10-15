import React from 'react';
import { Hero, MetaUpgrades } from '../../game/types';
import { HEROES, META_UPGRADE_CONFIG } from '../../game/constants';
import { gameAudio } from '../../game/audio';
import { 
  Play, 
  Sword, 
  Shield, 
  Zap, 
  Sparkles, 
  Coins, 
  Flame, 
  Check, 
  Lock,
  ChevronRight,
  Crosshair,
  Compass
} from 'lucide-react';

interface Props {
  selectedHeroId: string;
  onSelectHero: (id: string) => void;
  metaUpgrades: MetaUpgrades;
  credits: number;
  onUpgradeMeta: (key: keyof MetaUpgrades, cost: number) => void;
  onStartSurvivor: () => void;
  onStartSlicer: () => void;
}

export const ArmouryView: React.FC<Props> = ({
  selectedHeroId,
  onSelectHero,
  metaUpgrades,
  credits,
  onUpgradeMeta,
  onStartSurvivor,
  onStartSlicer,
}) => {
  const currentHero = HEROES.find((h) => h.id === selectedHeroId) || HEROES[0];

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 text-sm">
      {/* Top Banner / Currency */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
            CYBERNETIC ARSENAL
          </span>
          <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
            Champion & Upgrades
          </h2>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 border border-amber-500/30 font-mono text-amber-300 font-bold text-xs shadow-sm">
          <Coins className="w-4 h-4 text-amber-400" />
          <span>{credits}</span>
        </div>
      </div>

      {/* Main Mode Play Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onStartSurvivor}
          className="p-4 rounded-2xl bg-gradient-to-tr from-cyan-950/80 to-slate-900 border-2 border-cyan-500/50 hover:border-cyan-400 hover:scale-[1.02] active:scale-98 transition-all text-left shadow-lg shadow-cyan-950/40 relative overflow-hidden group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 mb-2">
            <Flame className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-bold">
            PRIMARY MODE
          </span>
          <h3 className="text-sm font-extrabold text-white tracking-tight">Horde Survivor</h3>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
            Survive waves of cyber mechs & colossal titans. Auto-aim weaponry & level-up perks.
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-cyan-300 group-hover:translate-x-1 transition-transform">
            <span>Deploy</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>

        <button
          onClick={onStartSlicer}
          className="p-4 rounded-2xl bg-gradient-to-tr from-purple-950/80 to-slate-900 border-2 border-purple-500/50 hover:border-purple-400 hover:scale-[1.02] active:scale-98 transition-all text-left shadow-lg shadow-purple-950/40 relative overflow-hidden group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 mb-2">
            <Sword className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block font-bold">
            ARCADE BLADE
          </span>
          <h3 className="text-sm font-extrabold text-white tracking-tight">Cyber Slicer</h3>
          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
            Swipe with laser blade ribbons to slice cyber cores & rack up combo streaks.
          </p>
          <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-purple-300 group-hover:translate-x-1 transition-transform">
            <span>Slice</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </button>
      </div>

      {/* Hero Selection Grid */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
            <Crosshair className="w-4 h-4 text-cyan-400" />
            <span>Select Champion</span>
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {HEROES.map((hero) => {
            const isSelected = hero.id === selectedHeroId;
            return (
              <div
                key={hero.id}
                onClick={() => {
                  onSelectHero(hero.id);
                  gameAudio.playButtonClick();
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#151928] border-cyan-400 shadow-lg shadow-cyan-500/20'
                    : 'bg-[#0f121d] border-white/5 hover:border-white/20'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
                <div
                  style={{ color: hero.color }}
                  className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold font-mono mb-1.5"
                >
                  {hero.name.substring(0, 2).toUpperCase()}
                </div>
                <h4 className="text-xs font-bold text-white">{hero.name}</h4>
                <span className="text-[10px] text-slate-400 font-mono block">{hero.title}</span>
                <div className="mt-2 text-[10px] text-slate-300 leading-tight">
                  HP {hero.baseHp} · Spd {hero.baseSpeed}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Meta Upgrades: The Black Market */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white tracking-tight">
              Permanent Upgrades (Black Market)
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">All runs benefit</span>
        </div>

        <div className="space-y-2">
          {META_UPGRADE_CONFIG.map((upgrade) => {
            const currentLevel = metaUpgrades[upgrade.key] || 0;
            const isMax = currentLevel >= upgrade.maxLevel;
            const cost = upgrade.costPerLevel * (currentLevel + 1);
            const canAfford = credits >= cost;

            return (
              <div
                key={upgrade.key}
                className="p-3 rounded-2xl bg-[#0f121d] border border-white/5 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white truncate">{upgrade.name}</h4>
                    <span className="text-[10px] font-mono text-cyan-400 shrink-0">
                      Lv.{currentLevel}/{upgrade.maxLevel}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{upgrade.description}</p>
                </div>

                {isMax ? (
                  <span className="text-[11px] font-mono text-emerald-400 font-bold px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shrink-0">
                    MAXED
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      if (canAfford) {
                        onUpgradeMeta(upgrade.key, cost);
                        gameAudio.playGem();
                      }
                    }}
                    disabled={!canAfford}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold flex items-center gap-1 shrink-0 transition-all ${
                      canAfford
                        ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 hover:scale-105 active:scale-95'
                        : 'bg-white/5 text-slate-500 border border-white/5 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <span>{cost}</span>
                    <Coins className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
