// Test direct database connection and insert
const { PrismaClient } = require('@prisma/client');

async function testDatabaseConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('Testing database connection...');
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Create a test shop
    console.log('\nCreating test shop...');
    const testShop = await prisma.shop.create({
      data: {
        shopName: 'Test Shop Direct Insert',
        email: `test${Date.now()}@example.com`,
        phone: '555-0100',
        address: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zipCode: '12345',
        status: 'pending',
        profileComplete: false,
        username: `test_${Date.now()}`,
        password: 'test123',
      }
    });
    console.log('✅ Test shop created:', testShop.id);
    
    // Immediately query it back
    console.log('\nQuerying for the shop we just created...');
    const foundShop = await prisma.shop.findUnique({
      where: { id: testShop.id }
    });
    
    if (foundShop) {
      console.log('✅ Shop found:', foundShop.shopName);
    } else {
      console.log('❌ Shop NOT found!');
    }
    
    // Query all pending shops
    console.log('\nQuerying all pending shops...');
    const pendingShops = await prisma.shop.findMany({
      where: { status: 'pending' }
    });
    console.log(`Found ${pendingShops.length} pending shops`);
    
    // Query ALL shops
    console.log('\nQuerying ALL shops...');
    const allShops = await prisma.shop.findMany();
    console.log(`Found ${allShops.length} total shops`);
    
    if (allShops.length > 0) {
      console.log('\nShops in database:');
      allShops.forEach(shop => {
        console.log(`  - ${shop.shopName} (${shop.status}) - ID: ${shop.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();
