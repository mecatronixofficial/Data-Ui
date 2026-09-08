# Shared layouts

## Root layout — `app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import ToastProvider from '@/components/ToastProvider';
import './globals.css';
export const metadata: Metadata = { title: 'Beone Production — Data Entry', description: 'Beone Production data entry and reporting' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body className="font-body bg-paper text-blue-900 min-h-screen"><ToastProvider>{children}</ToastProvider></body></html>;
}
```

## Dashboard shell — `app/dashboard/layout.tsx`

Client-authenticated shell. It loads the current user, shows a branded workspace loader, renders `Sidebar`, and places page content in a centered 6xl gradient workspace. Full implementation: `app/dashboard/layout.tsx` (115 lines).

## Sidebar — `components/Sidebar.tsx`

Responsive dark-blue navigation with desktop collapse, mobile drawer, logo, role-aware workspace/account/report groups, profile identity and sign-out. Full implementation: `components/Sidebar.tsx` (433 lines). Navigation changes by `role` and `permissions`; mobile uses a modal backdrop and Escape dismissal.
