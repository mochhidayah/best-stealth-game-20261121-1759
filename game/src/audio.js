// Shadow Vault — sound, synthesized live with WebAudio. No audio files:
// footsteps are filtered noise ticks, pickups are little arpeggios, the
// alarm is a two-tone siren. Silent until the first key press (browser rule).

let audioCtx = null;
let alarmNodes = null;

function ensureAudio() {
  if (audioCtx) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  audioCtx = new AC();
  return audioCtx;
}

function blip(freq, dur, type, vol, when) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime + (when || 0);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type || 'sine';
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol || 0.12, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function playFootstep(sneaking) {
  const ctx = ensureAudio();
  if (!ctx) return;
  const t = ctx.currentTime;
  const len = 0.06;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = sneaking ? 300 : 900;
  const gain = ctx.createGain();
  gain.gain.value = sneaking ? 0.03 : 0.09;
  src.connect(filter).connect(gain).connect(ctx.destination);
  src.start(t);
}

function playPickup() {
  blip(523, 0.12, 'triangle', 0.14, 0);
  blip(659, 0.12, 'triangle', 0.14, 0.09);
  blip(784, 0.22, 'triangle', 0.16, 0.18);
}

function playSpotted() {
  blip(220, 0.18, 'square', 0.08, 0);
  blip(311, 0.3, 'square', 0.08, 0.14);
}

function playWin() {
  [523, 659, 784, 1047].forEach((f, i) => blip(f, 0.25, 'triangle', 0.15, i * 0.12));
}

function playCaught() {
  blip(196, 0.4, 'sawtooth', 0.12, 0);
  blip(147, 0.6, 'sawtooth', 0.12, 0.3);
}

function startAlarm() {
  const ctx = ensureAudio();
  if (!ctx || alarmNodes) return;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = 660;
  const lfo = ctx.createOscillator();
  lfo.type = 'square';
  lfo.frequency.value = 1.6;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 140;
  lfo.connect(lfoGain).connect(osc.frequency);
  const gain = ctx.createGain();
  gain.gain.value = 0.045;
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  lfo.start();
  alarmNodes = { osc, lfo, gain };
}

function stopAlarm() {
  if (!alarmNodes) return;
  try { alarmNodes.osc.stop(); alarmNodes.lfo.stop(); } catch (e) { /* already stopped */ }
  alarmNodes = null;
}
