/** Segitiga dua-tone amber + navy — motif pojok kanan-bawah (CMS / booking app). */
export function CornerMotif({
  size = 64,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute right-0 bottom-0 ${className}`}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <div
        className="absolute right-0 bottom-0 h-full w-full bg-[var(--accent)]"
        style={{ clipPath: "polygon(100% 0, 100% 100%, 0 100%)" }}
      />
      <div
        className="absolute right-0 bottom-0 bg-[var(--navy-900)]"
        style={{
          width: "62%",
          height: "62%",
          clipPath: "polygon(100% 30%, 100% 100%, 30% 100%)",
        }}
      />
    </div>
  );
}
