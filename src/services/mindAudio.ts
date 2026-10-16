/**
 * High-Fidelity Procedural Audio & Music Engine for NEXUS: MindGym
 * 
 * Features:
 * 1. 🎧 Lo-Fi Study Chill Beats ("Gana" / Smooth 76 BPM jazz chords, sub-bass, kick-snare groove, pentatonic lead)
 * 2. 🎹 Peaceful Piano & Strings (Acoustic piano arpeggio progression with warm cello strings)
 * 3. 🌊 Deep Ocean Waves (Dual-filter surf swell, breaking tide froth, resonant ocean roar)
 * 4. 🔥 Cozy Campfire & Embers (Warm fireplace bed with crisp randomized timber crackles & pops)
 * 5. 🌧️ Monsoon Rain & Thunder (Gentle rain wash on glass with resonant drops and distant thunder)
 * 6. 🧘 Zen Tibetan Bowls (432Hz meditative healing drone with shimmering harmonics & bowl strikes)
 * 7. Crisp haptics and UI tactile chimes
 */

export type AmbientSoundType = 'lofi' | 'piano' | 'waves' | 'fire' | 'rain' | 'zen';

export interface AmbientTrackInfo {
  id: AmbientSoundType;
  title: string;
  subtitle: string;
  category: 'music' | 'nature' | 'mind';
  icon: string;
  description: string;
}

export const AMBIENT_TRACKS: AmbientTrackInfo[] = [
  {
    id: 'lofi',
    title: 'Lo-Fi Study Beats',
    subtitle: '76 BPM Chillhop & Jazz Keys',
    category: 'music',
    icon: 'music',
    description: 'Warm electric piano Rhodes chords, booming sub-bass, and groovy boom-bap rhythm.',
  },
  {
    id: 'piano',
    title: 'Peaceful Piano & Strings',
    subtitle: 'Acoustic Calm Instrumental',
    category: 'music',
    icon: 'piano',
    description: 'Gentle piano arpeggio progressions paired with warm ambient string pads.',
  },
  {
    id: 'waves',
    title: 'Deep Ocean Waves',
    subtitle: 'Rhythmic Coastal Swell & Tide',
    category: 'nature',
    icon: 'waves',
    description: 'Resonant low-end ocean surge, cresting white water, and soothing receding foam.',
  },
  {
    id: 'fire',
    title: 'Cozy Campfire & Embers',
    subtitle: 'Warm Hearth & Wood Crackles',
    category: 'nature',
    icon: 'flame',
    description: 'Deep ember warmth and frequent realistic randomized wood snaps and pops.',
  },
  {
    id: 'rain',
    title: 'Monsoon Rain & Thunder',
    subtitle: 'Soft Patter & Distant Rumblings',
    category: 'nature',
    icon: 'cloud-rain',
    description: 'Continuous raindrops on window pane with atmospheric distant thunder rumbles.',
  },
  {
    id: 'zen',
    title: 'Zen Tibetan Bowls',
    subtitle: '432Hz Meditative Healing Drone',
    category: 'mind',
    icon: 'sparkles',
    description: 'Harmonic singing bowl resonance with shimmering bell overtones.',
  },
];

type AudioListener = () => void;

class MindAudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.75; // 0.0 - 1.0 (Audible & rich default)

  // Master ambient control
  private masterAmbientGain: GainNode | null = null;
  private currentAmbientType: AmbientSoundType | null = null;
  private activeIntervals: number[] = [];
  private activeNodes: AudioNode[] = [];
  private listeners: Set<AudioListener> = new Set();

  constructor() {
    // Audio context will be initialized/unlocked upon first interaction
  }

  public subscribe(listener: AudioListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((cb) => {
      try {
        cb();
      } catch {}
    });
  }

  /**
   * Explicitly unlock and resume the Web Audio Context from any user gesture.
   */
  public async unlockAudio(): Promise<AudioContext | null> {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private ensureContext(): AudioContext | null {
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
    if (muted) {
      this.stopAmbient();
    }
    this.notify();
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterAmbientGain && this.ctx) {
      this.masterAmbientGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }
    this.notify();
  }

  public getVolume(): number {
    return this.volume;
  }

  public isPlaying(): boolean {
    return this.currentAmbientType !== null;
  }

  public getCurrentAmbient(): AmbientSoundType | null {
    return this.currentAmbientType;
  }

  public toggleAmbient(type: AmbientSoundType = 'lofi') {
    if (this.currentAmbientType === type) {
      this.stopAmbient();
    } else {
      this.playAmbient(type);
    }
  }

  // --- UI Sound Effects ---

  public playTap() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(750, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(380, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  public playCorrect(combo: number = 1) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const pitches = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      const pitchIndex = Math.min(pitches.length - 1, Math.max(0, combo - 1));
      const freq = pitches[pitchIndex];

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.24, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }

  public playWrong() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {}
  }

  public playComplete() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        const start = ctx.currentTime + idx * 0.09;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
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

  // --- Procedural Focus Music & Ambient Soundscapes ---

  public async playAmbient(type: AmbientSoundType) {
    if (this.currentAmbientType === type && this.masterAmbientGain) return;
    this.stopAmbient();
    if (this.isMuted) return;

    const ctx = await this.unlockAudio();
    if (!ctx) return;

    this.currentAmbientType = type;

    // Master ambient gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
    masterGain.connect(ctx.destination);
    this.masterAmbientGain = masterGain;

    if (type === 'lofi') {
      this.startLofiBeats(ctx, masterGain);
    } else if (type === 'piano') {
      this.startPeacefulPiano(ctx, masterGain);
    } else if (type === 'rain') {
      this.startRainSound(ctx, masterGain);
    } else if (type === 'fire') {
      this.startFireSound(ctx, masterGain);
    } else if (type === 'waves') {
      this.startOceanWaves(ctx, masterGain);
    } else if (type === 'zen') {
      this.startZenBowls(ctx, masterGain);
    }

    this.notify();
  }

  public stopAmbient() {
    this.activeIntervals.forEach((id) => clearInterval(id));
    this.activeIntervals = [];

    this.activeNodes.forEach((node) => {
      try {
        (node as any).stop?.();
        node.disconnect();
      } catch {}
    });
    this.activeNodes = [];

    if (this.masterAmbientGain) {
      try {
        this.masterAmbientGain.disconnect();
      } catch {}
      this.masterAmbientGain = null;
    }

    this.currentAmbientType = null;
    this.notify();
  }

  // 1. 🎵 LO-FI STUDY BEATS (Gana / Catchy Rhodes Chords, Bassline & Drums)
  private startLofiBeats(ctx: AudioContext, dest: AudioNode) {
    // Jazz Chords Progression: Dm9 -> G13 -> Cmaj9 -> Am7
    const chords = [
      {
        notes: [146.83, 220.00, 261.63, 329.63, 392.00], // Dm9: D3, A3, C4, E4, G4
        root: 73.42, // D2 bass
      },
      {
        notes: [196.00, 246.94, 293.66, 329.63, 349.23], // G13: G3, B3, D4, E4, F4
        root: 98.00, // G2 bass
      },
      {
        notes: [130.81, 196.00, 246.94, 261.63, 329.63], // Cmaj9: C3, G3, B3, C4, E4
        root: 65.41, // C2 bass
      },
      {
        notes: [110.00, 164.81, 220.00, 261.63, 329.63], // Am7: A2, E3, A3, C4, E4
        root: 55.00, // A1 bass
      },
    ];

    // Catchy relaxing melody notes in pentatonic scale
    const melodyPhrases = [
      [392.00, 440.00, 523.25, 659.25], // G4, A4, C5, E5
      [587.33, 523.25, 440.00, 392.00], // D5, C5, A4, G4
      [659.25, 783.99, 659.25, 523.25], // E5, G5, E5, C5
      [440.00, 392.00, 329.63, 392.00], // A4, G4, E4, G4
    ];

    let chordIdx = 0;
    let step = 0;
    const bpm = 76;
    const stepDuration = (60 / bpm / 2) * 1000; // 8th note duration ~394ms

    // Subtle vinyl warmth texture
    const vinyl = this.createNoiseBuffer(ctx, 3.0, true);
    const vinylFilter = ctx.createBiquadFilter();
    const vinylGain = ctx.createGain();
    vinylFilter.type = 'bandpass';
    vinylFilter.frequency.setValueAtTime(2200, ctx.currentTime);
    vinylFilter.Q.setValueAtTime(1.0, ctx.currentTime);
    vinylGain.gain.setValueAtTime(0.04, ctx.currentTime);
    vinyl.connect(vinylFilter);
    vinylFilter.connect(vinylGain);
    vinylGain.connect(dest);
    vinyl.start();
    this.activeNodes.push(vinyl, vinylFilter, vinylGain);

    const interval = window.setInterval(() => {
      if (!this.masterAmbientGain) return;
      const now = ctx.currentTime;
      const currentBeat = step % 8;

      // 1. Play Chord every 8 steps (once every 4 beats)
      if (currentBeat === 0) {
        const chord = chords[chordIdx % chords.length];
        const melody = melodyPhrases[chordIdx % melodyPhrases.length];
        chordIdx++;

        // Warm Rhodes Chords
        chord.notes.forEach((freq) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc1.type = 'triangle';
          osc1.frequency.setValueAtTime(freq, now);

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(freq * 1.002, now); // slight chorus detune

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(800, now);
          filter.frequency.exponentialRampToValueAtTime(500, now + 2.8);

          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

          osc1.connect(filter);
          osc2.connect(filter);
          filter.connect(gain);
          gain.connect(dest);

          osc1.start(now);
          osc2.start(now);
          osc1.stop(now + 3.0);
          osc2.stop(now + 3.0);
        });

        // Warm 808 Sub Bassline
        const bassOsc = ctx.createOscillator();
        const bassGain = ctx.createGain();
        bassOsc.type = 'sine';
        bassOsc.frequency.setValueAtTime(chord.root, now);
        bassGain.gain.setValueAtTime(0.28, now);
        bassGain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
        bassOsc.connect(bassGain);
        bassGain.connect(dest);
        bassOsc.start(now);
        bassOsc.stop(now + 2.6);
      }

      // 2. Play Melodic Lead note on beats 1, 3, 5, 7
      if (currentBeat % 2 === 1 && Math.random() < 0.85) {
        const chord = chords[chordIdx % chords.length];
        const noteIndex = Math.floor(Math.random() * chord.notes.length);
        const melodyFreq = chord.notes[noteIndex] * 2; // an octave higher

        const mOsc = ctx.createOscillator();
        const mGain = ctx.createGain();
        const mFilter = ctx.createBiquadFilter();

        mOsc.type = 'sine';
        mOsc.frequency.setValueAtTime(melodyFreq, now);

        mFilter.type = 'lowpass';
        mFilter.frequency.setValueAtTime(1400, now);

        mGain.gain.setValueAtTime(0.12, now);
        mGain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

        mOsc.connect(mFilter);
        mFilter.connect(mGain);
        mGain.connect(dest);

        mOsc.start(now);
        mOsc.stop(now + 0.65);
      }

      // 3. Kick Drum on 0 and 4 (beat 1 and 3)
      if (currentBeat === 0 || currentBeat === 4) {
        const kickOsc = ctx.createOscillator();
        const kickGain = ctx.createGain();
        kickOsc.frequency.setValueAtTime(130, now);
        kickOsc.frequency.exponentialRampToValueAtTime(42, now + 0.15);
        kickGain.gain.setValueAtTime(0.42, now);
        kickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        kickOsc.connect(kickGain);
        kickGain.connect(dest);
        kickOsc.start(now);
        kickOsc.stop(now + 0.15);
      }

      // 4. Snappy Lo-Fi Rimshot / Snare on 2 and 6 (beat 2 and 4)
      if (currentBeat === 2 || currentBeat === 6) {
        const snareNoise = this.createNoiseBuffer(ctx, 0.1);
        const snareGain = ctx.createGain();
        const snareFilter = ctx.createBiquadFilter();
        const toneOsc = ctx.createOscillator();
        const toneGain = ctx.createGain();

        snareFilter.type = 'bandpass';
        snareFilter.frequency.setValueAtTime(1350, now);
        snareFilter.Q.setValueAtTime(1.2, now);

        snareGain.gain.setValueAtTime(0.26, now);
        snareGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        toneOsc.frequency.setValueAtTime(190, now);
        toneGain.gain.setValueAtTime(0.15, now);
        toneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        snareNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(dest);

        toneOsc.connect(toneGain);
        toneGain.connect(dest);

        snareNoise.start(now);
        toneOsc.start(now);
        toneOsc.stop(now + 0.08);
      }

      // 5. Crisp Hi-hat on every 8th note
      const hatNoise = this.createNoiseBuffer(ctx, 0.04);
      const hatGain = ctx.createGain();
      const hatFilter = ctx.createBiquadFilter();
      hatFilter.type = 'highpass';
      hatFilter.frequency.setValueAtTime(6500, now);
      const hatVelocity = currentBeat % 2 === 0 ? 0.09 : 0.05;
      hatGain.gain.setValueAtTime(hatVelocity, now);
      hatGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      hatNoise.connect(hatFilter);
      hatFilter.connect(hatGain);
      hatGain.connect(dest);
      hatNoise.start(now);

      step++;
    }, stepDuration);

    this.activeIntervals.push(interval);
  }

  // 2. 🎹 PEACEFUL PIANO & STRINGS (Gana / Soothing Acoustic Melody)
  private startPeacefulPiano(ctx: AudioContext, dest: AudioNode) {
    const chords = [
      // Cmaj7
      { root: 130.81, arps: [261.63, 329.63, 392.00, 493.88, 523.25] },
      // Am9
      { root: 110.00, arps: [220.00, 261.63, 329.63, 392.00, 440.00] },
      // Fmaj7
      { root: 87.31,  arps: [174.61, 261.63, 329.63, 349.23, 440.00] },
      // Gsus4 -> G
      { root: 98.00,  arps: [196.00, 293.66, 392.00, 440.00, 493.88] },
    ];

    let chordIdx = 0;
    let step = 0;

    const interval = window.setInterval(() => {
      if (!this.masterAmbientGain) return;
      const now = ctx.currentTime;
      const currentChord = chords[chordIdx % chords.length];

      // Play string pad & bass on chord change (every 8 steps)
      if (step % 8 === 0) {
        chordIdx++;

        // Warm Cello/String Pad
        const padOsc = ctx.createOscillator();
        const padGain = ctx.createGain();
        const padFilter = ctx.createBiquadFilter();

        padOsc.type = 'sawtooth';
        padOsc.frequency.setValueAtTime(currentChord.root, now);

        padFilter.type = 'lowpass';
        padFilter.frequency.setValueAtTime(450, now);

        padGain.gain.setValueAtTime(0.01, now);
        padGain.gain.linearRampToValueAtTime(0.18, now + 1.2);
        padGain.gain.linearRampToValueAtTime(0.01, now + 3.8);

        padOsc.connect(padFilter);
        padFilter.connect(padGain);
        padGain.connect(dest);

        padOsc.start(now);
        padOsc.stop(now + 3.8);
      }

      // Arpeggiated Piano Note
      const arpNote = currentChord.arps[step % currentChord.arps.length];
      const pOsc1 = ctx.createOscillator();
      const pOsc2 = ctx.createOscillator();
      const pGain = ctx.createGain();

      pOsc1.type = 'triangle';
      pOsc1.frequency.setValueAtTime(arpNote, now);
      pOsc2.type = 'sine';
      pOsc2.frequency.setValueAtTime(arpNote * 2, now); // harmonic shine

      pGain.gain.setValueAtTime(0.18, now);
      pGain.gain.exponentialRampToValueAtTime(0.001, now + 1.4);

      pOsc1.connect(pGain);
      pOsc2.connect(pGain);
      pGain.connect(dest);

      pOsc1.start(now);
      pOsc2.start(now);
      pOsc1.stop(now + 1.4);
      pOsc2.stop(now + 1.4);

      step++;
    }, 480);

    this.activeIntervals.push(interval);
  }

  // 3. 🌊 DEEP OCEAN WAVES (Rhythmic Swell, Crest & Foam)
  private startOceanWaves(ctx: AudioContext, dest: AudioNode) {
    // Continuous pink & brown noise source
    const waveSource = this.createNoiseBuffer(ctx, 4.0, true);
    const filterLow = ctx.createBiquadFilter();
    const filterHigh = ctx.createBiquadFilter();
    const waveGain = ctx.createGain();

    // Deep ocean filter
    filterLow.type = 'lowpass';
    filterLow.frequency.setValueAtTime(400, ctx.currentTime);
    filterLow.Q.setValueAtTime(2.2, ctx.currentTime);

    // Highpass foam filter
    filterHigh.type = 'highpass';
    filterHigh.frequency.setValueAtTime(180, ctx.currentTime);

    waveGain.gain.setValueAtTime(0.45, ctx.currentTime);

    waveSource.connect(filterHigh);
    filterHigh.connect(filterLow);
    filterLow.connect(waveGain);
    waveGain.connect(dest);
    waveSource.start();

    this.activeNodes.push(waveSource, filterHigh, filterLow, waveGain);

    // LFO modulation: swell in and out like a natural ocean wave (period ~5.5s)
    let phase = 0;
    const interval = window.setInterval(() => {
      if (!this.masterAmbientGain) return;
      const now = ctx.currentTime;
      phase += 0.08;

      // Smooth wave envelope (asymmetric tide: slow build, quick crash, long retreat)
      const rawSine = Math.sin(phase);
      const swell = Math.pow((rawSine + 1) / 2, 1.6); // 0 to 1

      // Frequency sweeps from deep 280Hz up to 1400Hz at peak crash
      filterLow.frequency.setValueAtTime(280 + swell * 1150, now);
      
      // Volume rises to full body and drops to gentle background
      waveGain.gain.setValueAtTime(0.18 + swell * 0.55, now);
    }, 80);

    this.activeIntervals.push(interval);
  }

  // 4. 🔥 COZY CAMPFIRE & EMBERS (Warm Hearth + Crisp Wood Crackles)
  private startFireSound(ctx: AudioContext, dest: AudioNode) {
    // Warm low-end fireplace bed
    const fireBed = this.createNoiseBuffer(ctx, 3.0, true);
    const fireFilter = ctx.createBiquadFilter();
    const fireGain = ctx.createGain();

    fireFilter.type = 'bandpass';
    fireFilter.frequency.setValueAtTime(550, ctx.currentTime);
    fireFilter.Q.setValueAtTime(1.2, ctx.currentTime);
    fireGain.gain.setValueAtTime(0.38, ctx.currentTime);

    fireBed.connect(fireFilter);
    fireFilter.connect(fireGain);
    fireGain.connect(dest);
    fireBed.start();

    this.activeNodes.push(fireBed, fireFilter, fireGain);

    // Realistic wood pops, snaps and crackles
    const interval = window.setInterval(() => {
      if (!this.masterAmbientGain) return;
      const popCount = 1 + Math.floor(Math.random() * 3);

      for (let i = 0; i < popCount; i++) {
        const delay = Math.random() * 0.12;
        const now = ctx.currentTime + delay;

        // Wood snap oscillator & noise pulse
        const popOsc = ctx.createOscillator();
        const popGain = ctx.createGain();
        const popFilter = ctx.createBiquadFilter();

        popOsc.type = 'triangle';
        popOsc.frequency.setValueAtTime(1200 + Math.random() * 2200, now);
        popOsc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

        popFilter.type = 'bandpass';
        popFilter.frequency.setValueAtTime(1600 + Math.random() * 1400, now);
        popFilter.Q.setValueAtTime(2.0, now);

        popGain.gain.setValueAtTime(0.28 + Math.random() * 0.22, now);
        popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

        popOsc.connect(popFilter);
        popFilter.connect(popGain);
        popGain.connect(dest);

        popOsc.start(now);
        popOsc.stop(now + 0.03);
      }
    }, 180);

    this.activeIntervals.push(interval);
  }

  // 5. 🌧️ MONSOON RAIN & THUNDER (Pattering Rain + Distant Thunder Rolls)
  private startRainSound(ctx: AudioContext, dest: AudioNode) {
    // Continuous rain bed (rich filtered noise)
    const rainSource = this.createNoiseBuffer(ctx, 3.0, true);
    const rainFilter = ctx.createBiquadFilter();
    const rainGain = ctx.createGain();

    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(2200, ctx.currentTime);
    rainGain.gain.setValueAtTime(0.42, ctx.currentTime);

    rainSource.connect(rainFilter);
    rainFilter.connect(rainGain);
    rainGain.connect(dest);
    rainSource.start();

    this.activeNodes.push(rainSource, rainFilter, rainGain);

    // Random raindrops and occasional distant thunder
    const interval = window.setInterval(() => {
      if (!this.masterAmbientGain) return;
      const now = ctx.currentTime;

      // Realistic raindrop impact (plink)
      const dropOsc = ctx.createOscillator();
      const dropGain = ctx.createGain();
      dropOsc.type = 'sine';
      dropOsc.frequency.setValueAtTime(1400 + Math.random() * 900, now);
      dropOsc.frequency.exponentialRampToValueAtTime(350, now + 0.05);
      dropGain.gain.setValueAtTime(0.08, now);
      dropGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      dropOsc.connect(dropGain);
      dropGain.connect(dest);
      dropOsc.start(now);
      dropOsc.stop(now + 0.05);

      // Distant rolling thunder (15% chance per interval)
      if (Math.random() < 0.15) {
        const thunOsc = ctx.createOscillator();
        const thunGain = ctx.createGain();
        thunOsc.type = 'triangle';
        thunOsc.frequency.setValueAtTime(58, now);
        thunOsc.frequency.exponentialRampToValueAtTime(24, now + 3.0);
        thunGain.gain.setValueAtTime(0.35, now);
        thunGain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);
        thunOsc.connect(thunGain);
        thunGain.connect(dest);
        thunOsc.start(now);
        thunOsc.stop(now + 3.0);
      }
    }, 320);

    this.activeIntervals.push(interval);
  }

  // 6. 🧘 ZEN TIBETAN BOWLS (432Hz Drone & Shimmering Harmonics)
  private startZenBowls(ctx: AudioContext, dest: AudioNode) {
    const freqs = [432, 864, 1296, 1728];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      const amp = idx === 0 ? 0.35 : idx === 1 ? 0.14 : idx === 2 ? 0.07 : 0.03;
      gain.gain.setValueAtTime(amp, ctx.currentTime);

      osc.connect(gain);
      gain.connect(dest);
      osc.start();

      this.activeNodes.push(osc, gain);
    });

    // Slow meditative breathing modulation & periodic bowl bell strikes
    let phase = 0;
    const interval = window.setInterval(() => {
      if (!this.masterAmbientGain) return;
      const now = ctx.currentTime;
      phase += 0.06;
      const pulse = 0.85 + Math.sin(phase) * 0.15;
      if (this.masterAmbientGain) {
        this.masterAmbientGain.gain.setValueAtTime(this.volume * pulse, now);
      }

      // Sing bowl strike every ~8 seconds
      if (Math.random() < 0.08) {
        const strikeOsc = ctx.createOscillator();
        const strikeGain = ctx.createGain();
        strikeOsc.type = 'sine';
        strikeOsc.frequency.setValueAtTime(432 * 2, now);
        strikeGain.gain.setValueAtTime(0.25, now);
        strikeGain.gain.exponentialRampToValueAtTime(0.001, now + 4.5);
        strikeOsc.connect(strikeGain);
        strikeGain.connect(dest);
        strikeOsc.start(now);
        strikeOsc.stop(now + 4.5);
      }
    }, 100);

    this.activeIntervals.push(interval);
  }

  private createNoiseBuffer(ctx: AudioContext, seconds: number, loop: boolean = false): AudioBufferSourceNode {
    const bufferSize = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = loop;
    return source;
  }
}

export const mindAudio = new MindAudioService();
