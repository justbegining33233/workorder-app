import { PrismaClient } from '@prisma/client';

// IMPORTANT: do not hardcode DATABASE_URL here. Development should use `.env.local`
// and production should set DATABASE_URL via environment variables. The previous
// hard-coded Neon fallback has been removed so local dev can use a separate test
// database (e.g. local Postgres) and Neon remains inert unless explicitly used.

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
