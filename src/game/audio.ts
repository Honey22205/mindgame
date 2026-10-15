/**
 * Procedural Web Audio Engine for NEXUS: CYBER SURVIVOR
 * Delivers zero-asset, instant, punchy game audio:
 * - Laser shots, blade slashes, lightning arcs, explosions, powerups, level-ups
 * - Dynamic procedural synthwave / techno battle music rhythm
 */
class GameAudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicInterval: any = null;
  private musicStep: number = 0;
  private isMusicPlaying: boolean = false;

  private initContext(): AudioContext | null {
    if (this.isMuted) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.isMusicPlaying) {
      this.stopMusic();
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- Sound Effects ---

  public playLaser() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  public playSlash() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  public playLightning() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      // Noise + square wave burst
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.setValueAtTime(900, ctx.currentTime + 0.03);
      osc.frequency.setValueAtTime(300, ctx.currentTime + 0.07);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {}
  }

  public playExplosion(isBoss: boolean = false) {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const dur = isBoss ? 0.45 : 0.22;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isBoss ? 90 : 130, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + dur);
      gain.gain.setValueAtTime(isBoss ? 0.35 : 0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + dur);
    } catch {}
  }

  public playGem() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      const f = 900 + Math.random() * 400;
      osc.frequency.setValueAtTime(f, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  public playLevelUp() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880, 1108.73];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = ctx.currentTime + idx * 0.07;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.18);
      });
    } catch {}
  }

  public playHit() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  public playButtonClick() {
    const ctx = this.initContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }

  // --- Dynamic Procedural Synthwave Battle Track ---

  public startMusic() {
    if (this.isMusicPlaying || this.isMuted) return;
    this.isMusicPlaying = true;
    this.musicStep = 0;

    const bpm = 128;
    const intervalMs = (60 / bpm / 4) * 1000; // 16th notes

    // Bassline in D minor: D2, D2, F2, G2, A2, C3, Bb2, A2
    const bassline = [
      73.42, 73.42, 73.42, 87.31,
      73.42, 98.00, 73.42, 110.00,
      65.41, 65.41, 73.42, 87.31,
      58.27, 58.27, 65.41, 55.00
    ];

    this.musicInterval = setInterval(() => {
      if (!this.isMusicPlaying || this.isMuted) return;
      const ctx = this.initContext();
      if (!ctx) return;

      const step = this.musicStep % 16;
      this.musicStep++;

      // Kick drum on 0, 4, 8, 12
      if (step % 4 === 0) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.setValueAtTime(140, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(35, ctx.currentTime + 0.08);
          gain.gain.setValueAtTime(0.18, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.08);
        } catch {}
      }

      // Snare / Clap on 4, 12
      if (step === 4 || step === 12) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(220, ctx.currentTime);
          gain.gain.setValueAtTime(0.08, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.07);
        } catch {}
      }

      // Synth Bass note
      const bassFreq = bassline[step];
      if (bassFreq) {
        try {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(bassFreq, ctx.currentTime);
          gain.gain.setValueAtTime(0.04, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.09);
        } catch {}
      }
    }, intervalMs);
  }

  public stopMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const gameAudio = new GameAudioService();
