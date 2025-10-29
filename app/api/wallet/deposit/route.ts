// app/api/wallet/deposit/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { buildPagflyAuth, getAppConfig } from "@/app/api/_wallet/utils";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const Body = z.object({
  amount: z.number().positive(),               // BRL (ex.: 100.50)
  method: z.enum(["pix", "card"]),
  card: z.object({
    number: z.string(),
    holderName: z.string(),
    expirationMonth: z.number().int(),
    expirationYear: z.number().int(),
    cvv: z.string()
  }).optional()
});

interface UserRow extends RowDataPacket {
  name: string; email: string; cpf: string | null;
}
interface TxRow extends RowDataPacket {
  id: string; user_id: string; external_transaction_id: string | null; status: string;
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const json = await req.json();
  const parsed = Body.safeParse({
    amount: typeof json?.amount === "string" ? Number(json.amount) : json?.amount,
    method: json?.method,
    card: json?.card
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { amount, method, card } = parsed.data;
  const cfg = await getAppConfig();
  if (amount < cfg.min_deposit_amount) {
    return NextResponse.json({ error: `Depósito mínimo de R$ ${cfg.min_deposit_amount.toFixed(2)}` }, { status: 400 });
  }

  // Lê dados do usuário para mandar ao PSP
  const [urows] = await pool.query<UserRow[]>(
    `SELECT name, email, cpf FROM users WHERE id = ? LIMIT 1`,
    [userId]
  );
  if (!urows.length) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const user = urows[0];
  const cents = Math.round(amount * 100);
  const txId = uuidv4();

  // Cria transação local (pending) antes de chamar o PSP
  const conn = await pool.getConnection();
  try {
    await conn.query("START TRANSACTION");

    await conn.query<ResultSetHeader>(
      `INSERT INTO transactions
        (id, user_id, type, amount, status, description, payment_method, metadata, created_at, updated_at)
       VALUES (?, ?, 'deposit', ?, 'pending', 'Depósito via Pagfly', ?, JSON_OBJECT('origin','wallet-deposit'), NOW(), NOW())`,
      [txId, userId, amount, method]
    );

    await conn.query("COMMIT");
  } catch (e) {
    try { await conn.query("ROLLBACK"); } catch {}
    conn.release();
    return NextResponse.json({ error: "Falha ao registrar transação local" }, { status: 500 });
  }

  // Monta payload para Pagfly
  const postbackUrl = cfg.pix_postback_url || `${process.env.NEXT_PUBLIC_URL}/api/webhook`;
  const payload: any = {
    amount: cents,
    paymentMethod: method === "pix" ? "pix" : "credit_card",
    items: [
      { title: "Depósito", unitPrice: cents, quantity: 1, tangible: false }
    ],
    customer: {
      name: user.name,
      email: user.email,
      document: {
        number: (user.cpf || "").replace(/\D/g, "").slice(0, 14) || "00000000000",
        type: "cpf"
      }
    },
    postbackUrl,
    externalRef: txId,
    metadata: `{"source":"wallet"}`,
  };
  if (method === "card" && card) {
    payload.card = {
      number: card.number,
      holderName: card.holderName,
      expirationMonth: card.expirationMonth,
      expirationYear: card.expirationYear,
      cvv: card.cvv
    };
  }

  // Chamada ao PSP
  try {
    const resp = await fetch("https://api.pagfly.com/v1/transactions", {
      method: "POST",
      headers: {
        accept: "application/json",
        authorization: buildPagflyAuth(),
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json({ error: data?.message || "Falha no PSP" }, { status: 400 });
    }

    const externalId = String(data?.id ?? "");
    const pixQrcode = data?.pix?.qrcode ? String(data.pix.qrcode) : null;

    // Salva external_transaction_id
    await pool.query<ResultSetHeader>(
      `UPDATE transactions
          SET external_transaction_id = ?, updated_at = NOW()
        WHERE id = ?`,
      [externalId, txId]
    );

    // Para PIX, retornamos qrcode para exibição; para cartão, retorna status do PSP
    return NextResponse.json({
      transactionId: txId,
      externalId,
      method,
      status: String(data?.status || "waiting_payment"),
      pixQrcode
    }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Erro ao contatar PSP" }, { status: 502 });
  } finally {
    conn.release();
  }
}
