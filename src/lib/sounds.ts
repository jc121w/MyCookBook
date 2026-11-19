// Sound effects, made live with the Web Audio API (no audio files to download).
// Browsers only allow sound after a user action, so call these from a click/submit.

let ctx: AudioContext | null = null;
function audio() {
  if (typeof window === "undefined") return null;
  ctx ??= new AudioContext();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// White noise: the raw material for whooshes and scrapes
function noise(ac: AudioContext, seconds: number) {
  const buffer = ac.createBuffer(
    1,
    Math.ceil(ac.sampleRate * seconds),
    ac.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const source = ac.createBufferSource();
  source.buffer = buffer;
  return source;
}

// A gain node that fades: silent → peak at `attack` → silent at `end` (seconds from `t0`)
function envelope(
  ac: AudioContext,
  t0: number,
  peak: number,
  attack: number,
  end: number,
) {
  const gain = ac.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + end);
  return gain;
}

// One slash: a whoosh while the blade travels, then a metallic "shing" as it cuts.
// `t` = start time, `travel` = seconds the blade takes to cross the screen.
function slash(
  ac: AudioContext,
  out: AudioNode,
  t: number,
  travel: number,
  power = 1, // >1 = a bigger, louder slash
) {
  // Whoosh: noise through a band-pass filter sweeping upward as the blade speeds up
  const whoosh = noise(ac, travel);
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 1.2;
  band.frequency.setValueAtTime(500, t);
  band.frequency.exponentialRampToValueAtTime(2600, t + travel);
  whoosh
    .connect(band)
    .connect(envelope(ac, t, 0.3 * power, travel * 0.6, travel))
    .connect(out);
  whoosh.start(t);

  // The cut lands mid-swipe, as the blade crosses the middle of the screen
  const cut = t + travel * 0.6;

  // Scrape: a very short, bright burst of noise, the edge catching
  const scrape = noise(ac, 0.1);
  const high = ac.createBiquadFilter();
  high.type = "highpass";
  high.frequency.value = 3500;
  scrape
    .connect(high)
    .connect(envelope(ac, cut, 0.45 * power, 0.004, 0.1))
    .connect(out);
  scrape.start(cut);

  // Ring: a few high, slightly inharmonic tones fading out, like struck steel
  for (const [freq, level, decay] of [
    [2637, 0.12, 0.8],
    [3951, 0.08, 0.6],
    [5274, 0.05, 0.45],
    [7040, 0.03, 0.3],
  ]) {
    const osc = ac.createOscillator();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq * 1.02, cut);
    osc.frequency.exponentialRampToValueAtTime(freq, cut + 0.15); // tiny pitch settle
    osc
      .connect(envelope(ac, cut, level * power, 0.004, decay * power))
      .connect(out);
    osc.start(cut);
    osc.stop(cut + decay + 0.05);
  }
}

// The reveal: a soft, low rush of air as the cut opens up
function open(ac: AudioContext, out: AudioNode, t: number) {
  const air = noise(ac, 0.6);
  const low = ac.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.setValueAtTime(1800, t);
  low.frequency.exponentialRampToValueAtTime(200, t + 0.6);
  air
    .connect(low)
    .connect(envelope(ac, t, 0.35, 0.05, 0.6))
    .connect(out);
  air.start(t);
}

// The spin before the big slash: "whum… whum-whum-whum", speeding up and rising in pitch.
// Noise whose volume pulses with each turn (an LFO), the pulses getting faster.
function spin(ac: AudioContext, out: AudioNode, t: number, duration: number) {
  const air = noise(ac, duration);
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 2;
  band.frequency.setValueAtTime(450, t);
  band.frequency.exponentialRampToValueAtTime(1800, t + duration); // pitch rises

  // The pulsing: a slow wave (LFO) wiggles the volume; it speeds up as the knife spins faster
  const pulse = ac.createGain();
  pulse.gain.value = 0.5;
  const lfo = ac.createOscillator();
  lfo.frequency.setValueAtTime(3, t);
  lfo.frequency.exponentialRampToValueAtTime(14, t + duration);
  const depth = ac.createGain();
  depth.gain.value = 0.5; // pulse between 0 and 1
  lfo.connect(depth).connect(pulse.gain);

  // Crescendo: quiet at first, loudest right before it stops
  const swell = ac.createGain();
  swell.gain.setValueAtTime(0.0001, t);
  swell.gain.exponentialRampToValueAtTime(0.32, t + duration * 0.95);
  swell.gain.exponentialRampToValueAtTime(0.0001, t + duration + 0.06); // stops dead

  air.connect(band).connect(pulse).connect(swell).connect(out);
  air.start(t);
  lfo.start(t);
  lfo.stop(t + duration + 0.1);
}

// A deep, short thump: a low tone dropping in pitch, fading fast
function thud(ac: AudioContext, out: AudioNode, t: number) {
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(110, t);
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.25);
  osc.connect(envelope(ac, t, 0.6, 0.008, 0.35)).connect(out);
  osc.start(t);
  osc.stop(t + 0.4);
}

// The whole celebration's soundtrack. `slashes` = [start, travel] in seconds for each
// swipe, `openAt` = when the cut opens. Times match the animation.
export function playKnifeSequence(
  slashes: [number, number][],
  openAt?: number,
  spinAt?: [number, number], // [start, duration] of the spin before the last slash
) {
  try {
    const ac = audio();
    if (!ac) return;
    const now = ac.currentTime;
    const master = ac.createGain();
    master.gain.value = 0.5; // overall volume
    master.connect(ac.destination);
    // The last slash is the big one: louder, with a longer ring
    slashes.forEach(([start, travel], i) =>
      slash(
        ac,
        master,
        now + start,
        travel,
        i === slashes.length - 1 && slashes.length > 1 ? 1.6 : 1,
      ),
    );
    if (spinAt) spin(ac, master, now + spinAt[0], spinAt[1]);
    // A low thud under the big slash's impact, so you feel it
    if (slashes.length > 1) {
      const [start, travel] = slashes[slashes.length - 1];
      thud(ac, master, now + start + travel * 0.6);
    }
    if (openAt != null) open(ac, master, now + openAt);
  } catch {
    // No sound support (or blocked): the animation still plays
  }
}
