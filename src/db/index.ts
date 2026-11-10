import "server-only";
import path from "node:path";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { migrate as migratePg } from "drizzle-orm/postgres-js/migrator";
import { drizzle as drizzleLite } from "drizzle-orm/pglite";
import { migrate as migrateLite } from "drizzle-orm/pglite/migrator";
import { PGlite } from "@electric-sql/pglite";
import postgres from "postgres";
import * as schema from "./schema";
import { seedRooms } from "./seed";

type DB = ReturnType<typeof drizzlePg<typeof schema>>;

const globalForDb = globalThis as unknown as { __db?: Promise<DB> };
const migrationsFolder = path.join(process.cwd(), "drizzle");

async function create(): Promise<DB> {
  const url = process.env.DATABASE_URL;
  let db: DB;
  if (url) {
    const client = postgres(url, { max: 5, prepare: false });
    db = drizzlePg(client, { schema });
    if (process.env.AUTO_MIGRATE === "true") await migratePg(db, { migrationsFolder });
  } else {
    // Local dev without Postgres: embedded PGlite stored in ./.pglite
    const lite = drizzleLite(new PGlite(path.join(process.cwd(), ".pglite")), { schema });
    await migrateLite(lite, { migrationsFolder });
    db = lite as unknown as DB;
  }
  await seedRooms(db);
  return db;
}

export function getDb(): Promise<DB> {
  if (!globalForDb.__db) {
    globalForDb.__db = create().catch((e) => {
      globalForDb.__db = undefined;
      throw e;
    });
  }
  return globalForDb.__db;
}

export { schema };
