# Route map

All routes use Next.js App Router and `app/layout.tsx`.

| URL | File | Layout / purpose |
|---|---|---|
| `/` | `app/page.tsx` | redirects to login/dashboard |
| `/login` | `app/login/page.tsx` | branded login and MFA flow |
| `/dashboard` | `app/dashboard/page.tsx` | role-aware operations overview |
| `/dashboard/entry/new` | `app/dashboard/entry/new/page.tsx` | dynamic production entry workspace |
| `/dashboard/entry/edit/[id]` | `app/dashboard/entry/edit/[id]/page.tsx` | reuses entry workspace in edit mode |
| `/dashboard/reports` | `app/dashboard/reports/page.tsx` | superadmin reports |
| `/dashboard/reports/team` | `app/dashboard/reports/team/page.tsx` | admin team report |
| `/dashboard/fields` | `app/dashboard/fields/page.tsx` | field/schema configuration |
| `/dashboard/admins` | `app/dashboard/admins/page.tsx` | admin account management |
| `/dashboard/users` | `app/dashboard/users/page.tsx` | user account management |
| `/dashboard/details` | `app/dashboard/details/page.tsx` | user profile/details |
| `/dashboard/settings` | `app/dashboard/settings/page.tsx` | profile, password and MFA settings |

Every `/dashboard/*` route uses `app/dashboard/layout.tsx` and `components/Sidebar.tsx`. Middleware rejects dashboard requests with no access or refresh cookie.
