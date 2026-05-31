# HMTE Website Context

Last updated: 2026-05-26

## Confirmed Direction

This project is for a **himpunan / HMTE website**, not for the TRE study program website.

The existing TRE prototype/live site is useful as a **visual reference**, especially for its abstract-modern layout, dark hero, large typography, rail elements, technical linework, and premium feel. However, the new target website should communicate as a student organization, not as a formal academic department or study program.

The preferred direction is:

- **Resmi tapi hidup**: credible enough for lecturers, department staff, alumni, sponsors, and partners, but still clearly student-led.
- **Modern communication hub**: the website should help students quickly understand what is happening in HMTE.
- **Advisor-safe**: avoid a style that is too loud, chaotic, rebellious, meme-like, or overly expressive, because it may be rejected or pressured by lecturers.

## Main Homepage Priority

The most important homepage content is:

1. **Agenda**
2. **Pengumuman**
3. **Berita / artikel**

The homepage should not feel like a static organizational profile. It should feel active, updated, and useful.

For the first implementation phase, content can use **sample data**. A CMS/backend is not required yet.

## Intended Audience

Primary audience:

- HMTE members and TRE/SV UGM students who need quick information.
- Students looking for agenda, announcements, articles, open recruitment, event updates, or organization news.

Secondary audience:

- Lecturers and department stakeholders who need to see that HMTE communicates responsibly.
- Alumni, partners, sponsors, and prospective students who want to understand HMTE's activity and credibility.

## Content Model for Sample Data

Use sample data first, structured so it can later be replaced by real content or a CMS.

Suggested content groups:

- `announcements`
  - title
  - category
  - date
  - status
  - summary
  - CTA label

- `articles`
  - title
  - category
  - date
  - excerpt
  - featured flag

- `events`
  - title
  - date
  - location or platform
  - status
  - short description

Example content themes:

- Open recruitment
- Seminar or workshop
- Academic announcement relevant to students
- Himpunan activity recap
- Competition or delegation news
- Community service or student advocacy update
- Cabinet/program work update

## Visual Reference

Use the TRE prototype/live site as a reference for **feel**, not content.

Keep:

- Abstract-modern composition
- Large confident typography
- Dark hero section
- Warm paper/off-white sections
- Technical linework and subtle system diagrams
- Red accent used sparingly as a signal
- Asymmetric layouts
- Calm, mature, polished spacing

Avoid:

- Overly formal study-program messaging
- Curriculum/SKS/accreditation as the main homepage story
- Generic campus template sections
- Too many ordinary cards
- Excessive playful visuals
- Startup-like hype language
- Overly expressive student-festival aesthetics

## Agreed Design Personality

Working direction name:

**Modern HMTE Communication Hub**

Short description:

An official but lively HMTE website that uses abstract engineering-inspired visuals to present agenda, announcements, articles, and organizational communication in a mature, student-led way.

Tone:

- Clear
- Responsible
- Warm
- Modern
- Student-led
- Not stiff
- Not too wild

## Current Repo Context

The current workspace still contains a TRE/prodi-oriented prototype:

- `index.html` currently focuses on Teknologi Rekayasa Elektro as a study program.
- Existing copy mentions TRE, D4, Sekolah Vokasi UGM, curriculum, SKS, labs, accreditation, and industry partners.
- Existing visual system has useful assets and tokens, but the content strategy must shift to HMTE.

Design system references currently present:

- near-black background
- warm paper/off-white surface
- red accent
- Geist / Inter / JetBrains Mono typography stack
- technical linework and interface-like sections

## Important Correction

Do not confuse these:

- **TRE website**: study program / jurusan prototype.
- **HMTE website**: himpunan website to be built now.

The HMTE site can borrow the TRE prototype's abstract-modern visual language, but it should communicate organization activity, announcements, agenda, articles, and student-facing information.

## Open Information Still Needed

These are not confirmed yet:

- Official long form of HMTE name to display.
- HMTE logo/mark assets.
- Current cabinet/periode name.
- Official social media links.
- Real contact or aspiration channel.
- Real announcement/article data.
- Whether future content will use static data, Markdown files, JSON, or a CMS.

Until those are provided, use neutral sample data and avoid claiming real official facts beyond what is already known.

## Prior Planning Memory

Previous planning context described the goal as building a credible, warm, responsive, and maintainable official HMTE TRE SV UGM website. That goal remains useful, but should now be interpreted specifically as a himpunan communication website, not a study-program landing page.
