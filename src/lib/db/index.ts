import { neon } from '@neondatabase/serverless';
import { drizzle, NeonHttpDatabase } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Lazy-initialize db to avoid build-time errors when DATABASE_URL is missing
let dbInstance: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (!dbInstance) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    const sql = neon(databaseUrl);
    dbInstance = drizzle(sql, { schema });
  }
  return dbInstance;
}

// For backward compatibility, export db as a getter that lazy-initializes
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    return (getDb() as any)[prop];
  }
});
