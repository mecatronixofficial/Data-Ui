export default function DashboardLoading() {
  return (
    <div className="animate-pulse space-y-6" role="status" aria-label="Loading page">
      <div className="space-y-3">
        <div className="h-3 w-24 rounded-full bg-blue-100" />
        <div className="h-9 w-64 max-w-full rounded-xl bg-blue-100/80" />
        <div className="h-4 w-80 max-w-full rounded-full bg-slate-100" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-32 rounded-2xl border border-blue-100 bg-white shadow-sm" />
        ))}
      </div>
      <div className="h-80 rounded-2xl border border-blue-100 bg-white shadow-sm" />
      <span className="sr-only">Loading workspace content…</span>
    </div>
  );
}
