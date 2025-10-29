// app/api/plans/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

interface PlanRow extends RowDataPacket {
  id: string;
  name: string;
  category: string;
  description: string | null;
  location: string | null;
  min_investment: number | null;
  daily_return_rate: number | null;   // ex.: 0.0004 = 0.04%
  monthly_return_rate: number | null; // ex.: 0.012 = 1.2%
  duration_months: number | null;
  risk_level: string | null;
  image_url: string | null;
  features: any | null;
  rewards: any | null;
  is_new: number | boolean | null;
  total_invested: number | null;
}

export async function GET() {
  try {
    const [rows] = await pool.query<PlanRow[]>(
      `SELECT id, name, category, description, location, min_investment,
              daily_return_rate, monthly_return_rate, duration_months, risk_level,
              image_url, features, rewards, is_new, total_invested
         FROM investment_plans
        WHERE is_active = 1
        ORDER BY is_new DESC, total_invested DESC, created_at DESC`
    ); 

    // Mapeia para o shape usado no componente InvestPage
    const data = rows.map((p) => ({
      id: String(p.id),
      name: String(p.name),
      category: String(p.category),
      risk: p.risk_level ? String(p.risk_level) : "Moderado",
      minInvestment: Number(p.min_investment ?? 0),
      dailyReturn: Number((Number(p.daily_return_rate ?? 0) * 100).toFixed(2)),       // em %
      monthlyReturn: Number((Number(p.monthly_return_rate ?? 0) * 100).toFixed(2)),   // em %
      duration: Number(p.duration_months ?? 0),
      rewards: Array.isArray(p.rewards) ? p.rewards : p.rewards ? Object.values(p.rewards) : [],
      isNew: !!p.is_new,
      location: p.location ? String(p.location) : null,
      description: p.description ? String(p.description) : null,
      features: Array.isArray(p.features) ? p.features : p.features ? Object.values(p.features) : [],
    })); 

    return NextResponse.json(data); 
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 }); 
  }
}
