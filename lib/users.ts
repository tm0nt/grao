// ./lib/users.ts
import pool from '@/lib/db';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';

export type User = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
};

type UserRow = RowDataPacket & {
  id: string;
  email: string;
  name: string;
  password_hash: string;
};

export async function getUserByEmail(email: string): Promise<User | null> {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, email, name, password_hash FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  if (Array.isArray(rows) && rows.length > 0) {
    const u = rows[0];
    return {
      id: String(u.id),
      email: String(u.email),
      name: String(u.name),
      password_hash: String(u.password_hash),
    };
  }
  return null;
}

export async function emailExists(email: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT 1 AS ok FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return Array.isArray(rows) && rows.length > 0;
}

export async function createUser(params: {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  cpf?: string | null;
  referral_code: string;
}) {
  const { id, email, name, password_hash, cpf, referral_code } = params;
  const [res] = await pool.query<ResultSetHeader>(
    `INSERT INTO users (id, email, password_hash, name, cpf, referral_code)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, email, password_hash, name, cpf ?? null, referral_code]
  );
  return res.affectedRows === 1;
}
