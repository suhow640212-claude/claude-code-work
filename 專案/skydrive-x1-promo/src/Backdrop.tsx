import {random} from 'remotion';
import {H, W} from './theme';

// ---------- 星空 ----------
type Star = {x: number; y: number; r: number; speed: number; phase: number; glint: boolean};

export const STARS: Star[] = new Array(240).fill(0).map((_, i) => ({
  x: random(`sx-${i}`) * W,
  y: random(`sy-${i}`) * H * 0.78,
  r: 0.6 + random(`sr-${i}`) * 1.8,
  speed: 0.05 + random(`ss-${i}`) * 0.12,
  phase: random(`sp-${i}`) * Math.PI * 2,
  glint: random(`sg-${i}`) > 0.94,
}));

export const Stars: React.FC<{frame: number; opacity?: number}> = ({frame, opacity = 1}) => (
  <g opacity={opacity}>
    {STARS.map((s, i) => {
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * s.speed + s.phase));
      return (
        <g key={i} opacity={tw}>
          <circle cx={s.x} cy={s.y} r={s.r} fill="#ffffff" />
          {s.glint && (
            <g stroke="#cdeeff" strokeWidth={1} opacity={0.8}>
              <line x1={s.x - s.r * 6} y1={s.y} x2={s.x + s.r * 6} y2={s.y} />
              <line x1={s.x} y1={s.y - s.r * 6} x2={s.x} y2={s.y + s.r * 6} />
            </g>
          )}
        </g>
      );
    })}
  </g>
);

// ---------- 天際線 ----------
type Building = {x: number; w: number; h: number; windows: {x: number; y: number; c: string}[]; antenna: boolean};

const makeBuildings = (seed: string, count: number, minH: number, maxH: number, span: number): Building[] => {
  const out: Building[] = [];
  let x = -40;
  for (let i = 0; i < count && x < span; i++) {
    const w = 50 + random(`${seed}-w-${i}`) * 110;
    const h = minH + random(`${seed}-h-${i}`) ** 1.6 * (maxH - minH);
    const windows: Building['windows'] = [];
    for (let wy = 18; wy < h - 10; wy += 22) {
      for (let wx = 10; wx < w - 12; wx += 18) {
        const r = random(`${seed}-win-${i}-${wx}-${wy}`);
        if (r > 0.72) windows.push({x: wx, y: wy, c: r > 0.93 ? '#5ff1ff' : '#ffd88a'});
      }
    }
    out.push({x, w, h, windows, antenna: random(`${seed}-a-${i}`) > 0.75});
    x += w + 4 + random(`${seed}-g-${i}`) * 18;
  }
  return out;
};

const NEAR = makeBuildings('near', 40, 120, 380, W + 80);
const FAR = makeBuildings('far', 40, 180, 480, W + 80);

// 台北 101 剪影：八節斗狀結構 + 基座 + 塔尖
const Taipei101: React.FC<{x: number; base: number; fill: string; light: boolean}> = ({x, base, fill, light}) => {
  const seg = 54;
  const tiers = new Array(8).fill(0).map((_, i) => {
    const top = base - 200 - (i + 1) * seg;
    return `M ${x - 46} ${top + seg} L ${x - 56} ${top + 6} L ${x + 56} ${top + 6} L ${x + 46} ${top + seg} Z`;
  });
  const top = base - 200 - 8 * seg;
  return (
    <g fill={fill}>
      <path d={`M ${x - 70} ${base} L ${x - 58} ${base - 200} L ${x + 58} ${base - 200} L ${x + 70} ${base} Z`} />
      {tiers.map((d, i) => (
        <path key={i} d={d} />
      ))}
      <rect x={x - 30} y={top - 50} width={60} height={56} />
      <rect x={x - 14} y={top - 90} width={28} height={42} />
      <rect x={x - 3} y={top - 190} width={6} height={102} />
      {light &&
        new Array(8).fill(0).map((_, i) => (
          <rect key={i} x={x - 50} y={base - 200 - (i + 1) * seg + 8} width={100} height={3} fill="#5ff1ff" opacity={0.75} />
        ))}
      {light && <circle cx={x} cy={top - 190} r={5} fill="#ff4b6e" />}
    </g>
  );
};

type SkylineProps = {
  rise?: number; // 0–1 由下方浮現
  offsetX?: number;
  farColor?: string;
  nearColor?: string;
  lights?: number; // 窗戶燈光透明度
  frame: number;
};

export const Skyline: React.FC<SkylineProps> = ({
  rise = 1,
  offsetX = 0,
  farColor = '#0d1a3a',
  nearColor = '#060b1d',
  lights = 1,
  frame,
}) => {
  const dy = (1 - rise) * 520;
  return (
    <g transform={`translate(0 ${dy})`}>
      <g transform={`translate(${offsetX * 0.4} 0)`}>
        {FAR.map((b, i) => (
          <rect key={i} x={b.x} y={H - b.h - 60} width={b.w} height={b.h + 60} fill={farColor} />
        ))}
        <Taipei101 x={1380} base={H} fill={farColor} light={lights > 0} />
      </g>
      <g transform={`translate(${offsetX} 0)`}>
        {NEAR.map((b, i) => (
          <g key={i}>
            <rect x={b.x} y={H - b.h} width={b.w} height={b.h} fill={nearColor} />
            {b.antenna && (
              <>
                <rect x={b.x + b.w / 2 - 2} y={H - b.h - 40} width={4} height={40} fill={nearColor} />
                <circle
                  cx={b.x + b.w / 2}
                  cy={H - b.h - 42}
                  r={4}
                  fill="#ff4b6e"
                  opacity={lights * (0.3 + 0.7 * (Math.sin(frame * 0.15 + i) > 0 ? 1 : 0))}
                />
              </>
            )}
            {lights > 0 &&
              b.windows.map((w, j) => (
                <rect key={j} x={b.x + w.x} y={H - b.h + w.y} width={8} height={11} fill={w.c} opacity={lights * 0.8} />
              ))}
          </g>
        ))}
      </g>
    </g>
  );
};

// ---------- 視差高樓層（穿梭場景用，可無限捲動） ----------
type TowerLayerProps = {
  seed: string;
  frame: number;
  speed: number;
  color: string;
  minH: number;
  maxH: number;
  gap: number;
  window: string;
  windowOpacity: number;
  neon?: boolean;
};

export const TowerLayer: React.FC<TowerLayerProps> = ({seed, frame, speed, color, minH, maxH, gap, window, windowOpacity, neon}) => {
  const towers = new Array(14).fill(0).map((_, i) => ({
    w: 120 + random(`${seed}-tw-${i}`) * 160,
    h: minH + random(`${seed}-th-${i}`) * (maxH - minH),
    neonColor: random(`${seed}-nc-${i}`) > 0.5 ? '#ff4fd8' : '#3ee7ff',
    hasNeon: random(`${seed}-hn-${i}`) > 0.45,
  }));
  const offsets: number[] = [];
  let span = 0;
  for (const t of towers) {
    offsets.push(span);
    span += t.w + gap;
  }
  const shift = (((frame * speed) % span) + span) % span;
  return (
    <g>
      {[0, 1].map((rep) =>
        towers.map((t, i) => {
          const xx = offsets[i] - shift + rep * span;
          if (xx > W + 50 || xx + t.w < -50) return null;
          const y = H - t.h;
          return (
            <g key={`${rep}-${i}`}>
              <rect x={xx} y={y} width={t.w} height={t.h} fill={color} />
              <g opacity={windowOpacity}>
                {new Array(Math.floor(t.h / 34)).fill(0).map((_, r) => (
                  <rect key={r} x={xx + 14} y={y + 20 + r * 34} width={t.w - 28} height={6} fill={window} opacity={(r * 7 + i) % 5 === 0 ? 0.9 : 0.25} />
                ))}
              </g>
              {neon && t.hasNeon && (
                <rect x={xx - 2} y={y} width={t.w + 4} height={5} fill={t.neonColor} style={{filter: `drop-shadow(0 0 10px ${t.neonColor})`}} />
              )}
            </g>
          );
        }),
      )}
    </g>
  );
};
