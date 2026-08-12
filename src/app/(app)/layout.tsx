"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ToastHost } from "@/components/Toast";
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

  return (
    <div className="grid min-h-screen grid-cols-[238px_1fr] bg-[var(--bg)] max-[720px]:block">
      <Sidebar />
      <main className="mx-auto w-full max-w-[1450px] px-[clamp(18px,4vw,52px)] py-7 pb-12 max-[720px]:px-3.5">
        <div className="mb-8 flex items-center justify-between gap-4">
          <span className="text-xs text-[var(--muted)]">{CRUMBS[pathname] || "Dashboard"}</span>
          <span
            className={`flex items-center gap-1.5 text-xs font-bold max-[720px]:hidden ${
              loading ? "text-[var(--accent)]" : "text-[var(--success)]"
            }`}
          >
            <i className="inline-block h-2 w-2 rounded-full bg-current" />
            {loading ? "Memuat…" : `Data CMS · ${time} WIB`}
          </span>
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
