import { gameAudio } from './audio';

export interface SlicerTarget {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  isBomb: boolean;
  points: number;
  sliced: boolean;
}

export interface SlicerTrailPoint {
  x: number;
  y: number;
  time: number;
}

export class SlicerEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animId: number | null = null;
  private lastTime: number = 0;

  public isRunning: boolean = false;
  public score: number = 0;
  public combo: number = 0;
  public lives: number = 3;
  public onGameOver: (score: number) => void;
  public onScoreChange: (score: number, combo: number, lives: number) => void;

  private targets: SlicerTarget[] = [];
  private trail: SlicerTrailPoint[] = [];
  private spawnTimer: number = 0;
  private nextId: number = 1;

  constructor(
    canvas: HTMLCanvasElement,
    onScoreChange: (score: number, combo: number, lives: number) => void,
    onGameOver: (score: number) => void
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.onScoreChange = onScoreChange;
    this.onGameOver = onGameOver;
  }

  public start() {
    this.isRunning = true;
    this.score = 0;
    this.combo = 0;
    this.lives = 3;
    this.targets = [];
    this.trail = [];
    this.lastTime = performance.now();
    this.onScoreChange(this.score, this.combo, this.lives);
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    if (this.animId) cancelAnimationFrame(this.animId);
  }

  public addTrailPoint(x: number, y: number) {
    if (!this.isRunning) return;
    this.trail.push({ x, y, time: performance.now() });

    // Check line segment intersection with targets
    if (this.trail.length >= 2) {
      const p1 = this.trail[this.trail.length - 2];
      const p2 = this.trail[this.trail.length - 1];

      let slicedThisStroke = 0;
      this.targets.forEach((t) => {
        if (!t.sliced && this.distToSegment(t.x, t.y, p1.x, p1.y, p2.x, p2.y) <= t.radius) {
          t.sliced = true;
          if (t.isBomb) {
            this.lives--;
            gameAudio.playExplosion(true);
            this.combo = 0;
            if (this.lives <= 0) {
              this.stop();
              this.onGameOver(this.score);
              return;
            }
          } else {
            slicedThisStroke++;
            this.score += t.points * Math.max(1, this.combo);
            gameAudio.playSlash();
          }
        }
      });

      if (slicedThisStroke > 1) {
        this.combo += slicedThisStroke;
        gameAudio.playGem();
      }

      this.onScoreChange(this.score, this.combo, this.lives);
    }
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }

  private loop = (time: number) => {
    if (!this.isRunning) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    this.update(dt);
    this.render();

    this.animId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    // Spawn targets
    this.spawnTimer += dt;
    if (this.spawnTimer >= 0.8) {
      this.spawnTimer = 0;
      this.spawnTargets();
    }

    // Clean old trail points
    const now = performance.now();
    this.trail = this.trail.filter((p) => now - p.time < 160);

    // Update targets
    const gravity = 480;
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.x += t.vx * dt;
      t.y += t.vy * dt;
      t.vy += gravity * dt;

      // Drop off screen
      if (t.y > this.canvas.height + 60) {
        if (!t.sliced && !t.isBomb) {
          this.combo = 0;
          this.onScoreChange(this.score, this.combo, this.lives);
        }
        this.targets.splice(i, 1);
      }
    }
  }

  private spawnTargets() {
    const count = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const x = 60 + Math.random() * (this.canvas.width - 120);
      const y = this.canvas.height + 20;
      const vx = (Math.random() - 0.5) * 160;
      const vy = -480 - Math.random() * 160;
      const isBomb = Math.random() < 0.2;

      this.targets.push({
        id: this.nextId++,
        x, y, vx, vy,
        radius: isBomb ? 20 : 24,
        color: isBomb ? '#ef4444' : ['#00f0ff', '#a855f7', '#10b981', '#f59e0b'][Math.floor(Math.random() * 4)],
        isBomb,
        points: isBomb ? 0 : 50,
        sliced: false,
      });
    }
  }

  private render() {
    const ctx = this.ctx;
    ctx.fillStyle = '#06070e';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Targets
    this.targets.forEach((t) => {
      ctx.save();
      ctx.translate(t.x, t.y);

      if (t.sliced) {
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.beginPath();
        ctx.arc(-8, 0, t.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(8, 0, t.radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.shadowColor = t.color;
        ctx.shadowBlur = 12;
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, t.radius * 0.35, 0, Math.PI * 2);
        ctx.fill();

        if (t.isBomb) {
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('💣', -8, 4);
        }
      }
      ctx.restore();
    });

    // Slicing Laser Trail
    if (this.trail.length >= 2) {
      ctx.save();
      ctx.strokeStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 15;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.stroke();

      // Core white laser beam
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();
    }
  }
}
