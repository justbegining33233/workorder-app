#!/usr/bin/env node
require('dotenv').config();
const argv = require('minimist')(process.argv.slice(2));
const username = argv.username || argv.u;
let password = argv.password || argv.p;
if (!username) {
  console.error('Usage: node scripts/reset-admin-pass.js --username <username> --password <password>');
  process.exit(2);
}
(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const bcryptMod = await import('bcrypt');
    const bcrypt = (bcryptMod && (bcryptMod.default ?? bcryptMod));

    if (!password) {
      // generate a random password if not provided
      const crypto = require('crypto');
      password = crypto.randomBytes(12).toString('base64').replace(/\/+|=|\+/g, 'A').slice(0, 16);
      console.log('Generated password:', password);
    }

    const hashed = await bcrypt.hash(String(password), 12);

    const existing = await prisma.admin.findUnique({ where: { username } });
    if (!existing) {
      console.error('No admin found with username:', username);
      process.exit(1);
    }

    await prisma.admin.update({ where: { username }, data: { password: hashed } });
    console.log('Updated password for', username);
    await prisma.$disconnect();
    // print the password so the operator can copy it
    console.log('New password:', password);
    process.exit(0);
  } catch (err) {
    console.error('Error resetting admin password:', err && (err.message || err));
    process.exit(3);
  }
})();
