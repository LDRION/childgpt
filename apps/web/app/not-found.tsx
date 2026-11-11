import Link from 'next/link';
import { Lumi } from '@/components/Lumi';
import { NightSky } from '@/components/NightSky';

export default function NotFound() {
  return (
    <main style={{ position: 'relative', minHeight: '100svh', display: 'grid', placeItems: 'center', textAlign: 'center', padding: 24, background: 'linear-gradient(180deg, #060b24, #1d2763)' }}>
      <NightSky density={0.7} />
      <div style={{ position: 'relative', display: 'grid', justifyItems: 'center', gap: 12 }}>
        <Lumi size={140} />
        <h1 style={{ fontSize: 40, margin: '10px 0 0' }}>Эта страничка улетела к звёздам</h1>
        <p style={{ color: 'var(--on-night-soft)' }}>Давай вернёмся туда, где светло и уютно.</p>
        <Link href="/" className="btn">
          На главную
        </Link>
      </div>
    </main>
  );
}
