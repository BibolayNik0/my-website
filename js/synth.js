// Процедурный синтезатор: каждый демо-трек — это «зерно» (seed) + жанр,
// из которых детерминированно собирается аранжировка и играется через Web Audio.
const Synth = (() => {
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const GENRES = {
    lofi:      { name: 'Lo-Fi',     bpm: [72, 86],   scale: 'minor',    swing: 0.14, lead: 'sine',     pad: 'triangle', bass: 'triangle', tone: 1400, density: 0.35 },
    house:     { name: 'House',     bpm: [118, 126], scale: 'minor',    swing: 0,    lead: 'square',   pad: 'sawtooth', bass: 'sawtooth', tone: 3200, density: 0.3 },
    synthwave: { name: 'Synthwave', bpm: [96, 110],  scale: 'minor',    swing: 0,    lead: 'sawtooth', pad: 'sawtooth', bass: 'sawtooth', tone: 2600, density: 0.4 },
    trap:      { name: 'Trap',      bpm: [136, 150], scale: 'harmonic', swing: 0,    lead: 'triangle', pad: 'triangle', bass: 'sine',     tone: 2200, density: 0.3 },
    ambient:   { name: 'Ambient',   bpm: [60, 70],   scale: 'major',    swing: 0,    lead: 'sine',     pad: 'sine',     bass: 'sine',     tone: 1100, density: 0.18 },
    pop:       { name: 'Pop',       bpm: [100, 118], scale: 'major',    swing: 0,    lead: 'triangle', pad: 'triangle', bass: 'triangle', tone: 3600, density: 0.45 },
  };

  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11],
    minor: [0, 2, 3, 5, 7, 8, 10],
    harmonic: [0, 2, 3, 5, 7, 8, 11],
  };
  const PROGS = {
    major: [[0, 4, 5, 3], [0, 5, 3, 4], [5, 3, 0, 4], [0, 3, 4, 4]],
    minor: [[0, 5, 2, 6], [0, 3, 4, 0], [0, 6, 5, 6], [0, 2, 5, 4]],
  };

  const pat = (s) => s.split('').map((c) => (c === '.' ? 0 : c === 'x' ? 1 : 0.5));
  const DRUMS = {
    lofi:      { kick: pat('x......x..x.....'), snare: pat('....x.......x...'), hat: pat('x.x.x.x.x.x.x.x.') },
    house:     { kick: pat('x...x...x...x...'), snare: pat('....x.......x...'), hat: pat('..x...x...x...x.') },
    synthwave: { kick: pat('x.......x.x.....'), snare: pat('....x.......x...'), hat: pat('x.x.x.x.x.x.x.x.') },
    trap:      { kick: pat('x.....x...x.....'), snare: pat('........x.......'), hat: pat('xxxxxxxxxxxxxxxx') },
    pop:       { kick: pat('x.......x.x.....'), snare: pat('....x.......x...'), hat: pat('x.x.x.x.x.x.x.x.') },
    ambient:   null,
  };
  // [шаг, смещение в полутонах, длина в шагах]
  const BASS = {
    lofi: [[0, 0, 6], [10, 0, 4]],
    house: [[2, 0, 2], [6, 0, 2], [10, 12, 2], [14, 0, 2]],
    synthwave: [0, 2, 4, 6, 8, 10, 12, 14].map((s) => [s, s % 4 === 2 ? 12 : 0, 2]),
    trap: [[0, 0, 6], [6, 0, 4], [10, 0, 5]],
    pop: [[0, 0, 3], [3, 0, 3], [8, 0, 3], [11, 7, 3]],
    ambient: [[0, 0, 16]],
  };

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  const cache = new Map();
  function compose(track) {
    const key = track.genre + ':' + track.seed;
    if (cache.has(key)) return cache.get(key);
    const g = GENRES[track.genre] || GENRES.lofi;
    const r = rng(track.seed);
    const bpm = Math.round(g.bpm[0] + r() * (g.bpm[1] - g.bpm[0]));
    const stepDur = 60 / bpm / 4;
    const root = 45 + Math.floor(r() * 10);
    const scale = SCALES[g.scale];
    const progs = g.scale === 'major' ? PROGS.major : PROGS.minor;
    const prog = progs[Math.floor(r() * progs.length)];
    const targetSec = 70 + r() * 40;
    const bars = Math.max(16, Math.round(targetSec / (stepDur * 16) / 8) * 8);

    const deg = (d, base) => {
      const oct = Math.floor(d / 7);
      const i = ((d % 7) + 7) % 7;
      return base + scale[i] + 12 * oct;
    };

    // Два мотива по 2 такта: значение — смещение ступени от аккорда или null
    const offsets = [0, 2, 4, 7, 4, 2, 1, 3, 5, 0];
    const motif = () => {
      const m = new Array(32).fill(null);
      for (let s = 0; s < 32; s++) {
        const strong = s % 4 === 0 ? 1.6 : s % 2 === 0 ? 1 : 0.5;
        if (r() < g.density * strong) m[s] = offsets[Math.floor(r() * offsets.length)];
      }
      if (m[0] === null) m[0] = 0;
      return m;
    };
    const motifs = [motif(), motif()];

    const drums = DRUMS[track.genre] === undefined ? DRUMS.lofi : DRUMS[track.genre];
    const extraKick = Math.floor(r() * 16);
    const sections = bars / 8;
    const breakdown = sections >= 4 ? Math.floor(sections / 2) : -1;

    function layers(bar) {
      const sec = Math.floor(bar / 8);
      const inSec = bar % 8;
      if (sec === 0) return { pad: true, hat: inSec >= 2, kick: false, snare: false, bass: inSec >= 4, lead: false };
      if (sec === sections - 1 && inSec >= 4) return { pad: true, hat: false, kick: false, snare: false, bass: true, lead: true };
      if (sec === breakdown) return { pad: true, hat: inSec >= 4, kick: false, snare: inSec === 7, bass: false, lead: true };
      return { pad: true, hat: true, kick: true, snare: true, bass: true, lead: true };
    }

    const song = {
      bpm, stepDur, bars, genre: g, totalSteps: bars * 16,
      duration: bars * 16 * stepDur,
      notesAt(step) {
        const bar = Math.floor(step / 16);
        const s = step % 16;
        const L = layers(bar);
        const fade = bar >= bars - 2 ? Math.max(0.05, 1 - ((step - (bars - 2) * 16) / 32)) : 1;
        const chordDeg = prog[bar % 4];
        const out = [];
        if (s === 0 && L.pad) {
          out.push({ type: 'pad', notes: [0, 2, 4].map((o) => deg(chordDeg + o, root + 12)), len: 16, v: 0.07 * fade });
        }
        if (L.bass) {
          for (const [bs, semi, len] of BASS[track.genre] || BASS.lofi) {
            if (bs === s) out.push({ type: 'bass', note: deg(chordDeg, root - 12) + semi, len, v: 0.28 * fade });
          }
        }
        if (L.lead) {
          const which = Math.floor(bar / 4) % 4 === 2 ? 1 : 0;
          const m = motifs[which];
          const idx = (bar % 2) * 16 + s;
          if (m[idx] !== null) {
            let len = 1;
            while (len < 6 && idx + len < 32 && m[idx + len] === null) len++;
            out.push({ type: 'lead', note: deg(chordDeg + m[idx], root + 24), len, v: 0.09 * fade });
          }
        }
        if (drums) {
          if (L.kick && (drums.kick[s] || (track.genre !== 'house' && s === extraKick && s % 2 === 0))) out.push({ type: 'kick', v: 0.9 * fade });
          if (L.snare && drums.snare[s]) out.push({ type: 'snare', v: 0.45 * fade });
          if (L.hat && drums.hat[s]) {
            out.push({ type: 'hat', v: (s % 4 === 0 ? 0.16 : 0.1) * fade, open: track.genre === 'house' });
            if (track.genre === 'trap' && (s === 7 || s === 15) && bar % 2 === 1) out.push({ type: 'hat', v: 0.09 * fade, roll: true });
          }
        }
        return out;
      },
    };
    cache.set(key, song);
    return song;
  }

  function peaks(track, n = 90) {
    const r = rng(track.seed ^ 0x9e3779b9);
    const out = [];
    let prev = 0.5;
    for (let i = 0; i < n; i++) {
      const x = i / n;
      const env = x < 0.08 ? 0.45 + x * 4 : x > 0.92 ? 0.35 + (1 - x) * 5 : 0.75;
      prev = prev * 0.55 + r() * 0.45;
      out.push(Math.min(1, Math.max(0.08, env * (0.45 + prev * 0.8))));
    }
    return out;
  }

  class Engine {
    constructor() {
      this.ctx = null;
      this.song = null;
      this.playing = false;
      this.offset = 0;
      this.timer = null;
      this.onended = null;
      this.volume = 0.8;
    }
    ensure() {
      if (this.ctx) return;
      const Ctx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      const comp = this.ctx.createDynamicsCompressor();
      comp.threshold.value = -14;
      comp.ratio.value = 4;
      this.master.connect(comp);
      comp.connect(this.ctx.destination);
      const len = this.ctx.sampleRate;
      this.noise = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    }
    load(track) {
      this.pause();
      this.song = compose(track);
      this.offset = 0;
    }
    get duration() { return this.song ? this.song.duration : 0; }
    get currentTime() {
      if (!this.playing) return this.offset;
      return Math.min(this.duration, this.startOffset + Math.max(0, this.ctx.currentTime - this.startTime));
    }
    setVolume(v) {
      this.volume = v;
      if (this.master) this.master.gain.value = v;
    }
    play() {
      if (!this.song || this.playing) return;
      this.ensure();
      this.ctx.resume();
      const ctx = this.ctx;
      const g = this.song.genre;
      this.bus = ctx.createGain();
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.value = g.tone * 2.5;
      this.bus.connect(tone);
      tone.connect(this.master);
      // эхо для лида
      this.echo = ctx.createDelay(1);
      this.echo.delayTime.value = this.song.stepDur * 3;
      const fb = ctx.createGain();
      fb.gain.value = g === GENRES.ambient ? 0.55 : 0.3;
      const wet = ctx.createGain();
      wet.gain.value = 0.35;
      this.echo.connect(fb);
      fb.connect(this.echo);
      this.echo.connect(wet);
      wet.connect(this.bus);

      this.startTime = ctx.currentTime + 0.06;
      this.startOffset = this.offset;
      const sd = this.song.stepDur;
      this.nextStep = Math.ceil(this.offset / sd - 1e-6);
      this.nextTime = this.startTime + (this.nextStep * sd - this.offset);
      this.playing = true;
      this.tick();
      this.timer = setInterval(() => this.tick(), 25);
    }
    tick() {
      if (!this.playing) return;
      const ctx = this.ctx;
      const sd = this.song.stepDur;
      while (this.nextTime < ctx.currentTime + 0.15 && this.nextStep < this.song.totalSteps) {
        const swing = this.nextStep % 2 === 1 ? this.song.genre.swing * sd : 0;
        for (const n of this.song.notesAt(this.nextStep)) this.voice(n, this.nextTime + swing, sd);
        this.nextStep++;
        this.nextTime += sd;
      }
      if (this.currentTime >= this.duration - 0.01) {
        this.pause();
        this.offset = 0;
        if (this.onended) this.onended();
      }
    }
    pause() {
      if (!this.playing) return;
      this.offset = this.currentTime;
      this.playing = false;
      clearInterval(this.timer);
      const bus = this.bus;
      const now = this.ctx.currentTime;
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(0, now + 0.05);
      setTimeout(() => bus.disconnect(), 120);
    }
    seek(t) {
      const was = this.playing;
      this.pause();
      this.offset = Math.max(0, Math.min(this.duration - 0.05, t));
      if (was) this.play();
    }
    env(gainNode, t, v, attack, hold, release) {
      const p = gainNode.gain;
      p.setValueAtTime(0.0001, t);
      p.exponentialRampToValueAtTime(Math.max(v, 0.0002), t + attack);
      p.setValueAtTime(Math.max(v, 0.0002), t + attack + hold);
      p.exponentialRampToValueAtTime(0.0001, t + attack + hold + release);
      return t + attack + hold + release + 0.05;
    }
    noiseSrc(t, stop) {
      const s = this.ctx.createBufferSource();
      s.buffer = this.noise;
      s.start(t, Math.random() * 0.5);
      s.stop(stop);
      return s;
    }
    voice(n, t, sd) {
      const ctx = this.ctx;
      const g = this.song.genre;
      const bus = this.bus;
      switch (n.type) {
        case 'kick': {
          const o = ctx.createOscillator();
          const a = ctx.createGain();
          o.frequency.setValueAtTime(150, t);
          o.frequency.exponentialRampToValueAtTime(42, t + 0.13);
          const end = this.env(a, t, n.v, 0.003, 0.02, 0.3);
          o.connect(a).connect(bus);
          o.start(t); o.stop(end);
          break;
        }
        case 'snare': {
          const end = t + 0.25;
          const s = this.noiseSrc(t, end);
          const f = ctx.createBiquadFilter();
          f.type = 'highpass';
          f.frequency.value = g === GENRES.lofi ? 1200 : 1800;
          const a = ctx.createGain();
          this.env(a, t, n.v, 0.002, 0.01, 0.17);
          s.connect(f).connect(a).connect(bus);
          const o = ctx.createOscillator();
          o.type = 'triangle';
          o.frequency.setValueAtTime(190, t);
          const b = ctx.createGain();
          this.env(b, t, n.v * 0.5, 0.002, 0.01, 0.08);
          o.connect(b).connect(bus);
          o.start(t); o.stop(end);
          break;
        }
        case 'hat': {
          const tt = n.roll ? t + sd / 2 : t;
          const rel = n.open ? 0.16 : 0.035;
          const end = tt + rel + 0.05;
          const s = this.noiseSrc(tt, end);
          const f = ctx.createBiquadFilter();
          f.type = 'highpass';
          f.frequency.value = 7500;
          const a = ctx.createGain();
          this.env(a, tt, n.v, 0.001, 0.005, rel);
          s.connect(f).connect(a).connect(bus);
          break;
        }
        case 'bass': {
          const o = ctx.createOscillator();
          o.type = g.bass;
          o.frequency.setValueAtTime(mtof(n.note), t);
          const f = ctx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.value = g.bass === 'sawtooth' ? 500 : 900;
          const a = ctx.createGain();
          const end = this.env(a, t, n.v, 0.01, n.len * sd * 0.6, n.len * sd * 0.4 + 0.05);
          o.connect(f).connect(a).connect(bus);
          o.start(t); o.stop(end);
          break;
        }
        case 'pad': {
          const dur = n.len * sd;
          const f = ctx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.value = g.tone;
          const a = ctx.createGain();
          const end = this.env(a, t, n.v, Math.min(0.4, dur * 0.3), dur * 0.5, dur * 0.4);
          f.connect(a).connect(bus);
          for (const note of n.notes) {
            for (const det of [-7, 7]) {
              const o = ctx.createOscillator();
              o.type = g.pad;
              o.frequency.value = mtof(note);
              o.detune.value = det;
              o.connect(f);
              o.start(t); o.stop(end);
            }
          }
          break;
        }
        case 'lead': {
          const o = ctx.createOscillator();
          o.type = g.lead;
          o.frequency.value = mtof(n.note);
          const f = ctx.createBiquadFilter();
          f.type = 'lowpass';
          f.frequency.value = g.tone;
          const a = ctx.createGain();
          const ambient = g === GENRES.ambient;
          const end = this.env(a, t, n.v, ambient ? 0.08 : 0.01, n.len * sd * 0.5, ambient ? 1.2 : n.len * sd * 0.6);
          o.connect(f).connect(a);
          a.connect(bus);
          a.connect(this.echo);
          o.start(t); o.stop(end);
          break;
        }
      }
    }
  }

  return {
    GENRES,
    compose,
    peaks,
    duration: (track) => compose(track).duration,
    Engine,
    rng,
  };
})();
