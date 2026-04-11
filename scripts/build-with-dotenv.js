#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });
const { spawnSync } = require('child_process');

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set in .env.local');
  process.exit(1);
}

console.log('Loaded DATABASE_URL from .env.local (hidden)');

function run(cmd, args) {
  console.log(`\nRunning: ${cmd} ${args.join(' ')}`);
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: true });
  if (res.status !== 0) {
    process.exit(res.status || 1);
  }
}

// Optionally run any pre-check script
try {
  run('node', ['./scripts/check-database.js']);
} catch (e) {
  // check-database.js may exit non-zero; bubble up
}

run('npx', ['prisma', 'generate']);
run('npx', ['next', 'build']);
