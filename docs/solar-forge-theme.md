# NGMS Theme — "Solar Forge"

Builds on Ember Grid (`docs/ember-grid-theme.md`). One grey ramp from Jet Black to Chalk, with Solar Orange as the only brand accent. Every Ember Grid token keeps its name and value; three tokens are new.

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
| Fog | `fog` (new) | `#E7E7E4` | Main light band |
| Chalk | `paper` | `#F4F4F2` | Text on dark; cards on light |

## Accent

| Name | Tailwind | Hex | Use |
|---|---|---|---|
| Solar Orange | `orange` | `#F57C1B` | Fills, borders, icons, big display type on dark |
| Ember Deep (new) | `ember-deep` | `#A84300` | Orange TEXT on Chalk or Fog |
| Ember | `orange-dark` | `#FF5A1F` | Hover / pressed |
| Glow | `glow` | `#FF8A1F` | "Get a quote" button (Eco Green border) |

Functional colours stay as they were: WhatsApp green on WhatsApp buttons, Facebook blue on the Facebook icon.

## Contrast rules

- Bright Solar Orange as small text fails on light greys (2.2:1 on Fog). On light bands use `text-ember-deep` (5.5:1 on Chalk, 4.9:1 on Fog).
- Ember Deep is not for Concrete backgrounds (4.2:1). Use Fog or Chalk for bands that carry orange text.
- Jet on Solar Orange is 7.3:1, so black text on the orange panel is fine.

## Page rhythm

Dark and light bands alternate down the homepage, with one full orange panel (`BodyCorporateSection`). Orange stays under about 10% of any other screen.

## Light bands

Add `band-light` and a light background to a section:

```tsx
<section className="band-light bg-fog py-14 px-4"> ... </section>
```

Inside it, `text-mist`, `.tag`, `.kicker`, `.card`, orange text, headings and dark borders switch to their light-band colours (see `app/globals.css`). `text-paper` is not remapped, because it is also used on dark chips inside light sections. Use `text-graphite` on light-band text that used `text-paper`. Orange text inside a light band (including the review stars) becomes Ember Deep automatically.

## Orange panel

`btn-jet` and `btn-outline-jet` are the button styles for text on the orange panel.
