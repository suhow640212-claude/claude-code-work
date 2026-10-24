import {AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {HoverScene, LogoScene, NightCityScene, SunsetScene, WarpScene, WeaveScene} from './scenes';

// 場景交疊淡入淡出
const Fade: React.FC<{dur: number; fin?: number; fout?: number; children: React.ReactNode}> = ({
  dur,
  fin = 10,
  fout = 10,
  children,
}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [0, Math.max(fin, 0.01), dur - Math.max(fout, 0.01), dur], [fin ? 0 : 1, 1, 1, fout ? 0 : 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return <AbsoluteFill style={{opacity: o}}>{children}</AbsoluteFill>;
};

// [起始幀, 長度, 淡入, 淡出, 場景]
const SCENES: [number, number, number, number, React.FC][] = [
  [0, 276, 0, 12, NightCityScene], // 0–9s：夜幕城市 + 飛天車亮相
  [264, 162, 12, 12, WeaveScene], // 9–14s：穿梭大樓
  [414, 162, 12, 12, HoverScene], // 14–19s：自主飛行 HUD
  [564, 162, 12, 10, WarpScene], // 19–24s：加速巡航
  [716, 130, 10, 10, SunsetScene], // 24–28s：夕陽巡航
  [838, 62, 8, 0, LogoScene], // 28–30s：收尾 Logo
];

export const Promo: React.FC = () => (
  <AbsoluteFill style={{backgroundColor: '#000'}}>
    {SCENES.map(([from, dur, fin, fout, Scene], i) => (
      <Sequence key={i} from={from} durationInFrames={dur}>
        <Fade dur={dur} fin={fin} fout={fout}>
          <Scene />
        </Fade>
      </Sequence>
    ))}
    {/* 暗角 */}
    <AbsoluteFill
      style={{background: 'radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)', pointerEvents: 'none'}}
    />
    <Audio src={staticFile('soundtrack.wav')} />
  </AbsoluteFill>
);
