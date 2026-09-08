# Page dependency trees

## `/login`
- `app/login/page.tsx`
  - `lib/api.ts`
  - `lib/toast.ts`

## `/dashboard`
- `app/dashboard/page.tsx`
  - `app/dashboard/layout.tsx`
    - `components/Sidebar.tsx`
    - `lib/api.ts`
  - `app/layout.tsx`
    - `components/ToastProvider.tsx`
    - `app/globals.css`

## `/dashboard/entry/new` and `/dashboard/entry/edit/[id]`
- `app/dashboard/entry/new/page.tsx`
  - `components/DynamicFieldsForm.tsx`
    - `components/TallyBox.tsx`
    - `components/TotalPill.tsx`
    - `components/IconPicker.tsx`
    - `components/ColorPicker.tsx`
  - `components/OperatorToggle.tsx`
  - `lib/api.ts`
  - `lib/toast.ts`
  - dashboard/root layouts above

## `/dashboard/reports` and `/dashboard/reports/team`
- route page
  - `components/ReportsView.tsx`
    - `components/DynamicFieldsForm.tsx`
      - `components/TallyBox.tsx`
      - `components/TotalPill.tsx`
      - `components/IconPicker.tsx`
      - `components/ColorPicker.tsx`
    - `components/OperatorToggle.tsx`
    - `lib/api.ts`
    - `lib/toast.ts`
  - dashboard/root layouts above

## `/dashboard/fields`
- `app/dashboard/fields/page.tsx`
  - `components/IconPicker.tsx`
  - `components/ColorPicker.tsx`
  - `components/OperatorToggle.tsx`
  - `lib/api.ts`
  - `lib/toast.ts`
  - dashboard/root layouts above

## `/dashboard/admins` and `/dashboard/users`
- route page
  - `components/EditAccountModal.tsx`
  - `components/ResetPasswordModal.tsx`
  - `components/ConfirmDeleteModal.tsx`
  - `lib/api.ts`
  - `lib/toast.ts`
  - dashboard/root layouts above

## `/dashboard/settings` and `/dashboard/details`
- route page
  - `lib/api.ts`
  - `lib/toast.ts`
  - dashboard/root layouts above
