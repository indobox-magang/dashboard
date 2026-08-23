"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { CornerMotif } from "@/components/CornerMotif";
import { useDashboard } from "@/hooks/useDashboardSummary";
import { periodLabel } from "@/lib/format";

const NAV = [
  { href: "/command", label: "Command Center", icon: "dashboard" },
  { href: "/operations", label: "Operasional", icon: "monitoring" },
  { href: "/fnb", label: "F&B Detail", icon: "fastfood" },
  { href: "/optimizer", label: "Optimizer Showtime", icon: "event_note" },
  { href: "/cms", label: "Data CMS", icon: "database" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data, period, logout } = useDashboard();

  return (
    <aside className="relative flex h-full w-[260px] shrink-0 flex-col overflow-y-auto overflow-x-hidden border-r border-[var(--panel-border)] bg-[var(--sidebar)] py-6 max-[720px]:hidden">
      <div className="mb-10 px-6">
        <BrandLogo href="/command" height={26} subtitle="Business Dashboard" />
      </div>

      <div className="mb-2 px-6 text-[10px] font-bold tracking-[0.14em] text-[var(--muted)]">
        DASHBOARD
      </div>
      <nav className="flex flex-col gap-0.5">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-6 py-3 text-sm font-semibold transition-colors duration-150 ${
                active
                  ? "border-l-2 border-[var(--accent)] bg-[var(--sidebar-active)] pl-[22px] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]"
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mb-2 mt-6 px-6 text-[10px] font-bold tracking-[0.14em] text-[var(--muted)]">
        PENGATURAN
      </div>
      <Link
        href="/settings"
        className={`flex items-center gap-3 px-6 py-3 text-sm font-semibold transition-colors duration-150 ${
          pathname === "/settings"
            ? "border-l-2 border-[var(--accent)] bg-[var(--sidebar-active)] pl-[22px] text-[var(--accent)]"
            : "text-[var(--muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--foreground)]"
        }`}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          settings
        </span>
        <span>Konfigurasi Alert</span>
      </Link>

      <div className="relative z-[1] mt-auto space-y-3 px-6 pt-8">
        <div className="rounded border border-[var(--panel-border)] bg-black/20 p-3 text-xs leading-relaxed text-[var(--muted)]">
          Live dari indobox-cms
          <br />
          {data?.label || "—"} · {periodLabel(period)}
        </div>
        <button
          type="button"
          onClick={logout}
          className="btn-ghost flex w-full items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            logout
          </span>
          Keluar
        </button>
      </div>
      <CornerMotif size={56} />
    </aside>
  );
}
