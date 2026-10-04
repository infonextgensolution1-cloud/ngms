# NGMS Theme — "Solar Forge"

Builds on Ember Grid (`docs/ember-grid-theme.md`). One grey ramp from Jet Black to Chalk, **NextGen Blue** as the technology accent, and **Solar Orange reserved for conversion** (the primary "Get a quote" CTA). Type: **Poppins** for headings, **Inter** for body/UI, both loaded with `next/font` in `app/layout.tsx`.

## Grey ramp (dark to light)

| Name | Tailwind | Hex | Use |
|---|---|---|---|
| Jet | `jet` | `#0A0A0A` | Page background, header, footer |
| Carbon | `cardgrey` | `#141517` | Cards on black |
| Graphite | `graphite` | `#1F2023` | Dark bands; text on light bands |
| Steel | `darkgrey` | `#2E3035` | Lines and borders on dark |
| Slate | `slate` (new) | `#55585E` | Secondary text on light bands |
| Ash | `mist` | `#9A9CA1` | Secondary text on dark |
| Concrete | `concrete` | `#D6D6D3` | Light tiles, borders on light |
| Fog## Accents

| Name | Tailwind | Hex | Use |
|---|---|---|---|
| NextGen Blue | `blue` | `#3B8BFF` | Kickers, links, icons, focus ring, active nav — text on dark (5.96:1 on Jet) |
| Blue Fill | `blue-fill` | `#1F6FEB` | Solid buttons/badges with white text (4.63:1) — `.btn-blue` |
| Blue Dark | `blue-dark` | `#1D64D8` | Hover/pressed blue fills |
| Blue Deep | `blue-deep` | `#1A5BD0` | Blue TEXT on light bands (4.9:1 on Fog) — applied automatically in `.band-light` |
| Solar Orange | `orange` | `#F57C1B` | Primary "Get a quote" CTA (`.btn-quote`, jet text 7.3:1) and rare attention marks only |
| Ember Deep | `ember-deep` | `#A84300` | Orange TEXT on Chalk or Fog |

`power` (formerly purple) now maps to the blue values, so legacy `.btn-power` renders as a blue secondary button.

### CTA hierarchy

1. **Primary** — `.btn-quote` (orange). One per view where possible: Get a quote.
2. **Contact** — `.btn-wa` (WhatsApp green) for every WhatsApp action; `tel:` links for calls.
3. **Secondary** — `.btn-blue` or `.btn-outline`.
4. **Tertiary** — text links in blue.

Functional colours stay as they were: WhatsApp green on WhatsApp buttons, Facebook blue on the Facebook icon.

## Surfaces

- `.panel` — premium dark card: Carbon fill, Steel hairline, `rounded-panel` (10px), soft `shadow-panel`.
- `rounded-card` 6px, `rounded-btn` 4px. Avoid larger radii except pills.
- A `.panel` inside a `.band-light` section keeps dark-surface text colours.

Functional colours stay as they were: WhatsApp green on WhatsApp buttons, Facebook blue on the Facebook icon.

## Contrast rules

- Bright Solar Orange as small text fails on light greys (2.2:1 on Fog). On light bands use `text-ember-deep` (5.5:1 on Chalk, 4.9:1 on Fog).
- Ember Deep is not for Concrete backgrounds (4.2:1). Use Fog or Chalk for bands that carry orange text.
- Jet on Solar Orange is 7.3:1, so black text on the orange panel is fine.

## Page rhythm

Dark and light bands alternate down the homepage (the solar section is the main light band). There is no full orange panel any more; orange stays on CTAs and stays well under 10% of any screen.

## Light bands

Add `band-light` and a light background to a section:

```tsx
<section className="band-light bg-fog py-14 px-4"> ... </section>
```

Inside it, `text-mist`, `.tag`, `.kicker`, `.card`, orange text, headings and dark borders switch to their light-band colours (see `app/globals.css`). `text-paper` is not remapped, because it is also used on dark chips inside light sections. Use `text-graphite` on light-band text that used `text-paper`. Orange text inside a light band (including the review stars) becomes Ember Deep automatically.

## Orange panel

`btn-jet` and `btn-outline-jet` are the button styles for text on the orange panel.
