// app/api/kyc/review/route.ts
import { NextResponse } from "next/server";
import pool from "@/lib/db";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";

// ATENÇÃO: proteja com auth/role de admin conforme sua política
const REQUIRED_BY_TYPE = {
  rg: ["rg_front","rg_back","selfie","proof_address"],
  cnh: ["cnh_front","cnh_back","selfie","proof_address"],
  passport: ["passport","selfie","proof_address"],
} as const;

interface DocRow extends RowDataPacket {
  document_type: string;
  document_side: string | null;
  status: string;
}
function toKey(t: string, s: string | null) {
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

async function recomputeUserKyc(userId: string) {
  const [rows] = await pool.query<DocRow[]>(
    `SELECT document_type, document_side, status FROM kyc_documents WHERE user_id = ?`,
    [userId]
  );
  const keys = rows.map(r => toKey(r.document_type, r.document_side)).filter(Boolean) as string[];
  // Detecta o tipo dominante pela presença de passport > cnh > rg
  const type = keys.includes("passport") ? "passport" : (keys.some(k => k.startsWith("cnh")) ? "cnh" : (keys.some(k => k.startsWith("rg")) ? "rg" : null));
  if (!type) {
    await pool.query<ResultSetHeader>(`UPDATE users SET kyc_status = 'not_started', kyc_verified_at = NULL, updated_at = NOW() WHERE id = ?`, [userId]);
    return;
  }
  const req = REQUIRED_BY_TYPE[type as "rg"|"cnh"|"passport"];
  const byKey = new Map<string,string>();
  for (const r of rows) {
    const k = toKey(r.document_type, r.document_side);
    if (k) byKey.set(k, String(r.status||"pending").toLowerCase());
  }
  let anyRejected = false, anyPending = false;
  for (const k of req) {
    const st = byKey.get(k) || "not_uploaded";
    if (st === "rejected") anyRejected = true;
    else if (st === "pending" || st === "not_uploaded") anyPending = true;
  }
  if (anyRejected) {
    await pool.query<ResultSetHeader>(`UPDATE users SET kyc_status = 'rejected', kyc_verified_at = NULL, updated_at = NOW() WHERE id = ?`, [userId]);
  } else if (anyPending) {
    await pool.query<ResultSetHeader>(`UPDATE users SET kyc_status = 'pending', kyc_verified_at = NULL, updated_at = NOW() WHERE id = ?`, [userId]);
  } else {
    await pool.query<ResultSetHeader>(`UPDATE users SET kyc_status = 'approved', kyc_verified_at = NOW(), updated_at = NOW() WHERE id = ?`, [userId]);
  }
}

export async function POST(req: Request) {
  // body: { documentId: string, status: "approved"|"rejected", reason?: string, reviewerUserId?: string }
  const body = await req.json().catch(() => null);
  if (!body?.documentId || !body?.status) return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });

  const st = String(body.status).toLowerCase();
  if (!["approved","rejected"].includes(st)) return NextResponse.json({ error: "Status inválido" }, { status: 400 });

  // Atualiza documento
  await pool.query<ResultSetHeader>(
    `UPDATE kyc_documents
        SET status = ?, rejection_reason = CASE WHEN ?='rejected' THEN ? ELSE NULL END,
            reviewed_at = NOW(), reviewed_by = ?
      WHERE id = ?`,
    [st, st, body.reason || null, body.reviewerUserId || null, body.documentId]
  );

  // Descobre user_id e recalcula status agregado
  interface URow extends RowDataPacket { user_id: string; }
  const [r] = await pool.query<URow[]>(`SELECT user_id FROM kyc_documents WHERE id = ? LIMIT 1`, [body.documentId]);
  if (r.length) await recomputeUserKyc(r[0].user_id);

  return NextResponse.json({ ok: true });
}
