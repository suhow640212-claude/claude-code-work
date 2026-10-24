import {interpolate, useCurrentFrame} from 'remotion';
import {FONT, NEON} from './theme';

type Props = {
  text: string;
  from: number;
  to: number;
  fade?: number;
  y?: number;
  size?: number;
  weight?: number;
  spacing?: number;
  color?: string;
  glow?: string;
  align?: 'center' | 'left';
  x?: number;
};

// 淡入淡出字幕：from/to 為場景內的幀
export const Caption: React.FC<Props> = ({
  text,
  from,
  to,
  fade = 15,
  y = 860,
  size = 64,
  weight = 600,
  spacing = 0.18,
  color = '#eafcff',
  glow = NEON,
  align = 'center',
  x = 0,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [from, from + fade, to - fade, to], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const rise = interpolate(frame, [from, from + fade], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const blur = interpolate(frame, [from, from + fade], [10, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (opacity <= 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        left: align === 'center' ? 0 : x,
        right: align === 'center' ? 0 : undefined,
        top: y,
        textAlign: align,
        fontFamily: FONT,
        fontSize: size,
        fontWeight: weight,
        letterSpacing: `${spacing}em`,
        color,
        opacity,
        transform: `translateY(${rise}px)`,
        filter: `blur(${blur}px)`,
        textShadow: `0 0 12px ${glow}, 0 0 32px ${glow}aa, 0 0 64px ${glow}55`,
        whiteSpace: 'pre',
      }}
    >
      {text}
    </div>
  );
};
