import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Lazy-initialize PrismaClient with the Prisma 7 driver adapter pattern.
 * Uses PrismaPg adapter for PostgreSQL connections.
 */
export function getPrismaClient(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString && process.env.NODE_ENV === "production") {
    throw new Error("DATABASE_URL is required in production.");
  }

  // Create the PrismaPg adapter with connection string
  const adapter = new PrismaPg({ connectionString: connectionString ?? "" });

  const client = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
  }

  return client;
}

export const prisma = getPrismaClient();
export default prisma;
