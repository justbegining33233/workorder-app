const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const shops = await prisma.shop.findMany({ 
    orderBy: { createdAt: 'desc' }
  });
  console.log(`\n📊 Total shops in database: ${shops.length}\n`);
  for (const s of shops) {
    console.log(`✅ ${s.shopName}`);
    console.log(`   ID: ${s.id}`);
    console.log(`   Email: ${s.email}`);
    console.log(`   Status: ${s.status}`);
    console.log(`   Username: ${s.username}`);
    console.log(`   Created: ${s.createdAt}`);
    console.log('');
  }
  await prisma.$disconnect();
  process.exit(0);
})();
