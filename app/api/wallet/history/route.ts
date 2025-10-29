// app/api/wallet/history/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";

interface TxRow extends RowDataPacket {
  id: string;
  amount: number;
  status: string | null;
  payment_method: string | null;
  created_at: Date;
  description: string | null;
}

export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const limitRaw = Number(searchParams.get("limit") || 10);
  const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(50, Math.floor(limitRaw))) : 10;

  const [deposits] = await pool.query<TxRow[]>(
    `SELECT id, amount, status, payment_method, created_at, description
       FROM transactions
      WHERE user_id = ? AND type = 'deposit'
      ORDER BY created_at DESC
      LIMIT ?`,
    [userId, limit]
  );

  const [withdrawals] = await pool.query<TxRow[]>(
    `SELECT id, amount, status, payment_method, created_at, description
       FROM transactions
      WHERE user_id = ? AND type = 'withdraw'
      ORDER BY created_at DESC
      LIMIT ?`,
    [userId, limit]
  );

  return NextResponse.json({
    deposits: deposits.map(d => ({
      id: String(d.id),
      amount: Number(d.amount ?? 0),
      status: String(d.status ?? "pending"),
      method: d.payment_method ? String(d.payment_method) : null,
      created_at: d.created_at ? new Date(d.created_at).toISOString() : new Date().toISOString(),
      description: d.description || null,
    })),
    withdrawals: withdrawals.map(w => ({
      id: String(w.id),
      amount: Number(w.amount ?? 0),
      status: String(w.status ?? "pending"),
      method: w.payment_method ? String(w.payment_method) : null,
      created_at: w.created_at ? new Date(w.created_at).toISOString() : new Date().toISOString(),
      description: w.description || null,
    })),
  });
}
