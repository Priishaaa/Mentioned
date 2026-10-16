const Bone = ({ className }: { className: string }) => <div className={`skeleton ${className}`} />;

/** Placeholder shaped like the report while it loads. */
export function ReportSkeleton() {
  return (
    <div role="status" aria-label="Loading report" className="pb-8 pt-5 sm:pt-8">
      <Bone className="h-2 w-[220px]" />
      <div className="mt-4 grid items-end gap-5 lg:grid-cols-[minmax(0,1fr)_auto]">
        <div>
          <Bone className="h-10 w-[80%] max-w-[560px] sm:h-12" />
          <Bone className="mt-2 h-2 w-[260px]" />
        </div>
        <Bone className="h-[160px] w-[260px] sm:h-[200px]" />
      </div>
      <div className="mt-4">
        <Bone className="h-4 w-[70%] max-w-[600px]" />
      </div>

      <div className="mt-8 grid gap-2 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-t border-line py-2">
            <Bone className="h-2 w-[50%]" />
            <Bone className="mt-3 h-7 w-[40%]" />
            <Bone className="mt-2 h-2 w-[80%]" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-3 border-t-2 border-line pt-3">
        <Bone className="h-4 w-[240px]" />
        {[90, 60, 75].map((w) => (
          <div key={w} className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2 sm:grid-cols-[140px_minmax(0,1fr)]">
            <Bone className="h-2" />
            <Bone className="h-1.5" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading report…</span>
    </div>
  );
}
