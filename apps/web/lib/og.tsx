import { MASCOT_VIEWBOX, getMascotShapes, getTheme, type ThemeId } from '@childgpt/shared';

// Луми для ImageResponse (Satori понимает базовый SVG: circle, ellipse, path).
export function LumiSvg({ size, theme = 'boy' }: { size: number; theme?: ThemeId }) {
  const shapes = getMascotShapes(theme, getTheme(theme).colors.mascotAccent);
  return (
    <svg width={size} height={size} viewBox={MASCOT_VIEWBOX}>
      {shapes.map((s, i) =>
        s.kind === 'circle' ? (
          <circle key={i} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} opacity={s.opacity} />
        ) : s.kind === 'ellipse' ? (
          <ellipse
            key={i}
            cx={s.cx}
            cy={s.cy}
            rx={s.rx}
            ry={s.ry}
            fill={s.fill}
            opacity={s.opacity}
            transform={s.rotate ? `rotate(${s.rotate} ${s.cx} ${s.cy})` : undefined}
          />
        ) : (
          <path key={i} d={s.d} fill={s.fill} stroke={s.stroke} strokeWidth={s.strokeWidth} strokeLinecap="round" opacity={s.opacity} />
        ),
      )}
    </svg>
  );
}
