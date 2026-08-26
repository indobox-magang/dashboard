"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ToastHost } from "@/components/Toast";
import { DataFreshnessBadge } from "@/components/DataBadges";
import { DashboardProvider, useDashboard } from "@/hooks/useDashboardSummary";
import { hasToken } from "@/lib/auth";

const CRUMBS: Record<string, string> = {
  "/command": "Dashboard / Command Center",
  "/operations": "Dashboard / Operasional",
  "/fnb": "Dashboard / F&B Detail",
  "/optimizer": "Dashboard / Optimizer Showtime",
  "/cms": "Dashboard / Data CMS",
  "/settings": "Pengaturan / Konfigurasi Alert",
};

function AppChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, loading } = useDashboard();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!hasToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center text-[var(--muted)]">Memeriksa sesi…</div>
    );
  }

  const asOf = data?.as_of ? new Date(data.as_of) : null;
  const time = asOf
    ? asOf.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "—";
  const crumb =
    CRUMBS[pathname] ||
    (pathname.startsWith("/branches/")
      ? "Dashboard / Detail Cabang"
      : pathname.startsWith("/devices/")
        ? "Dashboard / Detail Device"
        : pathname.startsWith("/bookings/")
          ? "Dashboard / Detail Booking"
          : "Dashboard");

  return (
    <div className="grid min-h-screen grid-cols-[238px_1fr] bg-[var(--bg)] max-[720px]:block">
      <Sidebar />
      <main className="mx-auto w-full max-w-[1450px] px-[clamp(18px,4vw,52px)] py-6 pb-12 max-[720px]:px-3.5">
        <div className="mb-6 flex items-center justify-between gap-4">
          <span className="text-xs text-[var(--muted)]">{crumb}</span>
          <div className="flex items-center gap-2 max-[720px]:hidden">
            <span className={`text-xs font-bold ${loading ? "text-[var(--accent)]" : "text-slate-300"}`}>
              {loading ? "Memuat…" : `Ringkasan CMS · ${time} WIB`}
            </span>
            {!loading ? <DataFreshnessBadge timestamp={data?.as_of} /> : null}
          </div>
        </div>
        {children}
      </main>
      <ToastHost />
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <AppChrome>{children}</AppChrome>
    </DashboardProvider>
  );
}
