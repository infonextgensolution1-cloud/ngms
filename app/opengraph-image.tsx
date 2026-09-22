import { ImageResponse } from 'next/og'
import { LOGO_DATA_URI } from '@/lib/logo'

// Branded share card used when any page is shared on WhatsApp, Facebook etc.
export const alt = 'NextGen Solar Clean & Maintenance Solutions — One Call. All Solutions.'
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
          background: '#050608',
          padding: '64px 72px',
          color: '#F7F9FB',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={LOGO_DATA_URI} alt="" height={110} style={{ height: 110 }} />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 34, fontWeight: 700 }}>NextGen Solar Clean</div>
            <div style={{ fontSize: 34, fontWeight: 700 }}>&amp; Maintenance Solutions</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1 }}>ONE CALL.</div>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, color: '#FF7A18' }}>ALL SOLUTIONS.</div>
          <div style={{ fontSize: 28, marginTop: 24, color: '#AEB6C0' }}>
            Solar panel cleaning · Painting · Waterproofing · Paving · + 8 more
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 28,
            color: '#AEB6C0',
            borderTop: '2px solid #2A2A2D',
            paddingTop: 24,
          }}
        >
          <div>Strand · Gordon’s Bay · Somerset West</div>
          <div style={{ color: '#F7F9FB', fontWeight: 700 }}>063 138 7945</div>
        </div>
      </div>
    ),
    size
  )
}
