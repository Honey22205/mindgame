/**
 * Audio Engine for NEXUS: MindGym
 * Procedural Web Audio API sound effects & ambient soundscape generators:
 * - Crisp wooden tap clicks
 * - Ascending marimba & chime chords for correct answers & combos
 * - Soft error thuds
 * - Procedural ambient noise generators: Gentle Rain, Crackling Campfire, Ocean Waves
 */
class MindAudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private ambientSource: AudioNode | null = null;
  private ambientGain: GainNode | null = null;
  private currentAmbientType: string | null = null;

  private getContext(): AudioContext | null {
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

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stopAmbient();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // --- UI & Interaction Sounds ---

  public playTap() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.03);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  }

  public playCorrect(combo: number = 1) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      // Scale pitch with combo for extreme satisfaction (Pentatonic scale: C5, D5, E5, G5, A5, C6)
      const pitches = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      const pitchIndex = Math.min(pitches.length - 1, Math.max(0, combo - 1));
      const freq = pitches[pitchIndex];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.09, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch {}
  }

  public playWrong() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }

  public playComplete() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.08;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.1, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    } catch {}
  }

  public triggerHaptic(type: 'light' | 'medium' | 'success' = 'light') {
    try {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'light') navigator.vibrate(10);
        else if (type === 'medium') navigator.vibrate(25);
        else if (type === 'success') navigator.vibrate([15, 30, 20]);
      }
    } catch {}
  }

  // --- Procedural Ambient Soundscapes for Focus Timer ---

  public playAmbient(type: 'rain' | 'fire' | 'waves') {
    if (this.currentAmbientType === type) return;
    this.stopAmbient();
    if (this.isMuted) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      this.currentAmbientType = type;
      // White/pink noise buffer
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0.0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink noise filter approximation
        lastOut = (lastOut + 0.02 * white) / 1.02;
        data[i] = lastOut * 3.5;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Filter based on ambient type
      const filter = ctx.createBiquadFilter();
      if (type === 'rain') {
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, ctx.currentTime);
      } else if (type === 'fire') {
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, ctx.currentTime);
      } else {
        // waves
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(600, ctx.currentTime);
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      this.ambientSource = noise;
      this.ambientGain = gain;
    } catch {}
  }

  public stopAmbient() {
    try {
      if (this.ambientSource) {
        (this.ambientSource as any).stop?.();
        this.ambientSource.disconnect();
        this.ambientSource = null;
      }
      this.currentAmbientType = null;
    } catch {}
  }

  public getCurrentAmbient(): string | null {
    return this.currentAmbientType;
  }
}

export const mindAudio = new MindAudioService();
