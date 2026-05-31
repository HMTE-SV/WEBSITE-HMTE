---
name: tre-design
description: Use this skill to generate well-branded interfaces and assets for TRE (Teknologi Rekayasa Elektro, Sarjana Terapan, Sekolah Vokasi UGM), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.
If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.
If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick reference

- **Brand**: TRE — Sarjana Terapan Teknologi Rekayasa Elektro · Sekolah Vokasi UGM
- **Tone**: Institutional confidence without stiffness. Vercel spatial generosity × Petronas gravitas.
- **Colors**: `#0D0D0D` near-black · `#F8F7F4` warm off-white · `#E30613` TRE red (used like electricity) · `#F0EDE8` warm white ink on dark · `#1A1A1A` ink on light · `#8A8A8A` muted.
- **Type**: Geist (display) · Inter (body) · JetBrains Mono (numbers, codes, IDs).
- **Spacing**: Section vertical padding **120–160px**. Content max-width **1200px**, centered. 12-column grid, 32px gutters.
- **Radius**: Apple-style consistent curve — 8 (sm) / 12 (md) / 16 (lg) / 24 (xl). Same family of curvature across all surfaces.
- **Iconography**: Lucide, 1.5px stroke, 24px nominal, currentColor. **No emoji.**
- **Motion**: Restrained. Fade-up 12px / 400ms on entry. Hover opacity → 0.7 / 150ms. Press scale 0.98 / 50ms. No bounce, no spring.

## Files

| | |
|---|---|
| `README.md` | Full system: context, content fundamentals, visual foundations, iconography |
| `colors_and_type.css` | Token system — import for any HTML artifact |
| `assets/` | `tre-wordmark.svg`, `tre-mark.svg`, `accreditation-badge.svg` |
| `preview/` | Cards rendered in the design-system tab |
| `ui_kits/landing/` | Landing-page recreation + JSX components |

## Voice cheat sheet

- Sentence case · numerals always in figures · acronyms uppercase (TRE, UGM, TEDI, PLN)
- Bilingual (Bahasa + English) but **never mixed in one sentence**
- Em dashes freely · no exclamation marks · no emoji
- Numbers paired with mono are the brand's stat signature
