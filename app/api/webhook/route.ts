// app/api/webhook/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

interface TxRow extends RowDataPacket {
  id: string; user_id: string; amount: number; type: string; status: string;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Estrutura 1 (transaction deposit/credit_card)
    if (String(body?.type || "") === "transaction" && body?.data) {
      const data = body.data;
      const externalId = String(data.id);
      const status = String(data.status || "").toLowerCase();

      // Localiza transação por external_transaction_id
      const [txRows] = await pool.query<TxRow[]>(
        `SELECT id, user_id, amount, type, status
           FROM transactions
          WHERE external_transaction_id = ?
          LIMIT 1`,
        [externalId]
      );
      if (!txRows.length) return NextResponse.json({ ok: true }); // ignora desconhecidos

      const tx = txRows[0];

      if (tx.type === "deposit" && status === "paid" && tx.status !== "completed") {
        const conn = await pool.getConnection();
        try {
          await conn.query("START TRANSACTION");
          const [u] = await conn.query<any[]>(
            `SELECT balance FROM users WHERE id = ? FOR UPDATE`,
            [tx.user_id]
          );
          const bal = Number(u[0]?.balance ?? 0);
          await conn.query<ResultSetHeader>(
            `UPDATE users SET balance = ?, updated_at = NOW() WHERE id = ?`,
            [bal + Number(tx.amount), tx.user_id]
          );
          await conn.query<ResultSetHeader>(
            `UPDATE transactions
                SET status = 'completed', completed_at = NOW(), updated_at = NOW()
              WHERE id = ?`,
            [tx.id]
          );
          await conn.query("COMMIT");
          conn.release();
        } catch {
          try { await conn.query("ROLLBACK"); } catch {}
          conn.release();
          return NextResponse.json({ ok: false }, { status: 500 });
        }
      }

      if (tx.type === "withdraw" && (status === "completed" || status === "paid") && tx.status !== "completed") {
        await pool.query<ResultSetHeader>(
          `UPDATE transactions
              SET status = 'completed', completed_at = NOW(), updated_at = NOW()
            WHERE id = ?`,
          [tx.id]
        );
      }

      return NextResponse.json({ ok: true });
    }

    // Estrutura 2 (withdraw)
    if (String(body?.type || "") === "withdraw" && body?.data) {
      const data = body.data;
      const status = String(data.status || "").toLowerCase();
      const externalRef = data.externalRef ? String(data.externalRef) : null;

      // Se enviou externalRef no saque, usa-o; senão, não há id externo — necessário mapear por meta
      if (externalRef) {
        await pool.query<ResultSetHeader>(
          `UPDATE transactions
              SET status = ?, completed_at = CASE WHEN ? IN ('completed','paid') THEN NOW() ELSE completed_at END,
                  updated_at = NOW()
            WHERE id = ? AND type = 'withdraw'`,
          [status === "completed" ? "completed" : status, status, externalRef]
        );
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
