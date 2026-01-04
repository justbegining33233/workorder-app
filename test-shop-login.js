const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function testShopLogin() {
  try {
    console.log('\n🧪 Testing Shop Login...\n');

    // Test credentials
    const testUsername = 'joseruizvlla391@gmail.com';
    const testPassword = 'Password123!';

    console.log(`Testing login with:`);
    console.log(`  Username: ${testUsername}`);
    console.log(`  Password: ${testPassword}\n`);

    // Find shop by username, email, or shop name
    const shop = await prisma.shop.findFirst({
      where: {
        AND: [
          {
            OR: [
              { username: testUsername },
              { email: testUsername },
              { shopName: testUsername },
            ],
          },
          { status: 'approved' },
        ],
      },
    });

    if (!shop) {
      console.log('❌ FAILED: No approved shop found with that username/email');
      
      // Check if shop exists but not approved
      const anyShop = await prisma.shop.findFirst({
        where: {
          OR: [
            { username: testUsername },
            { email: testUsername },
            { shopName: testUsername },
          ],
        },
      });
      
      if (anyShop) {
        console.log(`\n⚠️  Shop found but status is: ${anyShop.status}`);
        console.log(`   Shop ID: ${anyShop.id}`);
        console.log(`   Shop Name: ${anyShop.shopName}`);
        console.log(`   Email: ${anyShop.email}`);
        console.log(`   Username: ${anyShop.username}`);
      }
      
      await prisma.$disconnect();
      return;
    }

    console.log('✅ Shop found in database:');
    console.log(`   Shop ID: ${shop.id}`);
    console.log(`   Shop Name: ${shop.shopName}`);
    console.log(`   Email: ${shop.email}`);
    console.log(`   Username: ${shop.username}`);
    console.log(`   Status: ${shop.status}`);
    console.log(`   Password stored: ${shop.password ? 'YES' : 'NO'}`);
    console.log(`   Password length: ${shop.password?.length || 0}`);

    if (!shop.password) {
      console.log('\n❌ FAILED: Shop has no password!');
      await prisma.$disconnect();
      return;
    }

    // Test password
    console.log('\n🔐 Testing password...');
    const isValid = await bcrypt.compare(testPassword, shop.password);

    if (isValid) {
      console.log('✅ PASSWORD MATCHES! Login should work!');
      console.log('\n📝 Use these credentials to login:');
      console.log(`   Username: ${shop.email} (or ${shop.username} or ${shop.shopName})`);
      console.log(`   Password: Password123!`);
    } else {
      console.log('❌ PASSWORD DOES NOT MATCH!');
      console.log('\nTrying other common passwords...');
      
      const commonPasswords = ['password', 'Password123', 'admin123', 'test123'];
      for (const pwd of commonPasswords) {
        const match = await bcrypt.compare(pwd, shop.password);
        if (match) {
          console.log(`✅ Found matching password: ${pwd}`);
          break;
        }
      }
    }

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testShopLogin();
