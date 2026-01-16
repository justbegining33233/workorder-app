const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkShop() {
  try {
    const shop = await prisma.shop.findFirst({
      where: { shopName: 'Ruben auto shop' }
    });

    if (shop) {
      console.log('Shop details:');
      console.log(` - ID: ${shop.id}`);
      console.log(` - Name: ${shop.shopName}`);
      console.log(` - Username: ${shop.username}`);
      console.log(` - Email: ${shop.email}`);
      console.log(` - Status: ${shop.status}`);
      console.log(` - Password set: ${shop.password ? 'Yes' : 'No'}`);
      console.log(` - Password length: ${shop.password ? shop.password.length : 0}`);
    } else {
      console.log('Shop not found');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShop();