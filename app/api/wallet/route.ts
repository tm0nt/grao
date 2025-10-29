// app/api/wallet/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/auth";
import type { RowDataPacket } from "mysql2/promise";

interface UserRow extends RowDataPacket {
  id: string; name: string; email: string;
  balance: number | null; total_invested: number | null; total_returns: number | null;
  kyc_status: string | null;
}
interface InvRow extends RowDataPacket {
  investment_id: string; plan_id: string; plan_name: string; category: string;
  amount: number; duration_months: number | null; risk_level: string | null;
  daily_return_rate: number | null; monthly_return_rate: number | null;
}
interface DivRow extends RowDataPacket {
  investment_id: string; paid_at: Date | null; amount: number; return_type: string;
}

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const [urows] = await pool.query<UserRow[]>(
    `SELECT id, name, email, balance, total_invested, total_returns, kyc_status
       FROM users WHERE id = ? LIMIT 1`, [userId]
  );
  if (!urows.length) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const u = urows[0];
  const totalInvested = Number(u.total_invested ?? 0);

  const [invrows] = await pool.query<InvRow[]>(
    `SELECT ui.id AS investment_id, ui.plan_id,
            ip.name AS plan_name, ip.category,
            ui.amount, ip.duration_months, ip.risk_level,
            ip.daily_return_rate, ip.monthly_return_rate
       FROM user_investments ui
       JOIN investment_plans ip ON ip.id = ui.plan_id
      WHERE ui.user_id = ?
      ORDER BY ui.created_at DESC`,
    [userId]
  );

  let portfolio = invrows.map((r) => ({
    investmentId: String(r.investment_id),
    planId: String(r.plan_id),
    planName: String(r.plan_name),
    category: String(r.category),
    amount: Number(r.amount),
    sharePct: totalInvested > 0 ? (Number(r.amount) / totalInvested) * 100 : 0,
    dailyReturnPct: Number(((r.daily_return_rate ?? 0) * 100).toFixed(2)),
    monthlyReturnPct: Number(((r.monthly_return_rate ?? 0) * 100).toFixed(2)),
    durationMonths: Number(r.duration_months ?? 0),
    riskLevel: r.risk_level ? String(r.risk_level) : null,
    dividends: [] as { date: string; value: number; type: string }[],
  }));

  if (portfolio.length) {
    const ids = portfolio.map((p) => p.investmentId);
    const placeholders = ids.map(() => "?").join(",");
    const [drows] = await pool.query<DivRow[]>(
      `SELECT investment_id, paid_at, amount, return_type
         FROM investment_returns
        WHERE investment_id IN (${placeholders})
        ORDER BY paid_at DESC
        LIMIT ${ids.length * 5}`, ids
    );
    const by = new Map<string, { date: string; value: number; type: string }[]>();
    for (const d of drows) {
      const list = by.get(String(d.investment_id)) ?? [];
      if (list.length < 5) list.push({
        date: d.paid_at ? new Date(d.paid_at).toLocaleDateString("pt-BR") : "",
        value: Number(d.amount),
        type: String(d.return_type),
      });
      by.set(String(d.investment_id), list);
    }
    portfolio = portfolio.map(p => ({ ...p, dividends: by.get(p.investmentId) ?? [] }));
  }

  return NextResponse.json({
    user: {
      id: String(u.id),
      name: String(u.name),
      email: String(u.email),
      balance: Number(u.balance ?? 0),
      total_invested: totalInvested,
      total_returns: Number(u.total_returns ?? 0),
      kyc_status: String(u.kyc_status ?? "not_started"),
    },
    portfolio,
    updatedAt: new Date().toISOString(),
  });
}
