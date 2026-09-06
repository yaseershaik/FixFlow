export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-slate-200 rounded-lg" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-slate-200 rounded-xl" />
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-white border border-slate-200/80 rounded-2xl p-4 space-y-2">
            <div className="h-3 w-16 bg-slate-100 rounded" />
            <div className="h-7 w-12 bg-slate-200 rounded-md" />
          </div>
        ))}
      </div>

      {/* Complaint card list skeletons */}
      <div className="space-y-3 pt-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white border border-slate-200/80 rounded-2xl p-5 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-28 bg-slate-200 rounded" />
              <div className="h-5 w-20 bg-slate-100 rounded-full" />
            </div>
            <div className="h-5 w-3/4 bg-slate-200 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
