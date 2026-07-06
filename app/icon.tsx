import { ImageResponse } from 'next/og';
 
// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';
 
// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to top right, #2563eb, #4f46e5)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '20%',
          fontSize: 22,
          fontWeight: 900,
          fontFamily: 'sans-serif',
        }}
      >
        O
      </div>
    ),
    {
      ...size,
    }
  );
}
