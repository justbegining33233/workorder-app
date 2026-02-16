const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  const username = 'admin1006';
  const password = '10062001';
  const email = 'admin@example.com';

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
    console.log('Admin created:', username, 'password:', password);
  } catch (err) {
    console.error('Failed to seed admin:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
