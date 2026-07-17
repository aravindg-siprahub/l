/**
 * Analytics Placeholder — light theme only.
 */
export default function AnalyticsPlaceholder({ title = 'Analytics' }: { title?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-500">
          Coming Soon
        </span>
      </div>
      <div className="h-44 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 text-zinc-400">
        <div className="flex items-end gap-2 mb-3 opacity-30">
          {[40, 65, 50, 80, 70, 90, 60].map((h, i) => (
            <div key={i} className="w-6 rounded-t-md bg-indigo-400" style={{ height: `${h}px` }} />
          ))}
        </div>
        <p className="text-sm font-medium">Analytics data will appear here</p>
        <p className="text-xs mt-1">Available in the Reports module</p>
      </div>
    </div>
  );
}
