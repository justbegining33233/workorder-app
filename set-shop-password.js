const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setShopPassword() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    const updatedShop = await prisma.shop.update({
      where: { username: 'Ras' },
      data: { password: hashedPassword }
    });

    console.log('✅ Password updated for shop:', updatedShop.shopName);
    console.log('   Username: Ras');
    console.log('   Password: password123');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setShopPassword();