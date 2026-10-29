---
version: alpha
colors:
  background: "oklch(0.965 0.006 240)"
  foreground: "oklch(0.20 0.030 250)"
  card: "oklch(1 0 0)"
  primary: "oklch(0.52 0.09 235)"
  muted: "oklch(0.95 0.004 240)"
  border: "oklch(0.91 0.004 240)"
  destructive: "oklch(0.58 0.18 25)"
typography:
  sans:
    fontFamily: "Prompt, sans-serif"
rounded:
  button: "0.7rem"
  card: "0.9rem"
omitted:
  - section: spacing
    reason: "Use existing Tailwind spacing and shared layout classes; no independent spacing token source."
  - section: components
    reason: "Runtime Base UI wrappers and shared premium components are canonical."
---

## Overview

NurseUp is a Thai nursing study workspace. Admin screens are task-oriented: quiet clinical blue, readable Thai, useful density, and clear data/action hierarchy. Extend the existing admin interface rather than create a separate visual identity.

## Colors

`src/app/globals.css` is the canonical token source. This file records the incumbent light theme; `.dark` in that stylesheet provides dark-mode values. Use semantic Tailwind classes (`bg-card`, `text-primary`, `border-border`) so both themes remain consistent. Color never replaces a text status.

## Typography

Prompt is loaded by the root layout for Thai and Latin. Use the existing `learning-page-title`, `PageHeader`, and shared body typography. Use tabular numerals for scores and durations. Keep full names readable; identifiers and emails may wrap within their cells.

## Layout

Reuse the admin shell: desktop sidebar from `lg`, mobile navigation below `lg`, a bounded content column, and the shell-owned vertical scroller. Tables may scroll horizontally in their own containers; show a mobile hint without causing document overflow. Use one heading, a search/action area, then the dataset. User detail pages use a profile definition list followed by complete exam history.

## Elevation & Depth

Prefer the existing `learning-panel`/GlassCard treatment: flat card surfaces, subtle borders, and restrained hover feedback. No decorative glass, new gradients, or dashboard statistics unrelated to the user's task.

## Shapes

Use existing rounded card/button classes. Radius values above describe the light-theme runtime mapping (`--radius: 0.5rem`, xl ×1.4, 2xl ×1.8); do not copy those lengths into individual components.

## Components

- Page headings: `PageHeader`; panels: `GlassCard`.
- Controls: existing Base UI `Button`, `Input`, and the Base UI `Checkbox` wrapper.
- Selection scope is explicit. `PaginationControls` is shared by user lists and user attempt history.
- Search is explicitly submitted and clears immediately; network results ignore stale responses.
- Loading/empty/error/success states must preserve available navigation and provide useful recovery.
- Motion follows existing shared components and respects reduced-motion preferences; tables do not stagger every row.
- Copy and accessible names use `src/lib/translations.ts`. Display dates using the active locale and explicit Bangkok time for these exam records.

## Do's and Don'ts

- Reuse runtime tokens and established components; preserve both locales and themes.
- Keep names, scores, and durations visually legible, and use native table/link/button semantics.
- Do not expose passwords, recovery data, sessions, or service keys in any UI or export.
- Do not replace the existing identity, introduce decorative metrics, or silently change product policies for a screen.
