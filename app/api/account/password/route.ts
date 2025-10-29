// app/api/account/password/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

const Body = z.object({
  oldPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

interface PwRow extends RowDataPacket {
  password_hash: string | null;
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", issues: parsed.error.issues }, { status: 400 });

  const { oldPassword, newPassword } = parsed.data;

  const [rows] = await pool.query<PwRow[]>(`SELECT password_hash FROM users WHERE id = ? LIMIT 1`, [userId]);
  if (!rows.length) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  const hash = rows[0].password_hash || "";
  const ok = await bcrypt.compare(oldPassword, hash);
  if (!ok) return NextResponse.json({ error: "Senha atual incorreta" }, { status: 400 });

  const newHash = await bcrypt.hash(newPassword, 10);
  await pool.query<ResultSetHeader>(
    `UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?`,
    [newHash, userId]
  );

  return NextResponse.json({ ok: true });
}
