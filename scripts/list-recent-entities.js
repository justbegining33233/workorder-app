const { PrismaClient } = require('@prisma/client');
(async () => {
  const prisma = new PrismaClient();
  try {
    const shops = await prisma.shop.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });
    const customers = await prisma.customer.findMany({ orderBy: { createdAt: 'desc' }, take: 10 });

    console.log('--- recent shops ---');
    shops.forEach(s => console.log(`${s.id} | ${s.shopName} | ${s.email} | ${s.status} | ${s.createdAt}`));
    console.log('\n--- recent customers ---');
    customers.forEach(c => console.log(`${c.id} | ${c.email} | ${c.username} | ${c.createdAt}`));
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();