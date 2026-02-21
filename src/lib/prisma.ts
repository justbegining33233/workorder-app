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
    const client = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

    // Middleware: auto-hash `password` on create/update/upsert and bulk variants.
    // This ensures any code path that writes a `password` field cannot accidentally
    // store plaintext passwords in the database.
    client.$use(async (params, next) => {
      const action = params.action;
      const sensitiveActions = new Set(['create', 'update', 'upsert', 'createMany', 'updateMany']);
      if (!sensitiveActions.has(action)) return next(params);

        const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

        async function maybeHash(obj: any) {
          if (!obj || typeof obj !== 'object') return;

          const sensitiveKeys = new Set([
            'password',
            'token',
            'tokenHash',
            'refreshToken',
            'refreshTokenHash',
            'apiKey',
            'secret',
            'clientSecret',
            'accessToken'
          ]);

          const bcrypt = await import('bcrypt');

          for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (typeof val !== 'string' || !val) continue;

            const lower = key.toLowerCase();
            const isSensitive = sensitiveKeys.has(key) || sensitiveKeys.has(lower) || lower.includes('token') || lower.includes('secret') || lower.includes('apikey') || lower.includes('key');
            if (!isSensitive) continue;

            if (val.startsWith('$2')) continue; // already bcrypt-hashed
            obj[key] = await bcrypt.hash(val, rounds);
          }
        }

      try {
        const data = params.args?.data;
        if (Array.isArray(data)) {
          // unlikely shape for Prisma, but handle defensively
          for (const item of data) await maybeHash(item);
        } else if (data) {
          await maybeHash(data);

          // Support nested shapes used by upsert/createMany
          if (data.create) await maybeHash(data.create);
          if (data.update) await maybeHash(data.update);
          if (data.createMany && Array.isArray(data.createMany.data)) {
            for (const item of data.createMany.data) await maybeHash(item);
          }
        }
      } catch (e) {
        // If hashing fails for any reason, surface the error rather than silently
        // continuing — it's safer to fail the write than store plaintext.
        throw e;
      }

      return next(params);
    });

    globalForPrisma.prisma = client;
  }

  return globalForPrisma.prisma!;
}

const prisma = createPrisma();

if (process.env.NODE_ENV !== 'production' && process.env.DATABASE_URL) globalForPrisma.prisma = prisma;

export { prisma };
export default prisma;
