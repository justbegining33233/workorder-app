const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const shop = await prisma.shop.findUnique({ where: { username: 'testshop' } });
    if (!shop) {
      console.log('testshop not found');
      return;
    }
    const services = await prisma.shopService.findMany({ where: { shopId: shop.id } });
    console.log('shop id', shop.id, 'services count', services.length);
    services.forEach(s => console.log('-', s.serviceName, s.category));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
})();