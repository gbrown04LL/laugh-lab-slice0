import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Lazy-initialize PrismaClient to avoid import-time throws if DATABASE_URL is missing.
 * This is particularly important for Vercel builds where env vars might not be present.
 *
 * Uses a Proxy to defer initialization until the client is actually used at runtime.
 */
function createLazyPrismaClient(): PrismaClient {
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

  // Cache in global to avoid multiple instances in development
  globalForPrisma.prisma = client;

  return client;
}

/**
 * Lazy Prisma client that defers initialization until first property access.
 * This ensures the client is only created at runtime, not during Vercel builds.
 */
const prismaProxy = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = createLazyPrismaClient();
    return (client as any)[prop];
  },
});

export const prisma = prismaProxy;
export default prisma;
