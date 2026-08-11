import { Pool, type QueryResultRow } from "pg";

let pool: Pool | null = null;

/** Shared OLTP: CMS Postgres (cms + booking). Same DB as admin CMS, booking API, device API. */
export function getCmsPool(): Pool {
  if (pool) return pool;
  const url =
    process.env.CMS_DATABASE_URL ||
    process.env.DATABASE_URL ||
    "postgres://indobox:indobox@127.0.0.1:5432/indobox";
  pool = new Pool({
    connectionString: url,
    max: 8,
    options: "-c search_path=cms,booking,public",
  });
  return pool;
}

export async function dbQuery<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return getCmsPool().query<T>(text, params);
}
