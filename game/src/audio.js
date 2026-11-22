// Sound: one job only. All sound is synthesized with WebAudio — no audio
// files, no network. A soft jazz-noir bed: brushed hats, a walking bass
// line and a muted trumpet blip on pickups; the alarm is a two-tone siren,
// the laser a short zap, the decoy a clockwork tick.
let ctx = null;
let musicTimer = null;
let bassStep = 0;

const BASS_LINE = [55, 0, 65.41, 0, 49, 0, 58.27, 0, 55, 0, 65.41, 0, 73.42, 0, 65.41, 0];

export function ensureAudio() {
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, gain, when = 0) {
  if (!ctx) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

export function startMusic() {
  if (!ctx || musicTimer) return;
  musicTimer = setInterval(() => {
    const f = BASS_LINE[bassStep % BASS_LINE.length];
    bassStep += 1;
    if (f > 0) tone(f, 0.42, 'triangle', 0.05);
    if (bassStep % 4 === 2) tone(880 + Math.random() * 40, 0.05, 'sine', 0.012); // hat tick
  }, 240);
}

export function sfxPickup(kind) {
  if (!ctx) return;
  if (kind === 'jewels') {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'sine', 0.09, i * 0.09));
  } else {
    tone(880, 0.12, 'sine', 0.07);
    tone(1320, 0.16, 'sine', 0.05, 0.06);
  }
}

export function sfxAlarm() {
  if (!ctx) return;
  tone(620, 0.22, 'square', 0.045);
  tone(440, 0.22, 'square', 0.045, 0.24);
}

export function sfxLaser() {
  if (!ctx) return;
  tone(1800, 0.1, 'sawtooth', 0.04);
  tone(900, 0.14, 'sawtooth', 0.04, 0.08);
}

export function sfxDecoy() {
  if (!ctx) return;
  tone(2093, 0.05, 'square', 0.03);
  tone(1568, 0.05, 'square', 0.03, 0.09);
}

export function sfxCaught() {
  if (!ctx) return;
  [330, 262, 196, 131].forEach((f, i) => tone(f, 0.3, 'sawtooth', 0.06, i * 0.12));
}

export function sfxCoin() {
  if (!ctx) return;
  tone(1568, 0.08, 'sine', 0.05);
  tone(2093, 0.12, 'sine', 0.04, 0.07);
}

export function sfxDoor() {
  if (!ctx) return;
  tone(98, 0.4, 'triangle', 0.08);
  tone(147, 0.3, 'triangle', 0.05, 0.15);
}

export function sfxWin() {
  if (!ctx) return;
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.5, 'triangle', 0.08, i * 0.14));
}
