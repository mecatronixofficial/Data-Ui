'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  FiArrowRight,
  FiArrowUpRight,
  FiBarChart2,
  FiCalendar,
  FiCheckCircle,
  FiFolder,
  FiLayers,
  FiPlus,
  FiShield,
  FiTrendingUp,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { api } from '@/lib/api';

type ProjectEntry = {
  _id: string;
  name: string;
  date: string;
  finalTotal: number;
  createdAt?: string;
  updatedAt?: string;
  teamName?: string;
  createdBy?: { name?: string };
  fields?: Array<{
    boxes?: number[];
    details?: Array<Array<Record<string, string | number>>>;
  }>;
};

type ProjectStatus = 'Planned' | 'In progress' | 'In review' | 'Completed';

type AccountSummary = {
  role: string;
  isActive?: boolean;
};

const STATUS_STYLES: Record<ProjectStatus, { dot: string; badge: string; chart: string }> = {
  Planned: { dot: 'bg-sky-400', badge: 'bg-sky-50 text-sky-700 ring-sky-100', chart: '#38bdf8' },
  'In progress': { dot: 'bg-blue-600', badge: 'bg-blue-50 text-blue-700 ring-blue-100', chart: '#006bc4' },
  'In review': { dot: 'bg-amber-400', badge: 'bg-amber-50 text-amber-700 ring-amber-100', chart: '#fbbf24' },
  Completed: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-100', chart: '#10b981' },
};

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Portfolio overview',
  admin: 'Team workspace',
  user: 'My workspace',
};

function parseProjectDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getStatus(entry: ProjectEntry): ProjectStatus {
  const date = parseProjectDate(entry.date);
  if (!date) return 'In progress';
  const days = (Date.now() - date.getTime()) / 86_400_000;
  if (days < 0) return 'Planned';
  if (days <= 3) return 'In progress';
  if (days <= 8) return 'In review';
  return 'Completed';
}

function getProgress(entry: ProjectEntry, status: ProjectStatus) {
  if (status === 'Planned') return 15;
  if (status === 'Completed') return 100;

  const boxes = (entry.fields || []).flatMap((field) => field.boxes || []);
  const details = (entry.fields || []).flatMap((field) => field.details || []);
  const totalSlots = Math.max(boxes.length, details.length, 1);
  const populated = Math.max(
    boxes.filter((value) => Number(value) !== 0).length,
    details.filter((rows) => rows.length > 0).length,
  );
  const measured = Math.round((populated / totalSlots) * 100);
  return status === 'In review'
    ? Math.max(78, Math.min(measured, 94))
    : Math.max(32, Math.min(measured || 58, 76));
}

function formatProjectDate(value?: string) {
  const date = parseProjectDate(value);
  return date
    ? new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
    : 'No date';
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value);
}

export default function DashboardHome() {
  const [role, setRole] = useState('user');
  const [name, setName] = useState('');
  const [entries, setEntries] = useState<ProjectEntry[]>([]);
  const [accounts, setAccounts] = useState<AccountSummary[] | null>(null);
  const [canViewAccounts, setCanViewAccounts] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      try {
        const user = await api.me();
        const currentRole = user?.role || 'user';
        const scope = currentRole === 'superadmin' ? 'all' : currentRole === 'admin' ? 'team' : 'mine';
        const mayViewAccounts = currentRole === 'superadmin' || Boolean(user?.permissions?.manageUsers);
        const [projectsResult, accountsResult] = await Promise.allSettled([
          api.allEntries({ scope }),
          mayViewAccounts ? api.listUsers() : Promise.resolve(null),
        ]);
        if (!cancelled) {
          setRole(currentRole);
          setName(user?.name || '');
          setCanViewAccounts(mayViewAccounts);
          setEntries(projectsResult.status === 'fulfilled' && Array.isArray(projectsResult.value) ? projectsResult.value : []);
          setAccounts(
            accountsResult.status === 'fulfilled' && Array.isArray(accountsResult.value)
              ? accountsResult.value
              : null,
          );
        }
      } catch {
        // The authenticated layout handles session failures; the dashboard can
        // still render an empty state if project reporting is temporarily unavailable.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, []);

  const reportHref = role === 'superadmin'
    ? '/dashboard/reports'
    : role === 'admin'
      ? '/dashboard/reports/team'
      : '/dashboard/details';
  const canCreate = role === 'admin' || role === 'user';

  const dashboard = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      const aTime = parseProjectDate(a.date)?.getTime() || 0;
      const bTime = parseProjectDate(b.date)?.getTime() || 0;
      return bTime - aTime;
    });

    const statuses = sorted.reduce<Record<ProjectStatus, number>>((counts, entry) => {
      counts[getStatus(entry)] += 1;
      return counts;
    }, { Planned: 0, 'In progress': 0, 'In review': 0, Completed: 0 });

    const now = new Date();
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      const count = entries.filter((entry) => {
        const projectDate = parseProjectDate(entry.date);
        return projectDate
          && projectDate.getFullYear() === date.getFullYear()
          && projectDate.getMonth() === date.getMonth();
      }).length;
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: new Intl.DateTimeFormat('en', { month: 'short' }).format(date),
        value: count,
      };
    });

    const teamMap = new Map<string, number>();
    for (const entry of entries) {
      const team = entry.teamName || entry.createdBy?.name || 'Unassigned';
      teamMap.set(team, (teamMap.get(team) || 0) + 1);
    }
    const teams = Array.from(teamMap, ([team, count]) => ({ team, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    return {
      sorted,
      statuses,
      months,
      teams,
      totalOutput: entries.reduce((sum, entry) => sum + (Number(entry.finalTotal) || 0), 0),
      completed: statuses.Completed,
    };
  }, [entries]);

  const currentMonth = dashboard.months.at(-1)?.value || 0;
  const previousMonth = dashboard.months.at(-2)?.value || 0;
  const monthDelta = currentMonth - previousMonth;
  const adminAccounts = accounts?.filter((account) => account.role === 'admin') || [];
  const userAccounts = accounts?.filter((account) => account.role === 'user') || [];

  return (
    <div className="space-y-6 pb-4 text-slate-900">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
            {ROLE_LABELS[role] || ROLE_LABELS.user}
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-blue-950 sm:text-4xl">
            Project dashboard
          </h1>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Welcome back{name ? `, ${name.split(' ')[0]}` : ''}. Here&apos;s how your work is moving.
          </p>
        </div>

        <Link
          href={canCreate ? '/dashboard/entry/new' : reportHref}
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-blue-950 px-4 text-sm font-bold text-white shadow-[0_10px_24px_-12px_rgba(7,39,71,0.8)] transition hover:-translate-y-0.5 hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 sm:self-auto"
        >
          {canCreate ? <FiPlus size={17} /> : <FiBarChart2 size={17} />}
          {canCreate ? 'New project' : 'Open reports'}
        </Link>
      </header>

      <section className={`grid gap-3 sm:grid-cols-2 ${canViewAccounts ? 'xl:grid-cols-5' : 'xl:grid-cols-3'}`} aria-label="Project and account summary">
        <MetricCard
          icon={FiFolder}
          label="Total projects"
          value={loading ? '—' : String(entries.length)}
          detail={`${currentMonth} added this month`}
          tone="blue"
        />
        <MetricCard
          icon={FiCheckCircle}
          label="Completed"
          value={loading ? '—' : String(dashboard.completed)}
          detail={entries.length ? `${Math.round((dashboard.completed / entries.length) * 100)}% completion rate` : 'No completed projects yet'}
          tone="green"
        />
        <MetricCard
          icon={FiTrendingUp}
          label="Portfolio output"
          value={loading ? '—' : formatNumber(dashboard.totalOutput)}
          detail={monthDelta >= 0 ? `+${monthDelta} projects vs last month` : `${monthDelta} projects vs last month`}
          tone="amber"
        />
        {canViewAccounts && (
          <>
            <MetricCard
              icon={FiShield}
              label="Total admins"
              value={loading || accounts === null ? '—' : String(adminAccounts.length)}
              detail={accounts === null ? 'Account data unavailable' : `${adminAccounts.filter((account) => account.isActive !== false).length} active accounts`}
              tone="violet"
            />
            <MetricCard
              icon={FiUser}
              label="Total users"
              value={loading || accounts === null ? '—' : String(userAccounts.length)}
              detail={accounts === null ? 'Account data unavailable' : `${userAccounts.filter((account) => account.isActive !== false).length} active accounts`}
              tone="blue"
            />
          </>
        )}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,0.75fr)]">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_45px_-32px_rgba(15,23,42,0.3)] sm:p-6">
          <SectionHeading
            eyebrow="Performance"
            title="Project activity"
            detail="Projects logged during the last six months"
            action={<span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500 ring-1 ring-slate-200">Last 6 months</span>}
          />
          <ActivityChart data={dashboard.months} loading={loading} />
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-blue-950 p-5 text-white shadow-[0_22px_50px_-30px_rgba(7,39,71,0.8)] sm:p-6">
          <SectionHeading
            eyebrow="Portfolio"
            title="Workflow split"
            detail="Live project distribution"
            dark
          />
          <StatusChart statuses={dashboard.statuses} total={entries.length} loading={loading} />
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.85fr)]">
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_16px_45px_-32px_rgba(15,23,42,0.3)]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <SectionHeading eyebrow="Projects" title="Recent projects" detail="Latest updates across your workspace" compact />
            <Link href={reportHref} className="group inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-950">
              View all
              <FiArrowRight className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {loading ? (
            <ProjectListSkeleton />
          ) : dashboard.sorted.length ? (
            <div className="divide-y divide-slate-100">
              {dashboard.sorted.slice(0, 5).map((project, index) => {
                const status = getStatus(project);
                const progress = getProgress(project, status);
                return (
                  <div key={project._id} className="group grid gap-4 px-5 py-4 transition hover:bg-slate-50/70 sm:grid-cols-[minmax(0,1.3fr)_140px_112px] sm:items-center sm:px-6">
                    <div className="flex min-w-0 items-center gap-3.5">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${index % 3 === 0 ? 'bg-blue-100 text-blue-700' : index % 3 === 1 ? 'bg-violet-100 text-violet-700' : 'bg-amber-100 text-amber-700'}`}>
                        {project.name.trim().charAt(0).toUpperCase() || 'P'}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">{project.name || 'Untitled project'}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                          <FiCalendar size={12} /> {formatProjectDate(project.date)}
                          {project.teamName && <><span>•</span><span className="truncate">{project.teamName}</span></>}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="mb-1.5 flex justify-between text-[10px] font-bold text-slate-400">
                        <span>Progress</span><span>{progress}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div className="h-full rounded-full bg-blue-600 transition-all duration-700" style={{ width: `${progress}%` }} />
                      </div>
                    </div>

                    <div className="flex sm:justify-end">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ring-1 ring-inset ${STATUS_STYLES[status].badge}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_STYLES[status].dot}`} />
                        {status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyProjects canCreate={canCreate} reportHref={reportHref} />
          )}
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_16px_45px_-32px_rgba(15,23,42,0.3)] sm:p-6">
          <SectionHeading eyebrow="Resources" title="Workload overview" detail="Projects grouped by team or owner" />
          <WorkloadList teams={dashboard.teams} total={entries.length} loading={loading} />

          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-blue-700 shadow-sm ring-1 ring-blue-100">
                <FiLayers size={17} />
              </span>
              <div>
                <p className="text-xs font-extrabold text-blue-950">Keep work moving</p>
                <p className="mt-1 text-[11px] font-medium leading-5 text-blue-800/65">
                  Review active projects and update today&apos;s production details.
                </p>
                <Link href={canCreate ? '/dashboard/entry/new' : reportHref} className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-extrabold text-blue-700 hover:text-blue-950">
                  Open workspace <FiArrowUpRight />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, detail, tone }: { icon: IconType; label: string; value: string; detail: string; tone: 'blue' | 'violet' | 'green' | 'amber' }) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-100',
    violet: 'bg-violet-50 text-violet-700 ring-violet-100',
    green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  };
  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_12px_32px_-28px_rgba(15,23,42,0.4)] transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_18px_36px_-24px_rgba(0,107,196,0.24)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-blue-950">{value}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-inset ${tones[tone]}`}>
          <Icon size={18} />
        </span>
      </div>
      <p className="mt-3 truncate text-[11px] font-semibold text-slate-400">{detail}</p>
    </article>
  );
}

function SectionHeading({ eyebrow, title, detail, action, dark = false, compact = false }: { eyebrow: string; title: string; detail: string; action?: React.ReactNode; dark?: boolean; compact?: boolean }) {
  return (
    <div className={`flex items-start justify-between gap-4 ${compact ? '' : 'mb-5'}`}>
      <div>
        <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${dark ? 'text-blue-300' : 'text-blue-600'}`}>{eyebrow}</p>
        <h2 className={`mt-1 font-display font-bold ${compact ? 'text-lg' : 'text-xl'} ${dark ? 'text-white' : 'text-blue-950'}`}>{title}</h2>
        <p className={`mt-1 text-[11px] font-medium ${dark ? 'text-blue-200/60' : 'text-slate-400'}`}>{detail}</p>
      </div>
      {action}
    </div>
  );
}

function ActivityChart({ data, loading }: { data: Array<{ key: string; label: string; value: number }>; loading: boolean }) {
  const width = 660;
  const height = 220;
  const padding = { top: 16, right: 16, bottom: 32, left: 24 };
  const max = Math.max(...data.map((point) => point.value), 4);
  const step = (width - padding.left - padding.right) / Math.max(data.length - 1, 1);
  const points = data.map((point, index) => ({
    ...point,
    x: padding.left + index * step,
    y: padding.top + (height - padding.top - padding.bottom) * (1 - point.value / max),
  }));
  const line = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  const area = `${line} L ${points.at(-1)?.x || 0} ${height - padding.bottom} L ${points[0]?.x || 0} ${height - padding.bottom} Z`;

  if (loading) return <div className="h-[220px] animate-pulse rounded-xl bg-slate-50" />;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Project activity line chart" className="h-[220px] min-w-[560px] w-full">
        <defs>
          <linearGradient id="activity-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#1689dc" stopOpacity="0.23" />
            <stop offset="100%" stopColor="#1689dc" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((lineIndex) => {
          const y = padding.top + ((height - padding.top - padding.bottom) / 3) * lineIndex;
          return <line key={lineIndex} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 6" />;
        })}
        <path d={area} fill="url(#activity-area)" />
        <path d={line} fill="none" stroke="#006bc4" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((point) => (
          <g key={point.key}>
            <circle cx={point.x} cy={point.y} r="8" fill="#ffffff" stroke="#006bc4" strokeWidth="3">
              <title>{`${point.label}: ${point.value} projects`}</title>
            </circle>
            <text x={point.x} y={height - 8} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="700">{point.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatusChart({ statuses, total, loading }: { statuses: Record<ProjectStatus, number>; total: number; loading: boolean }) {
  const items = (Object.entries(statuses) as Array<[ProjectStatus, number]>).filter(([, count]) => count > 0);
  let offset = 0;
  const segments = items.map(([status, count]) => {
    const length = total ? (count / total) * 100 : 0;
    const segment = { status, count, length, offset };
    offset += length;
    return segment;
  });

  return (
    <div>
      <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
        {loading ? (
          <div className="h-32 w-32 animate-pulse rounded-full border-[14px] border-white/10" />
        ) : (
          <svg viewBox="0 0 42 42" className="h-40 w-40 -rotate-90" role="img" aria-label="Project workflow distribution chart">
            <circle cx="21" cy="21" r="15.915" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="5" />
            {segments.map((segment) => (
              <circle
                key={segment.status}
                cx="21" cy="21" r="15.915"
                fill="none"
                stroke={STATUS_STYLES[segment.status].chart}
                strokeWidth="5"
                strokeDasharray={`${segment.length} ${100 - segment.length}`}
                strokeDashoffset={-segment.offset}
              >
                <title>{`${segment.status}: ${segment.count}`}</title>
              </circle>
            ))}
          </svg>
        )}
        <div className="absolute text-center">
          <p className="font-display text-3xl font-bold tabular-nums">{loading ? '—' : total}</p>
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-blue-200/55">Projects</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3">
        {(Object.entries(statuses) as Array<[ProjectStatus, number]>).map(([status, count]) => (
          <div key={status} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].dot}`} />
            <span className="min-w-0 flex-1 truncate text-[10px] font-semibold text-blue-100/60">{status}</span>
            <span className="text-xs font-extrabold tabular-nums">{count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkloadList({ teams, total, loading }: { teams: Array<{ team: string; count: number }>; total: number; loading: boolean }) {
  if (loading) {
    return <div className="space-y-4">{[1, 2, 3, 4].map((item) => <div key={item} className="h-10 animate-pulse rounded-lg bg-slate-50" />)}</div>;
  }
  if (!teams.length) {
    return <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 text-center"><FiUsers className="mb-2 text-slate-300" size={22} /><p className="text-xs font-bold text-slate-500">No workload data yet</p></div>;
  }
  const colors = ['bg-blue-600', 'bg-violet-500', 'bg-amber-400', 'bg-emerald-500'];
  return (
    <div className="space-y-4">
      {teams.map(({ team, count }, index) => (
        <div key={team}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className={`h-7 w-7 shrink-0 rounded-lg ${colors[index]} flex items-center justify-center text-[10px] font-extrabold text-white`}>{team.charAt(0).toUpperCase()}</span>
              <span className="truncate text-xs font-bold text-slate-700">{team}</span>
            </div>
            <span className="text-[10px] font-bold tabular-nums text-slate-400">{count} project{count === 1 ? '' : 's'}</span>
          </div>
          <div className="ml-9 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${colors[index]}`} style={{ width: `${Math.max((count / Math.max(total, 1)) * 100, 8)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ProjectListSkeleton() {
  return <div className="divide-y divide-slate-100">{[1, 2, 3, 4].map((item) => <div key={item} className="flex items-center gap-4 px-5 py-4 sm:px-6"><div className="h-10 w-10 animate-pulse rounded-xl bg-slate-100" /><div className="flex-1"><div className="h-3 w-40 animate-pulse rounded bg-slate-100" /><div className="mt-2 h-2 w-24 animate-pulse rounded bg-slate-50" /></div><div className="hidden h-2 w-28 animate-pulse rounded bg-slate-100 sm:block" /></div>)}</div>;
}

function EmptyProjects({ canCreate, reportHref }: { canCreate: boolean; reportHref: string }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 ring-1 ring-blue-100"><FiFolder size={21} /></span>
      <h3 className="font-display text-base font-bold text-blue-950">No projects to show yet</h3>
      <p className="mt-1.5 max-w-xs text-xs font-medium leading-5 text-slate-400">Your project overview will appear here as soon as the first production entry is added.</p>
      <Link href={canCreate ? '/dashboard/entry/new' : reportHref} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-950 px-3 py-2 text-xs font-bold text-white hover:bg-blue-800">
        {canCreate ? <><FiPlus /> Add first project</> : <>Open reports <FiArrowRight /></>}
      </Link>
    </div>
  );
}
