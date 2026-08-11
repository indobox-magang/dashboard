import { jwtVerify } from "jose";

export type AdminToken = {
  uid: number;
  email: string;
};

export async function verifyAdminJwt(raw: string): Promise<AdminToken> {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error("ADMIN_JWT_SECRET is not set");
  }
  const { payload } = await jwtVerify(raw, new TextEncoder().encode(secret), {
    algorithms: ["HS256"],
  });
  if (payload.sub !== "admin") {
    throw new Error("not an admin token");
  }
  const uid = Number(payload.uid);
  const email = String(payload.email || "");
  if (!Number.isFinite(uid) || !email) {
    throw new Error("invalid admin claims");
  }
  return { uid, email };
}

export function bearerFromRequest(req: Request): string | null {
  const h = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!h) return null;
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m?.[1] || null;
}
