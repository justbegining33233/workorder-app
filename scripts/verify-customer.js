require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const id = process.argv[2];
const backupPath = `./scripts/backups/customer-${id}.json`;
if (!id) {
  console.error('Usage: node scripts/verify-customer.js <id>');
  process.exit(2);
}

(async () => {
  const prisma = new PrismaClient();
  try {
    const backup = fs.existsSync(backupPath) ? JSON.parse(fs.readFileSync(backupPath,'utf8')) : null;
    const plaintext = backup ? (backup.password || '') : null;
    if (!plaintext) console.warn('No plaintext found in backup (cannot verify without password)');

    await prisma.$connect();
    const user = await prisma.customer.findUnique({ where: { id } });
    if (!user) {
      console.error('Customer not found:', id);
      process.exit(1);
    }
    const stored = user.password || '';
    if (!stored) {
      console.error('No stored password hash for user');
      process.exit(2);
    }
    if (!plaintext) {
      console.log('Stored hash preview:', stored.slice(0,40) + '...');
      console.log('No plaintext available to verify hash; consider manual login test.');
      process.exit(0);
    }
    const ok = await bcrypt.compare(plaintext, stored);
    console.log('Verification using backup plaintext:', ok);
    process.exit(ok ? 0 : 1);
  } catch (err) {
    console.error('Error verifying customer:', err);
    process.exit(3);
  } finally {
    await prisma.$disconnect();
  }
})();
