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
];

export function Sidebar() {
  const pathname = usePathname();
  const { data, period, logout } = useDashboard();

  return (
    <aside className="bg-[var(--nav)] px-[17px] py-7 text-[#b7c4d8] max-[720px]:hidden">
      <div className="mb-9 ml-2.5 flex items-center gap-2.5 text-xl font-extrabold text-white">
        <span className="grid h-[29px] w-[29px] place-items-center rounded-[9px] bg-[#62d8bd] text-base text-[var(--nav)]">
          i
        </span>
        indobox
      </div>
      <div className="mx-2.5 mb-2 mt-6 text-[10px] font-extrabold tracking-[0.12em] text-[#71819a]">
        DASHBOARD
      </div>
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`mb-0.5 block w-full rounded-lg px-3 py-2.5 text-left no-underline ${
              active ? "bg-[var(--nav2)] font-bold text-white" : "text-inherit"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <div className="mx-2.5 mb-2 mt-6 text-[10px] font-extrabold tracking-[0.12em] text-[#71819a]">
        PENGATURAN
      </div>
      <Link
        href="/settings"
        className={`mb-0.5 block w-full rounded-lg px-3 py-2.5 text-left no-underline ${
          pathname === "/settings" ? "bg-[var(--nav2)] font-bold text-white" : "text-inherit"
        }`}
      >
        Konfigurasi Alert
      </Link>
      <div className="mx-2 mt-10 rounded-[9px] border border-[#2b3c59] p-3 text-xs leading-relaxed text-[#9baac0]">
        Live dari indobox-cms
        <br />
        {data?.label || "—"} · {periodLabel(period)}
      </div>
      <button
        type="button"
        onClick={logout}
        className="mx-2 mt-3 w-[calc(100%-16px)] rounded-lg border border-[#2b3c59] bg-transparent px-3 py-2 text-xs font-semibold text-[#b7c4d8]"
      >
        Keluar
      </button>
    </aside>
  );
}
