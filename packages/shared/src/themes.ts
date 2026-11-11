export type ThemeId = 'boy' | 'girl';

export interface ChildTheme {
  id: ThemeId;
  title: string;
  audience: string;
  tagline: string;
  scene: 'cosmos' | 'castle';
  colors: {
    skyTop: string;
    skyMid: string;
    skyBottom: string;
    glow: string;
    star: string;
    surface: string;
    surfaceStrong: string;
    border: string;
    text: string;
    textMuted: string;
    accent: string;
    accentText: string;
    accent2: string;
    bubbleChild: string;
    bubbleChildText: string;
    bubbleLumi: string;
    bubbleLumiText: string;
    mascotAccent: string;
  };
}

export const THEMES: Record<ThemeId, ChildTheme> = {
  boy: {
    id: 'boy',
    title: 'Звёздный капитан',
    audience: 'для мальчиков',
    tagline: 'Ночное небо, планеты и звёздный корабль Луми',
    scene: 'cosmos',
    colors: {
      skyTop: '#070f2b',
      skyMid: '#12245a',
      skyBottom: '#23468a',
      glow: 'rgba(127, 214, 255, 0.35)',
      star: '#fff6d6',
      surface: 'rgba(255, 255, 255, 0.08)',
      surfaceStrong: 'rgba(12, 22, 58, 0.78)',
      border: 'rgba(170, 205, 255, 0.22)',
      text: '#f2f6ff',
      textMuted: 'rgba(222, 232, 255, 0.72)',
      accent: '#ffcf6e',
      accentText: '#2a1c05',
      accent2: '#7fd6ff',
      bubbleChild: '#ffcf6e',
      bubbleChildText: '#2a1c05',
      bubbleLumi: 'rgba(255, 255, 255, 0.1)',
      bubbleLumiText: '#f2f6ff',
      mascotAccent: '#4fb7ff',
    },
  },
  girl: {
    id: 'girl',
    title: 'Звёздная фея',
    audience: 'для девочек',
    tagline: 'Сиреневые сумерки, сказочный замок и волшебные огоньки',
    scene: 'castle',
    colors: {
      skyTop: '#170c35',
      skyMid: '#3a2066',
      skyBottom: '#7a4a9c',
      glow: 'rgba(255, 184, 217, 0.38)',
      star: '#fff2c9',
      surface: 'rgba(255, 255, 255, 0.09)',
      surfaceStrong: 'rgba(40, 18, 66, 0.78)',
      border: 'rgba(255, 205, 235, 0.24)',
      text: '#fff5fb',
      textMuted: 'rgba(255, 232, 246, 0.74)',
      accent: '#ffb8d9',
      accentText: '#3b0f2c',
      accent2: '#d6c4ff',
      bubbleChild: '#ffb8d9',
      bubbleChildText: '#3b0f2c',
      bubbleLumi: 'rgba(255, 255, 255, 0.11)',
      bubbleLumiText: '#fff5fb',
      mascotAccent: '#ff8cc6',
    },
  },
};

export function getTheme(id: string | null | undefined): ChildTheme {
  return id === 'girl' ? THEMES.girl : THEMES.boy;
}
