"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { periodLabel } from "@/lib/format";

const NAV = [
  { href: "/command", label: "Command Center" },
  { href: "/operations", label: "Operasional" },
  { href: "/fnb", label: "F&B Detail" },
  { href: "/optimizer", label: "Optimizer Showtime" },
  { href: "/cms", label: "Data CMS" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data, period, logout } = useDashboard();

  return (
    <aside className="border-r border-[var(--panel-border)] bg-[var(--nav)] px-4 py-7 text-[var(--muted)] max-[720px]:hidden">
      <div className="mb-9 ml-2 flex items-center gap-2.5 text-xl font-extrabold text-white">
        <span className="grid h-8 w-8 place-items-center rounded-[var(--radius)] bg-[var(--accent)] text-base font-extrabold text-[var(--navy-900)]">
          i
        </span>
        indobox
      </div>
      <div className="mx-2 mb-2 mt-6 text-[10px] font-bold tracking-[0.14em] text-[var(--label)]">
        DASHBOARD
      </div>
      {NAV.map((item) => {
        const active =
          pathname === item.href ||
          (item.href === "/command" && pathname.startsWith("/branches/")) ||
          (item.href === "/operations" && pathname.startsWith("/devices/")) ||
          (item.href === "/cms" && pathname.startsWith("/bookings/"));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-0.5 block w-full rounded-[var(--radius)] px-3 py-2.5 text-left text-sm no-underline transition ${
              active
                ? "bg-[var(--sidebar-active,rgba(232,162,37,0.12))] font-semibold text-[var(--accent)]"
                : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <div className="mx-2 mb-2 mt-6 text-[10px] font-bold tracking-[0.14em] text-[var(--label)]">
        PENGATURAN
      </div>
      <Link
        href="/settings"
        className={`mb-0.5 block w-full rounded-[var(--radius)] px-3 py-2.5 text-left text-sm no-underline transition ${
          pathname === "/settings"
            ? "bg-[rgba(232,162,37,0.12)] font-semibold text-[var(--accent)]"
            : "text-[var(--muted)] hover:bg-white/5 hover:text-white"
        }`}
      >
        Konfigurasi Alert
        <span className="mt-1 block text-[10px] font-medium normal-case tracking-normal text-[var(--accent)]/80">
          (Belum ada di cms)
        </span>
      </Link>
      <div className="mx-2 mt-10 rounded-[var(--radius)] border border-[var(--panel-border)] bg-black/20 p-3 text-xs leading-relaxed text-slate-400">
        Live dari indobox-cms
        <br />
        {data?.label || "—"} · {periodLabel(period)}
      </div>
      <button type="button" onClick={logout} className="btn-ghost mx-2 mt-3 w-[calc(100%-16px)]">
        Keluar
      </button>
    </aside>
  );
}
