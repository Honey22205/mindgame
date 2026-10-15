import { MetaUpgrades } from './types';
import { INITIAL_META_UPGRADES } from './constants';

const KEYS = {
  CREDITS: 'nexus_game_credits',
  HERO: 'nexus_game_hero',
  META: 'nexus_game_meta',
  RECORDS: 'nexus_game_records',
};

export interface GameRecords {
  longestSurvival: number;
  mostKills: number;
  highestSlicerScore: number;
  totalDamage: number;
  bossesDefeated: number;
}

const DEFAULT_RECORDS: GameRecords = {
  longestSurvival: 184,
  mostKills: 142,
  highestSlicerScore: 680,
  totalDamage: 14850,
  bossesDefeated: 2,
};

export const gameStorage = {
  getCredits(): number {
    try {
      const val = localStorage.getItem(KEYS.CREDITS);
      return val ? parseInt(val, 10) : 350; // generous starting credits for instant fun
    } catch {
      return 350;
    }
  },

  saveCredits(credits: number) {
    try {
      localStorage.setItem(KEYS.CREDITS, credits.toString());
    } catch {}
  },

  addCredits(amount: number): number {
    const next = this.getCredits() + amount;
    this.saveCredits(next);
    return next;
  },

  getSelectedHero(): string {
    try {
      return localStorage.getItem(KEYS.HERO) || 'kaelen';
    } catch {
      return 'kaelen';
    }
  },

  saveSelectedHero(id: string) {
    try {
      localStorage.setItem(KEYS.HERO, id);
    } catch {}
  },

  getMetaUpgrades(): MetaUpgrades {
    try {
      const val = localStorage.getItem(KEYS.META);
      return val ? JSON.parse(val) : INITIAL_META_UPGRADES;
    } catch {
      return INITIAL_META_UPGRADES;
    }
  },

  saveMetaUpgrades(meta: MetaUpgrades) {
    try {
      localStorage.setItem(KEYS.META, JSON.stringify(meta));
    } catch {}
  },

  getRecords(): GameRecords {
    try {
      const val = localStorage.getItem(KEYS.RECORDS);
      return val ? JSON.parse(val) : DEFAULT_RECORDS;
    } catch {
      return DEFAULT_RECORDS;
    }
  },

  saveRecords(records: GameRecords) {
    try {
      localStorage.setItem(KEYS.RECORDS, JSON.stringify(records));
    } catch {}
  },

  updateWithRun(kills: number, timeSec: number, damage: number) {
    const current = this.getRecords();
    const updated: GameRecords = {
      longestSurvival: Math.max(current.longestSurvival, timeSec),
      mostKills: Math.max(current.mostKills, kills),
      highestSlicerScore: current.highestSlicerScore,
      totalDamage: current.totalDamage + damage,
      bossesDefeated: current.bossesDefeated + (timeSec >= 120 ? 1 : 0),
    };
    this.saveRecords(updated);
    return updated;
  },

  updateSlicerScore(score: number) {
    const current = this.getRecords();
    const updated = {
      ...current,
      highestSlicerScore: Math.max(current.highestSlicerScore, score),
    };
    this.saveRecords(updated);
    return updated;
  },

  resetRecords() {
    this.saveRecords({
      longestSurvival: 0,
      mostKills: 0,
      highestSlicerScore: 0,
      totalDamage: 0,
      bossesDefeated: 0,
    });
  },
};
