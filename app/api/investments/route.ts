// app/api/investments/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

const CreateInvestmentSchema = z.object({
  planId: z.string().min(1),
  amount: z.number().positive(),
});

interface UserRow extends RowDataPacket {
  id: string;
  balance: number | null;
  total_invested: number | null;
}

interface PlanRow extends RowDataPacket {
  id: string;
  is_active: number | boolean;
  min_investment: number | null;
  max_investment_limit: number | null;
  total_invested: number | null;
}

export async function POST(req: Request) {
  const session = await auth(); 
  const userId = (session?.user as any)?.id as string | undefined; 
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 }); 

  const body = await req.json(); 
  const parsed = CreateInvestmentSchema.safeParse({
    planId: body?.planId,
    amount: typeof body?.amount === "string" ? Number(body.amount) : body?.amount,
  }); 
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.issues }, { status: 400 }); 

  const { planId, amount } = parsed.data; 

  const conn = await pool.getConnection(); 
  try {
    await conn.query("START TRANSACTION"); 

    // Bloqueia usuário para leitura/atualização
    const [userRows] = await conn.query<UserRow[]>(
      `SELECT id, balance, total_invested
         FROM users
        WHERE id = ?
        FOR UPDATE`,
      [userId]
    ); 
    if (userRows.length === 0) throw new Error("Usuário não encontrado"); 
    const user = userRows[0]; 

    // Bloqueia plano para leitura/atualização
    const [planRows] = await conn.query<PlanRow[]>(
      `SELECT id, is_active, min_investment, max_investment_limit, total_invested
         FROM investment_plans
        WHERE id = ?
        FOR UPDATE`,
      [planId]
    ); 
    if (planRows.length === 0) throw new Error("Plano não encontrado"); 
    const plan = planRows[0]; 

    if (!Boolean(plan.is_active)) throw new Error("Plano inativo"); 
    const minInv = Number(plan.min_investment ?? 0); 
    if (amount < minInv) throw new Error("Valor abaixo do mínimo do plano"); 

    const userBalance = Number(user.balance ?? 0); 
    if (userBalance < amount) throw new Error("Saldo insuficiente"); 

    const currentPlanTotal = Number(plan.total_invested ?? 0); 
    const maxLimit = plan.max_investment_limit != null ? Number(plan.max_investment_limit) : null; 
    if (maxLimit != null && currentPlanTotal + amount > maxLimit) {
      throw new Error("Limite máximo de captação do plano excedido"); 
    }

    // Cria user_investments
    const investmentId = uuidv4(); 
    await conn.query(
      `INSERT INTO user_investments (id, user_id, plan_id, amount, status, start_date, total_returns, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', NOW(), 0.00, NOW(), NOW())`,
      [investmentId, userId, planId, amount]
    ); 

    // Lança transação de investimento
    const transactionId = uuidv4(); 
    await conn.query(
      `INSERT INTO transactions (id, user_id, investment_id, type, amount, status, description, created_at, updated_at, completed_at)
       VALUES (?, ?, ?, 'investment', ?, 'completed', 'Aplicação no plano', NOW(), NOW(), NOW())`,
      [transactionId, userId, investmentId, amount]
    ); 

    // Debita saldo do usuário e atualiza total investido do usuário
    const newUserBalance = userBalance - amount; 
    const newUserTotal = Number(user.total_invested ?? 0) + amount; 
    await conn.query(
      `UPDATE users
          SET balance = ?, total_invested = ?, updated_at = NOW()
        WHERE id = ?`,
      [newUserBalance, newUserTotal, userId]
    ); 

    // Atualiza total investido do plano
    const newPlanTotal = currentPlanTotal + amount; 
    await conn.query(
      `UPDATE investment_plans
          SET total_invested = ?, updated_at = NOW()
        WHERE id = ?`,
      [newPlanTotal, planId]
    ); 

    await conn.query("COMMIT"); 
    conn.release(); 

    return NextResponse.json({ investmentId, transactionId, userId, planId, amount, balance: newUserBalance }, { status: 201 }); 
  } catch (e: any) {
    try { await conn.query("ROLLBACK"); } catch {} 
    conn.release(); 
    return NextResponse.json({ error: e?.message ?? "Erro ao criar investimento" }, { status: 400 }); 
  }
}
