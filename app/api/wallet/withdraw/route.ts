// app/api/wallet/withdraw/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { getAppConfig } from "@/app/api/_wallet/utils";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const Body = z.object({
  amount: z.number().positive(),             // BRL solicitado
  pixKey: z.string().min(3),
  pixKeyType: z.enum(["email", "phone", "cpf", "random"]),
});

interface UserRow extends RowDataPacket {
  balance: number | null; kyc_status: string | null;
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const json = await req.json();
  const parsed = Body.safeParse({
    amount: typeof json?.amount === "string" ? Number(json.amount) : json?.amount,
    pixKey: json?.pixKey,
    pixKeyType: json?.pixKeyType,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { amount, pixKey, pixKeyType } = parsed.data;
  const cfg = await getAppConfig();
  if (amount < cfg.min_withdraw_amount) {
    return NextResponse.json({ error: `Saque mínimo de R$ ${cfg.min_withdraw_amount.toFixed(2)}` }, { status: 400 });
  }

  // Calcula taxa de serviço (percentual) debitada junto com o saque
  const fee = (Number(cfg.service_fee_percent) / 100) * amount;
  const totalDebit = amount + fee;

  const conn = await pool.getConnection();
  try {
    await conn.query("START TRANSACTION");

    const [u] = await conn.query<UserRow[]>(
      `SELECT balance, kyc_status FROM users WHERE id = ? FOR UPDATE`,
      [userId]
    );
    if (!u.length) throw new Error("Usuário não encontrado");

    const kyc = String(u[0].kyc_status ?? "not_started").toLowerCase();
    if (kyc !== "approved") throw new Error("KYC não aprovado");

    const bal = Number(u[0].balance ?? 0);
    if (bal < totalDebit) throw new Error("Saldo insuficiente");

    const txId = uuidv4();
    await conn.query<ResultSetHeader>(
      `INSERT INTO transactions
        (id, user_id, type, amount, status, description, payment_method, pix_key, pix_key_type, metadata, created_at, updated_at)
       VALUES (?, ?, 'withdraw', ?, 'pending', 'Saque solicitado', 'pix', ?, ?, JSON_OBJECT('fee', ?), NOW(), NOW())`,
      [txId, userId, amount, pixKey, pixKeyType, fee]
    );

    await conn.query<ResultSetHeader>(
      `UPDATE users SET balance = ?, updated_at = NOW() WHERE id = ?`,
      [bal - totalDebit, userId]
    );

    await conn.query("COMMIT");
    conn.release();
    return NextResponse.json({ transactionId: txId, balance: bal - totalDebit, fee, net: amount }, { status: 201 });
  } catch (e: any) {
    try { await conn.query("ROLLBACK"); } catch {}
    conn.release();
    return NextResponse.json({ error: e?.message ?? "Erro ao solicitar saque" }, { status: 400 });
  }
}
