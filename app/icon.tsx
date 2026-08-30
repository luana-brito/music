import { ImageResponse } from 'next/og';

export function generateImageMetadata() {
  return [
    { contentType: 'image/png', size: { width: 192, height: 192 }, id: '192' },
    { contentType: 'image/png', size: { width: 512, height: 512 }, id: '512' },
  ];
}

export default function Icon({ id }: { id: string }) {
  const size = Number(id) || 192;
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FF6B00',
          color: '#000',
          fontSize: size * 0.48,
          fontWeight: 800,
        }}
      >
        ♪
      </div>
    ),
    { width: size, height: size }
  );
}
