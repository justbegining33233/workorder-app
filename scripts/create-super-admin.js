const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const email = process.env.ADMIN_EMAIL || process.argv[4] || 'admin@workorder.local';
  const isSuperAdmin = true;

  if (!username || !password) {
    console.error('Usage: ADMIN_USERNAME=xxx ADMIN_PASSWORD=xxx node scripts/create-super-admin.js');
    console.error('   or: node scripts/create-super-admin.js <username> <password> [email]');
    process.exit(1);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.log('Admin user already exists:', username);
    return;
  }

  const admin = await prisma.admin.create({
    data: {
      username,
      password: hashedPassword,
      email,
      isSuperAdmin,
    },
  });
  console.log('Super admin created:', admin);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
