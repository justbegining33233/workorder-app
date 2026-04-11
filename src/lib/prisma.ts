import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { encryptField, isEncrypted } from './encryption';

// Lazy Prisma initialization — do NOT throw at module import time.
// If DATABASE_URL is missing the exported object is a Proxy that throws only
// when a database method is actually called at runtime. This prevents the
// Next.js build from failing during module collection when the env var is not
// yet available (e.g. on Vercel where DATABASE_URL is injected at runtime).

type GlobalForPrisma = typeof global & { prisma?: PrismaClient };
const globalForPrisma = global as GlobalForPrisma;

function buildClient(): PrismaClient {
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

      async function maybeHash(obj: any) {
        if (!obj || typeof obj !== 'object') return;

        // Only auto-hash the `password` field.
        // Fields like tokenHash, refreshTokenHash, ipHash etc. are
        // already hashed by the calling code (SHA256 or bcrypt) before
        // being passed to Prisma — double-hashing them would break lookups.
        const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

        for (const key of Object.keys(obj)) {
          const val = obj[key];
          if (typeof val !== 'string' || !val) continue;

          // Auto-hash passwords
          if (key.toLowerCase() === 'password') {
            if (val.startsWith('$2')) continue; // already bcrypt-hashed, skip
            obj[key] = await bcrypt.hash(val, rounds);
            continue;
          }

          // Auto-encrypt bankAccountInfo
          if (key === 'bankAccountInfo') {
            if (isEncrypted(val)) continue; // already encrypted, skip
            try {
              obj[key] = encryptField(val);
            } catch {
              // If encryption key is not set, skip (dev mode without TOTP_ENCRYPTION_KEY)
            }
          }
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

  return client;
}

function getOrCreateClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    if (!process.env.DATABASE_URL) {
      // Return a proxy that throws a descriptive error only when a DB method
      // is actually invoked. This keeps the Next.js build from failing when
      // DATABASE_URL is set as a runtime-only variable (common on Vercel).
      return new Proxy({} as PrismaClient, {
        get(_target, prop) {
          throw new Error(
            `DATABASE_URL is not set. Cannot call prisma.${String(prop)}().\n` +
            'Set DATABASE_URL in your .env.local for local development or in your hosting provider (Vercel) for deploys.'
          );
        },
      });
    }
    globalForPrisma.prisma = buildClient();
  }
  return globalForPrisma.prisma!;
}

// Use a module-level Proxy so that the real client is only initialised on first
// use (deferred until runtime), not at import / build time.
const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getOrCreateClient(), prop, receiver);
  },
});

export { prisma };
export default prisma;
