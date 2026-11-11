import { ImageResponse } from 'next/og';
import { LumiSvg } from '@/lib/og';

export const size = { width: 64, height: 64 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: '#141d4d', borderRadius: 16 }}>
        <LumiSvg size={58} />
      </div>
    ),
    size,
  );
}
