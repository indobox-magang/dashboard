/** Marker for UI that has no counterpart / source in indobox-cms. */
export function NotInCms({ className = "" }: { className?: string }) {
  return (
    <span
      className={`ml-1 inline-flex items-center rounded-[var(--radius)] border border-[rgba(232,162,37,0.35)] bg-[rgba(232,162,37,0.12)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)] ${className}`}
    >
      (Belum ada di cms)
    </span>
  );
}
