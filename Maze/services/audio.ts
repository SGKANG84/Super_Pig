class AudioService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  
  // BGM Sequencer State
  private isPlaying: boolean = false;
  private timerID: number | null = null;
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  
  // Sequencer Config
  private readonly tempo = 110;
  private readonly lookahead = 25.0; // ms
  private readonly scheduleAheadTime = 0.1; // s

  // Reusable buffers
  private noiseBuffer: AudioBuffer | null = null;

  constructor() {
    // Defer context creation
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.createNoiseBuffer();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBGM();
      window.speechSynthesis.cancel();
      return true;
    } else {
      this.playBGM();
      return false;
    }
  }

  getMuteState() {
    return this.isMuted;
  }

  speak(text: string) {
    if (this.isMuted) return;
    
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
        (v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Zira'))
    );
    
    if (preferredVoice) utterance.voice = preferredVoice;
    utterance.pitch = 1.9; 
    utterance.rate = 1.1;  
    utterance.volume = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }

  // --- SOUND EFFECTS ---

  private playTone(freq: number, type: OscillatorType, duration: number, startTime: number = 0, vol: number = 0.1) {
    if (this.isMuted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + startTime);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    gain.gain.setValueAtTime(vol, this.ctx.currentTime + startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + startTime + duration);
    
    osc.start(this.ctx.currentTime + startTime);
    osc.stop(this.ctx.currentTime + startTime + duration);
  }

  playMove() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    // Funky "bloop"
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
    
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.linearRampToValueAtTime(0, t + 0.1);
    
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  playBump() {
    this.init();
    this.playTone(100, 'square', 0.1, 0, 0.05);
  }

  playWin() {
    this.init();
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    // Victory Fanfare - Major 7th arpeggio
    this.playTone(523.25, 'sawtooth', 0.2, 0, 0.1); // C5
    this.playTone(659.25, 'sawtooth', 0.2, 0.1, 0.1); // E5
    this.playTone(783.99, 'sawtooth', 0.2, 0.2, 0.1); // G5
    this.playTone(987.77, 'sawtooth', 0.4, 0.3, 0.1); // B5
    this.playTone(1046.50, 'sawtooth', 0.6, 0.4, 0.2); // C6
  }

  // --- FUNKY BGM ENGINE ---

  createNoiseBuffer() {
      if (!this.ctx) return;
      const bufferSize = this.ctx.sampleRate * 2.0; // 2 seconds
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
  }

  playBGM() {
      this.init();
      if (this.isMuted || this.isPlaying) return;
      
      this.isPlaying = true;
      this.current16thNote = 0;
      this.nextNoteTime = this.ctx!.currentTime;
      this.timerID = window.setInterval(() => this.scheduler(), this.lookahead);
  }

  stopBGM() {
      this.isPlaying = false;
      if (this.timerID !== null) {
          window.clearInterval(this.timerID);
          this.timerID = null;
      }
  }

  private scheduler() {
      if (!this.ctx) return;
      // Schedule notes that fall within the lookahead window
      while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
          this.scheduleNote(this.current16thNote, this.nextNoteTime);
          this.nextNote();
      }
  }

  private nextNote() {
      const secondsPerBeat = 60.0 / this.tempo;
      // Advance 1/16th note (0.25 of a beat)
      this.nextNoteTime += 0.25 * secondsPerBeat;
      this.current16thNote = (this.current16thNote + 1) % 32; // 32 steps = 2 bars
  }

  private scheduleNote(beat: number, time: number) {
      if (this.isMuted) return;

      // --- DRUMS ---
      // Kick: Heavy on 1, syncopated elsewhere
      if ([0, 7, 10, 16, 26].includes(beat)) {
          this.playKick(time);
      }

      // Snare: 2 and 4 (in 16th notes that's 4, 12, 20, 28)
      if ([4, 12, 20, 28].includes(beat)) {
          this.playSnare(time);
      }
      // Ghost snare
      if (beat === 29 || beat === 31) {
           this.playSnare(time, 0.3); 
      }

      // Hi-Hats: 8th notes
      if (beat % 2 === 0) {
          if (beat % 4 === 2) { 
              this.playHiHat(time, true); // Open hat (accent)
          } else {
              this.playHiHat(time, false); // Closed hat
          }
      }

      // --- BASS (Funky C Minor Pentatonic) ---
      // Freqs: C2=65.41, Eb2=77.78, F2=87.31, G2=98.00, Bb2=116.54, C3=130.81
      const bassLine: {[key: number]: number} = {
          0: 65.41, 
          2: 65.41,
          3: 130.81, // Octave pop
          4: 65.41,
          
          7: 77.78, // Eb
          8: 87.31, // F
          10: 98.00, // G
          
          14: 116.54, // Bb
          15: 123.47, // B (Passing tone to C)
          
          16: 65.41, 
          18: 65.41,
          
          22: 58.27, // Bb1 (Low)
          24: 65.41,
          26: 77.78,
          28: 87.31,
          30: 98.00
      };

      if (bassLine[beat]) {
          this.playBass(bassLine[beat], time);
      }

      // --- CHORDS / STABS (Off-beats) ---
      // Random funky stabs on off-beats (e & a)
      if ([2, 6, 11, 14, 18, 22, 27, 30].includes(beat)) {
          if (Math.random() > 0.5) {
             this.playStab(time);
          }
      }
  }

  // -- INSTRUMENTS --

  private playKick(time: number) {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
      
      gain.gain.setValueAtTime(0.8, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.5);
  }

  private playSnare(time: number, vol: number = 1.0) {
      if (!this.ctx || !this.noiseBuffer) return;
      
      // Noise part
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(vol * 0.4, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      
      // Tonal part (snap)
      const osc = this.ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, time);
      const oscGain = this.ctx.createGain();
      oscGain.gain.setValueAtTime(vol * 0.2, time);
      oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
      
      osc.connect(oscGain);
      oscGain.connect(this.ctx.destination);
      
      noise.start(time);
      osc.start(time);
      noise.stop(time + 0.2);
      osc.stop(time + 0.1);
  }

  private playHiHat(time: number, isOpen: boolean) {
      if (!this.ctx || !this.noiseBuffer) return;
      
      const source = this.ctx.createBufferSource();
      source.buffer = this.noiseBuffer;
      
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.value = 7000;
      
      const gain = this.ctx.createGain();
      // Variation in volume
      const vol = 0.1 + Math.random() * 0.05; 
      gain.gain.setValueAtTime(vol, time);
      // Short decay for closed, slightly longer for open
      const decay = isOpen ? 0.15 : 0.05;
      gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
      
      source.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      source.start(time);
      source.stop(time + decay);
  }

  private playBass(freq: number, time: number) {
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      // Filter for "Wah" effect
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.value = 5; // Resonant
      
      // Filter envelope
      filter.frequency.setValueAtTime(200, time);
      filter.frequency.linearRampToValueAtTime(2000, time + 0.1); // Wah up
      filter.frequency.exponentialRampToValueAtTime(200, time + 0.3); // Wah down
      
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.3, time);
      gain.gain.linearRampToValueAtTime(0, time + 0.3);
      
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(time);
      osc.stop(time + 0.3);
  }

  private playStab(time: number) {
      if (!this.ctx) return;
      // Play a chord: Cm7 (C, Eb, G, Bb) higher pitch
      const freqs = [523.25, 622.25, 783.99]; // C5, Eb5, G5
      
      freqs.forEach(f => {
          const osc = this.ctx!.createOscillator();
          osc.type = 'square'; // Clavinet-ish
          osc.frequency.value = f;
          
          const gain = this.ctx!.createGain();
          gain.gain.setValueAtTime(0.03, time);
          gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
          
          osc.connect(gain);
          gain.connect(this.ctx!.destination);
          
          osc.start(time);
          osc.stop(time + 0.15);
      });
  }
}

export const audio = new AudioService();