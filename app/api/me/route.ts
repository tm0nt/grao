// app/api/me/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/auth";
import type { RowDataPacket } from "mysql2/promise";

// Linhas tipadas
interface UserRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  balance: number | null;
  total_invested: number | null;
  total_returns: number | null;
  kyc_status: string | null;
  referral_code: string;
}

interface SumRow extends RowDataPacket {
  total: number;
}

export async function GET() {
  try {
    const session = await auth();
    const id = (session?.user as any)?.id as string | undefined;
    if (!id) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    // Busca usuário
    const [userRows] = await pool.query<UserRow[]>(
      `SELECT id, name, email, balance, cpf, avatar, total_invested, total_returns, kyc_status, referral_code
       FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    if (userRows.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }
    const u = userRows[0];

    // Soma dos retornos no mês atual
    const [retRows] = await pool.query<SumRow[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total
         FROM investment_returns
        WHERE user_id = ?
          AND YEAR(reference_date) = YEAR(CURDATE())
          AND MONTH(reference_date) = MONTH(CURDATE())`,
      [id]
    );

    const monthly_return_amount = Number(retRows[0]?.total ?? 0);
    const total_invested = Number(u.total_invested ?? 0);
    const monthly_change_pct = total_invested > 0 ? (monthly_return_amount / total_invested) * 100 : 0;

    return NextResponse.json({
      id: String(u.id),
      name: String(u.name),
      email: String(u.email),
      cpf: u.cpf,
      avatar: u.avatar,
      balance: Number(u.balance ?? 0),
      total_invested,
      total_returns: Number(u.total_returns ?? 0),
      kyc_status: String(u.kyc_status ?? "not_started"),
      referral_code: String(u.referral_code),
      monthly_return_amount,
      monthly_change_pct,
    });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
