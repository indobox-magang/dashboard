"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { CornerMotif } from "@/components/CornerMotif";
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
    <div className="login-page">
      <div className="login-page-bg" aria-hidden />
      <div className="login-page-overlay" aria-hidden />

      <form onSubmit={onSubmit} className="card card-brand login-page-form w-full max-w-md space-y-4 p-8">
        <CornerMotif size={48} />
        <BrandLogo height={28} subtitle="Business Dashboard sign in" />

        <p className="m-0 text-sm text-[var(--muted)]">
          Masuk dengan akun admin CMS untuk melihat data live.
        </p>

        <label className="block text-sm">
          <span className="text-[var(--muted)]">Email</span>
          <input
            className="input mt-1"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          <span className="text-[var(--muted)]">Password</span>
          <input
            className="input mt-1"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error ? <p className="m-0 text-[13px] text-[var(--danger)]">{error}</p> : null}

        <button type="submit" disabled={busy} className="btn-primary w-full">
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            login
          </span>
          {busy ? "Masuk…" : "Masuk"}
        </button>

        <p className="m-0 text-[11px] text-[var(--muted)]">
          API: {process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_CMS_API_URL || "http://localhost:8081"}
        </p>
      </form>
    </div>
  );
}
