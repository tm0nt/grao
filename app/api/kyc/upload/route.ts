// app/api/kyc/upload/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";

type DocKey =
  | "rg_front" | "rg_back" | "cnh_front" | "cnh_back"
  | "passport" | "selfie" | "proof_address";

const ALLOWED: DocKey[] = [
  "rg_front","rg_back","cnh_front","cnh_back","passport","selfie","proof_address",
];

function mapToTypeSide(k: DocKey): { type: string; side: string | null } {
  if (k === "rg_front") return { type: "rg", side: "front" };
  if (k === "rg_back") return { type: "rg", side: "back" };
  if (k === "cnh_front") return { type: "cnh", side: "front" };
  if (k === "cnh_back") return { type: "cnh", side: "back" };
  if (k === "passport") return { type: "passport", side: null };
  if (k === "selfie") return { type: "selfie", side: null };
  if (k === "proof_address") return { type: "proof_address", side: null };
  return { type: "unknown", side: null };
}

function inferExt(mime: string | null): string {
  if (!mime) return ".png";
  const m = mime.toLowerCase();
  if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
  if (m.includes("png")) return ".png";
  if (m.includes("webp")) return ".webp";
  if (m.includes("pdf")) return ".pdf";
  return ".png";
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "FormData inválido" }, { status: 400 });

  const file = form.get("file") as File | null;
  const docKey = String(form.get("docKey") || "");
  if (!file) return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 });
  if (!ALLOWED.includes(docKey as DocKey)) return NextResponse.json({ error: "docKey inválido" }, { status: 400 });

  const size = (file as any).size as number;
  if (size > 10 * 1024 * 1024) return NextResponse.json({ error: "Arquivo acima de 10MB" }, { status: 400 });

  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  const ext = inferExt(file.type || "");
  const dir = path.join(process.cwd(), "public", userId, "kyc");
  await ensureDir(dir);
  const filePath = path.join(dir, `${docKey}${ext}`);
  await fs.writeFile(filePath, buf);
  const publicPath = `/${userId}/kyc/${docKey}${ext}`;

  const { type, side } = mapToTypeSide(docKey as DocKey);

  // UPDATE se existir, senão INSERT
  interface ExistsRow extends RowDataPacket { id: string; }
  const [exists] = await pool.query<ExistsRow[]>(
    `SELECT id FROM kyc_documents WHERE user_id = ? AND document_type = ? AND (document_side <=> ?) LIMIT 1`,
    [userId, type, side]
  );

  if (exists.length) {
    await pool.query<ResultSetHeader>(
      `UPDATE kyc_documents
          SET file_url = ?, file_type = ?, status = 'pending', rejection_reason = NULL, uploaded_at = NOW(), reviewed_at = NULL, reviewed_by = NULL
        WHERE id = ?`,
      [publicPath, file.type || null, exists[0].id]
    );
  } else {
    const id = crypto.randomUUID();
    await pool.query<ResultSetHeader>(
      `INSERT INTO kyc_documents (id, user_id, document_type, document_side, file_url, file_type, status, uploaded_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [id, userId, type, side, publicPath, file.type || null]
    );
  }

  return NextResponse.json({ ok: true, key: docKey, status: "pending", filePath: publicPath });
}
