require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const shops = await prisma.shop.findMany({ select: { id: true, username: true, email: true, status: true, shopName: true } });
    const admins = await prisma.admin.findMany({ select: { id: true, username: true, email: true } });
    const techs = await prisma.tech.findMany({ select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, shopId: true } });
    const customers = await prisma.customer.findMany({ select: { id: true, email: true, username: true } });
    console.log({ shops, admins, techs, customers });
  } catch (err) {
    console.error('Error dumping users:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
