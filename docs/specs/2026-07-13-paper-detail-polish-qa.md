# Design QA

final result: passed

## Source and implementation

- Reference: `/Users/rprp/.codex/generated_images/019f5ae4-6768-7091-978e-7f08b363c8c9/exec-89434e16-9818-46da-8c04-cd1246ea5954.png`
- Implementation screenshot: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/paper-home-implementation.png`
- Full-view comparison: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/design-qa-comparison.png`
- Focused hero comparison: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/design-qa-hero-comparison.png`
- Mobile homepage: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/paper-home-mobile-fold.png`
- Mobile article: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/paper-article-mobile.png`

## Comparison state

- Route: homepage `/`
- Theme: light paper
- Reference size: 1487 × 1058
- Browser state: 1440 × 1024 CSS pixels at DPR 2
- Implementation capture: 2880 × 2048, normalized to 1487 × 1058 for the side-by-side comparison
- Focused region: masthead and two-column hero, cropped at identical coordinates from both normalized images

## Visual findings

- P0: none
- P1: none
- P2: none
- P3: the live implementation keeps the existing search and theme controls, uses real current post data, and replaces the mock's decorative topic icons with numbered editorial markers. These are intentional functional/content adaptations; the selected paper texture, warm ivory color temperature, terracotta accents, typography hierarchy, two-column structure, rules, and vertical rhythm remain aligned with the reference.

## Responsive and interaction checks

- Homepage at 390 × 844: passed; the hero becomes one column and the document has no horizontal overflow.
- Article at 390 × 844: passed; the table of contents moves above the article, the long title wraps cleanly, and the document has no horizontal overflow.
- Search trigger: passed; opens the search overlay and exposes the local Pagefind fallback when the index is absent.
- Escape close: passed.
- Theme toggle: passed in both directions; accessible labels and visible `paper`/`ink` state stay synchronized.
- Header and post links: valid internal URLs confirmed from the rendered DOM.
- Console: no application errors. Expected local warnings only: Pagefind index absent in development and Giscus discussion not created yet.

## Build checks

- `hugo --destination /tmp/wrp-preview-build --cleanDestinationDir --gc --minify`: passed, 26 pages.
- Targeted `git diff --check`: passed.
- Local preview: HTTP 200 at `http://127.0.0.1:1313/`.

## Fix history

1. Consolidated the theme into one warm-paper token system, then applied it to the masthead, homepage, lists, articles, search, code, tables, and footer.
2. Matched the selected first design's two-column hero and ruled recent-notes ledger while preserving the site's real content and controls.
3. Tightened the hero-to-notes spacing, removed duplicate script loading, and verified desktop and mobile states.

## Typography refinement

- Before/after comparison: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/typography-qa-resume-comparison.png`
- Final desktop Resume: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/typography-after-resume.png`
- Final desktop About: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/typography-after-about.png`
- Final mobile Resume: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/typography-after-resume-mobile.png`
- Drop-cap removal: passed; the first letter now computes to the surrounding 16px text size with `float: none`.
- Evergreen page metadata: passed; About and Resume no longer render publication dates.
- Hierarchy: passed; page titles, content headings, lists, and table-of-contents widths use the revised document scale.
- Mobile: passed at 390 × 844; no horizontal overflow on Resume or the long-title CJK article.

## LXGW WenKai quote refinement

- User-selected target: keep the warm ivory and terracotta paper system, and introduce LXGW WenKai only as a restrained handwritten accent for article quotations.
- Official source: `https://github.com/lxgw/LxgwWenKai`, release `v1.522`, SIL Open Font License 1.1.
- Web delivery: `https://fontsapi.zeoseven.com/292/main/result.css`; ZSFT is an author-recognized web-font provider referenced by the upstream project.
- Before: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/wenkai-blockquote-before.png`
- After: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/wenkai-blockquote-after.png`
- Same-state comparison: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/wenkai-blockquote-comparison.png`
- Mobile article: `/Users/rprp/.codex/visualizations/2026/07/13/019f5ae4-6768-7091-978e-7f08b363c8c9/wenkai-blockquote-mobile.png`
- Route and state: `/posts/wasmvectoranns/#小实验与实现`, light paper theme, identical desktop viewport and anchor state for before/after.
- Visual finding: passed. The old inherited italic treatment is removed; the Chinese quote now receives the lighter handwritten Kai character while Latin text continues through Iowan Old Style. Body copy, headings, and code remain unchanged, preserving technical readability and the established hierarchy.
- Computed style: `font-family: "Iowan Old Style", "LXGW WenKai", 霞鹜文楷, "Kaiti SC", STKaiti, serif`; `font-style: normal`; `font-size: 16.64px`; `line-height: 30.62px`; `document.fonts.check(...) = true`.
- Mobile check: passed at 390 × 844; document `scrollWidth` equals `clientWidth`, so the adjusted quote does not introduce horizontal overflow.
- Font service check: HTTP 200 with cross-origin access enabled and cache headers present.
- Build check: `hugo --destination /tmp/wrp-wenkai-build --cleanDestinationDir --gc --minify` passed, 26 pages; targeted `git diff --check` passed.
