'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  FiBarChart2,
  FiChevronDown,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPlusSquare,
  FiSettings,
  FiShield,
  FiTag,
  FiUser,
  FiUserPlus,
  FiUsers,
  FiX,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { api } from '@/lib/api';

type SidebarProps = {
  role: string;
  name: string;
  permissions: Record<string, boolean>;
};

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  matches?: (pathname: string) => boolean;
};

const LOGO_PATH = '/logo/B-one Production (1).png';

export default function Sidebar({ role, name, permissions }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const showAccounts = role === 'superadmin';
  const showReports = role === 'superadmin' || role === 'admin';
  const showSettings = role === 'superadmin';

  const workspaceLinks: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: FiHome },
    ...(role === 'admin' || role === 'user'
      ? [{
          href: '/dashboard/entry/new',
          label: 'New entry',
          icon: FiPlusSquare,
          matches: (path: string) => path.startsWith('/dashboard/entry/'),
        }]
      : []),
    ...(role === 'user'
      ? [{ href: '/dashboard/details', label: 'My details', icon: FiUser }]
      : []),
    ...(permissions?.manageFields || role === 'superadmin'
      ? [{ href: '/dashboard/fields', label: 'Fields', icon: FiTag }]
      : []),
  ];

  const accountLinks: NavItem[] = [
    { href: '/dashboard/admins', label: 'Admins', icon: FiShield },
    { href: '/dashboard/users', label: 'Users', icon: FiUsers },
  ];

  const reportLinks: NavItem[] = role === 'superadmin'
    ? [{ href: '/dashboard/reports', label: 'Team reports', icon: FiBarChart2 }]
    : [{ href: '/dashboard/reports/team', label: 'Team report', icon: FiUsers }];

  const accountsActive = accountLinks.some((item) => pathname === item.href);
  const reportsActive = pathname === '/dashboard/reports' || pathname.startsWith('/dashboard/reports/');

  useEffect(() => {
    setMobileOpen(false);
    if (accountsActive) setAccountsOpen(true);
    if (reportsActive) setReportsOpen(true);
  }, [accountsActive, pathname, reportsActive]);

  useEffect(() => {
    if (!mobileOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileOpen(false);
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  async function handleLogout() {
    if (signingOut) return;
    setSigningOut(true);
    setMobileOpen(false);
    try {
      await api.logout();
    } finally {
      router.replace('/login');
    }
  }

  const initial = name.trim().charAt(0).toUpperCase() || 'U';
  const roleLabel = role === 'superadmin' ? 'Super admin' : role;

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/10 bg-blue-950/95 px-4 text-white shadow-[0_6px_20px_rgba(0,15,35,0.28)] backdrop-blur-xl lg:hidden">
        <Brand compact />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open navigation"
          aria-expanded={mobileOpen}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.08] text-blue-100 ring-1 ring-white/10 transition hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300"
        >
          <FiMenu size={20} aria-hidden="true" />
        </button>
      </header>

      <button
        type="button"
        onClick={() => setMobileOpen(false)}
        aria-label="Close navigation"
        className={`fixed inset-0 z-40 bg-blue-950/45 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[17.5rem] max-w-[86vw] flex-col border-r border-white/10 bg-[linear-gradient(165deg,#061b30_0%,#082e50_58%,#064a76_100%)] text-white shadow-[16px_0_50px_rgba(0,15,35,0.38)] transition-[transform,width] duration-300 ease-out lg:sticky lg:top-0 lg:z-0 lg:h-screen lg:max-w-none lg:shrink-0 lg:translate-x-0 lg:shadow-[6px_0_28px_rgba(7,39,71,0.16)] ${
          collapsed ? 'lg:w-20' : 'lg:w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
   
        <div className={`flex h-[5.25rem] shrink-0 items-center justify-between border-b border-white/10 px-5 ${collapsed ? 'lg:justify-center lg:px-2' : ''}`}>
          <div className="lg:hidden">
            <Brand />
          </div>
          <div className="hidden lg:block">
            <Brand collapsed={collapsed} onToggle={() => setCollapsed((current) => !current)} />
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-blue-100/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 lg:hidden"
          >
            <FiX size={19} aria-hidden="true" />
          </button>
        </div>

        <nav className={`scrollbar-hide flex-1 overflow-y-auto px-3 py-5 ${collapsed ? 'lg:px-2' : ''}`}>
          <NavigationLabel collapsed={collapsed}>Workspace</NavigationLabel>
          <div className="space-y-1.5">
            {workspaceLinks.map((item) => (
              <NavigationLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
            ))}

            {showReports && (
              <NavigationGroup
                id="reports-menu"
                label="Reports"
                icon={FiBarChart2}
                items={reportLinks}
                pathname={pathname}
                active={reportsActive}
                open={reportsOpen}
                collapsed={collapsed}
                childDotOnly
                onToggle={() => setReportsOpen((current) => !current)}
              />
            )}
          </div>

          {showAccounts && (
            <div className={`mt-7 ${collapsed ? 'lg:mt-2' : ''}`}>
              <NavigationLabel collapsed={collapsed}>Administration</NavigationLabel>
              <NavigationGroup
                id="accounts-menu"
                label="Accounts"
                icon={FiUserPlus}
                items={accountLinks}
                pathname={pathname}
                active={accountsActive}
                open={accountsOpen}
                collapsed={collapsed}
                childDotOnly
                onToggle={() => setAccountsOpen((current) => !current)}
              />
            </div>
          )}

          {showSettings && (
            <div className="mt-1.5">
              <NavigationLink
                item={{ href: '/dashboard/settings', label: 'Settings', icon: FiSettings }}
                pathname={pathname}
                collapsed={collapsed}
              />
            </div>
          )}
        </nav>

        <footer className={`shrink-0 border-t border-white/10 p-3.5 ${collapsed ? 'lg:p-2' : ''}`}>
          <div className={`relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.07] p-3.5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_28px_-14px_rgba(0,10,30,0.65)] backdrop-blur-sm ${collapsed ? 'lg:p-2' : ''}`}>
            <div className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-blue-300/10 blur-2xl" />
            <div className={`relative flex items-center gap-3 ${collapsed ? 'lg:flex-col lg:gap-2' : ''}`}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-200 to-blue-400 text-sm font-extrabold text-blue-950 shadow-sm">
                {initial}
              </div>
              <div className={`min-w-0 flex-1 ${collapsed ? 'lg:sr-only' : ''}`}>
                <p className="truncate text-sm font-semibold">{name || 'User'}</p>
                <p className="mt-0.5 truncate text-[10px] font-semibold capitalize tracking-wide text-blue-200/70">
                  {roleLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                disabled={signingOut}
                aria-label={signingOut ? 'Signing out' : 'Sign out'}
                title="Sign out"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.08] text-blue-100 ring-1 ring-white/10 transition hover:bg-red-400/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:cursor-wait disabled:opacity-50"
              >
                {signingOut ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <FiLogOut size={16} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </footer>
      </aside>
    </>
  );
}

function Brand({ compact = false, collapsed = false, onToggle }: { compact?: boolean; collapsed?: boolean; onToggle?: () => void }) {
  const content = (
    <>
      <span
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-white/20 ${
          compact ? 'h-9 w-9' : 'h-11 w-11'
        }`}
      >
        <Image
          src={LOGO_PATH}
          alt="Beone Production logo"
          width={40}
          height={40}
          className="h-[90%] w-[90%] object-contain transition-transform duration-300 group-hover:scale-105"
          priority
        />
      </span>
      <span className={`min-w-0 ${collapsed ? 'lg:sr-only' : ''}`}>
        <span className={`block truncate font-display font-bold tracking-tight text-white ${compact ? 'text-sm' : 'text-base'}`}>
          Beone Production
        </span>
        {!compact && (
          <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.2em] text-blue-200/55">
            Operations workspace
          </span>
        )}
      </span>
    </>
  );

  const className = "group flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300";

  if (onToggle) {
    return (
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={className}
      >
        {content}
      </button>
    );
  }

  return <Link href="/dashboard" className={className}>{content}</Link>;
}

function NavigationLabel({ children, collapsed = false }: { children: string; collapsed?: boolean }) {
  return (
    <p className={`mb-2.5 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-blue-200/45 ${collapsed ? 'lg:sr-only' : ''}`}>
      {children}
    </p>
  );
}

function NavigationLink({
  item,
  pathname,
  nested = false,
  dotOnly = false,
  collapsed = false,
}: {
  item: NavItem;
  pathname: string;
  nested?: boolean;
  dotOnly?: boolean;
  collapsed?: boolean;
}) {
  const active = item.matches ? item.matches(pathname) : pathname === item.href;
  const Icon = item.icon;
  const dotOnlyActive = nested && dotOnly && active;

  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      aria-label={collapsed ? item.label : undefined}
      title={collapsed ? item.label : undefined}
      className={`group flex items-center gap-3 rounded-xl font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        nested ? 'px-2.5 py-2 text-[13px]' : 'px-2.5 py-2.5 text-sm'
      } ${collapsed ? 'lg:justify-center lg:gap-0 lg:px-1.5' : ''} ${
        dotOnlyActive
          ? 'text-white'
          : active
          ? 'bg-white text-blue-950 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.8)]'
          : 'text-blue-100/65 hover:bg-white/[0.08] hover:text-white'
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-lg transition-colors ${
          nested ? 'h-7 w-7' : 'h-8 w-8'
        } ${dotOnlyActive ? 'bg-white/[0.08] text-blue-100' : active ? 'bg-blue-100 text-blue-700' : 'bg-white/[0.06] text-blue-200/65 group-hover:bg-white/10 group-hover:text-blue-100'}`}
      >
        <Icon size={nested ? 14 : 16} aria-hidden="true" />
      </span>
      <span className={`min-w-0 flex-1 truncate ${collapsed ? 'lg:sr-only' : ''}`}>{item.label}</span>
      {active && (
        <span
          className={`rounded-full ${collapsed ? 'lg:hidden' : ''} ${dotOnlyActive ? 'h-2 w-2 bg-cyan-300 shadow-[0_0_9px_rgba(103,232,249,0.85)]' : 'h-1.5 w-1.5 bg-blue-500'}`}
          aria-hidden="true"
        />
      )}
    </Link>
  );
}

type NavigationGroupProps = {
  id: string;
  label: string;
  icon: IconType;
  items: NavItem[];
  pathname: string;
  active: boolean;
  open: boolean;
  collapsed?: boolean;
  childDotOnly?: boolean;
  onToggle: () => void;
};

function NavigationGroup({ id, label, icon: Icon, items, pathname, active, open, collapsed = false, childDotOnly = false, onToggle }: NavigationGroupProps) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={id}
        aria-label={collapsed ? label : undefined}
        title={collapsed ? label : undefined}
        className={`group flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
          collapsed ? 'lg:justify-center lg:gap-0 lg:px-1.5' : ''
        } ${
          active
            ? 'bg-white text-blue-950 shadow-[0_10px_24px_-14px_rgba(0,0,0,0.8)]'
            : 'text-blue-100/65 hover:bg-white/[0.08] hover:text-white'
        }`}
      >
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-blue-100 text-blue-700' : 'bg-white/[0.06] text-blue-200/65 group-hover:bg-white/10 group-hover:text-blue-100'}`}>
          <Icon size={16} aria-hidden="true" />
        </span>
        <span className={`flex-1 text-left ${collapsed ? 'lg:sr-only' : ''}`}>{label}</span>
        <FiChevronDown
          size={15}
          aria-hidden="true"
          className={`transition-transform duration-200 ${collapsed ? 'lg:hidden' : ''} ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <div
        id={id}
        className={`grid transition-[grid-template-rows,opacity] duration-200 ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className={`ml-5 mt-1.5 space-y-1 border-l-2 border-white/10 pl-3 ${collapsed ? 'lg:ml-0 lg:border-l-0 lg:pl-0' : ''}`}>
            {items.map((item) => (
              <NavigationLink key={item.href} item={item} pathname={pathname} nested dotOnly={childDotOnly} collapsed={collapsed} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
