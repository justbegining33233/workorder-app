const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function checkShopLogin() {
  try {
    console.log('\n🔍 Checking approved shops and their login credentials...\n');

    // Get all approved shops
    const approvedShops = await prisma.shop.findMany({
      where: {
        status: 'approved',
      },
      select: {
        id: true,
        shopName: true,
        username: true,
        email: true,
        password: true,
        status: true,
        approvedAt: true,
        createdAt: true,
      },
    });

    if (approvedShops.length === 0) {
      console.log('❌ No approved shops found in database');
      return;
    }

    console.log(`✅ Found ${approvedShops.length} approved shop(s):\n`);

    for (const shop of approvedShops) {
      console.log(`Shop: ${shop.shopName}`);
      console.log(`  ID: ${shop.id}`);
      console.log(`  Username: ${shop.username || '(empty)'}`);
      console.log(`  Email: ${shop.email}`);
      console.log(`  Status: ${shop.status}`);
      console.log(`  Password stored: ${shop.password ? 'YES' : 'NO'}`);
      console.log(`  Password length: ${shop.password?.length || 0}`);
      console.log(`  Password looks hashed: ${shop.password?.startsWith('$2') ? 'YES (bcrypt)' : 'NO - PROBLEM!'}`);
      console.log(`  Approved at: ${shop.approvedAt || 'Not set'}`);
      console.log(`  Created at: ${shop.createdAt}`);
      
      // Test password comparison
      if (shop.password) {
        console.log(`\n  Testing password comparisons:`);
        const testPasswords = ['password123', '123456', 'Password123', 'admin123', shop.shopName];
        for (const testPw of testPasswords) {
          try {
            const matches = await bcrypt.compare(testPw, shop.password);
            if (matches) {
              console.log(`    ✅ Password "${testPw}" MATCHES!`);
            }
          } catch (err) {
            // Password not bcrypt hashed
            if (shop.password === testPw) {
              console.log(`    ⚠️  Password "${testPw}" matches BUT NOT HASHED!`);
            }
          }
        }
      }
      console.log('');
    }

    // Get all pending shops for comparison
    const pendingShops = await prisma.shop.findMany({
      where: {
        status: 'pending',
      },
      select: {
        shopName: true,
        username: true,
        email: true,
        password: true,
      },
    });

    if (pendingShops.length > 0) {
      console.log(`\n📋 Also found ${pendingShops.length} pending shop(s):`);
      for (const shop of pendingShops) {
        console.log(`  - ${shop.shopName} (username: ${shop.username || 'none'}, email: ${shop.email})`);
        console.log(`    Password stored: ${shop.password ? 'YES' : 'NO'}`);
        console.log(`    Password looks hashed: ${shop.password?.startsWith('$2') ? 'YES' : 'NO'}`);
      }
    }

  } catch (error) {
    console.error('❌ Error checking shops:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShopLogin();
