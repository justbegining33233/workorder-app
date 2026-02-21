#!/usr/bin/env node
require('dotenv').config();
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    dryRun: false,
    batchSize: 200,
    limit: Infinity,
    models: ['Admin', 'Tech', 'Shop', 'Customer'],
  };
  for (const a of args) {
    if (a === '--dry-run') opts.dryRun = true;
    if (a.startsWith('--batch-size=')) opts.batchSize = parseInt(a.split('=')[1], 10) || opts.batchSize;
    if (a.startsWith('--limit=')) opts.limit = parseInt(a.split('=')[1], 10) || opts.limit;
    if (a.startsWith('--models=')) opts.models = a.split('=')[1].split(',').map(s => s.trim()).filter(Boolean);
  }
  return opts;
}

async function ensureConnected() {
  try {
    await prisma.$connect();
    console.log('Connected to database.');
  } catch (err) {
    console.error('Failed to connect to database:', err.message || err);
    process.exit(2);
  }
}

function keyForModel(modelName) {
  // prisma client uses lowercased first letter for model accessors (admin, tech, etc.)
  return modelName.charAt(0).toLowerCase() + modelName.slice(1);
}

async function rehashModelBatched({ modelName, batchSize, limit, dryRun }) {
  console.log(`\nChecking ${modelName} for plaintext passwords (batch ${batchSize})...`);
  const modelKey = keyForModel(modelName);
  const modelClient = prisma[modelKey];
  if (!modelClient || typeof modelClient.findMany !== 'function') {
    console.warn(`  Skipping ${modelName}: model not found on Prisma client.`);
    return 0;
  }

  const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
  let updated = 0;
  let processed = 0;
  let cursor = undefined;
  let keepGoing = true;

  while (keepGoing && processed < limit) {
    const take = Math.min(batchSize, limit - processed);
    const findArgs = {
      where: { NOT: { password: { startsWith: '$2' } } },
      select: { id: true, password: true },
      take,
      orderBy: { id: 'asc' },
    };
    if (cursor !== undefined) {
      findArgs.cursor = { id: cursor };
      findArgs.skip = 1; // skip the cursor itself
    }

    const items = await modelClient.findMany(findArgs);
    if (!items.length) break;

    for (const item of items) {
      if (processed >= limit) {
        keepGoing = false;
        break;
      }
      processed++;
      try {
        const plain = item.password || '';
        const hash = await bcrypt.hash(plain, rounds);
        if (dryRun) {
          console.log(`  [dry-run] Would rehash ${modelName} id=${item.id}`);
        } else {
          try {
            await modelClient.update({ where: { id: item.id }, data: { password: hash } });
            updated++;
            console.log(`  Rehashed ${modelName} id=${item.id}`);
          } catch (uErr) {
            console.error(`  Failed to update ${modelName} id=${item.id}:`, uErr.message || uErr);
          }
        }
      } catch (err) {
        console.error(`  Failed to rehash ${modelName} id=${item.id}:`, err.message || err);
      }
    }

    cursor = items[items.length - 1].id;
    if (items.length < take) break;
  }

  console.log(`  Processed ${processed} ${modelName} record(s), updated ${updated}.`);
  return updated;
}

async function main() {
  try {
    const opts = parseArgs();
    if (!process.env.DATABASE_URL) {
      console.error('ERROR: DATABASE_URL is not set. Use -r dotenv/config or set env.');
      process.exit(1);
    }

    await ensureConnected();

    let total = 0;
    for (const modelName of opts.models) {
      try {
        const updated = await rehashModelBatched({ modelName, batchSize: opts.batchSize, limit: opts.limit, dryRun: opts.dryRun });
        total += updated;
      } catch (mErr) {
        console.error(`Error processing ${modelName}:`, mErr.message || mErr);
      }
    }

    console.log(`\nDone. Total rehashed: ${total}`);
  } catch (err) {
    console.error('Error running rehash script:', err);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
