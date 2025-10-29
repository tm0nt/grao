// app/api/wallet/investments/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/auth";
import type { RowDataPacket } from "mysql2/promise";

interface InvRow extends RowDataPacket {
  investment_id: string;
  plan_id: string;
  plan_name: string;
  category: string;
  amount: number;
  duration_months: number | null;
  risk_level: string | null;
  monthly_return_rate: number | null;
}

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const [rows] = await pool.query<InvRow[]>(
    `SELECT ui.id AS investment_id, ui.plan_id,
            ip.name AS plan_name, ip.category, ui.amount,
            ip.duration_months, ip.risk_level, ip.monthly_return_rate
       FROM user_investments ui
       JOIN investment_plans ip ON ip.id = ui.plan_id
      WHERE ui.user_id = ?
      ORDER BY ui.created_at DESC`,
    [userId]
  );

  const total = rows.reduce((acc, r) => acc + Number(r.amount), 0);
  const data = rows.map((r) => ({
    investmentId: String(r.investment_id),
    planId: String(r.plan_id),
    planName: String(r.plan_name),
    category: String(r.category),
    amount: Number(r.amount),
    sharePct: total > 0 ? (Number(r.amount) / total) * 100 : 0,
    durationMonths: Number(r.duration_months ?? 0),
    riskLevel: r.risk_level ? String(r.risk_level) : null,
    monthlyReturnPct: Number(((r.monthly_return_rate ?? 0) * 100).toFixed(2)),
  }));

  return NextResponse.json({ total, items: data });
}
