# Block Boiler 3D — Preview

A standalone cyberpunk falling-block arcade prototype served from `public/games/block-boiler-3d/index.html`.

## Run locally
Open `public/games/block-boiler-3d/index.html` through a local static server. The page imports Three.js from jsDelivr, so the browser needs network access to that CDN.

## Controls
- Arrow Left / Right: move
- Arrow Up or X: rotate clockwise
- Z: rotate counter-clockwise
- Arrow Down: soft drop
- Space: hard drop
- C: hold / swap current piece
- E: reactor pulse (requires four cleared rows)
- P / Escape: pause
- Touch buttons are shown on narrow screens

## Preview acceptance checklist
- [ ] Static route loads without touching the NGMS homepage or shared app routes.
- [ ] Three.js arena renders and resizes with the viewport.
- [ ] Start, pause, resume, reset and game-over/restart work.
- [ ] All seven tetromino shapes spawn, move, rotate, collide and lock correctly.
- [ ] Completed rows clear; score, level, lines and best score update.
- [ ] Next-piece preview stays in sync with the queue.
- [ ] Hold/swap can be used once per piece.
- [ ] Reactor charges from cleared rows and consumes charge on use.
- [ ] Keyboard and touch controls work; controls do not scroll the page during play.
- [ ] No console errors, failed asset requests or severe mobile layout issues.
- [ ] Preview deployment verified before any production decision.

## Safety
This is an isolated static prototype. It does not modify existing NGMS app routes, data, Supabase records, or production settings. Do not merge or promote until the acceptance checklist has been executed and reviewed.
