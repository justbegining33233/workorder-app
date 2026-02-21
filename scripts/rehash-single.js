require('dotenv').config({ path: '.env.local' });
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const id = process.argv[2];
if (!id) {
  console.error('Usage: node scripts/rehash-single.js <id>');
  process.exit(2);
}

(async () => {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const user = await prisma.customer.findUnique({ where: { id } });
    if (!user) {
      console.error('Customer not found:', id);
      process.exit(1);
    }
    const pw = user.password || '';
    if (!pw) {
      console.error('No password to rehash for', id);
      process.exit(2);
    }
    if (pw.startsWith('$2') || pw.startsWith('$argon')) {
      console.log('Password already hashed for', id);
      process.exit(0);
    }
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const hash = await bcrypt.hash(pw, rounds);
    await prisma.customer.update({ where: { id }, data: { password: hash } });
    console.log('Rehashed and updated customer', id);
  } catch (err) {
    console.error('Error rehashing single:', err);
    process.exit(3);
  } finally {
    await prisma.$disconnect();
  }
})();
