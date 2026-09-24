# Paper editorial detail polish — design

Date: 2026-07-13
Scope: detail-level polish of the existing warm-paper editorial design. No layout,
palette, or structural changes. All changes land in `assets/css/paper.css`
(single override layer that loads last), plus verification in light/dark and mobile.

Approved punch list:

1. **Tables** — header background currently spans only the content columns while the
   table block stretches full width, leaving a hollow bordered gap on the right.
   Fix: size the table to its content (`width: max-content`, capped at 100% with
   horizontal scroll preserved), increase cell padding, unify row rules with
   `--rule`, restyle the header row without the half-painted background.
2. **Selection highlight** — `::selection` uses 9%-alpha accent, near invisible.
   Raise to a clearly visible terracotta wash (~25% light / ~30% dark).
3. **Footnotes** — mono accent numbering, styled back-arrow (↩), consistent rule
   above the block.
4. **Figcaption** — centered, mono, small, `--ink-soft`.
5. **h4** — editorial label treatment: mono, uppercase, letter-spaced, small size.
6. **Inline code** — drop the 4px radius (site language is zero-radius).
7. **End-of-article mark** — centered fleuron (❦) after article body.
8. **Dark mode pass** — verify every item above under `.dark`.

Out of scope: palette, homepage layout, nav, list pages, content.
