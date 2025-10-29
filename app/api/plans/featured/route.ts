// app/api/plans/featured/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

export const runtime = "nodejs";

interface PlanRow extends RowDataPacket {
  id: string;
  name: string;
  category: string;
  description: string | null;
  location: string | null;
  min_investment: number | null;
  daily_return_rate: number | null;
  monthly_return_rate: number | null;
  duration_months: number | null;
  risk_level: string | null;
  image_url: string | null;
  is_new: number | boolean | null;
  total_invested: number | null;
  featured: number | null;
}

export async function GET() {
  try {
    const [rows] = await pool.query<PlanRow[]>(
      `SELECT id, name, category, description, location,
              min_investment, daily_return_rate, monthly_return_rate,
              duration_months, risk_level, image_url, is_new, total_invested, featured
         FROM investment_plans
        WHERE is_active = 1
          AND featured = 1
        ORDER BY is_new DESC, total_invested DESC, created_at DESC
        LIMIT 6`
    );

    const data = rows.map((r) => ({
      id: String(r.id),
      name: String(r.name),
      category: String(r.category),
      description: r.description ? String(r.description) : null,
      location: r.location ? String(r.location) : null,
      min_investment: Number(r.min_investment ?? 0),
      daily_return_rate: Number(r.daily_return_rate ?? 0),
      monthly_return_rate: Number(r.monthly_return_rate ?? 0),
      duration_months: Number(r.duration_months ?? 0),
      risk_level: r.risk_level ? String(r.risk_level) : null,
      image_url: r.image_url ? String(r.image_url) : null,
      is_new: !!r.is_new,
      total_invested: Number(r.total_invested ?? 0),
      featured: Number(r.featured ?? 0) === 1,
    }));

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
