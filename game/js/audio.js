// Gobble Dash — synthesized sound effects with WebAudio.
// One job: every gobble, pickup, alarm and fanfare, made from oscillators,
// no audio files, so the game stays fully offline and self-contained.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.master = null;
  }

  // The browser only lets audio start after a user gesture; call on first input.
  unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.22;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
  }

  tone(freq, dur, type, vol, when = 0, slideTo = null) {
    if (!this.ctx || !this.enabled) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  // A turkey gobble: two quick low blips, like "gob-ble".
  gobble() {
    this.tone(320, 0.09, 'square', 0.5, 0, 190);
    this.tone(260, 0.12, 'square', 0.5, 0.11, 150);
  }

  pickup() {
    this.tone(660, 0.08, 'sine', 0.6, 0, 990);
    this.tone(990, 0.12, 'sine', 0.5, 0.07, 1320);
  }

  goldenPickup() {
    this.tone(660, 0.08, 'sine', 0.6, 0, 990);
    this.tone(880, 0.08, 'sine', 0.6, 0.07, 1170);
    this.tone(1320, 0.16, 'sine', 0.5, 0.14, 1760);
  }

  // The farmer spots the turkey: a sharp two-note alarm.
  alert() {
    this.tone(196, 0.16, 'sawtooth', 0.55, 0, 196);
    this.tone(262, 0.2, 'sawtooth', 0.55, 0.15, 262);
  }

  // Caught: a low thud plus a descending slide.
  caught() {
    this.tone(140, 0.25, 'triangle', 0.8, 0, 70);
    this.tone(90, 0.35, 'sawtooth', 0.4, 0.05, 45);
  }

  hop() {
    this.tone(300, 0.12, 'sine', 0.35, 0, 520);
  }

  // A soft waddle step while the turkey walks.
  step() {
    this.tone(180, 0.05, 'sine', 0.12, 0, 140);
  }

  click() {
    this.tone(520, 0.05, 'sine', 0.4);
  }

  knifeWhoosh() {
    this.tone(1200, 0.25, 'sawtooth', 0.18, 0, 300);
  }

  // Escaped a stage: a short rising jingle.
  stageClear() {
    [523, 659, 784, 1047].forEach((f, i) => this.tone(f, 0.14, 'triangle', 0.55, i * 0.09));
  }

  // Escaped for good: the full Thanksgiving fanfare.
  winFanfare() {
    [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) =>
      this.tone(f, 0.2, 'triangle', 0.55, i * 0.12),
    );
  }

  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.5, i * 0.16));
  }
}
