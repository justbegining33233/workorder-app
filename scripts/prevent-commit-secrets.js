#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getStagedFiles() {
  return execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
}

// Only flag strong credential patterns: explicit DB URLs or direct assignments.
const patterns = [
  /postgresql:\/\/[^\s'\"]+/i, // explicit Postgres URL with credentials
  /DATABASE_URL\s*=\s*['"][^'\"]+['"]/i, // direct assignment of DATABASE_URL
  /PGPASSWORD\s*=\s*['"][^'\"]+['"]/i,
  /password\s*=\s*['"][^'\"]+['"]/i,
  /secret\s*=\s*['"][^'\"]+['"]/i,
  /api[_-]?key\s*=\s*['"][^'\"]+['"]/i
];

function isBinary(filePath) {
  try {
    const buf = fs.readFileSync(filePath, { encoding: 'utf8' });
    return false;
  } catch (e) {
    return true;
  }
}

const staged = getStagedFiles();
const offenders = [];

for (const rel of staged) {
  const p = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(p) || isBinary(p)) continue;
  const content = fs.readFileSync(p, { encoding: 'utf8' });
  // Scan by line to give more targeted feedback and avoid false-positives
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const re of patterns) {
      if (re.test(line)) {
        // Treat env("DATABASE_URL") as safe - it's an env reference, not a secret
        if (/env\(\s*['\"]DATABASE_URL['\"]\s*\)/i.test(line)) continue;
        offenders.push({ file: rel, pattern: re.toString(), line: i + 1, text: line.trim() });
      }
    }
  }
}

if (offenders.length) {
  console.error('\nERROR: Commit blocked — possible secrets detected in staged files:');
  offenders.forEach(o => console.error(` - ${o.file}  (${o.pattern})`));
  console.error('\nRemove secrets or move them to an env file and ensure .env* is in .gitignore.');
  process.exit(1);
}

process.exit(0);
