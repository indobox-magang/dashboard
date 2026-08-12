"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/lib/api";
import { hasToken, setToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@indobox.cloud");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (hasToken()) router.replace("/command");
  }, [router]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await loginAdmin(email.trim(), password);
      setToken(res.token);
      router.replace("/command");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center p-6">
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 20% 10%, rgba(232,162,37,0.18) 0%, transparent 45%), radial-gradient(ellipse at 80% 90%, rgba(61,190,120,0.12) 0%, transparent 40%), var(--bg)",
        }}
      />
      <form
        onSubmit={onSubmit}
        className="card relative z-10 grid w-full max-w-[400px] gap-3 p-7 backdrop-blur"
      >
        <div className="mb-2 flex items-center gap-2.5 text-xl font-extrabold text-white">
          <span className="grid h-8 w-8 place-items-center rounded-[var(--radius)] bg-[var(--accent)] text-base text-[var(--navy-900)]">
            i
          </span>
          indobox
        </div>
        <h1 className="m-0 text-[22px] font-semibold tracking-[-0.5px] text-white">
          Business Dashboard
        </h1>
        <p className="m-0 mb-2 text-sm text-[var(--muted)]">
          Masuk dengan akun admin CMS untuk melihat data live.
        </p>
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--muted)]">
          Email
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--muted)]">
          Password
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="m-0 text-[13px] text-[var(--danger)]">{error}</p> : null}
        <button type="submit" disabled={busy} className="btn-primary mt-1">
          {busy ? "Masuk…" : "Masuk"}
        </button>
        <p className="m-0 text-[11px] text-slate-500">
          API: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}
        </p>
      </form>
    </div>
  );
}
