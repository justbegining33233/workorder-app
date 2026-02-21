#!/usr/bin/env node
/**
 * Runs `prisma generate` with a guaranteed-valid DATABASE_URL.
 *
 * Prisma validates that the datasource URL env var exists before generating
 * the client, even though no actual database connection is made. This is a
 * problem on Vercel (and in CI) where DATABASE_URL is injected at runtime but
 * is not available during the build step.
 *
 * If DATABASE_URL is already set we use it as-is.  If it is missing we
 * substitute a syntactically-valid placeholder so that `prisma generate` can
 * proceed and emit the TypeScript client code.  The placeholder is never used
 * at runtime — the real URL is always available when the app actually runs.
 */
const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const env = { ...process.env };

if (!env.DATABASE_URL) {
  // Valid PostgreSQL URL — prisma only checks the format, no connection made
  env.DATABASE_URL = 'postgresql://placeholder:placeholder@localhost:5432/placeholder';
  console.log('[prisma-safe-generate] DATABASE_URL not set — using placeholder for generate step.');
} else {
  console.log('[prisma-safe-generate] DATABASE_URL found — using real URL.');
}

// Prefer the locally-installed prisma binary (placed in node_modules/.bin by
// `npm install`) over whatever global version `npx` might resolve to, ensuring
// we always run the prisma version that matches the project's package.json.
// Resolve from the project root (cwd) so this script can be run from any
// working directory.
const localPrisma = path.resolve(process.cwd(), 'node_modules', '.bin', 'prisma');
const [cmd, args] = fs.existsSync(localPrisma)
  ? [localPrisma, ['generate']]
  : ['npx', ['prisma', 'generate']];

const result = spawnSync(cmd, args, {
  stdio: 'inherit',
  env,
  shell: process.platform === 'win32', // shell needed on Windows for .cmd wrappers
});

// Propagate the child exit code; if spawnSync itself failed (result.status is
// null), exit non-zero so the build fails visibly rather than silently.
if (result.error) {
  console.error('[prisma-safe-generate] Failed to run prisma generate:', result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
