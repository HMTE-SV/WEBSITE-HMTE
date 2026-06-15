# WEBSITE-HMTE

This repository currently tracks a focused HMTE public landing redesign slice rather than a full application shell.

## Current tracked scope

- `css/hmte.css`: consolidated visual system for the landing experience, including the HMTE navy/gold palette, typography tokens, layout primitives, and section styling.
- `src/components/site/Hero.tsx`: photo-grid hero with the HMTE institutional identity block.
- `src/components/site/KabinetSection.tsx`: kabinet/division overview cards rendered from `Division[]`.
- `src/components/site/Footer.tsx`: footer contact block plus grouped internal and external links.

These React components import data from `@/data/site-content` and `@/types/content`. If you are checking out only the tracked baseline on `beta-dev`, expect to supply the wider app shell and data files from your active local work before rendering them.

At the time of writing, directories such as `src/data/`, `src/lib/`, and `src/types/` may exist in local worktrees but are not part of the tracked baseline on this branch. Treat them as local in-progress context unless you intentionally stage and commit them.

## Working-tree notes

- Generated local directories such as `node_modules/`, `.next/`, `.next-local/`, and `outputs/` are development artifacts, not source-of-truth code.
- `.claude/` is local agent workspace state and stays ignored by default.
- `audit/` is for local design/content QA evidence and stays ignored by default.
- `verification/*.png` and `verification/chrome-*-profile/` stay ignored by default so screenshot evidence and transient browser-profile dumps do not leak into routine commits.
- If you intentionally need to preserve QA evidence in git, force-add only the exact files that belong in project history.

## Maintenance rule

When making small maintenance updates here, prefer surgical documentation or quality changes that match the tracked branch state. Do not mix those updates with unrelated local redesign work already in progress.
