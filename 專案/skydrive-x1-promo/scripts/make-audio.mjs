// 程式合成配樂：環境低音、引擎嗡嗡聲、風聲、加速「嗖」音效、收尾鐘音
// 輸出 public/soundtrack.wav（44.1kHz、16-bit、立體聲、30 秒）
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const SR = 44100;
const DUR = 30;
const N = SR * DUR;
const L = new Float32Array(N);
const R = new Float32Array(N);
const TAU = Math.PI * 2;

// 可重現的雜訊
let seed = 20450101;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
};
const smooth = (a, b, t) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};
const env = (t, a, b, c, d) => smooth(a, b, t) * (1 - smooth(c, d, t));
const add = (i, v, pan = 0) => {
  L[i] += v * Math.cos((pan + 1) * Math.PI / 4);
  R[i] += v * Math.sin((pan + 1) * Math.PI / 4);
};

// 二階帶通/低通濾波器（RBJ biquad），截止頻率可逐樣本變動
const biquad = (type) => {
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  return (x, f, q = 0.8) => {
    const w = TAU * f / SR;
    const alpha = Math.sin(w) / (2 * q);
    const cs = Math.cos(w);
    let b0, b1, b2;
    if (type === 'lp') {
      b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = (1 - cs) / 2;
    } else {
      b0 = alpha; b1 = 0; b2 = -alpha;
    }
    const a0 = 1 + alpha, a1 = -2 * cs, a2 = 1 - alpha;
    const y = (b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x; y2 = y1; y1 = y;
    return y;
  };
};

// 1. 環境低音鋪陳（全程，0–4s 最明顯，結尾前淡出）
{
  const lp = biquad('lp');
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const lfo = 0.6 + 0.4 * Math.sin(TAU * 0.15 * t);
    const tone = Math.sin(TAU * 41.2 * t) + 0.6 * Math.sin(TAU * 61.8 * t + 1) + 0.3 * Math.sin(TAU * 82.4 * t * 1.003);
    const air = lp(rnd() * 2 - 1, 300);
    const level = 0.16 * (0.55 + 0.45 * (1 - smooth(4, 8, t))) * smooth(0, 2.5, t) * (1 - smooth(27, 28.2, t));
    add(i, level * lfo * (tone * 0.5 + air * 2.5), 0);
  }
}

// 2. 引擎嗡嗡聲：鋸齒波低通 + 旋翼斬波，飛天車出現時開始，加速段升頻
{
  const lp = biquad('lp');
  let ph = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const level = env(t, 4, 5.5, 26, 28);
    if (level <= 0) continue;
    const accel = smooth(19, 21.5, t);
    const hover = env(t, 14, 15, 19, 19.3);
    const f0 = 58 + 52 * accel - 6 * hover + 3 * Math.sin(TAU * 0.4 * t);
    ph += f0 / SR;
    const saw = 2 * (ph - Math.floor(ph)) - 1;
    const chop = 0.7 + 0.3 * Math.sin(TAU * (24 + 14 * accel) * t);
    const y = lp(saw, 220 + 900 * accel, 0.9);
    const pan = t < 9 ? -0.8 + (t - 4) * 0.32 : 0.15 * Math.sin(TAU * 0.2 * t);
    add(i, 0.32 * level * chop * y * (1 - 0.6 * smooth(24, 27, t)), pan);
  }
}

// 3. 9–14s 呼嘯而過的風聲：帶通雜訊，跟著穿梭節奏起伏並左右移動
{
  const bpL = biquad('bp');
  const swells = [9.4, 10.6, 11.5, 12.4, 13.3];
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const base = env(t, 8.6, 9.4, 13.6, 14.6);
    if (base <= 0) continue;
    let s = 0.35;
    let pan = 0;
    for (const c of swells) {
      const g = Math.exp(-(((t - c) / 0.28) ** 2));
      s += g;
      pan += g * Math.tanh((t - c) * 6);
    }
    const n = rnd() * 2 - 1;
    const f = 500 + 1600 * Math.min(1, s * 0.7);
    add(i, 0.55 * base * s * bpL(n, f, 1.2), Math.max(-1, Math.min(1, -pan)));
  }
}

// 4. 19s 加速「嗖」：上掃雜訊 + 上升音調
{
  const bp = biquad('bp');
  let ph = 0;
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const k = t - 19;
    if (k < -0.1 || k > 2.2) continue;
    const e = smooth(-0.1, 0.25, k) * Math.exp(-Math.max(0, k - 0.3) * 2.2);
    const f = 300 + 5200 * smooth(-0.1, 1.2, k);
    const n = bp(rnd() * 2 - 1, f, 2.5);
    ph += (180 + 900 * smooth(0, 1.4, k)) / SR;
    const tone = Math.sin(TAU * ph) * 0.25;
    add(i, 0.9 * e * (n * 1.6 + tone), Math.max(-1, Math.min(1, -0.6 + k)));
  }
  // 衝出瞬間的低頻「轟」
  for (let i = 0; i < N; i++) {
    const k = i / SR - 19.05;
    if (k < 0 || k > 1.5) continue;
    add(i, 0.45 * Math.exp(-k * 3.5) * Math.sin(TAU * (70 - 30 * k) * k), 0);
  }
}

// 5. 28s 收尾鐘音：非諧波泛音 + 簡易延遲殘響
{
  const partials = [
    [1, 1, 3.2],
    [2.0, 0.55, 2.4],
    [2.76, 0.4, 1.8],
    [5.4, 0.22, 1.3],
    [8.93, 0.12, 0.9],
  ];
  const f0 = 392;
  const start = 28.0;
  const dry = new Float32Array(N);
  for (let i = Math.floor(start * SR); i < N; i++) {
    const k = i / SR - start;
    let v = 0;
    for (const [m, a, d] of partials) v += a * Math.exp(-k * d) * Math.sin(TAU * f0 * m * k + m);
    dry[i] = v * smooth(0, 0.004, k) * 0.32;
  }
  const taps = [
    [0.0, 1, 0],
    [0.083, 0.45, -0.6],
    [0.131, 0.38, 0.6],
    [0.197, 0.28, -0.3],
    [0.263, 0.2, 0.4],
    [0.37, 0.12, 0],
  ];
  for (const [d, g, pan] of taps) {
    const off = Math.floor(d * SR);
    for (let i = off; i < N; i++) if (dry[i - off]) add(i, dry[i - off] * g, pan);
  }
}

// 正規化至 -1 dBFS，最後 0.15 秒淡出
let peak = 0;
for (let i = 0; i < N; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
const gain = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write('WAVEfmt ', 8);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write('data', 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  const fade = 1 - smooth(DUR - 0.15, DUR, i / SR);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * gain * fade)) * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * gain * fade)) * 32767), 46 + i * 4);
}
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'soundtrack.wav');
mkdirSync(dirname(out), {recursive: true});
writeFileSync(out, buf);
console.log(`wrote ${out} (peak gain ${gain.toFixed(2)})`);
