import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ChildGPT — Луми',
    short_name: 'ChildGPT',
    description: 'Безопасный ИИ-друг для детей',
    start_url: '/kid',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a1030',
    theme_color: '#0a1030',
    lang: 'ru',
    icons: [
      { src: '/icon', sizes: '64x64', type: 'image/png' },
      { src: '/apple-icon', sizes: '180x180', type: 'image/png' },
    ],
  };
}
