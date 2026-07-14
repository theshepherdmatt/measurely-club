# Measurely Club

Sales and consultation tool for sound system installers working with bars and clubs. Same Acoustic Engine, same physics, bigger rooms.

## Concept

The install team visits a venue, runs an empty-room REW sweep from the middle of the dance floor, and exports the WAV. Measurely Club imports it, the Acoustic Engine builds a 3D model of the venue showing the acoustic problems, and the installer returns to the client to present the proposed system and treatment as a visual demonstration — the sweep becomes the pitch.

The measurement position is the **dance floor centre**, not a listening seat.

## What carries over unchanged (from the shared engine)

- All six acoustic pillars: Peaks & Dips, Reflections, Bandwidth, Balance, Smoothness, Clarity
- All existing viewport overlays and the 3D room simulator
- WAV import pipeline, RT60, room mode analysis, treatment recommendations — ceiling clouds and corner bass traps are the headline treatments for this market (clubs are hard surfaces everywhere)
- Engine consumed as a git submodule at `public/engine/`, never forked

## Roadmap — club-specific layer (built in this fork, not the engine)

None of the below is built yet. This is the scaffold commit only.

1. **Furniture/assets** — DJ booth, bar counter, seating booths. Reuse existing corner sofa assets where sensible. Purpose is visualisation flush: letting the client see their own venue layout.
2. **Sidebar additions (via SCL)** — dance floor size and capacity. Capacity = floor area × density (2 people/m² comfortable, up to 4 packed).
3. **Occupied-state prediction** — the sweep is always taken empty, but bodies are absorption: mids and highs get soaked up significantly per person (roughly equivalent to adding acoustic panels), bass passes through unaffected. Use the capacity figure to model added absorption and predict the occupied response from the empty sweep. Feeds RT60 prediction via the existing materials/absorption model — no new scoring model.
4. **System power calculation** — from room volume, absorption, target SPL (~105 dB at the floor, +10 dB headroom for peaks) and speaker sensitivity, work backwards to required amplifier power in kW. Every doubling of power = +3 dB; distance and absorption eat some back. Ballpark sanity check: a ~50 m² floor lands around 3–5 kW total, subs taking most of the budget.
5. **Speaker placement defaults** — club systems are coverage-driven, not imaging-driven: mono or stereo at most, subs always mono, typically stacked centre under the DJ booth to avoid power alley cancellation between spaced subs. Default layout for a mid-size room: two tops flanking the booth, two to four subs centre. No surround/cinema layouts.

## Repo structure

Follows `measurely-ecommerce` — the reusable template for client builds (ecommerce itself is the Anthill build; club is the second build off the same base):

- `public/engine/` — git submodule, shared 3D acoustic engine (never forked)
- `public/index.html` — app shell: brand tokens inline, script tag stack, mounts the 3D room simulator
- `public/app.js` — room state + `initRoom3D` bootstrap
- `public/styles.css` — `@import "./engine/css/index.css"` only; club-specific CSS overrides go here as they're added
- No `wrangler.jsonc`, no in-repo `CNAME` — deploy config and custom domain live in the Cloudflare Pages dashboard, same as ecommerce

## Deploy

Not yet deployed. Cloudflare Pages project to be created and connected via git integration (build output directory `public`), domain `club.measurely.uk` set in the dashboard once ready.

Cache-buster discipline applies here too: bump `?v=` query strings on every engine submodule bump.
