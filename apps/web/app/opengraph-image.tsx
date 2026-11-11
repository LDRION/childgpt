import { ImageResponse } from 'next/og';
import { LumiSvg } from '@/lib/og';

export const alt = 'ChildGPT — безопасный ИИ-друг для детей';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Встроенный шрифт ImageResponse не содержит кириллицы — на картинке только латиница,
// русский текст идёт в alt и мета-описание.
const STARS = Array.from({ length: 70 }, (_, i) => ({
  x: (i * 173) % 1200,
  y: (i * 97) % 520,
  r: 1 + ((i * 7) % 3),
}));

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '0 90px',
          background: 'linear-gradient(180deg, #060b24 0%, #141d4d 60%, #2a3b8a 100%)',
          color: '#fff',
          position: 'relative',
        }}
      >
        {STARS.map((s, i) => (
          <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, width: s.r * 2, height: s.r * 2, borderRadius: 999, background: '#fff6d6', opacity: 0.7 }} />
        ))}
        <div style={{ position: 'absolute', right: 120, top: 70, width: 130, height: 130, borderRadius: 999, background: '#fff0c9', boxShadow: '0 0 80px 30px rgba(255,233,170,0.35)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div style={{ fontSize: 110, fontWeight: 900, letterSpacing: -3, display: 'flex' }}>
            Child<span style={{ color: '#ffd479' }}>GPT</span>
          </div>
          <div style={{ fontSize: 40, color: 'rgba(226,232,255,0.8)', marginTop: 10 }}>Safe AI friend for kids · childgpt.ru</div>
        </div>
        <LumiSvg size={380} />
      </div>
    ),
    size,
  );
}
