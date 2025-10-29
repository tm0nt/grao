// app/api/kyc/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2/promise";

interface DocRow extends RowDataPacket {
  document_type: string;
  document_side: string | null;
  file_url: string;
  status: string;
  rejection_reason: string | null;
}

const ALL_DOC_KEYS = [
  "rg_front","rg_back","cnh_front","cnh_back","passport","selfie","proof_address",
] as const;
type DocKey = typeof ALL_DOC_KEYS[number];

function toKey(t: string, s: string | null): DocKey | null {
  const type = String(t).toLowerCase();
  const side = s ? String(s).toLowerCase() : null;
  if (type === "rg" && side === "front") return "rg_front";
  if (type === "rg" && side === "back") return "rg_back";
  if (type === "cnh" && side === "front") return "cnh_front";
  if (type === "cnh" && side === "back") return "cnh_back";
  if (type === "passport") return "passport";
  if (type === "selfie") return "selfie";
  if (type === "proof_address") return "proof_address";
  return null;
}

export async function GET() {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const [rows] = await pool.query<DocRow[]>(
    `SELECT document_type, document_side, file_url, status, rejection_reason
       FROM kyc_documents
      WHERE user_id = ?`,
    [userId]
  );

  const map = new Map<DocKey, { status: string; filePath: string | null; rejectionReason: string | null }>();
  for (const r of rows) {
    const k = toKey(r.document_type, r.document_side);
    if (!k) continue;
    map.set(k, {
      status: String(r.status || "pending"),
      filePath: r.file_url || null,
      rejectionReason: r.rejection_reason || null,
    });
  }

  const items = ALL_DOC_KEYS.map((k) => ({
    key: k,
    status: map.get(k)?.status ?? "not_uploaded",
    filePath: map.get(k)?.filePath ?? null,
    rejectionReason: map.get(k)?.rejectionReason ?? null,
  }));

  return NextResponse.json({ items, updatedAt: new Date().toISOString() });
}
