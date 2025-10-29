// app/api/account/avatar/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import type { ResultSetHeader } from "mysql2/promise";
import fs from "fs/promises";
import path from "path";

export const runtime = "nodejs";

function inferExtFromMime(mime: string | null): string {
  if (!mime) return ".png";
  if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
  if (mime.includes("png")) return ".png";
  if (mime.includes("webp")) return ".webp";
  return ".png";
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function writeBufferToAvatar(userId: string, buf: Buffer, ext = ".png") {
  const dir = path.join(process.cwd(), "public", userId);
  await ensureDir(dir);
  const filePath = path.join(dir, `avatar${ext}`);
  await fs.writeFile(filePath, buf);
  // URL pública servida por Next para arquivos em /public
  const publicPath = `/${userId}/avatar${ext}`;
  return publicPath;
}

export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as any)?.id as string | undefined;
  if (!userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const contentType = req.headers.get("content-type") || "";
  let savedPath: string | null = null;

  try {
    if (contentType.includes("multipart/form-data")) {
      // upload via FormData: file
      const form = await req.formData();
      const file = form.get("file") as File | null;
      if (!file) return NextResponse.json({ error: "Arquivo não enviado (file)" }, { status: 400 });

      const arrayBuf = await file.arrayBuffer();
      const buf = Buffer.from(arrayBuf);
      const ext = inferExtFromMime(file.type || "");
      savedPath = await writeBufferToAvatar(userId, buf, ext);
    } else {
      // JSON com { avatar: "<dataURL|base64>" }
      const body = await req.json().catch(() => ({}));
      const avatarStr = typeof body?.avatar === "string" ? body.avatar : "";
      if (!avatarStr) return NextResponse.json({ error: "Campo 'avatar' inválido" }, { status: 400 });

      let buf: Buffer;
      let ext = ".png";

      // Data URL: data:image/png;base64,xxxx
      if (avatarStr.startsWith("data:")) {
        const match = avatarStr.match(/^data:([^;]+);base64,(.*)$/);
        if (!match) return NextResponse.json({ error: "Data URL inválida" }, { status: 400 });
        const mime = match[1] || "image/png";
        const b64 = match[2] || "";
        buf = Buffer.from(b64, "base64");
        ext = inferExtFromMime(mime);
      } else {
        // base64 “puro”
        try {
          buf = Buffer.from(avatarStr, "base64");
        } catch {
          return NextResponse.json({ error: "Base64 inválido" }, { status: 400 });
        }
      }

      savedPath = await writeBufferToAvatar(userId, buf, ext);
    }

    // Persiste apenas o path (ex.: /<userId>/avatar.png)
    await pool.query<ResultSetHeader>(
      `UPDATE users SET avatar = ?, updated_at = NOW() WHERE id = ?`,
      [savedPath, userId]
    );

    // Retorna apenas o path como solicitado
    return NextResponse.json({ ok: true, avatar: savedPath });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Falha ao salvar avatar" }, { status: 500 });
  }
}
