// ============================================================================
// 効果音 — WebAudio でその場で合成(音声ファイル不要)。
// ブラウザ以外(Node検証)では何もしない。音量は控えめに固定。
// ============================================================================
export type SoundName =
  | 'click' // モード切替など
  | 'build' // 線路をつくった
  | 'demolish' // こわした
  | 'whistle' // 電車が発車
  | 'coin' // 運賃ゲット
  | 'fanfare' // ミッションクリア
  | 'error'; // お金が足りない等

const hasWindow = typeof window !== 'undefined';

let ctx: AudioContext | null = null;
let muted = loadMuted();
let lastCoinAt = 0;

function loadMuted(): boolean {
  if (!hasWindow) return true;
  try {
    return window.localStorage.getItem('rt3d-muted') === '1';
  } catch {
    return false;
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  muted = next;
  if (!hasWindow) return;
  try {
    window.localStorage.setItem('rt3d-muted', next ? '1' : '0');
  } catch {
    /* 保存できなくても動作に支障なし */
  }
}

function ensureCtx(): AudioContext | null {
  if (!hasWindow) return null;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** 単音(開始周波数→終了周波数のグライド可) */
function tone(
  c: AudioContext,
  opts: {
    freq: number;
    freqEnd?: number;
    dur: number;
    type?: OscillatorType;
    vol?: number;
    delay?: number;
  },
): void {
  const t0 = c.currentTime + (opts.delay ?? 0);
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = opts.type ?? 'sine';
  osc.frequency.setValueAtTime(opts.freq, t0);
  if (opts.freqEnd) osc.frequency.exponentialRampToValueAtTime(opts.freqEnd, t0 + opts.dur);
  const v = opts.vol ?? 0.05;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(v, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0008, t0 + opts.dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + opts.dur + 0.05);
}

/** 短いホワイトノイズ(こわす音) */
function noise(c: AudioContext, dur: number, vol: number): void {
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 900;
  const gain = c.createGain();
  gain.gain.value = vol;
  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
}

export function play(name: SoundName): void {
  if (muted) return;
  const c = ensureCtx();
  if (!c || c.state !== 'running') return;

  switch (name) {
    case 'click':
      tone(c, { freq: 760, dur: 0.06, type: 'square', vol: 0.025 });
      break;
    case 'build':
      tone(c, { freq: 620, dur: 0.07, type: 'triangle', vol: 0.05 });
      tone(c, { freq: 830, dur: 0.09, type: 'triangle', vol: 0.05, delay: 0.07 });
      break;
    case 'demolish':
      noise(c, 0.16, 0.06);
      tone(c, { freq: 220, freqEnd: 90, dur: 0.18, type: 'sawtooth', vol: 0.035 });
      break;
    case 'whistle':
      tone(c, { freq: 660, freqEnd: 880, dur: 0.22, type: 'triangle', vol: 0.05 });
      tone(c, { freq: 990, freqEnd: 1180, dur: 0.3, type: 'triangle', vol: 0.04, delay: 0.16 });
      break;
    case 'coin': {
      // 連続配達で鳴りすぎないように間引く
      const now = c.currentTime;
      if (now - lastCoinAt < 0.12) return;
      lastCoinAt = now;
      tone(c, { freq: 1180, dur: 0.07, type: 'sine', vol: 0.045 });
      tone(c, { freq: 1568, dur: 0.16, type: 'sine', vol: 0.045, delay: 0.06 });
      break;
    }
    case 'fanfare': {
      const notes = [523.3, 659.3, 784, 1046.5]; // ド ミ ソ ド
      notes.forEach((f, i) =>
        tone(c, { freq: f, dur: i === notes.length - 1 ? 0.42 : 0.16, type: 'triangle', vol: 0.06, delay: i * 0.13 }),
      );
      notes.forEach((f, i) =>
        tone(c, { freq: f * 2, dur: 0.12, type: 'sine', vol: 0.02, delay: i * 0.13 }),
      );
      break;
    }
    case 'error':
      tone(c, { freq: 240, freqEnd: 150, dur: 0.2, type: 'sawtooth', vol: 0.035 });
      break;
  }
}
