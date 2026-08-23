"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasToken } from "@/lib/auth";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace(hasToken() ? "/command" : "/login");
  }, [router]);
  return (
    <div className="grid min-h-screen place-items-center bg-[var(--bg)] text-[var(--muted)]">
      Mengalihkan…
    </div>
  );
}
