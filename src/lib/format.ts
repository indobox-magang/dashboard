export function fmtIDR(n: number, compact = false): string {
  const v = Number(n) || 0;
  if (!compact) {
    return "Rp" + Math.round(v).toLocaleString("id-ID");
  }
  if (Math.abs(v) >= 1_000_000) {
    const jt = v / 1_000_000;
    const digits = jt < 10 ? 1 : 0;
    return "Rp" + jt.toFixed(digits).replace(".", ",") + " jt";
  }
  if (Math.abs(v) >= 1000) {
    return "Rp" + Math.round(v / 1000).toLocaleString("id-ID") + " rb";
  }
  return "Rp" + Math.round(v).toLocaleString("id-ID");
}

export function fmtPct(v: number, digits = 1): string {
  const n = Number(v) || 0;
  return n.toFixed(digits).replace(".", ",") + "%";
}

export function fmtDelta(
  pct: number | null | undefined,
  pts = false,
  compact = false
): { text: string; down: boolean } {
  if (pct == null || Number.isNaN(Number(pct))) {
    return { text: compact ? "—" : "— vs periode lalu", down: false };
  }
  const n = Number(pct);
  const arrow = n > 0 ? "↑" : n < 0 ? "↓" : "→";
  const body = pts
    ? Math.abs(n).toFixed(1).replace(".", ",") + " pts"
    : Math.abs(n).toFixed(1).replace(".", ",") + "%";
  return {
    text: compact ? `${arrow} ${body}` : `${arrow} ${body} vs periode lalu`,
    down: n < 0,
  };
}

export function relativeTime(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "—";
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 60) return `${sec} dtk lalu`;
  if (sec < 3600) return `${Math.floor(sec / 60)} mnt lalu`;
  if (sec < 86400) return `${Math.floor(sec / 3600)} jam lalu`;
  return new Date(iso).toLocaleString("id-ID");
}

export function periodLabel(period: string): string {
  return (
    ({ "1d": "Hari ini", "7d": "7 hari terakhir", "28d": "28 hari terakhir" } as Record<
      string,
      string
    >)[period] || period
  );
}

export function conic(segments: [number, string][]): string {
  let acc = 0;
  return (
    "conic-gradient(" +
    segments
      .map((s, i) => {
        const from = acc;
        acc += s[0];
        return `${s[1]} ${from}% ${i === segments.length - 1 ? 100 : acc}%`;
      })
      .join(",") +
    ")"
  );
}

export function heatClass(v: number): string {
  if (v >= 85) return "bg-[var(--accent)] text-[var(--navy-900)]";
  if (v >= 72) return "bg-[#c88920] text-white";
  if (v >= 55) return "bg-[#2a4a78] text-white";
  return "bg-[#1e3458] text-[var(--muted)]";
}

export function genreClass(value: number): string {
  if (value >= 80) return "bg-[var(--success)] text-[var(--navy-900)]";
  if (value >= 65) return "bg-[#2f9a62] text-white";
  if (value >= 50) return "bg-[#246b4a] text-white";
  if (value >= 35) return "bg-[#1d4a38] text-[#9fd4b8]";
  return "bg-[#162e28] text-[var(--muted)]";
}
