# NGMS Theme — "Ember Grid"

Dark, industrial, one-accent theme built from two references (NY Labs dark portfolio + Digital Rhino black/orange agency layout), locked to the NGMS website direction: black/grey/white with orange as the only accent.

## Colour palette (Tailwind token → value)

| Role | Name | Tailwind | Hex |
|---|---|---|---|
| Base | Jet Black | `jet` | `#0A0A0A` |
| Surface | Carbon | `cardgrey` | `#141517` |
| Surface 2 | Graphite | `graphite` | `#1F2023` |
| Line | Steel Line | `darkgrey` | `#2E3035` |
| Accent | Solar Orange | `orange` / `blue` | `#F57C1B` |
| Accent hot | Ember | `orange-dark` / `blue-dark` | `#FF5A1F` |
| Light block | Concrete | `concrete` | `#D6D6D3` |
| Text | Chalk | `paper` | `#F4F4F2` |
| Text muted | Ash | `mist` | `#9A9CA1` |

The legacy `blue` token is aliased to orange. WhatsApp green stays for WhatsApp buttons only.

Rules: orange is the only brand colour on the site. Max ~10% of any screen in orange, except deliberate full-bleed orange panels (max one per page, two on home). Quotes/invoices keep the full NGMS palette.

## Typography

- Headings: Big Shoulders Display (currently Oswald via next/font — swap in app/layout.tsx when ready)
- Body/UI: IBM Plex Sans (currently Inter)
- Scale mobile → desktop: Hero 40→72px, H2 28→44px, H3 20→24px, body 16px, label 12px / 0.14em tracking

## Signature elements

1. Orange "+" cluster (2×3 grid) as a section marker
2. Outlined icon box — 36px square, 1px orange border, top-right of cards
3. Numbered process steps — number in an outlined square
4. Full-bleed orange split panel — orange left (headline + list), photo right
5. Contact split — dark photo left, orange form panel right
6. Square-cornered orange CTA with trailing arrow (radius 2px)
7. Dark photo hero with warm golden-hour solar array image

## Components

- Buttons: primary orange fill + black text; secondary 1px Chalk outline; radius 2px; height 48px
- Cards: Carbon bg, 1px Steel Line border, no shadow, 20px padding
- Inputs on orange: transparent, 1px black bottom border
- Spacing: 8px grid; section padding 64px mobile / 112px desktop
