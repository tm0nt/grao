// app/api/wallet/deposit/status/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { buildPagflyAuth } from "@/app/api/_wallet/utils";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

interface TxRow extends RowDataPacket {
  id: string; user_id: string; amount: number; status: string; external_transaction_id: string | null;
}

export async function GET(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const url = new URL(req.url);
  const externalId = url.searchParams.get("id");
  if (!externalId) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  // Busca transação local
  const [txRows] = await pool.query<TxRow[]>(
    `SELECT id, user_id, amount, status, external_transaction_id
       FROM transactions
      WHERE external_transaction_id = ? AND user_id = ? AND type = 'deposit'
      LIMIT 1`,
    [externalId, userId]
  );
  if (!txRows.length) return NextResponse.json({ error: "Transação não encontrada" }, { status: 404 });

  const tx = txRows[0];
  if (tx.status === "completed") {
    return NextResponse.json({ status: "already_paid" }, { status: 200 });
  }

  // Consulta PSP
  const resp = await fetch(`https://api.pagfly.com/v1/transactions/${encodeURIComponent(externalId)}`, {
    headers: {
      accept: "application/json",
      authorization: buildPagflyAuth()
    }
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    return NextResponse.json({ error: data?.message || "Falha ao consultar PSP" }, { status: 400 });
  }

  const status = String(data?.status || "").toLowerCase();

  if (status !== "paid") {
    return NextResponse.json({ status }, { status: 200 });
  }

  // Se pago, credita saldo e marca completed
  const conn = await pool.getConnection();
  try {
    await conn.query("START TRANSACTION");
    const [u] = await conn.query<any[]>(
      `SELECT balance FROM users WHERE id = ? FOR UPDATE`,
      [userId]
    );
    const bal = Number(u[0]?.balance ?? 0);

    await conn.query<ResultSetHeader>(
      `UPDATE users SET balance = ?, updated_at = NOW() WHERE id = ?`,
      [bal + Number(tx.amount), userId]
    );

    await conn.query<ResultSetHeader>(
      `UPDATE transactions
          SET status = 'completed', completed_at = NOW(), updated_at = NOW()
        WHERE id = ?`,
      [tx.id]
    );

    await conn.query("COMMIT");
    conn.release();
    return NextResponse.json({ status: "paid", balance: bal + Number(tx.amount) }, { status: 200 });
  } catch (e: any) {
    try { await conn.query("ROLLBACK"); } catch {}
    conn.release();
    return NextResponse.json({ error: e?.message || "Falha ao concluir depósito" }, { status: 500 });
  }
}
