const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestShop() {
  try {
    console.log('\n=== Creating Test Shop Account ===\n');

    // Check if test shop already exists
    const existing = await prisma.shop.findUnique({
      where: { username: 'testshop' }
    });

    if (existing) {
      console.log('✅ Test shop already exists');
      console.log(`   Username: ${existing.username}`);
      console.log(`   Shop Name: ${existing.shopName}`);
      console.log(`   Status: ${existing.status}`);
      await prisma.$disconnect();
      return;
    }

    // Create test shop
    const shop = await prisma.shop.create({
      data: {
        username: 'testshop',
        password: 'password123', // Plain text for testing
        shopName: 'Test Auto Shop',
        email: 'test@shop.com',
        phone: '555-0123',
        zipCode: '12345',
        address: '123 Test Street',
        city: 'Test City',
        state: 'TX',
        businessLicense: 'TEST123',
        insurancePolicy: 'INS123',
        shopType: 'both',
        profileComplete: true,
        status: 'approved'
      }
    });

    console.log('✅ Test shop created successfully!');
    console.log(`   Username: ${shop.username}`);
    console.log(`   Password: password123`);
    console.log(`   Shop Name: ${shop.shopName}`);
    console.log(`   Status: ${shop.status}`);
    console.log('\nYou can now log in with these credentials.');

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error creating test shop:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

createTestShop();