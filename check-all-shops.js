const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllShops() {
  try {
    // Get all shops regardless of status
    const allShops = await prisma.shop.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    
    console.log('\n=== ALL SHOPS IN DATABASE (Last 10) ===');
    console.log('Total shops found:', allShops.length);
    console.log('');
    
    if (allShops.length > 0) {
      allShops.forEach((shop, index) => {
        console.log(`${index + 1}. ${shop.shopName}`);
        console.log(`   Email: ${shop.email}`);
        console.log(`   Username: ${shop.username}`);
        console.log(`   Status: ${shop.status}`);
        console.log(`   ID: ${shop.id}`);
        console.log(`   Created: ${shop.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No shops found in the database.');
    }

    // Also check count by status
    const statusCounts = await prisma.shop.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('=== SHOPS BY STATUS ===');
    statusCounts.forEach(s => {
      console.log(`${s.status}: ${s._count} shops`);
    });

  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllShops();
