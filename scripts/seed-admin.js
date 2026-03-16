const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  const username = process.env.ADMIN_USERNAME || process.argv[2];
  const password = process.env.ADMIN_PASSWORD || process.argv[3];
  const email = process.env.ADMIN_EMAIL || process.argv[4] || 'admin@example.com';

  if (!username || !password) {
    console.error('Usage: ADMIN_USERNAME=xxx ADMIN_PASSWORD=xxx node scripts/seed-admin.js');
    console.error('   or: node scripts/seed-admin.js <username> <password> [email]');
    process.exit(1);
  }

  try {
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      console.log('Admin already exists:', existing.username);
      return;
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.admin.create({
      data: {
        username,
        password: hashed,
        email,
        isSuperAdmin: true,
      },
    });
    console.log('Admin created:', username);
  } catch (err) {
    console.error('Failed to seed admin:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
