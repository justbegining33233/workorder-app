const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testShopLogin() {
  try {
    console.log('Testing shop login for username: Ras');

    const shop = await prisma.shop.findFirst({
      where: {
        OR: [
          { username: 'Ras' },
          { email: 'Ras' },
          { shopName: 'Ras' },
        ],
        status: 'approved'
      }
    });

    if (!shop) {
      console.log('❌ Shop not found');
      return;
    }

    console.log('✅ Shop found:', {
      id: shop.id,
      username: shop.username,
      shopName: shop.shopName,
      email: shop.email,
      status: shop.status,
      hasPassword: !!shop.password
    });

    if (!shop.password) {
      console.log('❌ No password set');
      return;
    }

    const isValid = await bcrypt.compare('password123', shop.password);
    console.log('🔐 Password valid:', isValid);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testShopLogin();