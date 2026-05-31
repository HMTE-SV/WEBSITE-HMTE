# TRE Design System

**Teknologi Rekayasa Elektro (TRE)** — Sarjana Terapan (Applied Bachelor / D4) program in Electrical Engineering Technology, under Departemen Teknik Elektro dan Informatika (TEDI), Sekolah Vokasi, Universitas Gadjah Mada.

Yogyakarta, Indonesia · est. 1949 (UGM) · Akreditasi **Unggul** (LAM Teknik, 2026)

---

## Context

TRE prepares vocational engineers for the field of **electric power generation, transmission, distribution, and installation**. The program operates inside one of Indonesia's most established universities and partners with national-scale industry: PLN, Indonesia Power, Parama Data Unit, Schneider Electric, with international exchange to Japan, China, and Korea.

The brand challenge is straightforward and unusual: this is not a startup, not a marketing site, and not a government brochure. It is a **vocational engineering institution at a flagship national university**. The voice should carry the gravitas of a public-good institution while looking like contemporary, world-class engineering — the way Petronas presents itself as nationally important, told through the spatial confidence and typographic restraint of Vercel.

### Key facts the design must carry

| | |
|---|---|
| Full name | Sarjana Terapan Teknologi Rekayasa Elektro |
| Short | TRE |
| Parent | Departemen Teknik Elektro dan Informatika (TEDI) |
| School | Sekolah Vokasi, Universitas Gadjah Mada |
| Degree | D4 / Sarjana Terapan (Applied Bachelor, 4 years) |
| Location | Gedung Herman Yohannes, Sekip Unit 1, Catur Tunggal, Depok, Sleman, Yogyakarta 55281 |
| Web | listrik.sv.ugm.ac.id · tre.sv.ugm.ac.id |
| Accreditation | Unggul (LAM Teknik, 21 Apr 2026 – 20 Apr 2031) |
| Industry partners | PLN, Indonesia Power, Schneider Electric, Parama Data Unit |

### Sources consulted

The user did not attach a codebase, Figma, or asset library. The system below was derived from the brief plus public materials:

- https://listrik.sv.ugm.ac.id/ — primary program site
- https://tre.sv.ugm.ac.id/ — program news / activities
- https://tedi.sv.ugm.ac.id/ — parent department
- https://sv.ugm.ac.id/ — Sekolah Vokasi
- https://ugm.ac.id/ — university
- https://brand.ugm.ac.id/ — UGM brand guidelines (referenced for the parent identity, not lifted)
- The brief itself (visual philosophy, palette, type, tone)

> **Caveat for the reader:** the existing TRE website and any internal Figma were *not* attached. This system is a **proposed direction** built to the brief's specs, not a recreation of an existing TRE brand. Treat it as a target the institution could move toward.

---

## Index

| File | What's in it |
|---|---|
| `README.md` | This document — context, content, visual foundations, iconography |
| `colors_and_type.css` | Full token system: colors, type scale, spacing, semantic vars |
| `SKILL.md` | Agent skill metadata for Claude Code compatibility |
| `fonts/` | Local copies of Space Grotesk, Inter, JetBrains Mono (Google Fonts via CDN as default) |
| `assets/` | Logo lockups, accreditation badge, generic full-bleed imagery placeholders |
| `preview/` | Cards rendered in the Design System tab — colors, type, spacing, components, brand |
| `ui_kits/landing/` | Hi-fi recreation of the proposed TRE landing page + components |
| `slides/` | *Not created* — no deck template was provided |

---

## ICONOGRAPHY

TRE has no proprietary icon set. The system adopts **[Lucide](https://lucide.dev)** as the official icon library — loaded from CDN, available as both SVG components and a webfont. Lucide was chosen because:

- **Geometric, stroke-based** — matches the engineered, restrained tone. No filled glyphs.
- **1.5px stroke** at 24px nominal size — the same visual weight as the type's hairlines.
- **Open-source** (ISC license) — safe for institutional use without licensing review.

### Usage rules

- **Stroke width: 1.5px**, never 2px. The default Lucide stroke is 2px; we override.
- **Nominal size: 24px**. Acceptable range: 16, 20, 24, 32. Never below 14px, never above 40px in body context.
- **Color: `currentColor`**. Icons inherit text color. The only icon ever rendered in red (`#E30613`) is a directional arrow indicating action, and only when the surrounding context is dark or muted.
- **Stroke join/cap: round** — Lucide default. Do not change.
- **Pair with text** when the icon meaning is not universally known (a substation glyph always needs a label; an arrow does not).

### Loading

```html
<!-- Recommended: tree-shakeable per-icon SVGs via CDN -->
<script src="https://unpkg.com/lucide@latest"></script>
<i data-lucide="zap"></i>
<script>lucide.createIcons({ attrs: { 'stroke-width': 1.5 } });</script>
```

The `assets/` folder also contains a small set of inline SVG snippets used in the design system itself (`zap`, `cpu`, `network`, `gauge`, `arrow-up-right`, `battery`) — these are duplicated from Lucide for offline rendering and are not the canonical source.

### Emoji and Unicode

- **Emoji are not used.** Anywhere. Not in copy, not as bullets, not in error states, not in social posts.
- **Unicode dividers are used sparingly** — the middle dot `·` (U+00B7) appears in mono captions to separate metadata, and the em dash `—` (U+2014) is used freely in prose. The vertical bar `|` is avoided.
- **No flag emoji** for country/program references. Use the institution's name.

### Logos

`assets/tre-wordmark.svg` — primary horizontal lockup with red bar.
`assets/tre-mark.svg` — square mark for tight spaces (favicon, social avatar).
`assets/accreditation-badge.svg` — Unggul accreditation lockup.

The bar in the wordmark is **always #E30613** and **always on the left**. Do not recolor it. Do not move it. Do not separate it from the wordmark.

---

## CONTENT FUNDAMENTALS

### Voice

**Institutional confidence without stiffness.** Statements are declarative and short. The program does not sell itself with adjectives; it states what it does and what it produces. Imagine a department head briefing the rector — clear, deliberate, secure in its mandate. No excited copy, no exclamation marks, no "join the journey," no metaphors about lighting up futures.

The tone holds two ideas in tension:
- **Vocational rigor** — this is hands-on engineering, not theoretical pretension. Mention labs, equipment, industry partnerships by name.
- **National-scale ambition** — the work matters because Indonesia's electrical infrastructure matters. Don't shy from this. Petronas-style: "we power the nation" said quietly.

### Person & address

- **Third-person institutional** for primary headlines and program descriptions ("The program prepares…", "TRE graduates…", "Lulusan kami…").
- **Second-person ("you", "kamu" / "Anda")** is reserved for direct calls to action and admissions copy. Use sparingly.
- **First-person plural ("we", "kami")** when speaking on behalf of the program — letters from the Kaprodi, partnership statements. Never "I".
- Bilingual content is normal. Indonesian (Bahasa) and English coexist. Use Bahasa for primary national-facing copy; English for international/exchange context. **Do not mix them in a single sentence.**

### Casing

- **Sentence case** for headings, buttons, navigation. Title Case is reserved for proper nouns and the institution's full legal name.
- **Numerals always in figures**, even small ones — "4 years," "12 labs," "200+ industry partners." Numbers are a feature of the brand.
- Acronyms uppercase: TRE, UGM, TEDI, PLN, D4. Never "Tre" or "tre".

### Vocabulary

| Use | Avoid |
|---|---|
| program, kurikulum, lulusan, kompetensi | "journey," "experience," "unlock" |
| pembangkitan, transmisi, distribusi | generic engineering buzzwords |
| Praktik Industri (PI), Magang | "internship perks" |
| akreditasi Unggul | "best in class," "world-leading" |
| 4-year applied bachelor | "future-ready learners" |
| industri mitra (named: PLN, Schneider, …) | "global partners" without naming |

### Punctuation & rhythm

- **Em dashes** for definitional or expansive asides — used freely.
- **Periods at the end of standalone statements**, including ones inside cards. Sentence fragments are acceptable when they read like specs.
- **No emoji.** Anywhere. Iconography is geometric stroke-based, never expressive.
- **No exclamation marks.** Even in news headlines.
- **Numbers paired with monospace** in stats blocks — the mono itself is the signal.

### Examples

> ✅ "TRE menyiapkan tenaga ahli di bidang pembangkitan, transmisi, distribusi, dan instalasi tenaga listrik."
>
> ✅ "Four years. Twelve laboratories. One mandate — engineers Indonesia can build with."
>
> ✅ "Akreditasi Unggul. LAM Teknik, 2026."
>
> ❌ "🚀 Ready to spark your engineering journey? Join TRE today!"
>
> ❌ "We're so excited to announce that TRE has achieved excellent accreditation status!!"

The first three sound like the institution. The last two sound like a startup pretending to be one.

---

## VISUAL FOUNDATIONS

### Visual philosophy

Two reference points, held in tension:

1. **Vercel** — for spatial confidence. Wide gutters, large deliberate whitespace, type-driven hierarchy, near-black backgrounds, sparing use of color. Layout is the design.
2. **Petronas** — for institutional weight. A sense that the brand carries national consequence, that the red mark has earned its place. Warmth, not coldness. Legacy without nostalgia.

The result should feel **engineered**: every element has a structural reason, nothing is decorative.

### Color

**Two backgrounds**, alternating to create rhythm:

- `#0D0D0D` near-black — hero, dark sections, footer
- `#F8F7F4` warm off-white — content sections, supporting material

**One accent**:

- `#E30613` TRE red — used like electricity. Never as a fill on large surfaces, never as a section background. Reserved for: the wordmark stroke, single-character accents in a headline, the underline of a focused link, a 1px ascending bar in a stat. The user should be able to scroll past two screens before seeing it again. When it appears, it should feel like a switch closing.

**Text**:

- On dark: `#F0EDE8` (warm white — explicitly not `#FFFFFF`, which reads cold and feels web-app)
- On light: `#1A1A1A`
- Muted: `#8A8A8A` on either ground

**Borders**:

- `#2C2C2C` on dark — barely-there hairlines
- `#E8E4E0` on light — same idea, warmer

No tertiary brand colors. No gradients applied to text or large areas. Single-stop subtle radial glows are permitted in hero only, at very low alpha (<10%), red or warm-white.

### Typography

| Role | Family | Weight | Size range |
|---|---|---|---|
| Display headline | Space Grotesk | 500–600 | 72–96px |
| Section heading | Space Grotesk | 500 | 40–56px |
| Subhead | Space Grotesk | 500 | 22–28px |
| Body | Inter | 400 | 16–18px |
| Small / caption | Inter | 400 | 13–14px |
| Eyebrow / label | Inter | 500, uppercase, tracked +0.08em | 12–13px |
| Numbers, IDs, code | JetBrains Mono | 400–500 | matches surrounding text |

**Hierarchy is strict.** One dominant heading per section. Subheads are visually subordinate by at least 2× — never two competing weights. Body sits at a comfortable 65–75ch line length. Letter-spacing on display sizes is *tightened* (-0.02em on Space Grotesk above 56px), tracked positive only on uppercase eyebrows.

Numbers use **JetBrains Mono** wherever they signal precision — stats, room numbers, dates, accreditation IDs, course codes. Inside running prose, Inter is fine.

### Spacing & layout

- **12-column grid**, max content width **1200px**, centered, never edge-to-edge except for full-bleed hero imagery.
- **Section vertical padding: 120–160px** minimum on desktop. Down to 80px on mobile.
- **Gutters: 32px** on desktop, 16px on mobile.
- Cards are not the unit — **type and whitespace are the unit**. Reach for a card only when grouping is genuinely necessary (e.g. faculty profiles, program comparison).
- Margin is the design. If a section feels thin, do not pad with content — widen the margins until the content earns its space.

### Backgrounds

- **No patterns, no textures, no gradients applied as decoration.**
- Hero may carry a single full-bleed photograph — preferably grayscale or desaturated, with high contrast. Substation, transmission tower, lab equipment. Never stock photos of people pointing at screens.
- Mid-sections are flat color. Alternation is the rhythm.
- Imagery, when used, is **warm-toned, slightly desaturated, with documentary feel**. Not cold-blue corporate stock.

### Animation

- **Restrained.** The system favors stillness; movement is information.
- Page-load: nothing animates. Content is present.
- Scroll: subtle fade-up (12px translate, 400ms, ease-out) on section entry, **once**. No parallax. No counter animations on stats.
- Hover (desktop): opacity drop to 0.7 on links, **150ms**. Buttons swap text/bg colors over 200ms with `cubic-bezier(0.2, 0.8, 0.2, 1)`. Cards do not lift.
- Press: 50ms scale to 0.98, immediate spring back.
- **No bounce. No spring overshoot. No staggered character reveals.**

### Borders, corners, shadows

- **Border radius: 0** on most surfaces. Buttons, cards, inputs have a **2px** radius — barely there, suggests engineered tolerance.
- Pills and badges may use full-radius (`9999px`) when truly pill-shaped — sparingly.
- **Shadows: almost none.** A single elevation level exists for floating menus only: `0 1px 0 0 rgba(0,0,0,0.04), 0 12px 40px -12px rgba(0,0,0,0.18)`.
- Borders carry the structure. 1px hairlines at the section breaks, none on the cards themselves unless a card sits on the same color as its background.

### Transparency, blur, fixed elements

- The header is **fixed** at the top, with `backdrop-filter: blur(12px)` and a 70% alpha background matching the section it sits over. It is **2px below** the section break — a hairline border indicates it.
- Modal scrims use `rgba(13,13,13,0.6)` with a 6px backdrop blur.
- No frosted glass on cards or anywhere else.

### Imagery treatment

- Documentary, warm-tone, slightly desaturated. Lab interiors, hands at work, equipment detail.
- Avoid: people smiling at the camera, drone shots of the campus from above, generic "team meeting" stock.
- Black-and-white is acceptable when the photograph is strong on its own.
- Full-bleed imagery is reserved for hero and section dividers — never as background for body text.

### Layout rules

- **Header height: 72px**, fixed, with the wordmark left and primary nav center-right. Single accent color usage permitted here on the active nav item (red 1px underline).
- **Footer is dark even when its preceding section is light.** It carries the institutional address, accreditation, parent identities (TEDI, Sekolah Vokasi, UGM), and a single thin red rule above the address block.
- **Stats blocks** sit alone — surrounded by 120px+ vertical whitespace. Numbers in JetBrains Mono, very large (96–128px), label in small uppercase Inter.
- Lists do not use bullets. Use a 1px left border or numeric prefixes in mono.

