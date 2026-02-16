const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const rows = await prisma.$queryRaw`SELECT current_database() AS db, current_user AS usr, inet_server_addr() AS server_addr, version() AS ver`;
    console.log('DB info:', rows);
  } catch (err) {
    console.error('Error fetching DB info:', err);
  } finally {
    await prisma.$disconnect();
  }
})();