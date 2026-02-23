const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  const username = 'admin1006';
  const password = 'SupAdm1006';
  const email = 'admin@example.com';

  try {
    const hashed = await bcrypt.hash(password, 12);
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      await prisma.admin.update({ where: { username }, data: { password: hashed, isSuperAdmin: true } });
      console.log('Admin password updated:', username);
    } else {
      await prisma.admin.create({
        data: {
          username,
          password: hashed,
          email,
          isSuperAdmin: true,
        },
      });
      console.log('Admin created:', username);
    }
    console.log('Login with username:', username);
  } catch (err) {
    console.error('Failed to seed admin:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
