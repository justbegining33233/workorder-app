#!/usr/bin/env node
// Usage: DATABASE_URL=... node scripts/verify-login-cli.js --username <username> --password '<password>'
const argv = require('minimist')(process.argv.slice(2));
const username = argv.username || argv.u;
let password = argv.password || argv.p;
if (password !== undefined && password !== null) password = String(password);

if (!username || !password) {
  console.error('Usage: node scripts/verify-login-cli.js --username <username> --password <password>');
  process.exit(2);
}

(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const bcryptMod = await import('bcrypt');
    const bcrypt = (bcryptMod && (bcryptMod.default ?? bcryptMod));

    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      console.error('No admin found with username:', username);
      process.exit(1);
    }
    console.log('Found admin id:', admin.id);
    const stored = admin.password || '';
    console.log('Stored hash (preview):', stored.slice(0, 40) + '...');

    if (typeof password !== 'string') {
      console.error('Provided password is not a string');
      process.exit(2);
    }

    if (!stored) {
      console.error('No password hash stored for this admin');
      process.exit(2);
    }

    const ok = await bcrypt.compare(password, stored);
    console.log('Password match:', ok);
    process.exit(ok ? 0 : 1);
  } catch (err) {
    console.error('Error during verification:', err);
    process.exit(3);
  }
})();
