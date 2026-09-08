# Beone Production — interface design system

Beone is a role-based production operations workspace for admins and operators. Its core jobs are entering structured daily production values, reviewing team output, configuring fields, managing accounts, and protecting access.

## Direction

Create a crisp, calm operations console: information-dense without looking cramped, confident rather than decorative, and highly legible for long daily sessions. Preserve the recognizable blue identity and real Beone logo. Use layered white surfaces on a very pale blue canvas, restrained borders, precise alignment, and semantic color only when it communicates status. Avoid generic SaaS gradients, glass-heavy surfaces, oversized marketing typography, and ornamental charts.

## Foundations

- Primary scale: `#EFF8FF #DCEEFF #B9DEFF #86C7FF #4AA9F4 #1689DC #006BC4 #0057A2 #064A83 #0B3E6C #072747`.
- Canvas `#F7FBFF`; cards `#FFFFFF`; lines `#DCEEFF`; primary action `#072747`; interactive blue `#006BC4`.
- Success emerald, warnings amber, destructive red, security/admin violet. Never use semantic colors as decoration.
- Display: Trebuchet MS/Aptos Display/Segoe UI. Body: Aptos/Segoe UI/Roboto. Mono: Cascadia Mono/Consolas for totals and codes.
- Type: page title 30–36px; section title 18–22px; body 14–16px; metadata 11–12px. Do not force every element bold; use 400/500 for body, 600 for labels, 700 for headings and key totals.
- 4px spacing base. Controls 40–44px tall. Cards use 16px radius, dialogs 24px, controls 10–12px.
- Use subtle card shadow and 1px blue-gray borders. Strong shadows only for dialogs and floating navigation.

## Shell and responsive behavior

Desktop uses a 240px navigation rail, optionally collapsing to 72px. The rail is deep navy with visible logo, clear active state, grouped navigation, and user identity at the bottom. Main pages use a maximum readable width but reports and entry tables may expand wider. Mobile uses a compact top bar and modal drawer. Essential actions remain reachable without horizontal scrolling; wide data regions use deliberate contained scrolling and sticky identifiers/actions.

## Components

- Buttons: one filled navy primary, white/blue outline secondary, quiet ghost tertiary, red destructive. Always show focus rings and disabled/loading states.
- Cards: title/metadata first, then value/content, then contextual action. Keep KPI cards compact.
- Forms: visible labels, optional helper text, clear error copy, comfortable touch targets. Group related settings in titled cards.
- Tables: sticky header, restrained row dividers, tabular numerals, hover/focus row state, explicit empty and loading states.
- Entry grid: retain field→box mental model; make locked/editable state immediately visible; keep running totals aligned; place reset/destructive actions away from primary input.
- Dialogs: labelled modal, short explanatory copy, clear cancel/confirm order, Escape close and focus management.

## Motion and performance

Use 150–220ms transitions for hover, expansion and drawer movement. Animate opacity/transform only. Honor reduced motion. Lazy-load modal/editor code, avoid decorative media, and prioritize immediate shell/loading feedback.

## Key pages

Dashboard: role context, compact KPI row, production trend/status, recent projects and team distribution with a clear primary action. Entry: focused workspace with progress/save state and dense but touch-friendly field cards. Reports: filters and export above a readable table, with column configuration/history/edit as secondary flows. Fields: schema builder with clear hierarchy and safe save/reset behavior. Accounts: creation form plus searchable, status-aware management list. Settings/details: narrow readable forms grouped by profile, security and MFA.
