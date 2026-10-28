// Plucked-string sounds synthesized in the browser (Karplus–Strong), so the app ships no audio files.
let context: AudioContext | undefined;
let input: AudioNode | undefined;
const buffers = new Map<number, AudioBuffer>();

function audio() {
  if (typeof AudioContext === 'undefined') return undefined;
  if (!context) {
    context = new AudioContext();
    const tone = context.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 4200;
    const volume = context.createGain();
    volume.gain.value = .55;
    tone.connect(volume).connect(context.destination);
    input = tone;
  }
  if (context.state === 'suspended') void context.resume();
  return context;
}

const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

// A noise burst through a delay line and averaging filter. Returns the buffer and its native pitch.
function stringBuffer(ctx: AudioContext, midi: number) {
  const period = Math.max(2, Math.round(ctx.sampleRate / frequency(midi)));
  let buffer = buffers.get(period);
  if (!buffer) {
    buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * 1.8), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < period; i++) data[i] = Math.random() * 2 - 1;
    data[period] = data[0];
    for (let i = period + 1; i < data.length; i++) data[i] = .497 * (data[i - period] + data[i - period - 1]);
    buffers.set(period, buffer);
  }
  // The two-point average delays the loop by half a sample.
  return { buffer, rate: frequency(midi) / (ctx.sampleRate / (period + .5)) };
}

/** Plucks one note, optionally `delay` seconds from now. Returns a function that silences it. */
export function pluck(midi: number, delay = 0, level = 1): () => void {
  const ctx = audio();
  if (!ctx || !input) return () => {};
  const { buffer, rate } = stringBuffer(ctx, midi);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  const gain = ctx.createGain();
  const start = ctx.currentTime + delay;
  gain.gain.setValueAtTime(level * .8, start);
  gain.gain.exponentialRampToValueAtTime(.001, start + 1.7);
  source.connect(gain).connect(input);
  source.start(start);
  source.stop(start + 1.8);
  return () => { try { source.stop(); } catch { /* Already finished. */ } };
}

/** A short muted thud for a wrong answer. */
export function thud() {
  const ctx = audio();
  if (!ctx || !input) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const start = ctx.currentTime;
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(150, start);
  osc.frequency.exponentialRampToValueAtTime(70, start + .14);
  gain.gain.setValueAtTime(.35, start);
  gain.gain.exponentialRampToValueAtTime(.001, start + .16);
  osc.connect(gain).connect(input);
  osc.start(start);
  osc.stop(start + .18);
}
