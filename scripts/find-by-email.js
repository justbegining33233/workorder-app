const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  const email = process.argv[2] || 'joseruizvlla391@gmail.com';
  try {
    const customer = await p.customer.findUnique({ where: { email } });
    const shop = await p.shop.findFirst({ where: { email } });
    console.log('customer:', customer ? { id: customer.id, email: customer.email, username: customer.username, createdAt: customer.createdAt } : 'NOT FOUND');
    console.log('shop:', shop ? { id: shop.id, shopName: shop.shopName, email: shop.email, status: shop.status, username: shop.username, createdAt: shop.createdAt } : 'NOT FOUND');
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await p.$disconnect();
  }
})();