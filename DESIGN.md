---
name: HMTE TRE SV UGM
description: Beranda HMTE sebagai papan LED P10 satu warna di atas panel navy.
colors:
  led-gold: "#f5b82e"
  led-hot: "#ffd05a"
  panel-navy: "#011f4b"
  panel-navy-raised: "#062a5e"
  ink: "#000c22"
  seam: "#00071a"
  board: "#010a1c"
  board-frame: "#26344d"
  text: "#eef3fb"
  text-soft: "#bccbe2"
  text-mute: "#93a8ca"
  line: "rgba(147, 168, 202, 0.2)"
  frame: "rgba(188, 203, 226, 0.16)"
  capsule: "rgba(3, 14, 36, 0.94)"
  capsule-active: "#17366e"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.7rem, 12.5vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.96
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2rem, 8.4vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  hero-title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2rem, 8.6vw, 4.2rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(1.45rem, 6vw, 2.2rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.028em"
  statement:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(1.35rem, 5.4vw, 2.2rem)"
    fontWeight: 600
    lineHeight: 1.45
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.65
  body-strong:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 700
    lineHeight: 1.35
  caption:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 500
    lineHeight: 1.4
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  board: "4px"
  media: "8px"
  control: "16px"
  control-lg: "20px"
  capsule: "26px"
  pill: "999px"
spacing:
  gutter: "16px"
  gutter-wide: "40px"
  seam: "8px"
  seam-wide: "12px"
  module-top: "56px"
  module-bottom: "64px"
  module-top-wide: "96px"
  module-bottom-wide: "104px"
  head-gap: "32px"
  head-gap-wide: "44px"
components:
  button-gold:
    backgroundColor: "{colors.led-gold}"
    textColor: "{colors.ink}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "56px"
  button-gold-hero:
    backgroundColor: "{colors.led-gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control-lg}"
    height: "68px"
  button-gold-hover:
    backgroundColor: "{colors.led-hot}"
    textColor: "{colors.ink}"
  button-ghost:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.text}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "56px"
  pill:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.text-soft}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  pill-active:
    backgroundColor: "{colors.led-gold}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
  text-link:
    textColor: "{colors.led-gold}"
    typography: "{typography.body-strong}"
    height: "44px"
  channel-card:
    textColor: "{colors.led-gold}"
    rounded: "{rounded.control}"
    padding: "12px 18px"
    height: "64px"
  led-board:
    backgroundColor: "{colors.board}"
    rounded: "{rounded.board}"
  nav-capsule:
    backgroundColor: "{colors.capsule}"
    rounded: "{rounded.capsule}"
    padding: "6px"
  nav-item:
    textColor: "rgba(214, 224, 240, 0.72)"
    rounded: "{rounded.control-lg}"
    height: "60px"
  nav-item-active:
    backgroundColor: "{colors.capsule-active}"
    textColor: "#ffffff"
    rounded: "{rounded.control-lg}"
---

# Design System: HMTE TRE SV UGM

> **Scope.** This system governs **only the homepage (`/`)**, implemented in `css/home-p10.css` (every rule scoped under `.p10`), `src/components/home/*`, and the bottom-nav capsule in `css/mobile-nav.css` / `src/components/site/BottomNav.tsx`. All other routes still use the older incumbent styles (`css/hmte.css`, `css/ui-soft.css`, `css/org-pages.css`, `css/contact-postal.css`, and others) and have **not been migrated**. Do not read this file as a description of those routes, and do not assume a route follows it until it has been rebuilt inside the world. The site-wide brand commitments below (navy, gold, the three typefaces, the HMTE and cabinet logos) hold on every route.

## Overview

**Creative North Star: "Papan LED P10"**

The homepage is a running-text LED panel that HMTE's own electrical engineering students could build out of P10 modules. Every section is a navy panel module with a faint grid of unlit dots, joined to the next by a dark seam. Only one thing lights up, and only in one color: amber gold. Short headlines, the cabinet name, section titles, counters, and the closing cheer are drawn by a canvas engine that breaks Geist letters and real activity photos into dots. Those dots light almost instantly and fade out with an afterglow.

Everything that has to be *read* stays real type. Body copy is cool white Plus Jakarta Sans on navy, headings are tight Geist, and small context lines are JetBrains Mono. The board carries identity and a single highlight per section. It never replaces content: every scene on the board is built from real data (article titles, cabinet name, division codes, real counts, real photos).

Density is moderate on phone and generous on desktop. Sections are big modules with tall padding, and inside them the content keeps list-like rhythm (rows, chapters, one lead story plus a light list). Controls are soft pills and rounded slabs. That softness is the deliberate contrast to the near-square aluminium frames of the boards.

**Key Characteristics:**
- A navy panel with a visible unlit-dot grid (1px dots on an 8px pitch) behind every module.
- One lit color only: LED gold, with a hot-gold core and halo.
- Modules are joined by dark seams (8px, 12px wide), not by cards, rules, or whitespace alone.
- Boards have near-square aluminium frames (4px). Photos and media have soft 8px corners. Controls are pills.
- Motion: light instantly, fade slowly. Elements appear with a multiplex flicker, and photos resolve from dots into the whole image.
- Real content on the board, real text off the board.

## Colors

A single-color LED world: deep navy panels and ink, cool blue-white text, and one amber-gold emission.

### Primary
- **LED Gold** (`led-gold`): the lit LED. Used for board dots, the primary action slab, active pills, text links and section actions, chapter labels, quote marks, the status dot, LED bullets, `::selection`, and the focus outline. It is the brand gold (#F5B82E) and the only emissive color.
- **Hot Gold** (`led-hot`): the hot core of a lit dot. Used for the hover state of the gold slab and of story headline links. Never a second accent.

### Neutral
- **Panel Navy** (`panel-navy`): the brand navy (#011f4b), used as the face of every section module.
- **Raised Panel** (`panel-navy-raised`): the fill for avatars and other small raised plates on a module.
- **Ink** (`ink`): the deepest ground. Used for the page background, hero and closing backgrounds, and text on gold.
- **Seam** (`seam`): the dark joint between modules and behind the ticker strip.
- **Board Black** (`board`): the face of every LED board and the letterbox behind photos.
- **Aluminium Frame** (`board-frame`): the 2px frame around boards.
- **Signal White** (`text`): headings and primary text.
- **Soft Signal** (`text-soft`): leads, body paragraphs, excerpts.
- **Dim Signal** (`text-mute`): mono meta, captions, the soft second line of display headings, row icons at rest.
- **Line** / **Frame** (`line`, `frame`): translucent blue-grey hairlines for list dividers (`line`) and ghost-control outlines (`frame`).
- **Capsule** / **Capsule Active** (`capsule`, `capsule-active`): the floating bottom-nav body and its lit item.

### Named Rules
**The One Emission Rule.** Gold is the only color that lights. Every lit dot, glow, active state, and link is LED gold or its hot core. No second accent, no gradient text, no colored category chips.

**The Real Panel Rule.** The dark grounds are always navy-family (`ink`, `seam`, `board`, `panel-navy`), never neutral grey or pure black. The unlit-dot grid (`rgba(70,110,180,0.14)`, 1px dots, 8px pitch) sits on every module face.

## Typography

**Display Font:** Geist (fallback system-ui, sans-serif), exposed as `--font-display`. It is also the face the LED engine rasterizes, at weight 700.
**Body Font:** Plus Jakarta Sans, exposed as `--font-body`.
**Label/Mono Font:** JetBrains Mono, exposed as `--font-mono`, for small accents only.

**Character:** Tight, heavy Geist headlines read like engraved panel titles. The same letterforms re-emerge as dot matrix on the boards, so type and board belong to one family. Plus Jakarta keeps long copy warm and legible. Mono appears only as a quiet instrument readout.

### Hierarchy
- **Display** (`display`): the About section's two-line statement. The second line switches to Dim Signal instead of changing size.
- **Headline** (`headline`): section h2s.
- **Hero Title** (`hero-title`): the h1 below the hero board. On desktop it steps down to clamp(2.6rem, 3.6vw, 3.6rem), because the board carries the scale there.
- **Title** (`title`): chapter, story, and division h3s, with letter-spacing from -0.025em to -0.03em.
- **Statement** (`statement`): the momentum sentence that embeds LED counter boards inline, and the quote (600, up to 3rem, line-height 1.18).
- **Body** (`body`): leads and paragraphs, capped at 46–62ch (hero lead 46ch, section lead 62ch, chapter copy 60ch). Excerpts use 15.5px.
- **Body Strong** (`body-strong`): button labels, row titles (650), and action links (15px).
- **Caption** (`caption`): button sub-lines, row sub-lines, story foot.
- **Label** (`label`): mono context lines, story meta, the status line (0.04em), list heads, quote attribution. Always 12px, in sentence or data case.

### Named Rules
**The Mono Whisper Rule.** JetBrains Mono is only a 12px readout: meta, status, context, attribution. It never sets a heading, a button, or a tracked uppercase label.

**The Board Speaks Short Rule.** Only short strings go on an LED board: a name, a title, a code, a number, a cheer, a marquee of headlines. Anything longer than one line of thought is set as real type beside the board.

## Layout

Mobile-first, one component tree for all widths. CSS alone switches layout at **900px**.

- **Canvas:** module content is capped at 1200px and centered. The page gutter is 16px on phone and 40px from 900px up. Scroll rails (pills, division rail, photo wall) bleed to the screen edge with a negative gutter and use `scroll-padding` equal to the gutter.
- **Modules:** each section is a full-width module with padding 56px/64px (96px/104px wide) and a `seam`-colored top border of 8px (12px wide). The hero and closing modules sit on `ink` with a soft radial glow: navy in the hero, a faint gold wash at the close.
- **Section head:** a two-column grid, title left and its action link right, bottom-aligned. The lead and mono context span below. The head is followed by a 32px gap (44px wide).
- **Desktop splits** use 7fr/5fr (hero copy/actions, about head, news lead/list), 5fr/7fr (division control/detail), and 6fr/5fr (close). The division control column is sticky at top 104px.
- **Hero:** the board sits full canvas width on top. On phone it is min(30svh, 300px), with a floor of 200px, so the gold action stays above the floating nav. On desktop it is clamp(260px, 100svh − 592px, 440px). Title and tagline sit below it, with actions and status beside them. A full-bleed marquee ticker on a seam strip closes the first viewport.
- **Photo wall:** on phone, a horizontal snap rail of 76%-wide 4:5 tiles. On desktop, a fixed 3×4 grid (220px rows, 16px gap) with explicitly placed tiles, never auto-dense.
- **Bottom clearance:** on the homepage in a phone browser (<1024px), and in the installed PWA, the body reserves 96px plus the safe-area inset so the floating capsule never covers content.

## Elevation & Depth

Depth comes from light, not lift. Panels are flat. The sense of depth comes from the board sitting recessed in its frame (inner shadow), from things that emit (gold glows), and from the dark seams between modules. Drop shadows exist only as very soft, long, negative-spread falloffs that anchor a board or photo to its panel.

### Shadow Vocabulary
- **Board recess** (`box-shadow: inset 0 2px 14px rgba(0,0,0,0.65), 0 18px 40px -26px rgba(0,0,0,0.9)`): every framed LED board.
- **Photo anchor** (`box-shadow: 0 26px 50px -30px rgba(0,0,0,0.9)`): dot-print photo frames.
- **Gold emission** (`box-shadow: 0 14px 30px -14px rgba(245,184,46,0.75)`, hover `0 18px 36px -14px rgba(245,184,46,0.9)`): the gold slab glows downward like a lit panel.
- **LED point glow** (`box-shadow: 0 0 10px 2px rgba(245,184,46,0.7)` status dot, `0 0 8px 1px rgba(245,184,46,0.6)` bullet): single lit points.
- **Avatar ring** (`box-shadow: 0 0 0 2px rgba(245,184,46,0.35)`).
- **Capsule float** (`box-shadow: 0 20px 44px -18px rgba(0,6,20,0.9)` with `backdrop-filter: blur(16px) saturate(1.3)`): the bottom nav only.

### Named Rules
**The Emit, Don't Lift Rule.** Glow is gold and belongs to things that are lit. Dark shadows are long and soft and only anchor. No hard offset shadows, no layered card elevation.

**The Acrylic Rule.** A board may carry one thin diffuser sheen (a 172° white gradient from 7% to 0% over 38%). It is the acrylic cover of a real panel, not decorative glass anywhere else.

## Shapes

Three corner families, each tied to a material:
- **Aluminium** (4px, `rounded.board`): LED boards, with a 2px `board-frame` border plus an inset 1px outline at −4px. The ticker board is square and frameless because it is the strip itself. Inline counter boards use 6px.
- **Print** (8px, `rounded.media`): photos, story media, the empty-news panel.
- **Control** (14–26px and full pills): slabs 16px (hero slab 20px), desktop division tiles 14px, channel cards 16px, nav items 20px, the capsule 26px, filter and division pills 999px. Avatars and LED points are circles.

Photos keep a dot-print edge: a 6px-pitch ink dot grid is masked into the photo's outer rim, so the board's trace stays on every picture. News covers are shown whole (`object-fit: contain`) on a board-black letterbox at 16:10, never cropped, because covers often contain text.

## Components

### Buttons
Big thumb slabs, not chips: a label with an optional sub-line on the left, an arrow on the right.
- **Shape:** rounded slab (`rounded.control`), minimum height 56px. The hero gold slab is 68px with `rounded.control-lg`.
- **Gold (primary):** `button-gold`, with the Gold emission shadow. The sub-line is ink at 72%. There is one gold slab per action group.
- **Ghost (secondary):** `button-ghost` with a 1px `frame` border. On hover the border becomes gold at 50% and the fill gold at 8%.
- **States:** `:active` scales to 0.98. Transitions run 220ms on `cubic-bezier(0.16, 1, 0.3, 1)`. Focus is a 2px gold outline at 3px offset with a 10px radius.
- **Text link / section action:** gold Plus Jakarta 700 at 15px, 44px tall, with an 18px arrow that slides 4px right on hover.

### Chips
- **Style:** filter pills and the phone division rail are 44px full pills with a `frame` border, a 4% white fill, and `text-soft` text at 14px/650.
- **State:** active is solid LED gold with ink text. A gold pill is a lit segment, the same device as the board.

### Cards / Containers
The system avoids cards. Content sits on the module face as rows and columns.
- **Rows:** list items are a text block plus a 20px arrow, at least 72px tall, divided by `line` hairlines. The arrow turns gold and shifts 3px on hover, and `:active` tints the row 5% white.
- **Channel card:** the one bordered container. It has a 1px `frame` border and `rounded.control`, a mono 12px label over a gold 16px value, and a gold icon. The border turns gold at 50% on hover.
- **Empty state:** a `frame`-bordered 8px panel at `rgba(0,10,28,0.35)` with 24px padding, holding the two slabs.

### Navigation
- **Bottom capsule (phone, homepage browser and installed PWA):** a floating dark capsule (`nav-capsule`) inset 12px from the edges and at most 560px wide. It holds 4 equal items: a 24px icon over a 12px/600 label. The active item is a lit plate (`nav-item-active`) with a gold icon. It arrives with a 520ms rise after a 150ms delay. The header's menu button hides while the capsule shows, because "Lainnya" opens the same sheet.
- **Header:** the shared landing header, sitting over the hero ink.

### LED Board (signature)
A canvas engine (`led-engine.ts`, wrapped by `LedBoard.tsx`) renders a grid of dots, each with a brightness from 0 to 1. A lit dot is a sprite with a gold core (#fff3cf to hot gold to LED gold) and a gold halo. Unlit dots are `rgba(38,72,138,0.42)` at 30% of the pitch, drawn over dark grid lines. Scenes: `boot` (a column sweep), `text` (Geist 700 fitted to the board, balanced over two lines, 1-bit below 16 rows), `image` (a real photo printed as dot brightness, with a focal point), `marquee`, and `count` (a real number counting up).
- **Pitch by role:** hero 6px (9px wide); about finale 5px; division and cheer 4px; ticker, headlines, and counters 3px (4px wide).
- **Physics:** rise tau 0.028s, decay tau 0.17s. A dot lights almost instantly and fades with an afterglow.
- **Reduced motion:** the board renders a single still frame and never animates.

### Motion
Motion runs only under `[data-motion]`, which requires JS and motion allowed. With `prefers-reduced-motion`, every animation and transition inside `.p10` is removed, and text is always readable without waiting.
- **Flicker-in** (`p10-flick`, 520–620ms, linear): a multiplex flicker from 0 to 1 opacity for revealed blocks, staggered 70ms per person or program.
- **Dot-to-photo:** the photo is masked by a 10px dot grid whose radius grows from 0.6px to 7.5px over 1300ms, starting from a gold-sepia tint.
- **Breathing status dot:** 2.4s ease-in-out.
- **Ease:** `cubic-bezier(0.16, 1, 0.3, 1)` for all spatial transitions.

## Do's and Don'ts

### Do:
- **Do** make every module a navy panel with the unlit-dot grid and a dark seam on top (8px, 12px wide).
- **Do** give each section exactly one LED highlight: hero board and ticker, about finale, news headlines, division board, momentum counters, closing cheer.
- **Do** feed boards only real data: article titles, cabinet and division names, real counts, real activity photos.
- **Do** keep readable copy as real Plus Jakarta text beside the board, 46–62ch wide.
- **Do** frame boards in 4px aluminium, print photos with 8px corners and a dot-print rim, and shape controls as pills and slabs at least 44px tall (primary slabs 56–68px).
- **Do** light instantly and fade slowly, and render a still board under reduced motion.

### Don't:
- **Don't** introduce a second lit color, gradient text, or colored category chips; gold is the only emission.
- **Don't** set long text on the LED board or make visitors wait for animation to read.
- **Don't** use JetBrains Mono for headings, buttons, or tracked uppercase labels above headings; it is a 12px readout only.
- **Don't** fall back to the standard student-organization layout of a full-bleed cabinet photo, news cards, and a division grid; this world rejects it.
- **Don't** crop news covers; show them whole on the board-black letterbox.
- **Don't** add hard offset shadows or stacked card elevation; depth is recess and glow.
