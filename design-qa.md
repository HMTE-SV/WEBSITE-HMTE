# Landing Hero Scroll Story Design QA

- Source visual truth: current user-directed sequence in the active thread
- Supporting visual reference: `verification/hero-reference.png`
- Implementation: `http://localhost:3000/`
- Desktop viewport: 1280 × 720
- Mobile viewport: 390 × 844
- Desktop evidence:
  - `verification/hero-scroll-top-desktop.png`
  - `verification/hero-scroll-final-desktop.png`
  - `verification/hero-scroll-navbar-desktop.png`
- Mobile evidence:
  - `verification/hero-scroll-top-mobile.png`
  - `verification/hero-scroll-final-mobile.png`

## Full-view comparison evidence

The implementation was reviewed at the required interaction states rather than as one static frame:

1. Initial state: the first activity photo fills the viewport and the HMTE logo is small at the bottom center.
2. Photo sequence: scrolling advances through all five real HMTE activity photos in both directions.
3. Logo transition: after the last photo, additional scrolling moves and enlarges the logo toward the center.
4. Final state: the single photo fades into a 15-tile activity-photo wallpaper behind the centered logo.
5. Handoff state: the navbar appears below the completed hero and becomes sticky at its configured top offset.

The supporting reference's full-image stage, atmospheric lower field, and minimal visual chrome were preserved. The new direction intentionally replaces its static composition with the requested scroll narrative.

## Focused region comparison evidence

- Logo placement was measured at the start and end states on desktop and mobile.
- The final mobile logo was reduced to fit within the 390 px viewport without horizontal overflow.
- Navbar geometry was checked after the hero: 88 px desktop stage at 16 px sticky offset and the existing compact mobile variant.
- The document width matched the viewport width at 390 px.

## Findings

- No actionable P0, P1, or P2 findings remain.
- Fonts and typography: the hero contains no visible copy; only accessible hidden identity and active-photo descriptions remain.
- Spacing and layout rhythm: the logo begins at the lower center, moves continuously, and finishes centered; the navbar is separated from the hero and does not overlay the opening photo.
- Colors and tokens: the navy image treatment, gold progress marker, and dark final wallpaper reuse existing HMTE tokens.
- Image quality: all five slides and all wallpaper tiles use the repository's original high-resolution activity assets.
- Copy and content: no new visible hero copy was introduced.
- Interaction: scroll position controls the photo index, logo movement, logo scale, single-photo fade, wallpaper reveal, and final navbar handoff.
- Responsiveness: desktop and 390 × 844 mobile states passed without horizontal overflow or console errors.
- Accessibility: reduced-motion users receive a static final composition instead of a 6–7 viewport pinned sequence.

## Patches made during QA

- Moved the landing navbar after the hero and removed the negative overlap for this route.
- Replaced timed carousel state with passive, requestAnimationFrame-throttled scroll progress.
- Added five discrete photo stages followed by a continuous logo/wallpaper reveal phase.
- Added a mobile-specific final logo scale so the full mark remains inside the viewport.
- Preserved the existing sticky navbar behavior after the hero handoff.

## Follow-up polish

- P3: per-photo `object-position` values can be tuned if the activity image set changes.

final result: passed

# Shared Gradient Hero Rollout QA — 2026-07-02

- Source visual truth:
  - `C:\Users\MCEE0~1.REE\AppData\Local\Temp\codex-clipboard-bc228162-3b90-4e9b-b002-96797e845002.png`
  - Existing `/berita` hero tokens in `css/hmte.css`.
- Target implementations:
  - `/divisi/[slug]` — 8 generated routes.
  - `/pengurus/[slug]` — 64 generated routes.
- Intended comparison viewport: desktop 1280 x 720 and mobile 390 x 844.
- State: initial hero viewport with public header visible.
- Implementation screenshot path: unavailable; local Browser navigation to `http://localhost:3000` was blocked by the active Browser URL policy.

## Full-view comparison evidence

- Source opened successfully and establishes the target: navy multi-stop gradient, subtle gold radial light, large outlined circular arc, white display title, gold mono kicker, and preserved public navbar.
- Source-level implementation copies the exact `/berita` gradient, grid texture, circular arc geometry, and color opacity tokens onto the shared division and leader hero selectors.
- Runtime implementation capture is blocked, so full-view fidelity cannot be signed off from rendered evidence.

## Focused region comparison evidence

- Code audit confirms the full-bleed background `<Image fill>` and overlay nodes were removed from both shared slug templates.
- Code audit confirms no public slug page retains a hero `<Image fill>` background.
- Article detail imagery remains in the article body and division-index imagery remains in cards; these are content images, not hero backgrounds.
- A focused rendered comparison is blocked for the same Browser policy reason.

## Findings

- [Blocked] Rendered desktop/mobile comparison is unavailable.
  - Location: `/divisi/ph` and `/pengurus/muhammad-reyhan`.
  - Evidence: browser policy rejected local navigation before implementation screenshots could be captured.
  - Impact: typography wrapping, arc crop, and responsive spacing cannot be visually certified.
  - Required follow-up: capture both routes at 1280 x 720 and 390 x 844, compare with the source screenshot, then resolve any P1/P2 drift.
- Fonts and typography: existing HMTE display, body, and mono typography are preserved in source.
- Spacing and layout: existing division/leader content grids are preserved; only background layers changed.
- Colors and tokens: exact `/berita` navy/gold gradient and opacity values are reused.
- Image quality: full-bleed background photos are intentionally removed; leader portrait/logo content remains intact.
- Copy and content: unchanged.
- Interaction and accessibility: navigation, links, focus behavior, and reduced-motion behavior are unchanged.

## Patches made

- Removed `divisionVisuals` full-bleed hero images from the division and leader slug templates.
- Removed the obsolete photo-overlay nodes.
- Applied the shared `/berita` gradient, grid texture, and outlined circular arc to both hero families.
- Preserved person photos, logos, article imagery, and card imagery as content assets.

## Static verification

- ESLint passed without warnings.
- TypeScript `--noEmit` passed.
- Vitest passed: 15 tests.
- Production build generated 147 pages, including 8 division routes and 64 leader routes.
- Slug-page audit found zero hero `<Image fill>` backgrounds.

final result: blocked

# Navbar and Program Workspace QA

- Visual reference: user screenshot showing the opaque landing navbar stage.
- Navbar patch: the after-hero stage is transparent and no longer reserves a blank off-white padding band.
- Program index: editorial hero, eight featured programs, search, division filters, and status filters.
- Program detail: eight static routes with overview, focus, timeline, document area, and related programs.
- Cross-links: landing directory, division pages, program index, detail routes, and sitemap.

## Verification

- ESLint passed without warnings.
- TypeScript `--noEmit` passed.
- Production build passed and generated all eight featured program routes.
- New and modified program source files passed whitespace checks.
- Post-patch browser capture was unavailable because local browser access was blocked; source-level layout and production generation were still verified.

final result: automated checks passed; visual follow-up recommended

# Organization Information Architecture QA

- Implementation entry points:
  - `http://localhost:3000/#pillars`
  - `http://localhost:3000/divisi`
  - `http://localhost:3000/kepengurusan`
  - `http://localhost:3000/program-kerja`
- Detail routes verified: `/divisi/kominfo` and `/pengurus/ahmad-fauzi`
- Desktop viewport: 1280 x 720
- Mobile viewport: 390 x 844

## Flow verified

1. Landing preview keeps division selection, member/program tabs, and links into the full organization system.
2. Bidang & Divisi provides eight navigable division entries.
3. Each division page combines identity, member profiles, and division programs.
4. Pengurus provides a searchable, filterable cross-division directory.
5. Program Kerja remains the cross-division program catalog and links back to division profiles.
6. Individual member profiles link back to their division and surface the programs they support.

## Findings

- All organization surfaces use the same organization data loader and division codes.
- `/divisi/kominfo` rendered 8 member links and 3 program entries.
- The 390 px division page matched the viewport width with a two-column member grid and no horizontal overflow.
- All five tested organization URLs returned HTTP 200.
- Production build generated 8 division routes and 64 member profile routes.
- Lint, TypeScript, and production build passed.

final result: passed

# Organization Directory Interaction Design QA

- Implementation: `http://localhost:3000/#pillars`
- Desktop viewport: 1280 x 720
- Mobile viewport: 390 x 844

## States verified

1. Idle: only the PH and seven division cards are visible.
2. Confirmation: selecting a card triggers the HMTE-mark confirmation animation below the selector.
3. Open: the neutral workspace expands and shows members from the selected division.
4. Content mode: the Anggota and Program Kerja tabs switch content without leaving the workspace.

## Findings

- The workspace avoids recognizable macOS, Windows, and Linux controls or chrome.
- The selected division is visually clear and the workspace resets correctly when another division is chosen.
- Search, grid/list switching, member details, and program cards remain functional.
- Desktop and 390 x 844 mobile layouts passed without horizontal overflow.
- Keyboard state, reduced-motion handling, hidden-workspace inertness, and semantic button states were retained.
- Browser console check returned no errors.
- No actionable P0, P1, or P2 findings remain.

final result: passed

# Current QA Status — Shared Gradient Hero Rollout

The latest QA report is the `Shared Gradient Hero Rollout QA — 2026-07-02` section above. Static implementation checks passed, but the required rendered desktop/mobile comparison remains unavailable because local Browser navigation was blocked.

final result: blocked
