# WEBSITE-HMTE

This repository currently tracks a focused HMTE public landing redesign slice rather than a full application shell.

## Current tracked scope

- `css/hmte.css`: consolidated visual system for the landing experience, including the HMTE navy/gold palette, typography tokens, layout primitives, and section styling.
- `src/components/site/Hero.tsx`: photo-grid hero with the HMTE institutional identity block.
- `src/components/site/KabinetSection.tsx`: kabinet/division overview cards rendered from `Division[]`.
- `src/components/site/Footer.tsx`: footer contact block plus grouped internal and external links.

These React components import data from `@/data/site-content` and `@/types/content`. If you are checking out only the tracked baseline on `beta-dev`, expect to supply the wider app shell and data files from your active local work before rendering them.

## Working-tree notes

- Generated local directories such as `node_modules/`, `.next/`, `.next-local/`, and `outputs/` are development artifacts, not source-of-truth code.
- `audit/` and `verification/` are useful for manual design QA evidence. Keep them local unless you intentionally decide to stage that evidence.

## Maintenance rule

When making small maintenance updates here, prefer surgical documentation or quality changes that match the tracked branch state. Do not mix those updates with unrelated local redesign work already in progress.
