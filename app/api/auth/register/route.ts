// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import bcrypt from "bcryptjs";
import pool from "@/lib/db";

const RegisterSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha muito curta"),
  cpf: z.string().min(11).max(14).optional().nullable(),
  ref: z.string().min(1).optional().nullable(), // referral_code enviado pelo cliente
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = RegisterSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password, cpf, ref } = parsed.data;

    // Verifica e-mail único
    const [existsRows] = await pool.query("SELECT 1 FROM users WHERE email = ? LIMIT 1", [email]);
    const already = Array.isArray(existsRows) && (existsRows as any[]).length > 0;
    if (already) {
      return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
    }

    // Se veio ref (referral_code), resolve para o id do usuário que indicou
    let referredByUserId: string | null = null;
    if (ref) {
      const [refRows] = await pool.query(
        "SELECT id FROM users WHERE referral_code = ? LIMIT 1",
        [ref]
      );
      if (Array.isArray(refRows) && refRows.length > 0) {
        referredByUserId = String((refRows as any)[0].id);
      }
    }

    const id = uuidv4();
    const referral_code = uuidv4(); // código único do novo usuário
    const password_hash = await bcrypt.hash(String(password), 10);

    await pool.query(
      `INSERT INTO users
        (id, email, password_hash, name, cpf, referral_code, referred_by_user_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [id, email, password_hash, name, cpf ?? null, referral_code, referredByUserId]
    );

    return NextResponse.json({ id, email, name }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
