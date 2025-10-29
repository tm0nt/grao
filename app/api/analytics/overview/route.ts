// app/api/analytics/overview/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

interface PlanOptionRow extends RowDataPacket { id: string; name: string; }
interface DistRow extends RowDataPacket { plan_id: string; plan_name: string; amount: number; }
interface TxAggRow extends RowDataPacket { d: string; ttype: string; total: number; }
interface RetAggRow extends RowDataPacket { d: string; total: number; }
interface UserTotalsRow extends RowDataPacket { total_invested: number | null; }
interface PlanTotalRow extends RowDataPacket { total: number | null; }

function parsePeriod(period: string | null) {
  const now = new Date();
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  let from = new Date(to);
  switch ((period || "all").toLowerCase()) {
    case "month": from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1)); break;
    case "ytd": from = new Date(Date.UTC(to.getUTCFullYear(), 0, 1)); break;
    case "last3m": from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 3, to.getUTCDate())); break;
    case "last6m": from = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 6, to.getUTCDate())); break;
    case "all":
    default: from = new Date(Date.UTC(2000, 0, 1));
  }
  return { fromISO: from.toISOString().slice(0, 10), toISO: to.toISOString().slice(0, 10) };
}

export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const url = new URL(req.url);
  const period = url.searchParams.get("period");
  const planId = url.searchParams.get("planId");
  const { fromISO, toISO } = parsePeriod(period);

  // Planos investidos (para o filtro)
  const [plans] = await pool.query<PlanOptionRow[]>(
    `SELECT DISTINCT ip.id, ip.name
       FROM user_investments ui
       JOIN investment_plans ip ON ip.id = ui.plan_id
      WHERE ui.user_id = ?
      ORDER BY ip.name ASC`,
    [userId]
  );

  // Total investido do usuário
  const [ut] = await pool.query<UserTotalsRow[]>(
    `SELECT total_invested FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  const userTotalInvested = Number(ut[0]?.total_invested ?? 0);

  // Se o filtro de plano estiver ativo, usa o total investido daquele plano como denominador
  let denomInvested = userTotalInvested;
  if (planId && planId !== "all") {
    const [pt] = await pool.query<PlanTotalRow[]>(
      `SELECT COALESCE(SUM(amount),0) AS total
         FROM user_investments
        WHERE user_id = ? AND plan_id = ?`,
      [userId, planId]
    );
    denomInvested = Number(pt[0]?.total ?? 0);
  }

  // Distribuição por plano
  const [distRows] = await pool.query<DistRow[]>(
    `SELECT ui.plan_id, ip.name AS plan_name, SUM(ui.amount) AS amount
       FROM user_investments ui
       JOIN investment_plans ip ON ip.id = ui.plan_id
      WHERE ui.user_id = ?
        ${planId && planId !== "all" ? "AND ui.plan_id = ?" : ""}
      GROUP BY ui.plan_id, ip.name
      ORDER BY amount DESC`,
    planId && planId !== "all" ? [userId, planId] : [userId]
  );
  const distribution = distRows.map((r) => {
    const amt = Number(r.amount ?? 0);
    return {
      planId: String(r.plan_id),
      planName: String(r.plan_name),
      amount: amt,
      sharePct: userTotalInvested > 0 ? (amt / userTotalInvested) * 100 : 0,
    };
  });

  // Agregados diários de transações
  const txParams: any[] = [userId, fromISO, toISO];
  const planFilter = planId && planId !== "all" ? "AND investment_id IN (SELECT id FROM user_investments WHERE user_id = ? AND plan_id = ?)" : "";
  const planParams = planId && planId !== "all" ? [userId, planId] : [];

  const [txRows] = await pool.query<TxAggRow[]>(
    `SELECT DATE(created_at) AS d, type AS ttype, SUM(amount) AS total
       FROM transactions
      WHERE user_id = ?
        AND status IN ('completed','paid')
        AND DATE(created_at) BETWEEN ? AND ?
        ${planFilter}
      GROUP BY DATE(created_at), type
      ORDER BY DATE(created_at) ASC`,
    planFilter ? [...txParams, ...planParams] : txParams
  );

  // Agregados diários de rendimentos
  const retParams: any[] = [userId, fromISO, toISO];
  const [retRows] = await pool.query<RetAggRow[]>(
    `SELECT DATE(paid_at) AS d, SUM(amount) AS total
       FROM investment_returns
      WHERE user_id = ?
        AND DATE(paid_at) BETWEEN ? AND ?
        ${planId && planId !== "all" ? "AND investment_id IN (SELECT id FROM user_investments WHERE user_id = ? AND plan_id = ?)" : ""}
      GROUP BY DATE(paid_at)
      ORDER BY DATE(paid_at) ASC`,
    planId && planId !== "all" ? [...retParams, ...planParams] : retParams
  );

  // Índice por data
  const mapByDate = new Map<string, {
    deposits: number; withdrawals: number; investments: number; returns: number;
  }>();

  for (const r of txRows) {
    const d = String(r.d);
    const cur = mapByDate.get(d) ?? { deposits: 0, withdrawals: 0, investments: 0, returns: 0 };
    const t = String(r.ttype);
    if (t === "deposit") cur.deposits += Number(r.total ?? 0);
    else if (t === "withdraw") cur.withdrawals += Number(r.total ?? 0);
    else if (t === "investment") cur.investments += Number(r.total ?? 0);
    mapByDate.set(d, cur);
  }

  for (const r of retRows) {
    const d = String(r.d);
    const cur = mapByDate.get(d) ?? { deposits: 0, withdrawals: 0, investments: 0, returns: 0 };
    cur.returns += Number(r.total ?? 0);
    mapByDate.set(d, cur);
  }

  // Série diária
  const sortedDays = Array.from(mapByDate.keys()).sort();
  let cumBalance = 0;
  const series = sortedDays.map((d) => {
    const it = mapByDate.get(d)!;
    const denom = denomInvested > 0 ? denomInvested : userTotalInvested;
    const returnPct = denom > 0 ? (it.returns / denom) * 100 : 0;
    cumBalance += it.deposits - it.withdrawals - it.investments + it.returns;
    return {
      date: d,
      returnPct: Number(returnPct.toFixed(2)),
      balance: cumBalance,
      deposits: it.deposits,
      withdrawals: it.withdrawals,
      investments: it.investments,
    };
  });

  // Agregado do período
  const totalReturns = retRows.reduce((acc, r) => acc + Number(r.total ?? 0), 0);
  const denom = denomInvested > 0 ? denomInvested : userTotalInvested;
  const periodReturnPct = denom > 0 ? (totalReturns / denom) * 100 : 0;

  // Extrato
  const [extractRows] = await pool.query<RowDataPacket[]>(
    `
    SELECT created_at AS dt, 'deposit' AS t, CONCAT('Depósito #', id) AS descp, amount AS amt
      FROM transactions
     WHERE user_id = ? AND type = 'deposit' AND status IN ('completed','paid')
       AND DATE(created_at) BETWEEN ? AND ?
       ${planFilter}
    UNION ALL
    SELECT created_at AS dt, 'withdraw' AS t, CONCAT('Saque #', id) AS descp, amount AS amt
      FROM transactions
     WHERE user_id = ? AND type = 'withdraw' AND status IN ('completed','paid')
       AND DATE(created_at) BETWEEN ? AND ?
       ${planFilter}
    UNION ALL
    SELECT created_at AS dt, 'investment' AS t, CONCAT('Investimento #', id) AS descp, amount AS amt
      FROM transactions
     WHERE user_id = ? AND type = 'investment' AND status IN ('completed','paid')
       AND DATE(created_at) BETWEEN ? AND ?
       ${planFilter}
    UNION ALL
    SELECT paid_at AS dt, 'return' AS t, 'Rendimento' AS descp, amount AS amt
      FROM investment_returns
     WHERE user_id = ?
       AND DATE(paid_at) BETWEEN ? AND ?
       ${planId && planId !== "all" ? "AND investment_id IN (SELECT id FROM user_investments WHERE user_id = ? AND plan_id = ?)" : ""}
    ORDER BY dt DESC
    LIMIT 200
    `,
    planFilter
      ? [userId, fromISO, toISO, ...planParams, userId, fromISO, toISO, ...planParams, userId, fromISO, toISO, ...planParams, userId, fromISO, toISO, ...planParams]
      : [userId, fromISO, toISO, userId, fromISO, toISO, userId, fromISO, toISO, userId, fromISO, toISO]
  );

  const extract = (extractRows as any[]).map((r) => ({
    date: new Date(r.dt).toISOString(),
    type: String(r.t),
    description: String(r.descp),
    amount: Number(r.amt ?? 0),
  }));

  return NextResponse.json({
    range: { from: fromISO, to: toISO },
    agg: {
      periodReturnPct,
      lastUpdate: new Date().toISOString(),
    },
    series,
    distribution,
    extract,
    plans: plans.map((p) => ({ id: String(p.id), name: String(p.name) })),
  });
}
