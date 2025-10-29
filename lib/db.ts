// ./lib/db.ts
import mysql, { Pool } from 'mysql2/promise';

declare global {
  // Evita múltiplas instâncias em dev (hot reload)
  // eslint-disable-next-line no-var
  var mysqlPool: Pool | undefined;
}

const pool = global.mysqlPool ?? mysql.createPool({
  host: process.env.MYSQL_HOST ?? '127.0.0.1',
  port: Number(process.env.MYSQL_PORT ?? 3306),
  user: process.env.MYSQL_USER ?? 'root',
  password: process.env.MYSQL_PASSWORD ?? 'flamengo10',
  database: process.env.MYSQL_DATABASE ?? 'grao',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
});

if (process.env.NODE_ENV !== 'production') global.mysqlPool = pool;

export default pool;
