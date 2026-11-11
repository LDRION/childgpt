import type { ThemeId } from './themes';

// Маскот «Луми» — совёнок, описанный как набор простых фигур. Одни и те же данные
// рисуются и в вебе (обычный <svg>), и в приложении (react-native-svg), поэтому
// персонаж выглядит одинаково на всех платформах.

export type MascotPart = 'body' | 'eye' | 'accessory' | 'detail';

export type MascotShape =
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: string; opacity?: number; part: MascotPart }
  | {
      kind: 'ellipse';
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      fill: string;
      opacity?: number;
      rotate?: number;
      part: MascotPart;
    }
  | {
      kind: 'path';
      d: string;
      fill: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      part: MascotPart;
    };

export const MASCOT_VIEWBOX = '0 0 240 240';

const C = {
  body: '#b5825a',
  wing: '#9b6a47',
  belly: '#f6e2c3',
  feather: '#e2c398',
  face: '#fbeedb',
  eye: '#2a1b3d',
  beak: '#f4a640',
  blush: '#ff9fb2',
};

export function getMascotShapes(theme: ThemeId, accent: string): MascotShape[] {
  const shapes: MascotShape[] = [
    { kind: 'ellipse', cx: 120, cy: 224, rx: 58, ry: 7, fill: '#000000', opacity: 0.18, part: 'detail' },
    { kind: 'path', d: 'M70 74 Q55 44 58 18 Q82 32 102 56 Z', fill: C.body, part: 'body' },
    { kind: 'path', d: 'M170 74 Q185 44 182 18 Q158 32 138 56 Z', fill: C.body, part: 'body' },
    { kind: 'ellipse', cx: 50, cy: 142, rx: 22, ry: 46, rotate: 12, fill: C.wing, part: 'body' },
    { kind: 'ellipse', cx: 190, cy: 142, rx: 22, ry: 46, rotate: -12, fill: C.wing, part: 'body' },
    { kind: 'ellipse', cx: 120, cy: 130, rx: 78, ry: 86, fill: C.body, part: 'body' },
    { kind: 'ellipse', cx: 120, cy: 160, rx: 50, ry: 48, fill: C.belly, part: 'body' },
    {
      kind: 'path',
      d: 'M90 152 q7 8 14 0 M113 152 q7 8 14 0 M136 152 q7 8 14 0 M101 170 q7 8 14 0 M124 170 q7 8 14 0 M112 188 q7 8 14 0',
      fill: 'none',
      stroke: C.feather,
      strokeWidth: 3,
      part: 'detail',
    },
    { kind: 'circle', cx: 90, cy: 102, r: 32, fill: C.face, part: 'body' },
    { kind: 'circle', cx: 150, cy: 102, r: 32, fill: C.face, part: 'body' },
    { kind: 'circle', cx: 92, cy: 104, r: 18, fill: C.eye, part: 'eye' },
    { kind: 'circle', cx: 148, cy: 104, r: 18, fill: C.eye, part: 'eye' },
    { kind: 'circle', cx: 99, cy: 97, r: 6, fill: '#ffffff', part: 'eye' },
    { kind: 'circle', cx: 155, cy: 97, r: 6, fill: '#ffffff', part: 'eye' },
    { kind: 'circle', cx: 86, cy: 112, r: 2.5, fill: '#ffffff', opacity: 0.85, part: 'eye' },
    { kind: 'circle', cx: 142, cy: 112, r: 2.5, fill: '#ffffff', opacity: 0.85, part: 'eye' },
    { kind: 'ellipse', cx: 70, cy: 130, rx: 9, ry: 5, fill: C.blush, opacity: 0.5, part: 'detail' },
    { kind: 'ellipse', cx: 170, cy: 130, rx: 9, ry: 5, fill: C.blush, opacity: 0.5, part: 'detail' },
    { kind: 'path', d: 'M111 121 Q120 116 129 121 Q123 135 120 138 Q117 135 111 121 Z', fill: C.beak, part: 'body' },
    { kind: 'ellipse', cx: 100, cy: 214, rx: 13, ry: 6, fill: C.beak, part: 'body' },
    { kind: 'ellipse', cx: 140, cy: 214, rx: 13, ry: 6, fill: C.beak, part: 'body' },
  ];

  if (theme === 'boy') {
    // Шарф звёздного капитана.
    shapes.push(
      { kind: 'path', d: 'M66 132 Q120 156 174 132 L176 146 Q120 172 64 146 Z', fill: accent, part: 'accessory' },
      { kind: 'path', d: 'M146 152 L160 192 L144 188 L134 156 Z', fill: accent, part: 'accessory' },
      { kind: 'path', d: starPath(120, 158, 7, 3), fill: '#ffe08a', part: 'accessory' },
    );
  } else {
    // Бантик звёздной феи.
    shapes.push(
      { kind: 'path', d: 'M160 46 L142 32 L144 60 Z', fill: accent, part: 'accessory' },
      { kind: 'path', d: 'M160 46 L178 32 L176 60 Z', fill: accent, part: 'accessory' },
      { kind: 'circle', cx: 160, cy: 46, r: 6, fill: '#ffe08a', part: 'accessory' },
    );
  }

  return shapes;
}

/** SVG-путь пятиконечной звезды с центром в (cx, cy). */
export function starPath(cx: number, cy: number, outer: number, inner: number, points = 5): string {
  const step = Math.PI / points;
  let d = '';
  for (let i = 0; i < points * 2; i += 1) {
    const r = i % 2 === 0 ? outer : inner;
    const a = i * step - Math.PI / 2;
    const x = (cx + r * Math.cos(a)).toFixed(2);
    const y = (cy + r * Math.sin(a)).toFixed(2);
    d += `${i === 0 ? 'M' : 'L'}${x} ${y} `;
  }
  return `${d}Z`;
}
