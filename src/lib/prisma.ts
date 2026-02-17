import { PrismaClient } from '@prisma/client';

// Lazy Prisma initialization --- do NOT throw at module import time.
// If DATABASE_URL is missing the exported object is a proxy that throws only
// when a method/property is accessed at runtime. This prevents Next.js build
// from failing during module collection when env vars are not yet provided.

type GlobalForPrisma = typeof global & { prisma?: PrismaClient };
const globalForPrisma = global as GlobalForPrisma;

function createPrisma(): PrismaClient {
  // Enforce DATABASE_URL (Neon/Postgres) only — do not fall back to SQLite or
  // an in-memory stub. Fail fast with a clear error if the env is missing.
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is required and must point to your Neon PostgreSQL database.\n' +
      'Set DATABASE_URL in your .env.local (for local dev) or in your hosting provider (Vercel).' 
    );
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  }
  return globalForPrisma.prisma!;
}

const prisma = createPrisma();

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) globalForPrisma.prisma = prisma;

export { prisma };
export default prisma;
