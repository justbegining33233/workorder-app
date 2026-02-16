import { PrismaClient } from '@prisma/client';

// Lazy Prisma initialization --- do NOT throw at module import time.
// If DATABASE_URL is missing the exported object is a proxy that throws only
// when a method/property is accessed at runtime. This prevents Next.js build
// from failing during module collection when env vars are not yet provided.

type GlobalForPrisma = typeof global & { prisma?: PrismaClient };
const globalForPrisma = global as GlobalForPrisma;

function createPrisma(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Return a proxy that throws with a clear message when used.
    const handler: ProxyHandler<object> = {
      get() {
        throw new Error('Prisma client not initialized: DATABASE_URL is not set. Set DATABASE_URL in your environment.');
      },
      apply() {
        throw new Error('Prisma client not initialized: DATABASE_URL is not set.');
      }
    };
    return new Proxy({}, handler) as unknown as PrismaClient;
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

export default prisma;
