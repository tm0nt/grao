// app/api/affiliate/referrals/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/auth";
import type { RowDataPacket } from "mysql2/promise";

interface ReferralRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  created_at: Date;
  total_invested: number | null;
}

export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const url = new URL(req.url);
  const level = Number(url.searchParams.get("level") || 1); // futuro: níveis 1..3
  // Para nível 1: usuários com referred_by_user_id = userId
  // Para níveis superiores seria necessário mapear a árvore; aqui mantemos nível 1 por simplicidade

  const [rows] = await pool.query<ReferralRow[]>(
    `SELECT u.id, u.name, u.email, u.created_at,
            (SELECT COALESCE(SUM(amount),0) FROM user_investments ui WHERE ui.user_id = u.id) AS total_invested
       FROM users u
      WHERE u.referred_by_user_id = ?
      ORDER BY u.created_at DESC
      LIMIT 200`,
    [userId]
  );

  return NextResponse.json(rows.map(r => ({
    id: String(r.id),
    name: String(r.name),
    email: String(r.email),
    joinedAt: r.created_at ? new Date(r.created_at).toISOString() : null,
    totalInvested: Number(r.total_invested ?? 0),
  })));
}
