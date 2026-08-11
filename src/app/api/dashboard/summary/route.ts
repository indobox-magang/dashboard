import { bearerFromRequest, verifyAdminJwt } from "@/lib/adminAuth";
import { buildDashboardSummary } from "@/lib/summary";
import type { PeriodKey } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PERIODS = new Set<PeriodKey>(["1d", "7d", "28d"]);

function json(data: unknown, status = 200) {
  return Response.json(data, { status });
}

export async function GET(req: Request) {
  try {
    const token = bearerFromRequest(req);
    if (!token) return json({ error: "unauthorized" }, 401);
    try {
      await verifyAdminJwt(token);
    } catch {
      return json({ error: "unauthorized" }, 401);
    }

    const url = new URL(req.url);
    const periodRaw = (url.searchParams.get("period") || "7d") as PeriodKey;
    if (!PERIODS.has(periodRaw)) {
      return json({ error: "invalid period" }, 400);
    }
    const siteRaw = url.searchParams.get("site_id");
    let siteId: number | null = null;
    if (siteRaw && siteRaw.trim() !== "") {
      siteId = Number(siteRaw);
      if (!Number.isFinite(siteId)) return json({ error: "invalid site_id" }, 400);
    }

    const summary = await buildDashboardSummary({ period: periodRaw, siteId });
    return json(summary);
  } catch (err) {
    const message = err instanceof Error ? err.message : "internal error";
    console.error("dashboard summary failed", err);
    if (message.includes("ECONNREFUSED") || message.includes("connect")) {
      return json({ error: "CMS database not reachable" }, 503);
    }
    return json({ error: message }, 500);
  }
}
