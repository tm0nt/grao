// app/api/affiliate/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { auth } from "@/auth";
import type { RowDataPacket } from "mysql2/promise";

interface UserRow extends RowDataPacket {
  id: string;
  referral_code: string | null;
  name: string;
  email: string;
}
interface StatsRow extends RowDataPacket {
  totalReferrals: number | null;
  activeInvestors: number | null;
  totalEarnings: number | null;
  thisMonth: number | null;
}
interface LevelsRow extends RowDataPacket {
  level: number;
  percentage: number;
  description: string | null;
  color: string | null;
}

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Perfil e código de indicação (assumindo coluna referral_code na tabela users)
  const [uprofile] = await pool.query<UserRow[]>(
    `SELECT id, name, email, referral_code FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );

  if (!uprofile.length) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
  }

  const user = uprofile[0];
  const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";
  const code = user.referral_code || `U${userId}`;
  const affiliateLink = `${baseUrl}/ref/${encodeURIComponent(code)}`;

  // Estatísticas básicas: total de referidos, ativos (quem tem investimento > 0), ganhos totais e no mês
  const [stats] = await pool.query<StatsRow[]>(
    `
    SELECT
      (SELECT COUNT(*) FROM users u WHERE u.referred_by_user_id = ?)                                                 AS totalReferrals,
      (SELECT COUNT(*) FROM users u
         JOIN user_investments ui ON ui.user_id = u.id
        WHERE u.referred_by_user_id = ?)                                                                            AS activeInvestors,
      (SELECT COALESCE(SUM(amount),0) FROM affiliate_commissions ac WHERE ac.affiliate_user_id = ?)                 AS totalEarnings,
      (SELECT COALESCE(SUM(amount),0) FROM affiliate_commissions ac
        WHERE ac.affiliate_user_id = ?
          AND YEAR(ac.created_at) = YEAR(CURDATE())
          AND MONTH(ac.created_at) = MONTH(CURDATE()))                                                              AS thisMonth
    `,
    [userId, userId, userId, userId]
  );

  // Níveis configurados (opcional: tabela affiliate_levels)
  const [levels] = await pool.query<LevelsRow[]>(
    `SELECT level, percentage, description, color
       FROM affiliate_levels
      WHERE is_active = 1
      ORDER BY level ASC`
  );

  return NextResponse.json({
    affiliateLink,
    referralCode: code,
    stats: {
      totalReferrals: Number(stats[0]?.totalReferrals ?? 0),
      activeInvestors: Number(stats[0]?.activeInvestors ?? 0),
      totalEarnings: Number(stats[0]?.totalEarnings ?? 0),
      thisMonth: Number(stats[0]?.thisMonth ?? 0),
    },
    levels: levels.map(l => ({
      level: Number(l.level),
      percentage: Number(l.percentage),
      description: l.description || "",
      color: l.color || "#00D9A3",
    })),
  });
}
