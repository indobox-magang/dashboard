"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ToastHost } from "@/components/Toast";
import { DashboardProvider, useDashboard } from "@/hooks/useDashboardSummary";
import { hasToken } from "@/lib/auth";

const CRUMBS: Record<string, { title: string; icon: string }> = {
  "/command": { title: "Command Center", icon: "dashboard" },
  "/operations": { title: "Operasional", icon: "monitoring" },
  "/fnb": { title: "F&B Detail", icon: "fastfood" },
  "/optimizer": { title: "Optimizer Showtime", icon: "event_note" },
  "/cms": { title: "Data CMS", icon: "database" },
  "/settings": { title: "Konfigurasi Alert", icon: "settings" },
};

function AppChrome({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data, loading, alerts } = useDashboard();
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
      <div className="grid min-h-screen place-items-center text-[var(--muted)]">
        Memeriksa sesi…
      </div>
    );
  }

  const asOf = data?.as_of ? new Date(data.as_of) : null;
  const time = asOf
    ? asOf.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
    : "—";
  const crumb = CRUMBS[pathname] || { title: "Dashboard", icon: "space_dashboard" };
  const openAlerts = alerts?.length || 0;

  return (
    <div className="dash-shell">
      <Sidebar />
      <div className="dash-main">
        <header className="dash-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <span className="material-symbols-outlined text-[var(--accent)]" style={{ fontSize: 22 }}>
              {crumb.icon}
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Dashboard
              </p>
              <h1 className="m-0 truncate text-sm font-bold text-[var(--foreground)]">{crumb.title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span
              className={`hidden items-center gap-1.5 text-xs font-bold sm:flex ${
                loading ? "text-[var(--accent)]" : "text-[var(--success)]"
              }`}
            >
              <i className="inline-block h-2 w-2 rounded-full bg-current" />
              {loading ? "Memuat…" : `Data CMS · ${time} WIB`}
            </span>
            <span className="relative text-[var(--muted)]" title={`${openAlerts} alert terbuka`}>
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                notifications
              </span>
              {openAlerts > 0 ? (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-[var(--danger)]" />
              ) : null}
            </span>
            <div className="hidden items-center gap-2 border-l border-[var(--panel-border)] pl-4 md:flex">
              <span className="text-right">
                <p className="m-0 text-sm font-bold leading-none text-[var(--foreground)]">Admin</p>
                <p className="mt-0.5 mb-0 text-[10px] uppercase tracking-wider text-[var(--muted)]">
                  CMS
                </p>
              </span>
              <span className="material-symbols-outlined text-[var(--muted)]" style={{ fontSize: 32 }}>
                account_circle
              </span>
            </div>
          </div>
        </header>
        <main className="dash-content">
          <div className="mx-auto w-full max-w-[1450px]">{children}</div>
        </main>
      </div>
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
