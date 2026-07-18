/**
 * SkeletonRow
 * Animated shimmer placeholder row for table loading states.
 * Accepts a `cols` prop to match the parent table's column count.
 */

interface Props {
  cols?: number;
  rows?: number;
}

export default function SkeletonRow({ cols = 6, rows = 5 }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <tr key={rowIdx} className="animate-pulse">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-4">
              <div
                className={`h-4 rounded bg-zinc-200 ${colIdx === 0 ? 'w-32' : colIdx === cols - 1 ? 'w-20' : 'w-full'}`}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * SkeletonCard — block-level shimmer for card/detail loading states.
 */
export function SkeletonCard({ lines = 4 }: { lines?: number }) {
  return (
    <div className="animate-pulse space-y-3 p-6">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-4 rounded bg-zinc-200 ${i === 0 ? 'w-1/3' : i % 2 === 0 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}
