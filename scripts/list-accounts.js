const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const shops = await prisma.shop.findMany({ select: { id: true, username: true, email: true, status: true, shopName: true } });
    const admins = await prisma.admin.findMany({ select: { id: true, username: true, email: true } });
    const customers = await prisma.customer.findMany({ select: { id: true, email: true, username: true } });
    console.log('Shops:', shops);
    console.log('Admins:', admins);
    console.log('Customers:', customers);
  } catch (err) {
    console.error('Error listing accounts:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
