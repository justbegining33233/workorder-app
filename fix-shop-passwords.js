const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixShopPasswords() {
  try {
    console.log('\n🔧 Fixing shop passwords...\n');

    // Get the approved shop without password
    const shops = await prisma.shop.findMany({
      where: {
        status: 'approved',
      },
    });

    const shopsWithoutPassword = shops.filter(shop => !shop.password || shop.password === '');

    if (shopsWithoutPassword.length === 0) {
      console.log('✅ All approved shops have passwords');
      return;
    }

    console.log(`Found ${shopsWithoutPassword.length} approved shop(s) without passwords:\n`);

    for (const shop of shopsWithoutPassword) {
      console.log(`Shop: ${shop.shopName} (ID: ${shop.id})`);
      console.log(`  Email: ${shop.email}`);
      console.log(`  Username: ${shop.username}`);
      
      // Set a default password
      const defaultPassword = 'Password123!';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      // Update the shop
      await prisma.shop.update({
        where: { id: shop.id },
        data: {
          password: hashedPassword,
        },
      });
      
      console.log(`  ✅ Password set to: ${defaultPassword}`);
      console.log(`  Note: Shop can now login and should change this password!\n`);
    }

    console.log('\n✅ All approved shops now have passwords!\n');
    console.log('📝 Login credentials for approved shops:');
    console.log('   Username: shop email or username');
    console.log('   Password: Password123!');
    console.log('\n⚠️  Please advise shops to change their passwords after first login!\n');

  } catch (error) {
    console.error('❌ Error fixing shop passwords:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixShopPasswords();
