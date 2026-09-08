# Theme

## Compact token summary

- Brand: operational blue. `50 #EFF8FF`, `100 #DCEEFF`, `200 #B9DEFF`, `300 #86C7FF`, `400 #4AA9F4`, `500 #1689DC`, `600 #006BC4`, `700 #0057A2`, `800 #064A83`, `900 #0B3E6C`, `950 #072747`.
- Surfaces: paper `#F7FBFF`, card `#FFFFFF`, line `#DCEEFF`.
- Semantic accents: emerald success, amber warning, red destructive, violet admin/security.
- Display font: Trebuchet MS → Aptos Display → Segoe UI. Body: Aptos → Segoe UI → Roboto. Mono: Cascadia Mono → Consolas.
- Radius: controls 12px; cards 16px; feature/dialog surfaces 24px.
- Shadows: card `0 1px 2px rgba(20,22,28,.04), 0 8px 24px rgba(20,22,28,.06)`; receipt `0 2px 0 rgba(20,22,28,.05), 0 12px 28px rgba(20,22,28,.10)`.
- Breakpoints: Tailwind defaults (`sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`).
- Motion: 150–280ms interaction transitions; reduced-motion disables decorative entry/toast animation.

## Raw source locations

The complete raw token sources are `tailwind.config.ts` and `app/globals.css`. The latter contains Tailwind layers, global typography, tabular-number treatment, hidden-scrollbar utility, toast/workspace/entry animations, dense entry-page type scaling, and entry card surface rules. Both are passed directly to design generation so their complete current values remain authoritative.
