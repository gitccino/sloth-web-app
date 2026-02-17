import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import {
  // drizzle as neonDrizzle,
  NeonDatabase,
} from "drizzle-orm/neon-serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-http";
// import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import { Pool } from "pg";
import { Pool as neonPool, neon, neonConfig } from "@neondatabase/serverless";
import * as ws from "ws";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

let dbClient:
  | ReturnType<typeof drizzle<typeof schema>>
  | ReturnType<typeof neonDrizzle<typeof schema>>;
// let dbClient:
//   | (NodePgDatabase<typeof schema> & {
//       $client: Pool;
//     })
//   | NeonDatabase<typeof schema>;

const getDbConnection = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in environment variables");
  }

  if (!dbClient && process.env.APP_ENV === "production") {
    // NEON
    // const neonPoolInstance = new neonPool({
    //   connectionString: process.env.DATABASE_URL!,
    // });
    const neonPoolInstance = neon(process.env.DATABASE_URL!);
    dbClient = neonDrizzle({ client: neonPoolInstance });
  }

  if (!dbClient && process.env.APP_ENV === "development") {
    // PG
    dbClient = drizzle({ client: pool });
  }

  return dbClient;
};

// For development
export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = getDbConnection();
