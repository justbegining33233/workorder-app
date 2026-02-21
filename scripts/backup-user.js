require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const id = process.argv[2];
if (!id) {
  console.error('Usage: node scripts/backup-user.js <id>');
  process.exit(2);
}

(async () => {
  const prisma = new PrismaClient();
  try {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      console.error('Customer not found:', id);
      process.exit(1);
    }
    const out = `./scripts/backups/customer-${id}.json`;
    fs.mkdirSync('./scripts/backups', { recursive: true });
    fs.writeFileSync(out, JSON.stringify(customer, null, 2));
    console.log('Backed up customer to', out);
  } catch (err) {
    console.error('Error backing up:', err);
    process.exit(3);
  } finally {
    await prisma.$disconnect();
  }
})();
