import { PrismaClient } from '@prisma/client';

// IMPORTANT: do NOT commit production credentials.
// `DATABASE_URL` must be supplied via environment variables (e.g. `.env.local` for dev
// and your host provider's env settings for production). This prevents secrets from
// being stored in source control.
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required. Set it in .env.local or your deployment environment.');
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
