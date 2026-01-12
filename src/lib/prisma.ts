import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Lazy-initialize PrismaClient to avoid import-time throws if DATABASE_URL is missing.
 * This is particularly important for Vercel builds where env vars might not be present.
 */
export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl && process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production.");
  }

  const client = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

  // Cache the client globally to prevent connection pool exhaustion
  // in serverless environments (Vercel) where each request could create a new client
  globalForPrisma.prisma = client;

  return client;
}

export const prisma = getPrismaClient();
export default prisma;
