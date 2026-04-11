const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.admin.findUnique({ where: { username: 'admin1006' } });
    console.log('admin found?', !!admin);
    if (admin) {
      console.log('pwd hash length', admin.password ? admin.password.length : 'no password');
      const ok = await bcrypt.compare('10062001', admin.password);
      console.log('password match:', ok);
    }
  } catch (err) {
    console.error('error checking admin pw:', err);
  } finally {
    await prisma.$disconnect();
  }
})();