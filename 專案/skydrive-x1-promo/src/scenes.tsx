import {AbsoluteFill, Easing, interpolate, random, useCurrentFrame} from 'remotion';
import {Skyline, STARS, Stars, TowerLayer} from './Backdrop';
import {Caption} from './Caption';
import {FlyingCar} from './FlyingCar';
import {bezier, clamp, FONT, H, MONO, NEON, NEON_PINK, W} from './theme';

const CL = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const DEG = 180 / Math.PI;

const Svg: React.FC<{children: React.ReactNode}> = ({children}) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{position: 'absolute', inset: 0}}>
    {children}
  </svg>
);

const NightSky: React.FC = () => (
  <>
    <defs>
      <linearGradient id="night" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#01030d" />
        <stop offset="0.55" stopColor="#081640" />
        <stop offset="1" stopColor="#173a7a" />
      </linearGradient>
    </defs>
    <rect width={W} height={H} fill="url(#night)" />
  </>
);

const Moon: React.FC<{cx: number; cy: number}> = ({cx, cy}) => (
  <g>
    <defs>
      <radialGradient id="moonGlow">
        <stop offset="0" stopColor="#bfe6ff" stopOpacity="0.45" />
        <stop offset="1" stopColor="#bfe6ff" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="moonFace" cx="0.4" cy="0.38">
        <stop offset="0" stopColor="#ffffff" />
        <stop offset="0.7" stopColor="#dbe8f5" />
        <stop offset="1" stopColor="#a9bdd6" />
      </radialGradient>
    </defs>
    <circle cx={cx} cy={cy} r={360} fill="url(#moonGlow)" />
    <circle cx={cx} cy={cy} r={120} fill="url(#moonFace)" />
    <g fill="#9fb3cc" opacity={0.35}>
      <circle cx={cx - 38} cy={cy - 24} r={22} />
      <circle cx={cx + 30} cy={cy + 30} r={30} />
      <circle cx={cx + 44} cy={cy - 46} r={12} />
      <circle cx={cx - 50} cy={cy + 52} r={10} />
    </g>
  </g>
);

// ===== 0–9s：夜幕城市 + 飛天車亮相 =====
const P0: [number, number] = [-420, 660];
const P1: [number, number] = [520, 150];
const P2: [number, number] = [1250, 760];
const P3: [number, number] = [2400, 300];
const carT = (f: number) => interpolate(f, [118, 268], [0, 1], {...CL, easing: Easing.bezier(0.15, 0.75, 0.85, 0.25)});

export const NightCityScene: React.FC = () => {
  const f = useCurrentFrame();
  const moonY = interpolate(f, [0, 130], [980, 290], {...CL, easing: Easing.out(Easing.cubic)});
  const rise = interpolate(f, [8, 110], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
  const lights = interpolate(f, [60, 115], [0, 1], CL);

  const t = carT(f);
  const [cx, cy] = bezier(t, P0, P1, P2, P3);
  const [nx, ny] = bezier(Math.min(1, t + 0.01), P0, P1, P2, P3);
  const tilt = clamp(Math.atan2(ny - cy, nx - cx) * DEG * 0.7, -25, 25);
  const carOn = f >= 116;

  // 發光尾跡：以過去的位置畫出漸隱軌跡
  const trail: [number, number][] = [];
  for (let k = 0; k < 46; k++) {
    const tk = carT(f - k * 0.9);
    if (tk <= 0) break;
    const [px, py] = bezier(tk, P0, P1, P2, P3);
    trail.push([px - 150, py + 10]);
  }

  return (
    <AbsoluteFill>
      <Svg>
        <NightSky />
        <Stars frame={f} opacity={interpolate(f, [0, 40], [0, 1], CL)} />
        <Moon cx={250} cy={moonY} />
        <Skyline frame={f} rise={rise} lights={lights} offsetX={-f * 0.15} />
        {carOn && (
          <>
            <g style={{mixBlendMode: 'screen'}}>
              {trail.slice(1).map(([x, y], i) => {
                const [x0, y0] = trail[i];
                const a = 1 - i / trail.length;
                return (
                  <line
                    key={i}
                    x1={x0}
                    y1={y0}
                    x2={x}
                    y2={y}
                    stroke={i < 3 ? '#ffffff' : NEON}
                    strokeWidth={2 + 16 * a}
                    strokeLinecap="round"
                    opacity={0.75 * a}
                    style={{filter: `drop-shadow(0 0 12px ${NEON})`}}
                  />
                );
              })}
              {trail.slice(4).map(([x, y], i) => (
                <circle
                  key={`p${i}`}
                  cx={x + (random(`tp-${i}`) - 0.5) * 40}
                  cy={y + (random(`tq-${i}`) - 0.5) * 50}
                  r={1.5 + random(`tr-${i}`) * 2.5}
                  fill="#c8f7ff"
                  opacity={(1 - i / trail.length) * 0.9}
                />
              ))}
            </g>
            <FlyingCar id="c1" frame={f} x={cx} y={cy} scale={0.9} tilt={tilt} thrust={0.8} boost={0.15} />
          </>
        )}
      </Svg>
      <Caption text="2045．台北" from={15} to={114} y={430} size={104} weight={300} spacing={0.3} />
      <Caption text="SKYDRIVE X-1" from={168} to={270} y={120} size={168} weight={800} spacing={0.08} fade={22} />
    </AbsoluteFill>
  );
};

// ===== 9–14s：穿梭大樓 =====
const RING_SPEED = 15;
const weaveX = (f: number) => 880 + 130 * Math.sin(f * 0.035) + interpolate(f, [0, 34], [-1100, 0], {...CL, easing: Easing.out(Easing.cubic)});
const weaveY = (f: number) => 470 + 200 * Math.sin(f * 0.072 + 0.4);
const ringX = (f: number) => 2350 - f * RING_SPEED;
// 找出光環與車交會的時間，讓光環高度對準飛天車
const CROSS = (() => {
  let best = 0;
  for (let f = 0; f < 160; f++) if (Math.abs(ringX(f) - weaveX(f)) < Math.abs(ringX(best) - weaveX(best))) best = f;
  return best;
})();
const RING_Y = weaveY(CROSS) + 8;

export const WeaveScene: React.FC = () => {
  const f = useCurrentFrame();
  const x = weaveX(f);
  const y = weaveY(f);
  const vy = weaveY(f + 1) - y;
  const vx = weaveX(f + 1) - x + 18;
  const tilt = clamp(Math.atan2(vy, vx) * DEG * 0.8, -24, 24);
  const rx = ringX(f);
  const flash = interpolate(Math.abs(f - CROSS), [0, 8], [1, 0], CL);

  const ringPath = (side: 1 | -1) => `M ${rx} ${RING_Y - 200} A 58 200 0 0 ${side === 1 ? 1 : 0} ${rx} ${RING_Y + 200}`;

  return (
    <AbsoluteFill>
      <Svg>
        <NightSky />
        <Stars frame={f + 300} opacity={0.6} />
        <Skyline frame={f} rise={1} lights={0.6} offsetX={-f * 1.2} farColor="#0b1838" nearColor="#0a1430" />
        <TowerLayer seed="far" frame={f} speed={5} color="#0a1430" minH={420} maxH={760} gap={60} window="#5fb8ff" windowOpacity={0.35} />
        <TowerLayer seed="mid" frame={f} speed={11} color="#060c22" minH={300} maxH={900} gap={240} window="#ffd88a" windowOpacity={0.5} neon />
        {/* 光環後半 */}
        <path d={ringPath(-1)} stroke={NEON_PINK} strokeWidth={14} fill="none" opacity={0.55} style={{filter: `drop-shadow(0 0 16px ${NEON_PINK})`}} />
        {/* 速度線 */}
        {new Array(24).fill(0).map((_, i) => {
          const sy = random(`wl-${i}`) * H;
          const len = 120 + random(`wll-${i}`) * 260;
          const sx = (((random(`wlx-${i}`) * (W + 600) - f * 40) % (W + 600)) + W + 600) % (W + 600) - 300;
          return <line key={i} x1={sx} y1={sy} x2={sx + len} y2={sy} stroke="#9fdcff" strokeWidth={2} opacity={0.18} />;
        })}
        <FlyingCar id="c2" frame={f} x={x} y={y} scale={0.85} tilt={tilt} thrust={0.7} boost={0.35} />
        {/* 光環前半 */}
        <path d={ringPath(1)} stroke={NEON_PINK} strokeWidth={16} fill="none" style={{filter: `drop-shadow(0 0 22px ${NEON_PINK})`}} />
        <path d={ringPath(1)} stroke="#ffd6f6" strokeWidth={4} fill="none" />
        <ellipse cx={rx} cy={RING_Y} rx={58 + 120 * flash} ry={200 + 60 * flash} fill="none" stroke="#ffffff" strokeWidth={6} opacity={flash * 0.7} />
        <TowerLayer seed="near" frame={f} speed={26} color="#02040b" minH={160} maxH={360} gap={520} window="#3ee7ff" windowOpacity={0.6} neon />
      </Svg>
      <AbsoluteFill style={{backgroundColor: NEON_PINK, opacity: flash * 0.12, mixBlendMode: 'screen'}} />
    </AbsoluteFill>
  );
};

// ===== 14–19s：自主飛行 HUD =====
const Bracket: React.FC<{x: number; y: number; w: number; h: number; o: number}> = ({x, y, w, h, o}) => {
  const L = 46;
  const c = (sx: number, sy: number, dx: number, dy: number) => `M ${sx + dx * L} ${sy} L ${sx} ${sy} L ${sx} ${sy + dy * L}`;
  return (
    <g stroke={NEON} strokeWidth={4} fill="none" opacity={o} style={{filter: `drop-shadow(0 0 8px ${NEON})`}}>
      <path d={c(x, y, 1, 1)} />
      <path d={c(x + w, y, -1, 1)} />
      <path d={c(x, y + h, 1, -1)} />
      <path d={c(x + w, y + h, -1, -1)} />
    </g>
  );
};

export const HoverScene: React.FC = () => {
  const f = useCurrentFrame();
  const x = interpolate(f, [0, 60], [-380, 900], {...CL, easing: Easing.out(Easing.cubic)});
  const y = 500 + 14 * Math.sin(f * 0.08);
  const tilt = interpolate(f, [0, 30, 60, 80], [4, -12, -3, 0], CL) + Math.sin(f * 0.05) * 1.2;
  const hud = interpolate(f, [52, 70], [0, 1], CL);
  const box = interpolate(f, [52, 72], [1.6, 1], {...CL, easing: Easing.out(Easing.back(1.4))});
  const typed = (s: string, start: number) => s.slice(0, Math.max(0, Math.floor((f - start) * 1.2)));
  const dest: [number, number] = [1480, 230];
  const route = `M ${x + 40} ${y - 30} C ${x + 300} ${y - 330} ${dest[0] - 360} ${dest[1] + 260} ${dest[0]} ${dest[1]}`;
  const routeReveal = interpolate(f, [62, 100], [1400, 0], CL);
  const bw = 520 * box;
  const bh = 300 * box;

  return (
    <AbsoluteFill>
      <Svg>
        <NightSky />
        <Stars frame={f + 600} opacity={0.8} />
        <Skyline frame={f} rise={1} lights={1} offsetX={-60 - f * 0.4} />
        <rect width={W} height={H} fill="#020818" opacity={0.25 * hud} />

        {/* 掃描圈 */}
        <g opacity={hud * 0.9} transform={`translate(${x} ${y})`}>
          <g transform={`rotate(${f * 2})`}>
            <circle r={300} fill="none" stroke={NEON} strokeWidth={2} strokeDasharray="14 18" opacity={0.6} />
          </g>
          <g transform={`rotate(${-f * 3.2})`}>
            <circle r={350} fill="none" stroke={NEON} strokeWidth={6} strokeDasharray="140 410" opacity={0.7} />
            <circle r={350} fill="none" stroke={NEON} strokeWidth={1} opacity={0.3} />
          </g>
          <g transform={`rotate(${f * 4})`}>
            <path d="M 0 0 L 300 0 A 300 300 0 0 0 260 -150 Z" fill={NEON} opacity={0.12} />
          </g>
          {new Array(36).fill(0).map((_, i) => (
            <line
              key={i}
              x1={0}
              y1={-380}
              x2={0}
              y2={i % 3 === 0 ? -400 : -390}
              stroke={NEON}
              strokeWidth={2}
              transform={`rotate(${i * 10})`}
              opacity={0.6}
            />
          ))}
        </g>

        {/* 航線虛線 + 目的地 */}
        <g opacity={hud}>
          <path d={route} stroke={NEON} strokeWidth={4} fill="none" strokeDasharray="1400" strokeDashoffset={routeReveal} opacity={0.25} />
          <path
            d={route}
            stroke={NEON}
            strokeWidth={4}
            fill="none"
            strokeDasharray="18 16"
            strokeDashoffset={-f * 3}
            style={{filter: `drop-shadow(0 0 6px ${NEON})`}}
            mask="url(#routeMask)"
          />
          <mask id="routeMask">
            <path d={route} stroke="#fff" strokeWidth={10} fill="none" strokeDasharray="1400" strokeDashoffset={routeReveal} />
          </mask>
          <g transform={`translate(${dest[0]} ${dest[1]})`} opacity={interpolate(f, [92, 102], [0, 1], CL)}>
            <rect x={-18} y={-18} width={36} height={36} transform="rotate(45)" fill="none" stroke={NEON_PINK} strokeWidth={4} />
            <circle r={6 + 26 * ((f % 30) / 30)} fill="none" stroke={NEON_PINK} strokeWidth={2} opacity={1 - (f % 30) / 30} />
            <text x={34} y={-14} fill="#ffd6f6" fontFamily={MONO} fontSize={24}>
              DEST ▸ 信義 A7 停機坪
            </text>
            <text x={34} y={18} fill="#ffd6f6" fontFamily={MONO} fontSize={20} opacity={0.75}>
              ETA 04:12
            </text>
          </g>
        </g>

        <Bracket x={x - bw / 2} y={y - bh / 2 - 20} w={bw} h={bh} o={hud} />
        <FlyingCar id="c3" frame={f} x={x} y={y} scale={0.95} tilt={tilt} thrust={interpolate(f, [0, 60], [0.4, 1], CL)} />

        {/* 左側資訊面板 */}
        <g opacity={hud} fontFamily={MONO} fontSize={26} fill="#bff6ff">
          <rect x={90} y={210} width={360} height={260} fill="#03132c" opacity={0.55} stroke={NEON} strokeWidth={1.5} />
          <rect x={90} y={210} width={360} height={36} fill={NEON} opacity={0.2} />
          <text x={108} y={236} fontSize={20} fill={NEON}>
            SKYDRIVE OS v4.5
          </text>
          <text x={108} y={290}>{typed('AUTOPILOT ▸ ON', 64)}</text>
          <text x={108} y={330}>{typed('ALT   320 m', 74)}</text>
          <text x={108} y={370}>{typed('SPD     0 km/h', 82)}</text>
          <text x={108} y={410}>{typed('BATT   98 %', 90)}</text>
          <text x={108} y={450} fill="#7dffb2">
            {typed('CO₂     0 g/km', 98)}
          </text>
        </g>
      </Svg>
      <Caption text="AI 自主導航" from={62} to={162} y={800} size={84} weight={700} spacing={0.2} />
      <Caption text="零排放電力驅動" from={88} to={162} y={915} size={50} weight={400} spacing={0.32} glow="#7dffb2" />
    </AbsoluteFill>
  );
};

// ===== 19–24s：加速巡航（warp） =====
const warpSpeed = (f: number) => interpolate(f, [0, 16, 70], [1.5, 3, 95], {...CL, easing: Easing.in(Easing.quad)});
const WARP_DIST: number[] = (() => {
  const d = [0];
  for (let i = 1; i < 200; i++) d.push(d[i - 1] + warpSpeed(i));
  return d;
})();
const PARTICLES = new Array(90).fill(0).map((_, i) => ({
  y: random(`wp-y-${i}`) * H,
  x: random(`wp-x-${i}`) * W,
  depth: 0.4 + random(`wp-d-${i}`) * 1.6,
  color: random(`wp-c-${i}`) > 0.7 ? NEON_PINK : NEON,
}));

export const WarpScene: React.FC = () => {
  const f = useCurrentFrame();
  const v = warpSpeed(f);
  const dist = WARP_DIST[Math.min(f, WARP_DIST.length - 1)];
  const boost = interpolate(f, [14, 40], [0, 1], CL);
  const shake = v > 20 ? (random(`sh-${f}`) - 0.5) * Math.min(8, v * 0.08) : 0;
  const x = 860 + interpolate(f, [14, 50, 150], [-80, 220, 260], {...CL, easing: Easing.out(Easing.cubic)}) + shake;
  const y = 520 + shake * 0.6 + Math.sin(f * 0.1) * 6;
  const tilt = interpolate(f, [0, 14, 30, 70], [0, 4, -5, -2], CL);
  const flash = interpolate(f, [14, 18, 36], [0, 0.45, 0], CL);
  const kmh = Math.round(interpolate(f, [16, 106], [0, 300], {...CL, easing: Easing.out(Easing.quad)}));
  const wrap = (n: number, m: number) => ((n % m) + m) % m;

  return (
    <AbsoluteFill>
      <Svg>
        <defs>
          <radialGradient id="warpBg" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0" stopColor="#0b2a66" />
            <stop offset="0.6" stopColor="#040b26" />
            <stop offset="1" stopColor="#010208" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#warpBg)" />
        {/* 星星 → 流光 */}
        {STARS.map((s, i) => {
          const depth = 0.3 + s.r / 2.4;
          const len = Math.max(s.r * 2, v * depth * 3.2);
          const sx = wrap(s.x - dist * depth, W + 800) - 400;
          return (
            <g key={i}>
              <line x1={sx} y1={s.y + 80} x2={sx + len} y2={s.y + 80} stroke="#e6f8ff" strokeWidth={s.r * 1.2} strokeLinecap="round" opacity={0.85} />
              {s.glint && (
                <g transform={`translate(${sx} ${s.y + 80})`} opacity={clamp(v / 40, 0.3, 1)}>
                  <path d={`M -${8 + v} 0 L 0 -3 L ${8 + v} 0 L 0 3 Z`} fill="#ffffff" />
                  <path d={`M 0 -${8 + v * 0.6} L 3 0 L 0 ${8 + v * 0.6} L -3 0 Z`} fill="#ffffff" />
                  <circle r={4} fill="#ffffff" style={{filter: 'drop-shadow(0 0 8px #9fe6ff)'}} />
                </g>
              )}
            </g>
          );
        })}
        {/* 光粒子 */}
        {PARTICLES.map((p, i) => {
          const len = 10 + v * p.depth * 6;
          const px = wrap(p.x - dist * p.depth * 1.6, W + 1200) - 600;
          return (
            <line
              key={`p${i}`}
              x1={px}
              y1={p.y}
              x2={px + len}
              y2={p.y}
              stroke={p.color}
              strokeWidth={2 + p.depth * 2}
              strokeLinecap="round"
              opacity={clamp(v / 30, 0.15, 0.85)}
              style={{filter: `drop-shadow(0 0 6px ${p.color})`}}
            />
          );
        })}
        <FlyingCar id="c4" frame={f} x={x} y={y} scale={1} tilt={tilt} thrust={0.5} boost={boost} />
        {/* 速度表 */}
        <g transform="translate(1660 190)" opacity={interpolate(f, [14, 24], [0, 1], CL)}>
          <circle r={110} fill="#020a1e" opacity={0.6} stroke={NEON} strokeWidth={2} />
          <circle
            r={92}
            fill="none"
            stroke={NEON}
            strokeWidth={12}
            strokeDasharray={`${(kmh / 300) * 2 * Math.PI * 92 * 0.75} 1000`}
            transform="rotate(135)"
            strokeLinecap="round"
            style={{filter: `drop-shadow(0 0 10px ${NEON})`}}
          />
          <text y={18} textAnchor="middle" fill="#ffffff" fontFamily={MONO} fontSize={58} fontWeight={700}>
            {kmh}
          </text>
          <text y={58} textAnchor="middle" fill={NEON} fontFamily={MONO} fontSize={22}>
            km/h
          </text>
        </g>
      </Svg>
      <AbsoluteFill style={{backgroundColor: '#dff8ff', opacity: flash}} />
      <Caption text="0→300km/h　6秒" from={30} to={162} y={830} size={96} weight={800} spacing={0.06} fade={14} />
    </AbsoluteFill>
  );
};

// ===== 24–28s：夕陽巡航 =====
export const SunsetScene: React.FC = () => {
  const f = useCurrentFrame();
  const t = interpolate(f, [0, 128], [0, 1], {...CL, easing: Easing.inOut(Easing.sin)});
  const sun: [number, number] = [1340, 800 - f * 0.35];
  const x = interpolate(t, [0, 1], [420, sun[0] - 30]);
  const y = interpolate(t, [0, 1], [430, sun[1] - 70]);
  const scale = interpolate(t, [0, 1], [1.05, 0.09]);

  return (
    <AbsoluteFill>
      <Svg>
        <defs>
          <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1d0b45" />
            <stop offset="0.35" stopColor="#5a1f73" />
            <stop offset="0.62" stopColor="#d2457a" />
            <stop offset="0.82" stopColor="#ff8a3d" />
            <stop offset="1" stopColor="#ffd58a" />
          </linearGradient>
          <radialGradient id="sunGlow">
            <stop offset="0" stopColor="#fff3c4" stopOpacity="0.95" />
            <stop offset="0.25" stopColor="#ffb35c" stopOpacity="0.55" />
            <stop offset="1" stopColor="#ff6a3d" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width={W} height={H} fill="url(#dawn)" />
        <Stars frame={f} opacity={interpolate(f, [0, 60], [0.5, 0], CL)} />
        {/* 光芒 */}
        <g transform={`translate(${sun[0]} ${sun[1]}) rotate(${f * 0.15})`} opacity={0.18}>
          {new Array(14).fill(0).map((_, i) => (
            <path key={i} d="M 0 0 L 1400 -60 L 1400 60 Z" fill="#fff0c0" transform={`rotate(${i * (360 / 14)})`} />
          ))}
        </g>
        <circle cx={sun[0]} cy={sun[1]} r={520} fill="url(#sunGlow)" />
        <circle cx={sun[0]} cy={sun[1]} r={115} fill="#fff1c9" />
        {/* 雲帶 */}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={-200 + ((f * (0.6 + i * 0.25) + i * 400) % 600) - 300}
            y={520 + i * 70}
            width={2600}
            height={10 + i * 4}
            rx={8}
            fill={i % 2 ? '#ffb3a0' : '#c75a8c'}
            opacity={0.35}
          />
        ))}
        <Skyline frame={f} rise={1} lights={0} offsetX={-f * 0.3} farColor="#5a2357" nearColor="#24102c" />
        <FlyingCar id="c5" frame={f} x={x} y={y} scale={scale} tilt={6} thrust={0} boost={0.25} silhouette />
      </Svg>
      <Caption text="城市，不再有路" from={18} to={128} y={170} size={92} weight={500} spacing={0.3} color="#fff4e6" glow="#ff7a45" fade={20} />
    </AbsoluteFill>
  );
};

// ===== 28–30s：收尾 Logo =====
const FLICKER = [0, 1, 0, 0, 1, 1, 0, 1, 1, 1, 0.4, 1];

export const LogoScene: React.FC = () => {
  const f = useCurrentFrame();
  const on = f < FLICKER.length ? FLICKER[f] : 1;
  const glow = interpolate(f, [0, 20], [0.4, 1], CL);
  const line = interpolate(f, [10, 30], [0, 1], {...CL, easing: Easing.out(Easing.cubic)});
  const sub = interpolate(f, [22, 36], [0, 1], CL);
  return (
    <AbsoluteFill style={{backgroundColor: '#000', alignItems: 'center', justifyContent: 'center'}}>
      <AbsoluteFill style={{background: `radial-gradient(ellipse at center, rgba(31,123,255,${0.22 * glow}) 0%, rgba(0,0,0,0) 55%)`}} />
      <svg width={420} height={150} viewBox="-210 -110 420 170" style={{opacity: on, marginBottom: 10}}>
        <g fill="none" stroke={NEON} strokeWidth={5} strokeLinejoin="round" style={{filter: `drop-shadow(0 0 10px ${NEON}) drop-shadow(0 0 24px ${NEON})`}}>
          <path d="M -195 -4 C -155 -36 -60 -42 0 -40 C 85 -38 155 -26 200 6 C 178 32 100 42 0 42 C -95 42 -165 32 -195 12 Z" />
          <path d="M -60 -38 C -40 -100 95 -98 128 -30" />
          <line x1={-200} y1={-62} x2={-36} y2={-62} />
          <line x1={36} y1={-62} x2={200} y2={-62} />
        </g>
      </svg>
      <div
        style={{
          fontFamily: FONT,
          fontSize: 150,
          fontWeight: 800,
          letterSpacing: '0.1em',
          color: '#f0fdff',
          opacity: on,
          textShadow: `0 0 ${14 * glow}px ${NEON}, 0 0 ${40 * glow}px ${NEON}, 0 0 ${90 * glow}px #1f7bff`,
        }}
      >
        SKYDRIVE X-1
      </div>
      <div style={{width: 900 * line, height: 3, background: NEON, boxShadow: `0 0 16px ${NEON}`, margin: '18px 0 26px'}} />
      <div
        style={{
          fontFamily: FONT,
          fontSize: 44,
          fontWeight: 400,
          letterSpacing: '0.4em',
          color: '#cfefff',
          opacity: sub,
          whiteSpace: 'pre',
          textShadow: `0 0 12px ${NEON}88`,
        }}
      >
        {'SKYDRIVE　未來，起飛'}
      </div>
    </AbsoluteFill>
  );
};
