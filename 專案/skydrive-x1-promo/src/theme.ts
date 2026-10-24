export const W = 1920;
export const H = 1080;

export const NEON = '#3ee7ff';
export const NEON_DEEP = '#1f7bff';
export const NEON_PINK = '#ff4fd8';

export const FONT =
  '"Noto Sans TC", "PingFang TC", "Microsoft JhengHei", "WenQuanYi Zen Hei", "Helvetica Neue", Arial, sans-serif';
export const MONO = '"JetBrains Mono", "SFMono-Regular", Consolas, "DejaVu Sans Mono", monospace';

// 三次貝茲曲線上的點
export const bezier = (
  t: number,
  p0: [number, number],
  p1: [number, number],
  p2: [number, number],
  p3: [number, number],
): [number, number] => {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0],
    a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1],
  ];
};

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
