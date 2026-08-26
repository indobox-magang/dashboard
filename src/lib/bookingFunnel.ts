import type { BookingFunnelMetrics, BookingRow, BookingStatusCount } from "./types";

const STATUSES = ["pending", "paid", "used", "expired", "cancelled"] as const;

export function buildBookingFunnel(bookings: BookingRow[]): BookingFunnelMetrics {
  const counts = new Map<string, number>();
  for (const booking of bookings) {
    const status = booking.status?.toLowerCase() || "unknown";
    counts.set(status, (counts.get(status) || 0) + 1);
  }

  const stages: BookingStatusCount[] = STATUSES.map((status) => ({
    status,
    count: counts.get(status) || 0,
  }));
  const converted = (counts.get("paid") || 0) + (counts.get("used") || 0);
  const total = bookings.length;

  return {
    total,
    converted,
    conversion_pct: total ? (converted / total) * 100 : 0,
    stages,
  };
}
