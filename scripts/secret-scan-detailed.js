#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function getStagedFiles() {
  return execSync('git diff --cached --name-only', { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
}

const patterns = [
  { name: 'DATABASE_URL', re: /DATABASE_URL/i },
  { name: 'postgresql', re: /postgresql:\/\//i },
  { name: 'PGPASSWORD', re: /PGPASSWORD/i },
  { name: 'neon.tech', re: /neon\.tech/i },
  { name: 'aws.neon.tech', re: /aws\.neon\.tech/i },
  { name: 'password_literal', re: /password\s*=\s*['"][^'\"]+['"]/i },
  { name: 'secret_literal', re: /secret\s*=\s*['"][^'\"]+['"]/i },
  { name: 'api_key_literal', re: /api[_-]?key\s*=\s*['"][^'\"]+['"]/i }
];

const staged = getStagedFiles();
let found = false;

for (const rel of staged) {
  const p = path.resolve(process.cwd(), rel);
  if (!fs.existsSync(p)) continue;
  let content;
  try {
    content = fs.readFileSync(p, 'utf8');
  } catch (e) {
    continue;
  }
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pat of patterns) {
      if (pat.re.test(line)) {
        if (!found) {
          console.error('\nDetailed secret scan results:');
          found = true;
        }
        console.error(`${rel}:${i + 1}: [${pat.name}] ${line.trim()}`);
      }
    }
  }
}

if (!found) {
  console.error('\nNo matches found.');
  process.exit(0);
} else {
  process.exit(1);
}
