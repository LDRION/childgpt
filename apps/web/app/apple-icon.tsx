import { ImageResponse } from 'next/og';
import { LumiSvg } from '@/lib/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'linear-gradient(180deg, #0a1030, #2a3b8a)' }}>
        <LumiSvg size={160} />
      </div>
    ),
    size,
  );
}
