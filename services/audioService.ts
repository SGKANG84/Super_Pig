

class AudioService {
  private ctx: AudioContext | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private isMuted: boolean = false;
  private isPlaying: boolean = false;
  private tempo: number = 110;
  private nextNoteTime: number = 0;
  private noteIndex: number = 0;
  private timerID: number | undefined;
  private currentLevel: number = 1;

  // Funky bassline notes (A minor pentatonic-ish)
  private bassLine = [
    110.0, 0, 110.0, 130.81, 146.83, 0, 146.83, 130.81, // A2, C3, D3
    110.0, 0, 98.0, 0, 87.31, 0, 98.0, 103.83,          // A2, G2, F2, G2, G#2
    220.0, 0, 196.0, 0, 110.0, 110.0, 130.81, 146.83    // A3, G3, A2, A2, C3, D3
  ];

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    } catch (e) {
      console.error("Web Audio API not supported");
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Level BGM Update ---
  updateBGMForLevel(level: number) {
      this.currentLevel = level;

      // Dramatic Tempo Increase
      // Level 1: ~110 BPM (Groovy)
      // Level 5: ~138 BPM (Fast)
      // Level 10: ~173 BPM (Frantic)
      this.tempo = 110 + ((level - 1) * 7); 
      
      // Key Change Logic (Rising Tension)
      // Levels 1-3: A (110Hz base)
      // Levels 4-6: C (130.81Hz base) -> +3 semitones (Higher energy)
      // Levels 7-9: E (164.81Hz base) -> +7 semitones (Tense)
      // Level 10: F# (185.00Hz base) -> +9 semitones (Boss Battle)
      
      let semitoneShift = 0;
      if (level >= 4 && level <= 6) semitoneShift = 3;
      else if (level >= 7 && level <= 9) semitoneShift = 7;
      else if (level >= 10) semitoneShift = 9;

      const multiplier = Math.pow(2, semitoneShift / 12);
      
      // Base Patterns
      const sparsePattern = [
        110.0, 0, 110.0, 130.81, 146.83, 0, 146.83, 130.81, 
        110.0, 0, 98.0, 0, 87.31, 0, 98.0, 103.83,          
        220.0, 0, 196.0, 0, 110.0, 110.0, 130.81, 146.83    
      ];
      
      // Denser pattern for high intensity levels (fills the gaps)
      const densePattern = [
        110.0, 110.0, 110.0, 130.81, 146.83, 146.83, 146.83, 130.81, 
        110.0, 110.0, 98.0, 98.0, 87.31, 87.31, 98.0, 103.83,          
        220.0, 220.0, 196.0, 196.0, 110.0, 110.0, 130.81, 146.83 
      ];

      // Use denser pattern for levels 7+
      const template = level >= 7 ? densePattern : sparsePattern;

      this.bassLine = template.map(freq => freq * multiplier);
  }

  // --- Sound Effects ---

  playHit(type: 'brick' | 'paddle' | 'wall') {
    if (this.isMuted || !this.ctx) return;
    this.initCtx();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    if (type === 'brick') {
      // Funky "pop"
      osc.type = 'square';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.1);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'paddle') {
      // Springy sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(300, now + 0.1);
      osc.frequency.linearRampToValueAtTime(150, now + 0.2);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.linearRampToValueAtTime(0, now + 0.2);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      // Wall hit (Clave-like)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.start(now);
      osc.stop(now + 0.05);
    }
  }

  playPowerUp() {
    if (this.isMuted || !this.ctx) return;
    this.initCtx();
    const now = this.ctx.currentTime;
    
    // Arpeggio
    const frequencies = [440, 554.37, 659.25, 880]; // A Major
    frequencies.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        
        osc.type = 'square';
        osc.frequency.value = freq;
        
        const startTime = now + i * 0.05;
        gain.gain.setValueAtTime(0.05, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);
        
        osc.start(startTime);
        osc.stop(startTime + 0.1);
    });
  }

  playDogBark() {
    if (this.isMuted || !this.ctx) return;
    this.initCtx();
    const now = this.ctx.currentTime;
    
    // Noise for texture
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noise.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    // Tone for body
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    // Bark Logic: Pitch drops quickly, mix of tone and noise
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noiseGain.gain.setValueAtTime(0.4, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.start(now);
    osc.stop(now + 0.15);
    noise.start(now);
    noise.stop(now + 0.15);
  }

  playLoseLife() {
     if (this.isMuted || !this.ctx) return;
    this.initCtx();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.linearRampToValueAtTime(50, now + 0.5);
    
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
  }

  playGameOverStinger() {
    if (this.isMuted || !this.ctx) return;
    this.initCtx();
    this.stopBGM(); // Stop music immediately
    
    const now = this.ctx.currentTime;
    
    // Sad descending tones
    const notes = [392.00, 369.99, 349.23, 329.63]; // G, F#, F, E
    notes.forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.connect(gain);
        gain.connect(this.ctx!.destination);
        
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        const startTime = now + i * 0.4;
        gain.gain.setValueAtTime(0.2, startTime);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.4);
        
        osc.start(startTime);
        osc.stop(startTime + 0.4);
    });
    
    // Final low boom/thud
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(100, now + 1.6);
    osc.frequency.exponentialRampToValueAtTime(30, now + 2.5);
    
    gain.gain.setValueAtTime(0.3, now + 1.6);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
    
    osc.start(now + 1.6);
    osc.stop(now + 2.5);
  }

  // --- BGM Sequencer ---

  private scheduleNote(frequency: number, time: number) {
    if (this.isMuted || !this.ctx) return;
    if (frequency === 0) return; // Rest

    // Main Oscillator
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    // Waveform Texture based on Level intensity
    if (this.currentLevel < 4) {
        osc.type = 'square'; // Classic 8-bit funk (Levels 1-3)
    } else if (this.currentLevel < 7) {
        osc.type = 'sawtooth'; // Sharper, edgier (Levels 4-6)
    } else {
        osc.type = 'sawtooth'; // Aggressive (Levels 7+)
    }
    
    osc.frequency.value = frequency;
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    // Slap bass envelope
    gain.gain.setValueAtTime(0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.15); 

    // Filter effect (Wah)
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    
    // Increase resonance (Q) dramatically at higher levels
    const qValue = 1 + (this.currentLevel * 0.8);
    filter.Q.value = Math.min(qValue, 15);

    // Filter frequency sweep
    const baseFreq = 200 + (this.currentLevel * 30);
    const peakFreq = 2000 + (this.currentLevel * 200);

    filter.frequency.setValueAtTime(baseFreq, time);
    filter.frequency.exponentialRampToValueAtTime(peakFreq, time + 0.05);
    filter.frequency.exponentialRampToValueAtTime(baseFreq, time + 0.15);
    
    // Re-route through filter
    osc.disconnect();
    osc.connect(filter);
    filter.connect(gain);

    // Add Sub-Bass for Levels 7+ (The "Epic" feel)
    if (this.currentLevel >= 7) {
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.value = frequency / 2; // Octave down
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        
        subGain.gain.setValueAtTime(0.12, time);
        subGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        
        subOsc.start(time);
        subOsc.stop(time + 0.2);
    }

    osc.start(time);
    osc.stop(time + 0.2);
  }

  private nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    const noteRate = 0.5; // Eighth notes
    this.nextNoteTime += noteRate * secondsPerBeat;
    this.noteIndex = (this.noteIndex + 1) % this.bassLine.length;
  }

  private scheduler() {
    if (!this.isPlaying || !this.ctx) return;
    
    // Schedule ahead
    while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
      this.scheduleNote(this.bassLine[this.noteIndex], this.nextNoteTime);
      this.nextNote();
    }
    
    this.timerID = window.setTimeout(() => this.scheduler(), 25);
  }

  startBGM() {
    if (this.isPlaying) return;
    this.initCtx();
    if (!this.ctx) return;

    this.isPlaying = true;
    this.noteIndex = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.scheduler();
  }

  stopBGM() {
    this.isPlaying = false;
    if (this.timerID) clearTimeout(this.timerID);
  }
}

export const audioService = new AudioService();
