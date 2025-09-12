import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// For development without database, use a mock connection
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://mock:mock@localhost:5432/mock';

if (!process.env.DATABASE_URL) {
  console.warn("⚠️  DATABASE_URL not set. Using mock database for frontend development.");
  console.warn("⚠️  Database operations will fail, but frontend will work.");
}

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });