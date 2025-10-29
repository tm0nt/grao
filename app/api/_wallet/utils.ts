// app/api/_wallet/utils.ts
import pool from "@/lib/db";

export async function getAppConfig() {
  const [rows] = await pool.query<any[]>(
    `SELECT service_fee_percent, min_withdraw_amount, min_deposit_amount, pix_postback_url
       FROM app_config WHERE id = 1 LIMIT 1`
  );
  if (!Array.isArray(rows) || rows.length === 0) {
    return {
      service_fee_percent: 2.5,
      min_withdraw_amount: 50,
      min_deposit_amount: 10,
      pix_postback_url: null as string | null,
    };
  }
  const r = rows[0];
  return {
    service_fee_percent: Number(r.service_fee_percent ?? 2.5),
    min_withdraw_amount: Number(r.min_withdraw_amount ?? 50),
    min_deposit_amount: Number(r.min_deposit_amount ?? 10),
    pix_postback_url: r.pix_postback_url ? String(r.pix_postback_url) : null,
  };
}

export function buildPagflyAuth() {
  const pub = process.env.PAGFLY_PUBLIC_KEY || "";
  const sec = process.env.PAGFLY_SECRET_KEY || "";
  const token = Buffer.from(`${pub}:${sec}`).toString("base64");
  return `Basic ${token}`;
}
