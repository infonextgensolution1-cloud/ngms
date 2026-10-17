# NGMS Formula / Industrial Design System
Status: design specification prepared on isolated branch. No production files modified by this document.

## Reference
Use the user-provided Michael Schumacher / Formula 1 1990 visual as a direction for hierarchy, not as a literal replica:
- warm ivory information panels with black segmented/technical typography
- high-visibility racing orange used sparingly for large identifiers, active state and CTAs
- concrete grey secondary panels
- jet-black page canvas and dividers
- aggressive diagonal/clipped panel corners, compact metadata and oversized numbered service markers
- retain legibility, accessibility and a premium maintenance-company tone

## Design tokens
- canvas: #090909 / #111111
- paper: #F7F4EF
- concrete: #B8B8B8
- orange: #FF6426 (primary accent)
- ink: #111111
- charcoal: #242424
- body font: Inter or system sans-serif
- display font: a geometric segmented/technical display face, with a highly legible fallback such as Rajdhani or Space Grotesk
- corners: mostly 2–6px; selected feature panels have clipped/angled corners
- never use light text on orange if contrast is insufficient; black ink on orange/paper panels

## Global shell
Create one consistent marketing shell for every public route:
- high contrast navigation with short uppercase labels
- active/current section indicated in orange, never by colour alone
- responsive mobile nav and a compact fixed quote / WhatsApp action
- shared footer with service-area links, contact details and legal links
- consistent content max-width and vertical rhythm
- respect safe-area insets and prefers-reduced-motion

## Page templates
1. Home: asymmetric ivory/orange masthead, oversized NGMS identifier, clear solar cleaning and maintenance proposition, real photo, quick service index, proof/coverage, quote CTA.
2. Service index/detail: service number, category metadata, clear deliverables, scope/limitations, photographs, related services, quote CTA.
3. Campaigns: focused single-service pages with a strong orange price/offer panel and short quote path.
4. Local SEO: unique area copy for Helderberg, Strand, Somerset West, Gordon's Bay and Overberg locations; never just duplicate boilerplate.
5. Maintenance packages / ROI / price list: grey/ivory data panels, clear ZAR values, responsive tables/cards and explanatory assumptions.
6. Portfolio/gallery: image-first, accessible gallery, preserve admin-managed image sources and upload path.
7. Quote/contact: preserve existing multi-step form behaviour, validation, photo upload and lead persistence; change appearance only unless separately tested.
8. FAQ/about/terms/privacy: consistent typographic system and legible editorial page structure.

## Non-negotiables
- Preserve every existing route, including campaigns and service/location combinations.
- Preserve metadata, canonicals, schema, redirects, analytics and tracking.
- Do not replace backend integrations, admin upload workflows, quote generation, Supabase or auth.
- No production deployment without preview acceptance and QA.
- Test keyboard focus, contrast, mobile overflow, form validation and image failures.
- Do not copy Formula 1/Ferrari/Michael Schumacher logos or imply affiliation; use original NGMS lettering and own graphics.

## QA checklist
- [ ] map every sitemap URL to an existing route
- [ ] compare desktop/mobile page screenshots
- [ ] test every primary nav and CTA
- [ ] test quote submission and uploads in preview
- [ ] test SEO metadata and canonical URLs
- [ ] run lint/build/tests when repository environment is available
- [ ] obtain human approval before merge/deploy
