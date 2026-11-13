import { createClient } from "@libsql/client";
if (process.env.RENDER && !process.env.TURSO_DATABASE_URL)
  throw Error("Configura TURSO_DATABASE_URL para conservar las cuentas.");
export const db = createClient({
  url:
    process.env.TURSO_DATABASE_URL ||
    "file:" + (process.env.VERA_DB || "vera.sqlite"),
  authToken: process.env.TURSO_AUTH_TOKEN,
});
export const rows = async (sql, ...args) =>
  (await db.execute({ sql, args })).rows;
await db.batch(
  [
    "CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE,salt TEXT,hash TEXT)",
    "CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,uid TEXT,expires INTEGER)",
    "CREATE TABLE IF NOT EXISTS quota(uid TEXT,day TEXT,n INTEGER,PRIMARY KEY(uid,day))",
    "CREATE TABLE IF NOT EXISTS notices(uid TEXT PRIMARY KEY,version TEXT,accepted INTEGER)",
    "CREATE TABLE IF NOT EXISTS deals(id TEXT PRIMARY KEY,direction TEXT,company TEXT,catalog TEXT,stage TEXT,price REAL,created TEXT)",
  ],
  "write",
);
