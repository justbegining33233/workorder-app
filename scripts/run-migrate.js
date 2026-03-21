const { execSync } = require('child_process');
const fs = require('fs');

const lines = fs.readFileSync('.env.local', 'utf8').split('\n');
const env = { ...process.env };

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const idx = trimmed.indexOf('=');
  if (idx < 0) continue;
  const key = trimmed.slice(0, idx).trim();
  let val = trimmed.slice(idx + 1).trim();
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

console.log('DB:', env.DATABASE_URL ? env.DATABASE_URL.substring(0, 40) + '...' : 'NOT SET');
execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', env });
