import { PrismaClient } from '@prisma/client';

// Fallback: set DATABASE_URL from a tracked source if not already provided.
// NOTE: this commits the production Neon connection string into the repo
// (you requested it to be stored where Git won't ignore it).
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://neondb_owner:npg_JxjuD0anSod6@ep-orange-silence-aichnpgk-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';
}

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
