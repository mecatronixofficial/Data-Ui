# Extractable components

## Sidebar
- Source: `components/Sidebar.tsx`
- Category: layout
- Description: responsive role-aware navigation rail and mobile drawer.
- Extractable props: `role`, `name`, `permissions`, active route, collapsed/open state.
- Hardcoded: brand logo, navigation labels, Feather icons, shell colors.

## DashboardShell
- Source: `app/dashboard/layout.tsx`
- Category: layout
- Description: authenticated shell, loading state and content canvas.
- Extractable props: current user, loading state.
- Hardcoded: logo, ambient backgrounds, content width.

## StatCard
- Source: `components/StatCard.tsx`
- Category: basic
- Description: compact KPI card with semantic tones.
- Extractable props: `label`, `value`, `icon`, `tone`, `highlight`.

## TotalPill
- Source: `components/TotalPill.tsx`
- Category: basic
- Description: tabular numeric badge with signed coloring.
- Extractable props: `label`, `value`, `emphasize`, `dark`, `colorBySign`.

## ConfirmDeleteModal
- Source: `components/ConfirmDeleteModal.tsx`
- Category: basic
- Description: accessible confirmation dialog for destructive operations.
- Extractable props: title/body copy, loading state, confirmation callback.

## ToastViewport
- Source: `components/ToastProvider.tsx`
- Category: basic
- Description: stacked notification surface with tone, lifetime and dismissal.
- Extractable props: toast items and dismissal state.

## TallyBox
- Source: `components/TallyBox.tsx`
- Category: basic
- Description: expandable numeric/detail data-entry card.
- Extractable props: field schema, value/details, lock state, color/icon and callbacks.
