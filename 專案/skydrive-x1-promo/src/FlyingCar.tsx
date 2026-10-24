import {random} from 'remotion';
import {NEON, NEON_DEEP} from './theme';

type Props = {
  id: string;
  frame: number;
  x: number;
  y: number;
  scale?: number;
  tilt?: number; // 度，正值機頭朝下
  thrust?: number; // 底部推進光焰 0–1
  boost?: number; // 尾部加速光焰 0–1
  silhouette?: boolean;
  silhouetteColor?: string;
};

// 側視旋翼：葉片投影長度隨轉角 cos 變化，加上半透明模糊盤面
const Rotor: React.FC<{cx: number; cy: number; frame: number; phase: number; sil: boolean; color: string}> = ({
  cx,
  cy,
  frame,
  phase,
  sil,
  color,
}) => {
  const a = frame * 1.9 + phase;
  const blades = [0, Math.PI / 2].map((o) => 78 * Math.cos(a + o));
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={84} ry={9} fill={sil ? color : NEON} opacity={sil ? 0.45 : 0.18} />
      {!sil && <ellipse cx={cx} cy={cy} rx={84} ry={9} fill="none" stroke={NEON} strokeWidth={1.5} opacity={0.55} />}
      {blades.map((l, i) => (
        <line
          key={i}
          x1={cx - l}
          y1={cy}
          x2={cx + l}
          y2={cy}
          stroke={sil ? color : '#d9f6ff'}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.85}
        />
      ))}
      <rect x={cx - 7} y={cy - 2} width={14} height={30} rx={4} fill={sil ? color : '#2a3550'} />
      <circle cx={cx} cy={cy} r={6} fill={sil ? color : '#9fefff'} />
    </g>
  );
};

export const FlyingCar: React.FC<Props> = ({
  id,
  frame,
  x,
  y,
  scale = 1,
  tilt = 0,
  thrust = 0.6,
  boost = 0,
  silhouette = false,
  silhouetteColor = '#1a0b22',
}) => {
  const sil = silhouette;
  const flick = 0.85 + 0.15 * Math.sin(frame * 1.7) + 0.1 * (random(`f-${id}-${frame}`) - 0.5);
  const flameLen = (40 + 70 * thrust) * flick;
  const boostLen = (60 + 380 * boost) * flick;
  const body = sil ? silhouetteColor : `url(#body-${id})`;

  return (
    <g transform={`translate(${x} ${y}) rotate(${tilt}) scale(${scale})`}>
      <defs>
        <linearGradient id={`body-${id}`} x1="0" y1="-40" x2="0" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#e8f1ff" />
          <stop offset="0.45" stopColor="#8796b8" />
          <stop offset="1" stopColor="#1b2238" />
        </linearGradient>
        <linearGradient id={`glass-${id}`} x1="0" y1="-90" x2="0" y2="-30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#bff8ff" />
          <stop offset="0.5" stopColor="#2aa6d8" />
          <stop offset="1" stopColor="#06253f" />
        </linearGradient>
        <linearGradient id={`flame-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.25" stopColor={NEON} />
          <stop offset="1" stopColor={NEON_DEEP} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`boost-${id}`} x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.2" stopColor={NEON} />
          <stop offset="1" stopColor={NEON_DEEP} stopOpacity="0" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur stdDeviation="6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* 推進光焰 */}
      {!sil && thrust > 0 && (
        <g filter={`url(#glow-${id})`}>
          <path
            d={`M -62 38 Q -50 ${38 + flameLen} -40 ${38 + flameLen * 1.05} Q -30 ${38 + flameLen} -18 38 Z`}
            fill={`url(#flame-${id})`}
          />
          <path
            d={`M 38 34 Q 48 ${34 + flameLen * 0.8} 56 ${34 + flameLen * 0.85} Q 64 ${34 + flameLen * 0.8} 74 34 Z`}
            fill={`url(#flame-${id})`}
          />
        </g>
      )}
      {boost > 0 && (
        <g filter={sil ? undefined : `url(#glow-${id})`}>
          <path
            d={`M -186 -8 Q ${-186 - boostLen} -2 ${-186 - boostLen * 1.05} 2 Q ${-186 - boostLen} 6 -186 12 Z`}
            fill={sil ? '#ffd9a0' : `url(#boost-${id})`}
            opacity={sil ? 0.6 : 1}
          />
        </g>
      )}

      {/* 後旋翼（遠側，較暗） */}
      <g opacity={sil ? 1 : 0.55}>
        <Rotor cx={-118} cy={-58} frame={frame} phase={1.1} sil={sil} color={silhouetteColor} />
      </g>

      {/* 尾翼 */}
      <path d="M -150 -18 L -196 -70 L -170 -70 L -110 -24 Z" fill={sil ? silhouetteColor : '#5b6a8c'} />

      {/* 機身 */}
      <path
        d="M -195 -4 C -155 -36 -60 -42 0 -40 C 85 -38 155 -26 200 6 C 178 32 100 42 0 42 C -95 42 -165 32 -195 12 Z"
        fill={body}
      />
      {/* 推進器噴口 */}
      <rect x={-66} y={32} width={52} height={10} rx={5} fill={sil ? silhouetteColor : '#0e1424'} />
      <rect x={34} y={28} width={44} height={10} rx={5} fill={sil ? silhouetteColor : '#0e1424'} />

      {/* 座艙穹頂 */}
      <path d="M -60 -38 C -40 -100 95 -98 128 -30 Z" fill={sil ? silhouetteColor : `url(#glass-${id})`} />
      {!sil && (
        <>
          <path d="M -30 -46 C -15 -82 40 -86 70 -70" stroke="#ffffff" strokeWidth={5} fill="none" opacity={0.6} strokeLinecap="round" />
          {/* 霓虹腰線 */}
          <path
            d="M -185 6 C -100 14 60 16 190 8"
            stroke={NEON}
            strokeWidth={4}
            fill="none"
            filter={`url(#glow-${id})`}
          />
          {/* 頭燈 / 尾燈 */}
          <circle cx={192} cy={6} r={7} fill="#ffffff" filter={`url(#glow-${id})`} />
          <circle cx={-190} cy={4} r={5} fill="#ff3b6b" filter={`url(#glow-${id})`} />
        </>
      )}
      {sil && <path d="M -185 6 C -100 14 60 16 190 8" stroke="#ffb36b" strokeWidth={3} fill="none" opacity={0.7} />}

      {/* 前旋翼（近側） */}
      <Rotor cx={118} cy={-58} frame={frame} phase={0} sil={sil} color={silhouetteColor} />
    </g>
  );
};
