import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

type HealthOk = { ok: true };
type HealthFail = { ok: false; error: string };

/**
 * GET /api/health
 *
 * Minimal DB connectivity check using Drizzle/Neon.
 */
export async function GET(): Promise<NextResponse<HealthOk | HealthFail>> {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, error: "DATABASE_URL not configured" },
        { status: 503 }
      );
    }

    const sql = neon(process.env.DATABASE_URL);
    await sql`SELECT 1`;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { ok: false, error: "Database connectivity check failed" },
      { status: 503 }
    );
  }
}
