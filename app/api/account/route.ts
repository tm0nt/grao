// app/api/account/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

interface ProfileRow extends RowDataPacket {
  id: string;
  name: string;
  email: string;
  cpf: string | null;
  phone: string | null;
  avatar: string | null;
}
interface StatRow extends RowDataPacket {
  totalDeposits: number | null;
  totalWithdraws: number | null;
  activeAffiliates: number | null;
  totalCommissions: number | null;
}
interface TxRow extends RowDataPacket {
  dt: Date;
  type: string;
  amount: number;
  status: string;
}

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const [uprofile] = await pool.query<ProfileRow[]>(
    `SELECT id, name, email, cpf, phone, avatar FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  if (!uprofile.length) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  const profile = uprofile[0];

  const [stats] = await pool.query<StatRow[]>(
    `
    SELECT
      (SELECT COALESCE(SUM(amount),0) FROM transactions t
        WHERE t.user_id = ? AND t.type='deposit'  AND t.status IN ('completed','paid'))  AS totalDeposits,
      (SELECT COALESCE(SUM(amount),0) FROM transactions t
        WHERE t.user_id = ? AND t.type='withdraw' AND t.status IN ('completed','paid'))  AS totalWithdraws,
      (SELECT COUNT(*) FROM users u
        JOIN user_investments ui ON ui.user_id = u.id
        WHERE u.referred_by_user_id = ?)                                              AS activeAffiliates,
      (SELECT COALESCE(SUM(amount),0) FROM affiliate_commissions ac
        WHERE ac.affiliate_user_id = ?)                                              AS totalCommissions
    `,
    [userId, userId, userId, userId]
  );

  const [tx] = await pool.query<TxRow[]>(
    `SELECT created_at AS dt, type, amount, status
       FROM transactions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10`,
    [userId]
  );

  return NextResponse.json({
    profile: {
      id: String(profile.id),
      name: String(profile.name),
      email: String(profile.email),
      cpf: profile.cpf ? String(profile.cpf) : null,
      phone: profile.phone ? String(profile.phone) : null,
      avatar: profile.avatar ? String(profile.avatar) : null,
    },
    stats: {
      totalDeposits: Number(stats[0]?.totalDeposits ?? 0),
      totalWithdraws: Number(stats[0]?.totalWithdraws ?? 0),
      activeAffiliates: Number(stats[0]?.activeAffiliates ?? 0),
      totalCommissions: Number(stats[0]?.totalCommissions ?? 0),
    },
    recent: tx.map((r) => ({
      date: r.dt ? new Date(r.dt).toISOString() : null,
      type: String(r.type),
      amount: Number(r.amount ?? 0),
      status: String(r.status),
    })),
  });
}
