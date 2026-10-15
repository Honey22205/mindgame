export type WeaponId = 
  | 'plasma_gun' 
  | 'neon_katana' 
  | 'chain_lightning' 
  | 'emp_nova' 
  | 'seeker_missiles' 
  | 'cryo_field';

export interface Weapon {
  id: WeaponId;
  name: string;
  level: number;
  maxLevel: number;
  damage: number;
  cooldown: number; // in seconds
  currentCd: number;
  count: number;
  range: number;
  speed: number;
  description: string;
}

export interface Hero {
  id: string;
  name: string;
  title: string;
  description: string;
  baseHp: number;
  baseSpeed: number;
  baseDamage: number; // multiplier, e.g. 1.0
  baseCrit: number; // e.g. 0.05
  defaultWeapon: WeaponId;
  color: string;
  glow: string;
}

export type UpgradeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface UpgradeCard {
  id: string;
  title: string;
  type: 'new_weapon' | 'upgrade_weapon' | 'stat_boost';
  weaponId?: WeaponId;
  description: string;
  rarity: UpgradeRarity;
  statBonus?: {
    hp?: number;
    speed?: number;
    damageMult?: number;
    magnetRadius?: number;
    critChance?: number;
  };
}

export type EnemyType = 'swarmer' | 'drone' | 'brute' | 'stalker' | 'boss';

export interface Enemy {
  id: number;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  radius: number;
  color: string;
  type: EnemyType;
  xpValue: number;
  shootCd?: number;
  glow: string;
}

export interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  glow: string;
  life: number;
  pierce: number;
  isPlayer: boolean;
  isHoming?: boolean;
  targetId?: number;
}

export interface Gem {
  id: number;
  x: number;
  y: number;
  value: number;
  radius: number;
  color: string;
  isCredit: boolean;
}

export interface DamageNumber {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  isCrit: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  radius: number;
}

export interface MetaUpgrades {
  maxHpLvl: number;
  damageLvl: number;
  speedLvl: number;
  magnetLvl: number;
  critLvl: number;
}

export interface GameStats {
  enemiesKilled: number;
  timeSurvived: number; // in seconds
  damageDealt: number;
  creditsEarned: number;
  levelReached: number;
}
