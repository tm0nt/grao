// app/api/affiliate/earnings/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/auth";
import type { RowDataPacket } from "mysql2/promise";

interface EarnRow extends RowDataPacket {
  id: string;
  amount: number;
  origin: string | null;
  level: number | null;
  created_at: Date;
}

export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const url = new URL(req.url);
  const period = url.searchParams.get("period"); // ex.: month, ytd, last3m, all
  const now = new Date();
  const toISO = now.toISOString().slice(0, 10);
  let fromISO = "2000-01-01";
  if (period === "month") fromISO = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString().slice(0, 10);
  else if (period === "ytd") fromISO = new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString().slice(0, 10);

  const [rows] = await pool.query<EarnRow[]>(
    `SELECT id, amount, origin, level, created_at
       FROM affiliate_commissions
      WHERE affiliate_user_id = ?
        AND DATE(created_at) BETWEEN ? AND ?
      ORDER BY created_at DESC
      LIMIT 200`,
    [userId, fromISO, toISO]
  );

  return NextResponse.json(rows.map(r => ({
    id: String(r.id),
    amount: Number(r.amount ?? 0),
    origin: r.origin || "",
    level: Number(r.level ?? 1),
    createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
  })));
}
