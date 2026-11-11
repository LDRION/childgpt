import type { Metadata, Viewport } from 'next';
import { Nunito, Playfair_Display } from 'next/font/google';
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from '@/lib/site';
import './globals.css';

const nunito = Nunito({ subsets: ['latin', 'cyrillic'], variable: '--font-nunito', display: 'swap' });
const playfair = Playfair_Display({
  subsets: ['latin', 'cyrillic'],
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0a1030',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'ИИ для детей',
    'нейросеть для детей',
    'безопасный чат-бот для ребёнка',
    'детский ChatGPT',
    'помощник с уроками',
    'сказки для детей',
    'родительский контроль',
  ],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${nunito.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
