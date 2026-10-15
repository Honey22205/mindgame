import { 
  Hero, 
  Weapon, 
  WeaponId, 
  Enemy, 
  Projectile, 
  Gem, 
  DamageNumber, 
  Particle, 
  UpgradeCard, 
  GameStats, 
  MetaUpgrades 
} from './types';
import { BASE_WEAPONS, HEROES, META_UPGRADE_CONFIG } from './constants';
import { gameAudio } from './audio';

export interface GameEngineCallbacks {
  onLevelUp: (choices: UpgradeCard[]) => void;
  onGameOver: (victory: boolean, stats: GameStats) => void;
  onHpChange: (current: number, max: number) => void;
  onXpChange: (current: number, needed: number, level: number) => void;
  onBossAlert: (bossName: string) => void;
  onScoreUpdate: (kills: number, time: number, credits: number) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameEngineCallbacks;

  // Game Loop
  private animationFrameId: number | null = null;
  private lastTime: number = 0;
  public isRunning: boolean = false;
  public isPaused: boolean = false;

  // Screen dimensions
  public width: number = 800;
  public height: number = 800;

  // Player state
  public hero: Hero;
  public playerX: number = 400;
  public playerY: number = 400;
  public playerHp: number = 100;
  public playerMaxHp: number = 100;
  public playerSpeed: number = 220;
  public playerDamageMult: number = 1.0;
  public playerCritChance: number = 0.1;
  public magnetRadius: number = 140;

  // Input state
  public inputX: number = 0;
  public inputY: number = 0;

  // Progression
  public level: number = 1;
  public currentXp: number = 0;
  public neededXp: number = 25;
  public creditsEarned: number = 0;
  public enemiesKilled: number = 0;
  public totalDamageDealt: number = 0;
  public timeSurvived: number = 0;

  // Active Weapons
  public weapons: Map<WeaponId, Weapon> = new Map();
  private katanaAngle: number = 0;

  // Entities
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public gems: Gem[] = [];
  public damageNumbers: DamageNumber[] = [];
  public particles: Particle[] = [];

  // Spawner & Boss
  private enemySpawnTimer: number = 0;
  private nextEnemyId: number = 1;
  private hasSpawnedBoss1: boolean = false;
  private hasSpawnedBoss2: boolean = false;
  public activeBoss: Enemy | null = null;

  // Visual effects
  private screenShake: number = 0;
  private flashColor: string | null = null;
  private flashAlpha: number = 0;

  constructor(canvas: HTMLCanvasElement, heroId: string, meta: MetaUpgrades, callbacks: GameEngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.callbacks = callbacks;

    const selectedHero = HEROES.find((h) => h.id === heroId) || HEROES[0];
    this.hero = selectedHero;

    this.initPlayer(meta);
    this.resize(canvas.width, canvas.height);
  }

  private initPlayer(meta: MetaUpgrades) {
    // Apply Hero stats + Meta upgrades
    const hpBonus = (meta.maxHpLvl || 0) * 20;
    const dmgBonus = (meta.damageLvl || 0) * 0.1;
    const spdBonus = (meta.speedLvl || 0) * 15;
    const magBonus = (meta.magnetLvl || 0) * 0.3;
    const critBonus = (meta.critLvl || 0) * 0.04;

    this.playerMaxHp = this.hero.baseHp + hpBonus;
    this.playerHp = this.playerMaxHp;
    this.playerSpeed = this.hero.baseSpeed + spdBonus;
    this.playerDamageMult = this.hero.baseDamage + dmgBonus;
    this.playerCritChance = this.hero.baseCrit + critBonus;
    this.magnetRadius = 140 * (1 + magBonus);

    // Add starting weapon
    this.addWeapon(this.hero.defaultWeapon);
  }

  public resize(w: number, h: number) {
    this.width = w;
    this.height = h;
    this.canvas.width = w;
    this.canvas.height = h;
    if (this.playerX === 400 && this.playerY === 400) {
      this.playerX = w / 2;
      this.playerY = h / 2;
    }
  }

  public start() {
    this.isRunning = true;
    this.isPaused = false;
    this.lastTime = performance.now();
    gameAudio.startMusic();
    this.callbacks.onHpChange(this.playerHp, this.playerMaxHp);
    this.callbacks.onXpChange(this.currentXp, this.neededXp, this.level);
    this.loop(this.lastTime);
  }

  public pause() {
    this.isPaused = true;
  }

  public resume() {
    if (!this.isRunning) return;
    this.isPaused = false;
    this.lastTime = performance.now();
  }

  public stop() {
    this.isRunning = false;
    gameAudio.stopMusic();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  public setInput(x: number, y: number) {
    // Normalize vector
    const mag = Math.hypot(x, y);
    if (mag > 1) {
      this.inputX = x / mag;
      this.inputY = y / mag;
    } else {
      this.inputX = x;
      this.inputY = y;
    }
  }

  // --- Weapon Management ---

  public addWeapon(id: WeaponId) {
    if (this.weapons.has(id)) {
      this.upgradeWeapon(id);
      return;
    }
    const base = BASE_WEAPONS[id];
    if (!base) return;

    this.weapons.set(id, {
      ...base,
      currentCd: 0,
    });
  }

  public upgradeWeapon(id: WeaponId) {
    const w = this.weapons.get(id);
    if (!w || w.level >= w.maxLevel) return;
    w.level++;
    w.damage = Math.round(w.damage * 1.35);
    w.cooldown = Math.max(0.15, w.cooldown * 0.88);
    if (id === 'neon_katana') w.count++;
    if (id === 'plasma_gun') w.count = Math.min(4, Math.floor(w.level / 2) + 1);
    if (id === 'chain_lightning') w.count += 2;
    if (id === 'seeker_missiles') w.count++;
  }

  public applyUpgrade(card: UpgradeCard) {
    if (card.type === 'new_weapon' && card.weaponId) {
      this.addWeapon(card.weaponId);
    } else if (card.type === 'upgrade_weapon' && card.weaponId) {
      this.upgradeWeapon(card.weaponId);
    } else if (card.type === 'stat_boost' && card.statBonus) {
      if (card.statBonus.hp) {
        this.playerMaxHp += card.statBonus.hp;
        this.playerHp = Math.min(this.playerMaxHp, this.playerHp + card.statBonus.hp);
        this.callbacks.onHpChange(this.playerHp, this.playerMaxHp);
      }
      if (card.statBonus.speed) this.playerSpeed += card.statBonus.speed;
      if (card.statBonus.damageMult) this.playerDamageMult += card.statBonus.damageMult;
      if (card.statBonus.magnetRadius) this.magnetRadius += card.statBonus.magnetRadius;
      if (card.statBonus.critChance) this.playerCritChance += card.statBonus.critChance;
    }

    this.resume();
  }

  public getAvailableUpgrades(): UpgradeCard[] {
    const choices: UpgradeCard[] = [];

    // 1. Upgrades for current weapons that are not maxed
    this.weapons.forEach((w) => {
      if (w.level < w.maxLevel) {
        choices.push({
          id: `upgrade_${w.id}_${w.level + 1}`,
          title: `Upgrade ${w.name} (Lv ${w.level + 1})`,
          type: 'upgrade_weapon',
          weaponId: w.id,
          description: `+35% damage, reduced cooldown. Current level: ${w.level}/${w.maxLevel}`,
          rarity: w.level >= 3 ? 'epic' : 'rare',
        });
      }
    });

    // 2. Discover new weapons if under weapon limit (max 4 weapons)
    if (this.weapons.size < 4) {
      (Object.keys(BASE_WEAPONS) as WeaponId[]).forEach((id) => {
        if (!this.weapons.has(id)) {
          const base = BASE_WEAPONS[id];
          choices.push({
            id: `new_${id}`,
            title: `Arm: ${base.name}`,
            type: 'new_weapon',
            weaponId: id,
            description: base.description,
            rarity: 'epic',
          });
        }
      });
    }

    // 3. Stat boosts always available
    const statCards: UpgradeCard[] = [
      {
        id: 'stat_hp',
        title: 'Nanite Hull Patch',
        type: 'stat_boost',
        statBonus: { hp: 35 },
        description: '+35 Max Health and instant heal',
        rarity: 'common',
      },
      {
        id: 'stat_damage',
        title: 'Plasma Overdrive',
        type: 'stat_boost',
        statBonus: { damageMult: 0.15 },
        description: '+15% all weapon damage multiplier',
        rarity: 'rare',
      },
      {
        id: 'stat_speed',
        title: 'Hyper Thrusters',
        type: 'stat_boost',
        statBonus: { speed: 25 },
        description: '+25 Movement velocity',
        rarity: 'common',
      },
      {
        id: 'stat_crit',
        title: 'Targeting Core Matrix',
        type: 'stat_boost',
        statBonus: { critChance: 0.08 },
        description: '+8% Critical strike probability',
        rarity: 'rare',
      },
      {
        id: 'stat_magnet',
        title: 'Graviton Vacuum',
        type: 'stat_boost',
        statBonus: { magnetRadius: 60 },
        description: '+60px Nanite collection range',
        rarity: 'common',
      },
    ];

    // Pick 3 diverse cards
    const pool = [...choices, ...statCards];
    // Shuffle
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool.slice(0, 3);
  }

  // --- Main Game Loop ---

  private loop = (time: number) => {
    if (!this.isRunning) return;

    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    if (!this.isPaused) {
      this.update(dt);
    }
    this.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.timeSurvived += dt;

    // Shake & Flash decay
    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 15);
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 2.5);

    // 1. Move Player
    this.playerX += this.inputX * this.playerSpeed * dt;
    this.playerY += this.inputY * this.playerSpeed * dt;

    // Bounds check
    const padding = 20;
    this.playerX = Math.max(padding, Math.min(this.width - padding, this.playerX));
    this.playerY = Math.max(padding, Math.min(this.height - padding, this.playerY));

    // 2. Rotate Katana
    this.katanaAngle += 3.5 * dt;

    // 3. Update Weapons
    this.updateWeapons(dt);

    // 4. Spawn & Update Enemies
    this.updateEnemies(dt);

    // 5. Update Projectiles
    this.updateProjectiles(dt);

    // 6. Update Gems & Vacuum
    this.updateGems(dt);

    // 7. Update Particles & Floating Text
    this.updateEffects(dt);

    // Periodic Score UI dispatch
    if (Math.floor(this.timeSurvived) % 1 === 0) {
      this.callbacks.onScoreUpdate(this.enemiesKilled, Math.floor(this.timeSurvived), this.creditsEarned);
    }
  }

  private updateWeapons(dt: number) {
    this.weapons.forEach((weapon) => {
      weapon.currentCd -= dt;
      if (weapon.currentCd <= 0) {
        this.fireWeapon(weapon);
        weapon.currentCd = weapon.cooldown;
      }
    });
  }

  private fireWeapon(w: Weapon) {
    if (this.enemies.length === 0) return;

    if (w.id === 'plasma_gun') {
      // Find nearest enemies
      const sorted = [...this.enemies].sort((a, b) => {
        const da = Math.hypot(a.x - this.playerX, a.y - this.playerY);
        const db = Math.hypot(b.x - this.playerX, b.y - this.playerY);
        return da - db;
      });

      const targets = sorted.slice(0, w.count);
      targets.forEach((target, i) => {
        const angle = Math.atan2(target.y - this.playerY, target.x - this.playerX) + (i - (w.count - 1) / 2) * 0.15;
        this.projectiles.push({
          x: this.playerX,
          y: this.playerY,
          vx: Math.cos(angle) * w.speed,
          vy: Math.sin(angle) * w.speed,
          damage: Math.round(w.damage * this.playerDamageMult),
          radius: 5,
          color: '#00f0ff',
          glow: 'rgba(0, 240, 255, 0.8)',
          life: 1.2,
          pierce: 1,
          isPlayer: true,
        });
      });
      gameAudio.playLaser();
    } else if (w.id === 'chain_lightning') {
      // Pick nearest, chain to w.count enemies
      const sorted = [...this.enemies].sort((a, b) => {
        return Math.hypot(a.x - this.playerX, a.y - this.playerY) - Math.hypot(b.x - this.playerX, b.y - this.playerY);
      });

      if (sorted[0]) {
        let currentTarget = sorted[0];
        const hitEnemies: Enemy[] = [currentTarget];

        for (let i = 1; i < w.count; i++) {
          const next = sorted.find((e) => !hitEnemies.includes(e) && Math.hypot(e.x - currentTarget.x, e.y - currentTarget.y) < 180);
          if (next) {
            hitEnemies.push(next);
            currentTarget = next;
          }
        }

        hitEnemies.forEach((e) => {
          this.damageEnemy(e, Math.round(w.damage * this.playerDamageMult));
          this.spawnHitSparks(e.x, e.y, '#a855f7');
        });
        gameAudio.playLightning();
      }
    } else if (w.id === 'emp_nova') {
      // Radial burst
      this.enemies.forEach((e) => {
        const d = Math.hypot(e.x - this.playerX, e.y - this.playerY);
        if (d <= w.range) {
          const knockback = 80;
          const angle = Math.atan2(e.y - this.playerY, e.x - this.playerX);
          e.x += Math.cos(angle) * knockback;
          e.y += Math.sin(angle) * knockback;
          this.damageEnemy(e, Math.round(w.damage * this.playerDamageMult));
        }
      });
      this.screenShake = 6;
      this.spawnNovaRing(this.playerX, this.playerY, w.range, '#10b981');
      gameAudio.playExplosion(false);
    } else if (w.id === 'seeker_missiles') {
      for (let i = 0; i < w.count; i++) {
        const angle = (Math.PI * 2 * i) / w.count + Math.random() * 0.3;
        this.projectiles.push({
          x: this.playerX,
          y: this.playerY,
          vx: Math.cos(angle) * w.speed,
          vy: Math.sin(angle) * w.speed,
          damage: Math.round(w.damage * this.playerDamageMult),
          radius: 6,
          color: '#f59e0b',
          glow: 'rgba(245, 158, 11, 0.8)',
          life: 2.5,
          pierce: 1,
          isPlayer: true,
          isHoming: true,
        });
      }
      gameAudio.playLaser();
    }
  }

  private updateEnemies(dt: number) {
    // Spawning logic based on time
    this.enemySpawnTimer += dt;
    const spawnRate = Math.max(0.25, 1.2 - (this.timeSurvived / 180) * 0.9);

    if (this.enemySpawnTimer >= spawnRate) {
      this.enemySpawnTimer = 0;
      this.spawnWave();
    }

    // Check Boss triggers
    if (this.timeSurvived >= 120 && !this.hasSpawnedBoss1) {
      this.hasSpawnedBoss1 = true;
      this.spawnBoss('TITAN CORRUPTOR', 1800, 32, '#f43f5e');
    }
    if (this.timeSurvived >= 240 && !this.hasSpawnedBoss2) {
      this.hasSpawnedBoss2 = true;
      this.spawnBoss('VOID SOVEREIGN', 3800, 42, '#a855f7');
    }

    // Katana orbit blade collision check
    const katana = this.weapons.get('neon_katana');
    if (katana) {
      const bladeDist = katana.range;
      for (let i = 0; i < katana.count; i++) {
        const angle = this.katanaAngle + (Math.PI * 2 * i) / katana.count;
        const bx = this.playerX + Math.cos(angle) * bladeDist;
        const by = this.playerY + Math.sin(angle) * bladeDist;

        this.enemies.forEach((e) => {
          if (Math.hypot(e.x - bx, e.y - by) < e.radius + 14) {
            this.damageEnemy(e, Math.round((katana.damage * this.playerDamageMult * dt) * 8));
            this.spawnHitSparks(bx, by, '#00f0ff');
          }
        });
      }
    }

    // Cryo field slow
    const cryo = this.weapons.get('cryo_field');

    // Move & Collision
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      let speed = e.speed;

      if (cryo && Math.hypot(e.x - this.playerX, e.y - this.playerY) < cryo.range) {
        speed *= 0.55;
        this.damageEnemy(e, Math.round(cryo.damage * this.playerDamageMult * dt));
      }

      const angle = Math.atan2(this.playerY - e.y, this.playerX - e.x);
      e.x += Math.cos(angle) * speed * dt;
      e.y += Math.sin(angle) * speed * dt;

      // Player collision damage
      const dist = Math.hypot(e.x - this.playerX, e.y - this.playerY);
      if (dist < e.radius + 12) {
        this.takeDamage(e.damage * dt * 3.5);
      }

      // Boss shooting
      if (e.type === 'boss') {
        e.shootCd = (e.shootCd || 0) - dt;
        if (e.shootCd <= 0) {
          e.shootCd = 1.4;
          for (let b = 0; b < 6; b++) {
            const bAngle = angle + (b - 2.5) * 0.25;
            this.projectiles.push({
              x: e.x,
              y: e.y,
              vx: Math.cos(bAngle) * 220,
              vy: Math.sin(bAngle) * 220,
              damage: 18,
              radius: 6,
              color: '#f43f5e',
              glow: 'rgba(244, 63, 94, 0.8)',
              life: 3,
              pierce: 1,
              isPlayer: false,
            });
          }
        }
      }

      if (e.hp <= 0) {
        this.killEnemy(e);
        this.enemies.splice(i, 1);
      }
    }
  }

  private spawnWave() {
    // Spawn offscreen perimeter
    const side = Math.floor(Math.random() * 4);
    let x = 0;
    let y = 0;
    const margin = 30;

    if (side === 0) { x = Math.random() * this.width; y = -margin; }
    else if (side === 1) { x = this.width + margin; y = Math.random() * this.height; }
    else if (side === 2) { x = Math.random() * this.width; y = this.height + margin; }
    else { x = -margin; y = Math.random() * this.height; }

    const isDrone = this.timeSurvived > 30 && Math.random() < 0.25;
    const isBrute = this.timeSurvived > 60 && Math.random() < 0.15;
    const isStalker = this.timeSurvived > 90 && Math.random() < 0.12;

    const hpScale = 1 + this.timeSurvived * 0.015;

    let enemy: Enemy;
    if (isBrute) {
      enemy = {
        id: this.nextEnemyId++,
        x, y,
        hp: Math.round(90 * hpScale),
        maxHp: Math.round(90 * hpScale),
        speed: 75,
        damage: 16,
        radius: 18,
        color: '#f97316',
        glow: 'rgba(249, 115, 22, 0.4)',
        type: 'brute',
        xpValue: 8,
      };
    } else if (isDrone) {
      enemy = {
        id: this.nextEnemyId++,
        x, y,
        hp: Math.round(40 * hpScale),
        maxHp: Math.round(40 * hpScale),
        speed: 130,
        damage: 8,
        radius: 12,
        color: '#eab308',
        glow: 'rgba(234, 179, 8, 0.4)',
        type: 'drone',
        xpValue: 4,
      };
    } else if (isStalker) {
      enemy = {
        id: this.nextEnemyId++,
        x, y,
        hp: Math.round(55 * hpScale),
        maxHp: Math.round(55 * hpScale),
        speed: 190,
        damage: 14,
        radius: 11,
        color: '#ec4899',
        glow: 'rgba(236, 72, 153, 0.4)',
        type: 'stalker',
        xpValue: 6,
      };
    } else {
      enemy = {
        id: this.nextEnemyId++,
        x, y,
        hp: Math.round(22 * hpScale),
        maxHp: Math.round(22 * hpScale),
        speed: 125,
        damage: 6,
        radius: 9,
        color: '#06b6d4',
        glow: 'rgba(6, 182, 212, 0.3)',
        type: 'swarmer',
        xpValue: 2,
      };
    }

    this.enemies.push(enemy);
  }

  private spawnBoss(name: string, hp: number, radius: number, color: string) {
    const boss: Enemy = {
      id: this.nextEnemyId++,
      x: this.width / 2,
      y: -50,
      hp,
      maxHp: hp,
      speed: 65,
      damage: 28,
      radius,
      color,
      glow: 'rgba(244, 63, 94, 0.8)',
      type: 'boss',
      xpValue: 80,
      shootCd: 1.0,
    };
    this.enemies.push(boss);
    this.activeBoss = boss;
    this.screenShake = 14;
    this.flashColor = '#f43f5e';
    this.flashAlpha = 0.4;
    this.callbacks.onBossAlert(name);
    gameAudio.playExplosion(true);
  }

  public damageEnemy(enemy: Enemy, amount: number) {
    if (amount <= 0) return;
    const isCrit = Math.random() < this.playerCritChance;
    const finalDmg = isCrit ? Math.round(amount * 2.0) : amount;

    enemy.hp -= finalDmg;
    this.totalDamageDealt += finalDmg;

    // Pop damage text
    this.damageNumbers.push({
      x: enemy.x + (Math.random() - 0.5) * 16,
      y: enemy.y - 10,
      text: isCrit ? `${finalDmg}!` : `${finalDmg}`,
      color: isCrit ? '#f59e0b' : '#ffffff',
      life: 0.6,
      maxLife: 0.6,
      isCrit,
    });

    if (isCrit) {
      this.screenShake = Math.min(10, this.screenShake + 1.2);
    }
  }

  private killEnemy(e: Enemy) {
    this.enemiesKilled++;
    this.spawnExplosion(e.x, e.y, e.color, e.type === 'boss' ? 36 : 14);

    if (e.type === 'boss') {
      gameAudio.playExplosion(true);
      this.screenShake = 18;
      this.activeBoss = null;
      // Drop huge gold & XP fountain
      for (let g = 0; g < 15; g++) {
        this.gems.push({
          id: Math.random(),
          x: e.x + (Math.random() - 0.5) * 60,
          y: e.y + (Math.random() - 0.5) * 60,
          value: 12,
          radius: 7,
          color: '#fbbf24',
          isCredit: true,
        });
      }
    } else {
      gameAudio.playExplosion(false);
      // Drop XP Nanite Gem
      const isCredit = Math.random() < 0.25;
      this.gems.push({
        id: Math.random(),
        x: e.x,
        y: e.y,
        value: e.xpValue,
        radius: isCredit ? 5 : 4,
        color: isCredit ? '#fbbf24' : '#00f0ff',
        isCredit,
      });
    }
  }

  private takeDamage(amount: number) {
    this.playerHp -= amount;
    this.screenShake = Math.min(12, this.screenShake + 3);
    this.flashColor = '#ef4444';
    this.flashAlpha = 0.3;
    gameAudio.playHit();

    if (this.playerHp <= 0) {
      this.playerHp = 0;
      this.callbacks.onHpChange(0, this.playerMaxHp);
      this.handleGameOver(false);
      return;
    }

    this.callbacks.onHpChange(Math.round(this.playerHp), this.playerMaxHp);
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;

      // Homing logic for micro seekers
      if (p.isHoming && this.enemies.length > 0) {
        let target = this.enemies[0];
        let minDist = 9999;
        this.enemies.forEach((e) => {
          const d = Math.hypot(e.x - p.x, e.y - p.y);
          if (d < minDist) {
            minDist = d;
            target = e;
          }
        });
        const angle = Math.atan2(target.y - p.y, target.x - p.x);
        p.vx = Math.cos(angle) * 380;
        p.vy = Math.sin(angle) * 380;
      }

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.life <= 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Collisions
      if (p.isPlayer) {
        for (const e of this.enemies) {
          if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
            this.damageEnemy(e, p.damage);
            this.spawnHitSparks(p.x, p.y, p.color);
            p.pierce--;
            if (p.pierce <= 0) {
              this.projectiles.splice(i, 1);
              break;
            }
          }
        }
      } else {
        // Enemy projectile hits player
        if (Math.hypot(this.playerX - p.x, this.playerY - p.y) < 14 + p.radius) {
          this.takeDamage(p.damage);
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  private updateGems(dt: number) {
    for (let i = this.gems.length - 1; i >= 0; i--) {
      const gem = this.gems[i];
      const dist = Math.hypot(this.playerX - gem.x, this.playerY - gem.y);

      // Vacuum suction
      if (dist < this.magnetRadius) {
        const angle = Math.atan2(this.playerY - gem.y, this.playerX - gem.x);
        const pullSpeed = 480 * (1 - dist / this.magnetRadius) + 120;
        gem.x += Math.cos(angle) * pullSpeed * dt;
        gem.y += Math.sin(angle) * pullSpeed * dt;
      }

      // Collect
      if (dist < 18) {
        if (gem.isCredit) {
          this.creditsEarned += gem.value;
        } else {
          this.addXp(gem.value);
        }
        gameAudio.playGem();
        this.gems.splice(i, 1);
      }
    }
  }

  private addXp(amount: number) {
    this.currentXp += amount;
    if (this.currentXp >= this.neededXp) {
      this.currentXp -= this.neededXp;
      this.level++;
      this.neededXp = Math.round(this.neededXp * 1.35 + 15);
      this.callbacks.onXpChange(this.currentXp, this.neededXp, this.level);
      this.triggerLevelUp();
    } else {
      this.callbacks.onXpChange(this.currentXp, this.neededXp, this.level);
    }
  }

  private triggerLevelUp() {
    this.pause();
    this.screenShake = 6;
    this.flashColor = '#00f0ff';
    this.flashAlpha = 0.4;
    gameAudio.playLevelUp();
    const choices = this.getAvailableUpgrades();
    this.callbacks.onLevelUp(choices);
  }

  private handleGameOver(victory: boolean) {
    this.stop();
    const stats: GameStats = {
      enemiesKilled: this.enemiesKilled,
      timeSurvived: Math.floor(this.timeSurvived),
      damageDealt: this.totalDamageDealt,
      creditsEarned: this.creditsEarned,
      levelReached: this.level,
    };
    this.callbacks.onGameOver(victory, stats);
  }

  // --- Effects & Particles ---

  private spawnHitSparks(x: number, y: number, color: string) {
    for (let i = 0; i < 5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0.25,
        maxLife: 0.25,
        radius: 2,
      });
    }
  }

  private spawnExplosion(x: number, y: number, color: string, count: number = 14) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        life: 0.4 + Math.random() * 0.3,
        maxLife: 0.6,
        radius: 2.5 + Math.random() * 2,
      });
    }
  }

  private spawnNovaRing(x: number, y: number, range: number, color: string) {
    for (let i = 0; i < 24; i++) {
      const angle = (Math.PI * 2 * i) / 24;
      this.particles.push({
        x: x + Math.cos(angle) * 10,
        y: y + Math.sin(angle) * 10,
        vx: Math.cos(angle) * 260,
        vy: Math.sin(angle) * 260,
        color,
        life: 0.35,
        maxLife: 0.35,
        radius: 3,
      });
    }
  }

  private updateEffects(dt: number) {
    // Damage numbers
    for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
      const d = this.damageNumbers[i];
      d.life -= dt;
      d.y -= 28 * dt;
      if (d.life <= 0) this.damageNumbers.splice(i, 1);
    }

    // Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.94;
      p.vy *= 0.94;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  // --- Rendering ---

  private render() {
    const ctx = this.ctx;
    ctx.save();

    // Screen Shake Offset
    if (this.screenShake > 0) {
      const ox = (Math.random() - 0.5) * this.screenShake;
      const oy = (Math.random() - 0.5) * this.screenShake;
      ctx.translate(ox, oy);
    }

    // Clear with Cyber Grid Background
    ctx.fillStyle = '#06070c';
    ctx.fillRect(0, 0, this.width, this.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    const offsetX = (this.playerX * 0.1) % gridSize;
    const offsetY = (this.playerY * 0.1) % gridSize;

    for (let x = -gridSize; x < this.width + gridSize; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x - offsetX, 0);
      ctx.lineTo(x - offsetX, this.height);
      ctx.stroke();
    }
    for (let y = -gridSize; y < this.height + gridSize; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y - offsetY);
      ctx.lineTo(this.width, y - offsetY);
      ctx.stroke();
    }

    // Cryo field render
    const cryo = this.weapons.get('cryo_field');
    if (cryo) {
      ctx.beginPath();
      ctx.arc(this.playerX, this.playerY, cryo.range, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 240, 255, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.2)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Render Gems
    this.gems.forEach((g) => {
      ctx.beginPath();
      ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fillStyle = g.color;
      ctx.shadowColor = g.color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Render Katana Blades Orbit
    const katana = this.weapons.get('neon_katana');
    if (katana) {
      for (let i = 0; i < katana.count; i++) {
        const angle = this.katanaAngle + (Math.PI * 2 * i) / katana.count;
        const bx = this.playerX + Math.cos(angle) * katana.range;
        const by = this.playerY + Math.sin(angle) * katana.range;

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(angle + Math.PI / 4);

        ctx.strokeStyle = '#00f0ff';
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 10;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(-12, 0);
        ctx.lineTo(12, 0);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Render Enemies
    this.enemies.forEach((e) => {
      ctx.save();
      ctx.translate(e.x, e.y);

      // Glow
      ctx.shadowColor = e.color;
      ctx.shadowBlur = e.type === 'boss' ? 20 : 8;

      ctx.beginPath();
      if (e.type === 'boss') {
        // Menacing hex boss shape
        const sides = 6;
        for (let i = 0; i < sides; i++) {
          const a = (Math.PI * 2 * i) / sides;
          const px = Math.cos(a) * e.radius;
          const py = Math.sin(a) * e.radius;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
      } else if (e.type === 'brute') {
        ctx.rect(-e.radius, -e.radius, e.radius * 2, e.radius * 2);
      } else {
        ctx.arc(0, 0, e.radius, 0, Math.PI * 2);
      }

      ctx.fillStyle = e.color;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Health bar for high HP enemies & Boss
      if (e.hp < e.maxHp || e.type === 'boss') {
        const barW = e.radius * 2 + 8;
        const hpPct = Math.max(0, e.hp / e.maxHp);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(-barW / 2, -e.radius - 8, barW, 4);
        ctx.fillStyle = e.type === 'boss' ? '#f43f5e' : '#22c55e';
        ctx.fillRect(-barW / 2, -e.radius - 8, barW * hpPct, 4);
      }

      ctx.restore();
    });

    // Render Projectiles
    this.projectiles.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Render Player
    ctx.save();
    ctx.translate(this.playerX, this.playerY);
    ctx.shadowColor = this.hero.color;
    ctx.shadowBlur = 14;

    // Player body
    ctx.beginPath();
    ctx.arc(0, 0, 13, 0, Math.PI * 2);
    ctx.fillStyle = this.hero.color;
    ctx.fill();

    // Inner core
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();

    // Render Particles
    this.particles.forEach((p) => {
      const alpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Render Floating Damage Numbers
    this.damageNumbers.forEach((d) => {
      ctx.save();
      const alpha = d.life / d.maxLife;
      ctx.globalAlpha = alpha;
      ctx.font = d.isCrit ? 'bold 15px "JetBrains Mono", monospace' : '11px "JetBrains Mono", monospace';
      ctx.fillStyle = d.color;
      ctx.shadowColor = d.color;
      ctx.shadowBlur = d.isCrit ? 8 : 0;
      ctx.fillText(d.text, d.x, d.y);
      ctx.restore();
    });

    // Chromatic / Screen Flash
    if (this.flashAlpha > 0 && this.flashColor) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  }
}
