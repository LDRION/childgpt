import { MASCOT_VIEWBOX, getMascotShapes, getTheme, type ThemeId } from '@childgpt/shared';

interface LumiProps {
  theme?: ThemeId;
  size?: number;
  float?: boolean;
  className?: string;
  title?: string;
}

export function Lumi({ theme = 'boy', size = 160, float = true, className, title = 'Совёнок Луми' }: LumiProps) {
  const shapes = getMascotShapes(theme, getTheme(theme).colors.mascotAccent);
  return (
    <svg
      viewBox={MASCOT_VIEWBOX}
      width={size}
      height={size}
      role="img"
      aria-label={title}
      className={['lumi', float ? 'lumi--float' : '', className ?? ''].join(' ').trim()}
    >
      <title>{title}</title>
      {shapes.map((s, i) => {
        const cls = s.part === 'eye' ? 'lumi-eye' : undefined;
        if (s.kind === 'circle') return <circle key={i} className={cls} cx={s.cx} cy={s.cy} r={s.r} fill={s.fill} opacity={s.opacity} />;
        if (s.kind === 'ellipse')
          return (
            <ellipse
              key={i}
              className={cls}
              cx={s.cx}
              cy={s.cy}
              rx={s.rx}
              ry={s.ry}
              fill={s.fill}
              opacity={s.opacity}
              transform={s.rotate ? `rotate(${s.rotate} ${s.cx} ${s.cy})` : undefined}
            />
          );
        return (
          <path
            key={i}
            className={cls}
            d={s.d}
            fill={s.fill}
            stroke={s.stroke}
            strokeWidth={s.strokeWidth}
            strokeLinecap="round"
            opacity={s.opacity}
          />
        );
      })}
    </svg>
  );
}
