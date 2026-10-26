/**
 * 音效：全部用 Web Audio 即時合成，沒有音檔。
 * 手機瀏覽器要等使用者第一次點畫面才能出聲，所以在第一次點擊時啟動。
 * 靜音設定記在瀏覽器（localStorage），讀不到就預設有聲音。
 */
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let muted = false;
try {
  muted = localStorage.getItem('raujing-muted') === '1';
} catch {
  /* 無痕模式 */
}

function ac(): AudioContext | null {
  if (muted) return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** 第一次點畫面時啟動聲音（手機需要） */
export function unlockAudio(): void {
  const once = () => {
    ac();
    window.removeEventListener('pointerdown', once);
  };
  window.addEventListener('pointerdown', once);
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem('raujing-muted', m ? '1' : '0');
  } catch {
    /* 無痕模式 */
  }
  if (m && ctx) void ctx.suspend();
  if (!m) ac();
}

function noise(c: AudioContext): AudioBuffer {
  if (noiseBuf) return noiseBuf;
  noiseBuf = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

/** 一個音：振盪器＋音量包絡 */
function tone(type: OscillatorType, freq: number, start: number, dur: number, vol: number, endFreq?: number): void {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** 一段雜訊：濾波＋音量包絡 */
function hiss(start: number, dur: number, vol: number, filter: BiquadFilterType, freq: number, endFreq?: number, q = 1): void {
  const c = ac();
  if (!c || !master) return;
  const t = c.currentTime + start;
  const s = c.createBufferSource();
  s.buffer = noise(c);
  const f = c.createBiquadFilter();
  f.type = filter;
  f.frequency.setValueAtTime(freq, t);
  if (endFreq) f.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(master);
  s.start(t, Math.random() * 0.5);
  s.stop(t + dur + 0.05);
}

export const sfx = {
  /** 按鈕 */
  click(): void {
    tone('triangle', 900, 0, 0.05, 0.12, 600);
  },
  /** 鑼 */
  gong(): void {
    for (const [f, v] of [[150, 0.3], [227, 0.18], [331, 0.12], [462, 0.08], [611, 0.05]] as [number, number][]) tone('sine', f, 0, 2.6, v, f * 0.97);
    hiss(0, 0.15, 0.15, 'bandpass', 2000);
  },
  /** 鼓，連打 n 下 */
  drum(n = 1): void {
    for (let i = 0; i < n; i++) {
      tone('sine', 110, i * 0.22, 0.35, 0.5, 45);
      hiss(i * 0.22, 0.06, 0.2, 'lowpass', 900);
    }
  },
  /** 鞭炮：一串劈哩啪啦 */
  firecracker(): void {
    const n = 8 + Math.floor(Math.random() * 6);
    for (let i = 0; i < n; i++) hiss(i * 0.045 + Math.random() * 0.03, 0.04, 0.35, 'bandpass', 1800 + Math.random() * 2000, undefined, 0.8);
  },
  /** 鈴 */
  bell(vol = 0.25): void {
    tone('sine', 1320, 0, 1.2, vol);
    tone('sine', 2640, 0, 0.6, vol * 0.4);
  },
  /** 擲筊落地：木頭碰撞 */
  jiao(): void {
    tone('square', 620, 0, 0.06, 0.15, 380);
    hiss(0, 0.05, 0.2, 'bandpass', 1400, undefined, 3);
    tone('square', 540, 0.09, 0.05, 0.1, 350);
  },
  /** 蓋章 */
  stamp(): void {
    tone('sine', 140, 0, 0.18, 0.5, 60);
    hiss(0, 0.08, 0.3, 'lowpass', 1200);
  },
  /** 鎖鏈 */
  chain(): void {
    for (let i = 0; i < 5; i++) tone('triangle', 2200 + Math.random() * 900, i * 0.05, 0.12, 0.08);
  },
  /** 收容：一陣風被收進令旗 */
  whoosh(): void {
    hiss(0, 0.5, 0.25, 'bandpass', 300, 1800, 2);
  },
  /** 斬 */
  slash(): void {
    hiss(0, 0.3, 0.4, 'highpass', 6000, 800, 1);
    tone('sawtooth', 220, 0.05, 0.25, 0.15, 60);
  },
  /** 挨打 */
  hit(): void {
    hiss(0, 0.07, 0.25, 'lowpass', 700);
  },
  /** 回血、超渡：上行和弦 */
  heal(): void {
    [523, 659, 784, 1047].forEach((f, i) => tone('sine', f, i * 0.08, 0.6, 0.12));
  },
  /** 對了 */
  good(): void {
    tone('sine', 784, 0, 0.25, 0.15);
    tone('sine', 1175, 0.1, 0.4, 0.15);
  },
  /** 錯了 */
  bad(): void {
    tone('sawtooth', 220, 0, 0.35, 0.12, 140);
  },
  /** 天令：雷 */
  thunder(): void {
    hiss(0, 0.12, 0.6, 'highpass', 2000);
    hiss(0.05, 1.4, 0.5, 'lowpass', 400, 80);
  },
  /** 地鳴 */
  rumble(): void {
    hiss(0, 1.6, 0.6, 'lowpass', 120, 60);
  },
  /** 石駒嘶鳴 */
  neigh(): void {
    const c = ac();
    if (!c || !master) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const lfo = c.createOscillator();
    const lg = c.createGain();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(420, t);
    o.frequency.linearRampToValueAtTime(880, t + 0.25);
    o.frequency.linearRampToValueAtTime(700, t + 0.7);
    o.frequency.linearRampToValueAtTime(380, t + 1.1);
    lfo.frequency.value = 18;
    lg.gain.value = 40;
    lfo.connect(lg).connect(o.frequency);
    f.type = 'bandpass';
    f.frequency.value = 1100;
    f.Q.value = 1.5;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.15);
    o.connect(f).connect(g).connect(master);
    o.start(t);
    lfo.start(t);
    o.stop(t + 1.2);
    lfo.stop(t + 1.2);
  },
  /** 雞啼 */
  rooster(): void {
    const c = ac();
    if (!c || !master) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    const f = c.createBiquadFilter();
    const g = c.createGain();
    o.type = 'sawtooth';
    const pts: [number, number][] = [[0, 500], [0.12, 900], [0.3, 950], [0.45, 760], [0.75, 1000], [1.1, 1050], [1.4, 600]];
    for (const [dt, fr] of pts) o.frequency.linearRampToValueAtTime(fr, t + dt);
    f.type = 'bandpass';
    f.frequency.value = 1200;
    f.Q.value = 2;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.05);
    g.gain.setValueAtTime(0.18, t + 1.2);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.45);
    o.connect(f).connect(g).connect(master);
    o.start(t);
    o.stop(t + 1.5);
  },
  /** 翻頁 */
  page(): void {
    hiss(0, 0.25, 0.12, 'bandpass', 2500, 900, 0.7);
  },
};
