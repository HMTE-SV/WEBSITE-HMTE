---
name: HMTE TRE SV UGM
description: Beranda HMTE sebagai lembar putih yang diterangi aurora dari logo Kabinet Abya Vistara.
colors:
  navy: "#011f4b"
  navy-deep: "#00112c"
  blue: "#1f6fe5"
  blue-ink: "#1a5fd0"
  sky: "#5cc2ff"
  ice: "#dff2ff"
  mist: "#f3f8ff"
  gold: "#f5b82e"
  sheet: "#ffffff"
  text: "#011f4b"
  text-2: "#3a4f72"
  text-3: "#5b6f90"
  line: "rgba(1, 31, 75, 0.1)"
  line-strong: "rgba(1, 31, 75, 0.16)"
  on-dark: "#eef7ff"
  on-dark-2: "rgba(226, 240, 255, 0.8)"
  on-dark-accent: "#9fdcff"
  capsule: "rgba(3, 14, 36, 0.94)"
  capsule-active: "#17366e"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 11.5vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.04em"
  hero-title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 9vw, 4.8rem)"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.038em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2rem, 8vw, 3.6rem)"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(1.45rem, 5.6vw, 2.1rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.03em"
  statement:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(1.35rem, 5.6vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
  lead:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.65
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 400
    lineHeight: 1.62
  body-strong:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "15.5px"
    fontWeight: 650
    lineHeight: 1.35
  caption:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  photo: "16px"
  channel: "18px"
  tile: "20px"
  box: "24px"
  stage: "28px"
  stage-wide: "32px"
  capsule: "26px"
  pill: "999px"
spacing:
  gutter: "16px"
  gutter-wide: "40px"
  canvas: "1240px"
  stage-inset: "8px"
  stage-inset-wide: "16px"
  box-gap: "12px"
  box-gap-wide: "16px"
  section: "64px"
  section-wide: "104px"
  head-gap: "28px"
  head-gap-wide: "44px"
components:
  button-light:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.navy}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: "8px 8px 8px 22px"
    height: "56px"
  button-glass:
    backgroundColor: "rgba(255, 255, 255, 0.08)"
    textColor: "{colors.sheet}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: "8px 8px 8px 22px"
    height: "56px"
  button-glass-hover:
    backgroundColor: "rgba(255, 255, 255, 0.16)"
  button-navy:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.sheet}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: "8px 8px 8px 22px"
    height: "56px"
  button-line:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.navy}"
    typography: "{typography.body-strong}"
    rounded: "{rounded.pill}"
    padding: "8px 8px 8px 22px"
    height: "56px"
  text-link:
    textColor: "{colors.blue-ink}"
    typography: "{typography.body-strong}"
    height: "44px"
  pill:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.text-2}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  pill-active:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.pill}"
  tag:
    backgroundColor: "{colors.ice}"
    textColor: "{colors.blue-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  box:
    backgroundColor: "{colors.sheet}"
    rounded: "{rounded.box}"
  box-mist:
    backgroundColor: "{colors.mist}"
    rounded: "{rounded.box}"
  box-deep:
    backgroundColor: "{colors.navy}"
    textColor: "{colors.on-dark}"
    rounded: "{rounded.box}"
  channel:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.navy}"
    rounded: "{rounded.channel}"
    padding: "14px"
    height: "112px"
  channel-active:
    backgroundColor: "{colors.blue}"
    textColor: "{colors.sheet}"
    rounded: "{rounded.channel}"
  nav-capsule:
    backgroundColor: "{colors.capsule}"
    rounded: "{rounded.capsule}"
    padding: "6px"
  nav-item-active:
    backgroundColor: "{colors.capsule-active}"
    textColor: "#ffffff"
    rounded: "{rounded.tile}"
    height: "60px"
---

# Design System: HMTE TRE SV UGM

> **Scope.** This system governs **only the homepage (`/`)**, implemented in `css/home-aurora.css` (every rule scoped under `.av`), `src/components/home/*`, and the bottom-nav capsule in `css/mobile-nav.css` / `src/components/site/BottomNav.tsx`. All other routes still use the older incumbent styles (`css/hmte.css`, `css/ui-soft.css`, `css/org-pages.css`, `css/contact-postal.css`, and others) and have **not been migrated**. Do not read this file as a description of those routes, and do not assume a route follows it until it has been rebuilt inside the world. The site-wide brand commitments (HMTE navy, gold, the three typefaces, the HMTE and cabinet logos) hold on every route. This file replaces the retired "Papan LED P10" homepage world.

## Overview

**Creative North Star: "Sumber Cahaya" (the cabinet logo as a light source)**

The Kabinet Abya Vistara logo is a light source. The blue swirl in the logo radiates as an aurora (HMTE navy, bright blue, sky blue, ice, with a pinch of gold from the logo's star), and that aurora lights a clean white sheet. The hero and the closing section are aurora "stages": deep navy boxes with drifting blurred light, fine grain, and, in the hero, a giant glowing arc with the logo sitting at its crest inside a slowly turning aurora ring. Between them, the page is white.

The white sheet is ruled like a blueprint. Two navy hairlines run the full height of the page at the edge of the content canvas, crossed by section rules, with small blue plus-marks where the rules intersect. Every box snaps to that canvas. Some boxes are plain white with a hairline, some are mist, and a few catch the aurora (a navy deep box, a pale aurora box, a gradient-lit chapter). Each white section also carries a faint corner wash of sky light so the white never reads as empty.

Density is moderate on phone and generous on desktop. Boxes are soft (24px), controls are full pills, and everything that is read is real type in navy on white or cool white on navy.

**Key Characteristics:**
- White sheet, visible hairline canvas (two vertical rails plus section rules with blue plus-marks).
- Aurora is light, not paint: it lives in the hero and closing stages, in deep and aurora boxes, and as faint corner washes on the sheet.
- Two blues do the work: HMTE navy for text and dark grounds, bright blue for links, active states, and marks. Gold is a small star accent only.
- Soft boxes (24px), large stages (28px phone, 32px wide), pill controls with a circular icon well.
- Motion: things arrive out of light (blur 10px to sharp, rise 24px, exponential ease-out); the emblem ignites, the arc rises, the ring turns.

## Colors

A white sheet lit by a blue aurora: navy ink, a bright blue signal, pale sky and ice light, and one small gold spark.

### Primary
- **HMTE Navy** (`navy`): the brand navy. All headings and primary text on white, the dark base of every aurora stage and deep box, the navy pill button, the active filter pill, and the scrolled header capsule (at 88%).
- **Signal Blue** (`blue`): the aurora's bright band and the system's active color. Canvas plus-marks, the focus outline, program bullets, the active pager bar, row-arrow hover, and the top of the active channel gradient.
- **Link Blue** (`blue-ink`): a slightly deeper blue for type on white, so it holds contrast. Text links and section actions, the blue second line of display headings, chapter labels, tag text, story-headline hover.

### Secondary
- **Sky** (`sky`): the aurora's light. Radial glows in stages, deep boxes and aurora boxes, the corner washes on the white sheet, and the hero status dot.
- **Ice** (`ice`) / **Mist** (`mist`): pale fills. Ice backs photos, avatars, tags, and the icon well of the line button; Mist is the quiet box fill and the row press state.

### Tertiary
- **Star Gold** (`gold`): the brand gold, used only as a spark. The closing heading's final period, and a 30% screen-blended glow blob in the aurora sky. Never a fill, button, or link.

### Neutral
- **Sheet** (`sheet`): the page and plain box ground; pure white to the edges.
- **Navy Text / Text 2 / Text 3** (`text`, `text-2`, `text-3`): headings; leads and body; mono meta, captions, row sub-lines, icons at rest.
- **Hairline / Strong Hairline** (`line`, `line-strong`): navy at 10% for the canvas rails, section rules, box borders, and row dividers; 16% for pill, channel, and line-button outlines.
- **On Dark / On Dark 2 / On Dark Accent** (`on-dark`, `on-dark-2`, `on-dark-accent`): text on aurora stages and deep boxes; the ice-blue accent carries mono labels and the focus outline on dark.
- **Capsule / Capsule Active** (`capsule`, `capsule-active`): the floating bottom nav and its active plate.

### Named Rules
**The Light Not Paint Rule.** Aurora appears as radial light over a navy or pale base, always with grain on the dark or saturated boxes. It is never a flat multicolor fill, never gradient text, and it never tints body type.

**The Two Blues Rule.** Navy carries text and dark grounds; bright blue carries links, actives, and marks. Gold is a spark (a period, a star glow), never a second interactive color on the page; the inherited bottom-nav capsule keeps its gold active icon.

## Typography

**Display Font:** Geist (fallback system-ui, sans-serif), via `--font-display`.
**Body Font:** Plus Jakarta Sans, via `--font-body`.
**Label/Mono Font:** JetBrains Mono, via `--font-mono`, for small readouts only.

**Character:** Tight, heavy Geist headlines in navy sit on the white sheet like titles on a clean drawing; Plus Jakarta keeps copy warm and open; mono is a quiet instrument readout.

### Hierarchy
- **Display** (`display`): the About statement. Its second line switches to Link Blue rather than changing size. The closing heading reuses the role at clamp(2rem, 8.4vw, 3.8rem), in white with a soft on-dark middle phrase.
- **Hero Title** (`hero-title`): the centered white h1, max 14ch (16ch wide), balanced. Steps down to clamp(1.75rem, 7.6vw, 2.2rem) on short phones.
- **Headline** (`headline`): section h2s, max 18ch wide, with the same blue second-phrase device.
- **Title** (`title`): story, chapter (clamp(1.4rem, 5.8vw, 1.9rem)) and division (clamp(1.6rem, 6.4vw, 2.4rem)) h3s; channel names at 20px.
- **Statement** (`statement`): the momentum sentence with counted numbers inline (1.5em, 700, tabular) and the quote (600, up to 2.8rem, 1.18).
- **Lead** (`lead`): section leads at 62ch; the hero lead is 15.5px (17px wide) at 42ch.
- **Body** (`body`): chapter copy (60ch), excerpts, division text (56ch).
- **Body Strong** (`body-strong`): button labels (700), row titles, pills (14px), text links (15px, 700).
- **Caption** (`caption`): row sub-lines, story foot, button sub-lines (12.5px, 72% opacity).
- **Label** (`label`): mono 12px context lines, story meta, list heads, hero meta, ticker dates, quote attribution. Sentence or data case.

### Named Rules
**The Mono Whisper Rule.** JetBrains Mono is only a 12px readout. It never sets a heading, a button, or a tracked uppercase label above a heading.

**The Blue Second Line Rule.** Two-part headings shift color (Link Blue on white, soft on-dark on navy) rather than size or weight.

## Layout

Mobile-first, one component tree for all widths; CSS switches layout at **640px** (action rows go side by side) and **900px** (grids and wider gutters).

- **Canvas:** content is capped at 1240px and centered; the gutter is 16px on phone and 40px from 900px. The two vertical hairline rails sit exactly on the content edge, so box edges touch them. Sections are 64px tall padding (104px wide) with a hairline top rule and blue 13px plus-marks where it crosses the rails.
- **Stages:** the hero and closing boxes are inset 8px from the screen (16px wide). The hero fills the first viewport (minus the bottom-nav reserve on phones) and ends in a full-bleed ticker of real headlines.
- **Section head:** title over lead and mono context on phone; on desktop a two-column grid with the action link bottom-right. 28px below (44px wide).
- **Desktop splits:** 7fr/5fr (about head, news lead/list), 5fr/7fr (division head and programs / people), 6fr/5fr (close). The about bento is a 12-column grid with named areas (finale 7 + chapter 5; chapter 5 + chapter 7).
- **Scroll rails:** pills, channel rail, and photo wall bleed to the screen edge with a negative gutter, a right-edge fade mask, and snap. On desktop they become static: pills wrap, the 8 channels form an equal 8-column row, the wall becomes a 3-column, 4-row (220px) grid with explicitly placed tiles.
- **Equal peers:** the eight cabinet channels are identical in size; never a size hierarchy among divisions.
- **Bottom clearance:** on phone browsers (<1024px) the capsule shows on the homepage, and the footer (not the body) takes 136px plus safe area so the reserve stays dark.

## Elevation & Depth

Depth is light plus soft lift. Plain boxes sit on the sheet with a hairline and a long, faint, negative-spread shadow; aurora areas get depth from layered radial light and grain; the hero arc glows from its rim. No hard shadows anywhere.

### Shadow Vocabulary
- **Box rest** (`box-shadow: 0 1px 2px rgba(1,31,75,0.04), 0 30px 60px -44px rgba(1,31,75,0.35)`): every box.
- **Button lift** (`0 14px 30px -14px rgba(0,8,30,0.7)` light pill; `0 14px 30px -16px rgba(1,31,75,0.7)` navy pill).
- **Header capsule** (`0 18px 40px -22px rgba(1,31,75,0.7)` with `backdrop-filter: blur(18px) saturate(1.4)` over navy at 88%): the scrolled header only.
- **Logo glow** (`drop-shadow(0 12px 28px rgba(31,111,229,0.65))`, smaller at the close and finale): cabinet logo marks.
- **Arc rim** (a 1.5px ice ring plus stacked sky/blue outer and inset glows): the hero orbit only.
- **Capsule float** (`0 20px 44px -18px rgba(0,6,20,0.9)` with `blur(16px) saturate(1.3)`): the bottom nav.

### Named Rules
**The Glow Is Blue Rule.** Emissive glows are sky or blue from the logo's light. Dark shadows are long, soft, and navy-tinted, and only anchor.

**The Grain Rule.** Aurora stages and deep boxes carry a fractal-noise grain (overlay, 28%); pale aurora boxes carry it softer (soft-light, 50%). Plain white boxes never do.

## Shapes

- **Stage** (28px, 32px wide): the hero and closing aurora boxes.
- **Box** (24px): every white, mist, deep, and aurora box, and desktop photo tiles.
- **Tile / channel** (20px, 18px): phone photo tiles, the Instagram channel link, channel cards.
- **Photo** (16px): photos inside boxes.
- **Pill** (999px): every button, filter pill, tag, tile caption, pager bar. Button icons sit in a 40px circle well.
- **Circle:** avatars, status and channel dots, program bullets, the emblem ring and halo, the orbit arc.

## Components

### Buttons
Full pills with the label left and a circular icon well right; label with optional sub-line.
- **Shape:** pill, 56px minimum (52px on short phones), 40px icon well.
- **Light:** the primary on aurora. White with navy text, navy icon well, Button lift.
- **Glass:** the secondary on aurora. 8% white with a 28% white border; hover 16% / 50%.
- **Navy:** the primary on white. **Line:** the secondary on white, with a Strong Hairline border, ice icon well, blue border on hover.
- **States:** hover lifts 1px and slides the icon 2px; `:active` scales 0.98; 220ms on `cubic-bezier(0.16, 1, 0.3, 1)`. Focus is a 2px Signal Blue outline (ice-blue on dark) at 3px offset.
- **Text link:** Link Blue, 15px/700, 44px tall, 18px arrow sliding 4px on hover.

### Chips
- **Filter pills:** 44px, white, Strong Hairline border, Text 2 at 14px/650; hover border blue 45%; active is solid navy with white text; press scales 0.95.
- **Tag:** Ice fill, Link Blue 650 text, pill.

### Cards / Containers
- **Box:** 24px, hairline border, white, Box rest shadow; variants mist, deep (navy with sky and blue radial light, grain, on-dark text), and aurora (pale ice base with blue light, grain).
- **Rows:** list items at least 72px, avatar or bullet + text block + arrow, divided by hairlines; arrow turns blue and slides 3px on hover; press fills mist.
- **Channel:** one of eight identical cards (148px wide on phone, equal columns on desktop, 112px/128px tall), with a dot, Geist 20px name, and two-line description. Active becomes a blue-to-navy gradient with an ice dot.

### Navigation
- **Header:** transparent over the hero; once scrolled it becomes a floating navy capsule (22px radius, 72px tall) with blur. On phones it hides while scrolling down.
- **Bottom capsule (phone browser homepage and installed PWA):** a floating dark capsule inset 12px, max 560px, 4 equal items (24px icon over 12px/600 label); active item is a Capsule Active plate. Arrives with a 520ms rise after 150ms.

### Aurora Stage (signature)
A navy box with three drifting blurred light fields (blue, sky, and a faint gold screen blob, 22 to 30s alternate), grain, and sparse twinkling specks. In the hero, a giant circle's top edge rises as a glowing arc and the cabinet logo sits on its crest with a turning conic aurora ring (24s) and a breathing star halo (4.6s). On phone the arc and logo follow scroll; on desktop they follow the pointer. The closing stage reuses the sky inverted, with the cabinet logo beside the cheer.

### Motion
Content is fully readable without JS. Under `[data-motion]`, reveal blocks go from blur 10px, 24px down, and 0 opacity to sharp over 900ms with staggered delays; division parts and people rise over 560 to 620ms (50ms per person). The emblem ignites (blur 16px, brightness 1.8 to rest, 1400ms), the arc rises (1600ms), counters count up. Ease: `cubic-bezier(0.16, 1, 0.3, 1)`. The ticker pauses on hover or focus. With `prefers-reduced-motion`, all animation and transition inside `.av` is removed and the ticker becomes a scrollable strip.

## Do's and Don'ts

### Do:
- **Do** keep the page a white sheet with the hairline canvas visible: rails on the content edge, section rules, blue plus-marks.
- **Do** snap every box to the canvas and use the 24px box radius; reserve 28/32px for the two aurora stages.
- **Do** light with the aurora as radial glows over navy or pale bases, with grain on dark and saturated boxes, and a faint sky corner wash on white sections.
- **Do** use navy for text and dark grounds, Link Blue for links and actives on white, and gold only as a small spark.
- **Do** pair light pill + glass pill on aurora, navy pill + line pill on white, each at least 56px with a circular icon well.
- **Do** keep peer entities (the eight cabinet channels) identical in size.
- **Do** make things arrive out of light (blur to sharp, small rise) and keep everything readable without motion.

### Don't:
- **Don't** fill aurora as flat multicolor paint or set gradient text; light boxes that hold copy keep it in solid navy-family type.
- **Don't** use gold for buttons, links, or fills on the page; its only interactive role is the active icon and focus ring inside the inherited bottom-nav capsule.
- **Don't** use JetBrains Mono for headings, buttons, or tracked uppercase labels above headings; it is a 12px readout only.
- **Don't** fall back to the standard student-organization layout of a full-bleed cabinet photo, uniform news cards, and a division grid, nor to plain editorial white without light.
- **Don't** add hard offset shadows or stacked card elevation.
