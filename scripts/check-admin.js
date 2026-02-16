const { PrismaClient } = require('@prisma/client');

(async function() {
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.admin.findUnique({ where: { username: 'admin1006' } });
    console.log('Admin record:', JSON.stringify(admin, null, 2));
  } catch (e) {
    console.error('Error querying admin:', e);
  } finally {
    await prisma.$disconnect();
  }
})();
