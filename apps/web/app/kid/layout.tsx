import type { Metadata, Viewport } from 'next';
import './kid.css';

export const metadata: Metadata = { title: 'Луми', robots: { index: false, follow: false } };
export const viewport: Viewport = { themeColor: '#0a1030', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function KidLayout({ children }: { children: React.ReactNode }) {
  return children;
}
