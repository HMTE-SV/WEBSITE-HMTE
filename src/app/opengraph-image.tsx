import { ImageResponse } from 'next/og'

// Site-wide social share card (link previews on WhatsApp, Instagram, X, etc.).
// Generated at build — not rendered on any visible page.
export const alt = 'HMTE TRE SV UGM — Himpunan Mahasiswa Teknik Elektro'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'linear-gradient(135deg, #011333 0%, #011f4b 55%, #02305e 100%)',
          color: '#F8F7F4',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '10px', height: '64px', background: '#F5B82E', borderRadius: '4px' }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-1px' }}>HMTE</div>
            <div style={{ fontSize: '20px', color: '#9ab0c2', letterSpacing: '5px' }}>TRE · SV · UGM</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div
            style={{
              fontSize: '68px',
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: '-2px',
              maxWidth: '940px',
            }}
          >
            Himpunan Mahasiswa Teknik Elektro
          </div>
          <div style={{ fontSize: '28px', color: '#cdd9e3', maxWidth: '880px', lineHeight: 1.4 }}>
            Ruang kabar, agenda, dan kegiatan mahasiswa Teknik Elektro Sekolah Vokasi UGM.
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '22px', color: '#F5B82E' }}>
          <div style={{ width: '44px', height: '3px', background: '#F5B82E' }} />
          website-hmte.vercel.app
        </div>
      </div>
    ),
    { ...size },
  )
}
