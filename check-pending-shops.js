const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPendingShops() {
  try {
    const shops = await prisma.shop.findMany({
      where: { status: 'pending' }
    });
    
    console.log('\n=== PENDING SHOPS IN DATABASE ===');
    console.log('Total pending shops:', shops.length);
    console.log('');
    
    if (shops.length > 0) {
      shops.forEach((shop, index) => {
        console.log(`${index + 1}. ${shop.shopName}`);
        console.log(`   Email: ${shop.email}`);
        console.log(`   Phone: ${shop.phone}`);
        console.log(`   Location: ${shop.city}, ${shop.state}`);
        console.log(`   Status: ${shop.status}`);
        console.log(`   ID: ${shop.id}`);
        console.log(`   Created: ${shop.createdAt}`);
        console.log('');
      });
    } else {
      console.log('❌ No pending shops found in the database.');
    }
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPendingShops();
