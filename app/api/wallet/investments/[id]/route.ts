// app/api/wallet/investments/[id]/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/auth";
import type { RowDataPacket } from "mysql2/promise";

interface InvRow extends RowDataPacket {
  id: string;
  plan_id: string;
  amount: number;
  total_returns: number | null;
  status: string;
  start_date: Date | null;
  end_date: Date | null;
  plan_name: string;
  monthly_return_rate: number | null;
}
interface DivRow extends RowDataPacket {
  amount: number;
  paid_at: Date | null;
  return_type: string;
}

export async function GET(_: Request, ctx: { params: { id: string } }) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const investmentId = ctx.params.id;

  const [rows] = await pool.query<InvRow[]>(
    `SELECT ui.id, ui.plan_id, ui.amount, ui.total_returns, ui.status, ui.start_date, ui.end_date,
            ip.name AS plan_name, ip.monthly_return_rate
       FROM user_investments ui
       JOIN investment_plans ip ON ip.id = ui.plan_id
      WHERE ui.id = ? AND ui.user_id = ?
      LIMIT 1`,
    [investmentId, userId]
  );
  if (!rows.length) return NextResponse.json({ error: "Investimento não encontrado" }, { status: 404 });

  const inv = rows[0];

  const [divs] = await pool.query<DivRow[]>(
    `SELECT amount, paid_at, return_type
       FROM investment_returns
      WHERE investment_id = ?
      ORDER BY paid_at DESC
      LIMIT 12`,
    [investmentId]
  );

  return NextResponse.json({
    id: String(inv.id),
    planId: String(inv.plan_id),
    planName: String(inv.plan_name),
    amount: Number(inv.amount),
    totalReturns: Number(inv.total_returns ?? 0),
    status: String(inv.status),
    startDate: inv.start_date ? new Date(inv.start_date).toISOString() : null,
    endDate: inv.end_date ? new Date(inv.end_date).toISOString() : null,
    monthlyReturnPct: Number(((inv.monthly_return_rate ?? 0) * 100).toFixed(2)),
    dividends: divs.map((d) => ({
      value: Number(d.amount),
      date: d.paid_at ? new Date(d.paid_at).toLocaleDateString("pt-BR") : "",
      type: String(d.return_type),
    })),
  });
}
