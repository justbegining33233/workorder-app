import { PrismaClient } from '@prisma/client';

// Lazy Prisma initialization --- do NOT throw at module import time.
// If DATABASE_URL is missing the exported object is a proxy that throws only
// when a method/property is accessed at runtime. This prevents Next.js build
// from failing during module collection when env vars are not yet provided.

type GlobalForPrisma = typeof global & { prisma?: PrismaClient };
const globalForPrisma = global as GlobalForPrisma;

function createPrisma(): PrismaClient {
  if (!process.env.DATABASE_URL) {
    // Return a lightweight stub that *looks like* a Prisma client so Turbopack
    // can inspect properties without triggering errors at import time. Methods
    // return safe defaults (counts => 0, findMany => [], findUnique => null).
    const modelHandler: ProxyHandler<any> = {
      get(_target, prop) {
        // Return async functions for typical model methods
        if (typeof prop === 'string') {
          if (prop === 'count') return async () => 0;
          if (prop === 'findMany') return async () => [];
          if (prop === 'findUnique') return async () => null;
          if (prop === 'findFirst') return async () => null;
          if (prop === 'create') return async () => ({});
          if (prop === 'update') return async () => ({});
          if (prop === 'delete') return async () => ({});
          if (prop === 'groupBy') return async () => [];
          // Generic fallback for other methods
          return async () => {
            throw new Error('Prisma stub: DATABASE_URL not configured');
          };
        }
        return undefined;
      }
    };

    const fakeModel = new Proxy({}, modelHandler);

    const handler: ProxyHandler<any> = {
      get(_target, prop) {
        // Avoid being treated as a Promise
        if (prop === 'then') return undefined;
        // Expose commonly-used Prisma client helpers as no-ops
        if (prop === '$connect') return async () => {};
        if (prop === '$disconnect') return async () => {};
        if (prop === '$queryRaw') return async () => [];
        if (prop === '$executeRaw') return async () => 0;
        // Any model access returns the fakeModel proxy
        return fakeModel;
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
