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
    <div className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_20%_10%,#dce8ff_0%,transparent_50%),radial-gradient(ellipse_at_80%_90%,#d8f3ec_0%,transparent_45%),var(--bg)] p-6">
      <form
        onSubmit={onSubmit}
        className="grid w-full max-w-[400px] gap-3 rounded-[14px] border border-[var(--line)] bg-white p-7 shadow-[0_12px_40px_#17233d12]"
      >
        <div className="mb-2 flex items-center gap-2.5 text-xl font-extrabold text-[var(--ink)]">
          <span className="grid h-[29px] w-[29px] place-items-center rounded-[9px] bg-[#62d8bd] text-base text-[var(--nav)]">
            i
          </span>
          indobox
        </div>
        <h1 className="m-0 text-[22px] tracking-[-0.5px]">Business Dashboard</h1>
        <p className="m-0 mb-2 text-[var(--muted)]">
          Masuk dengan akun admin CMS untuk melihat data live.
        </p>
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--muted)]">
          Email
          <input
            className="min-h-10 rounded-lg border border-[var(--line)] px-3 text-[var(--ink)]"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="grid gap-1.5 text-xs font-semibold text-[var(--muted)]">
          Password
          <input
            className="min-h-10 rounded-lg border border-[var(--line)] px-3 text-[var(--ink)]"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="m-0 text-[13px] text-[var(--red)]">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg border border-[var(--blue)] bg-[var(--blue)] px-3 py-2.5 text-xs font-bold text-white disabled:opacity-60"
        >
          {busy ? "Masuk…" : "Masuk"}
        </button>
        <p className="m-0 text-[11px] text-[var(--muted)]">
          API: {process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}
        </p>
      </form>
    </div>
  );
}
