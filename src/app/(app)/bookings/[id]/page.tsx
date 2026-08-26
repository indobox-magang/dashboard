"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ErrorState, LoadingState } from "@/components/Alerts";
import { SeedBadge } from "@/components/DataBadges";
import { PageHead } from "@/components/Filters";
import { Panel } from "@/components/Leaderboard";
import { useCmsSnapshot } from "@/hooks/useCmsSnapshot";
import { fmtIDR, relativeTime } from "@/lib/format";

function statusTone(status: string) {
  return status === "paid" || status === "used" ? "badge-ok" : "badge-warn";
}

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, loading, error } = useCmsSnapshot();

  if (loading && !data) return <LoadingState />;
  if (error && !data) return <ErrorState message={error} />;

  const id = decodeURIComponent(params.id);
  const booking = data?.bookings.find((item) => item.id === id);
  if (!booking) {
    return (
      <Panel>
        <h1 className="mt-0 text-xl text-white">Booking tidak ditemukan</h1>
        <p className="text-[var(--muted)]">
          Endpoint admin hanya mengembalikan maksimal 200 booking terbaru.
        </p>
        <Link href="/cms" className="btn-ghost inline-flex no-underline">
          Kembali ke Data CMS
        </Link>
      </Panel>
    );
  }

  return (
    <div>
      <PageHead
        controls={false}
        title={
          <>
            Booking {booking.code}
            <SeedBadge values={[booking.id, booking.code, booking.user_name, booking.movie_title]} />
          </>
        }
        subtitle="Detail yang tersedia dari snapshot endpoint admin booking."
      />
      <div className="grid grid-cols-[1.2fr_0.8fr] gap-4 max-[900px]:grid-cols-1">
        <Panel>
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="m-0 text-base text-white">Lifecycle booking</h2>
            <span className={`badge ${statusTone(booking.status)}`}>{booking.status}</span>
          </div>
          <dl className="grid grid-cols-[160px_1fr] gap-y-3 text-sm">
            <dt className="text-[var(--muted)]">Booking ID</dt>
            <dd className="m-0 break-all font-mono text-white">{booking.id}</dd>
            <dt className="text-[var(--muted)]">Dibuat</dt>
            <dd className="m-0 text-white">
              {new Date(booking.created_at).toLocaleString("id-ID")} · {relativeTime(booking.created_at)}
            </dd>
            <dt className="text-[var(--muted)]">Dibayar</dt>
            <dd className="m-0 text-white">
              {booking.paid_at ? new Date(booking.paid_at).toLocaleString("id-ID") : "Belum dibayar"}
            </dd>
            <dt className="text-[var(--muted)]">Total</dt>
            <dd className="m-0 text-lg font-bold text-white">{fmtIDR(booking.total)}</dd>
          </dl>
        </Panel>
        <Panel>
          <h2 className="mt-0 text-base text-white">Customer & show</h2>
          <dl className="grid grid-cols-[110px_1fr] gap-y-3 text-sm">
            <dt className="text-[var(--muted)]">Customer</dt>
            <dd className="m-0 text-white">{booking.user_name || "—"}</dd>
            <dt className="text-[var(--muted)]">Email</dt>
            <dd className="m-0 break-all text-white">{booking.email || "—"}</dd>
            <dt className="text-[var(--muted)]">Film</dt>
            <dd className="m-0 text-white">{booking.movie_title || "—"}</dd>
            <dt className="text-[var(--muted)]">Showtime</dt>
            <dd className="m-0 text-white">
              {booking.start_time ? new Date(booking.start_time).toLocaleString("id-ID") : "—"}
            </dd>
            <dt className="text-[var(--muted)]">Kota</dt>
            <dd className="m-0 text-white">{booking.city || "—"}</dd>
          </dl>
        </Panel>
      </div>
      <div className="notice mt-4">
        <span>
          Metode pembayaran, promo, kursi, dan snack detail tidak tersedia pada respons endpoint admin
          saat ini, sehingga tidak direka di dashboard.
        </span>
      </div>
    </div>
  );
}
