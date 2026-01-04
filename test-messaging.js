const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMessaging() {
  try {
    console.log('🔍 Testing Messaging System...\n');

    // 1. Check if DirectMessage table exists
    console.log('1️⃣ Checking DirectMessage table...');
    const messageCount = await prisma.directMessage.count();
    console.log(`✅ DirectMessage table exists. Current messages: ${messageCount}\n`);

    // 2. Find a manager to test with
    console.log('2️⃣ Finding test manager...');
    const manager = await prisma.tech.findFirst({
      where: { role: 'manager' },
      include: { shop: true },
    });
    
    if (!manager) {
      console.log('❌ No manager found in database');
      return;
    }
    
    console.log(`✅ Found manager: ${manager.firstName} ${manager.lastName} (${manager.email})`);
    console.log(`   Shop: ${manager.shop.shopName}\n`);

    // 3. Find a tech from the same shop
    console.log('3️⃣ Finding tech from same shop...');
    const tech = await prisma.tech.findFirst({
      where: { 
        role: 'tech',
        shopId: manager.shopId,
        id: { not: manager.id },
      },
    });
    
    if (tech) {
      console.log(`✅ Found tech: ${tech.firstName} ${tech.lastName} (${tech.email})\n`);
    } else {
      console.log('⚠️ No tech found in same shop (you can create one for testing)\n');
    }

    // 4. Find an admin
    console.log('4️⃣ Finding admin...');
    const admin = await prisma.admin.findFirst();
    
    if (admin) {
      console.log(`✅ Found admin: ${admin.username} (${admin.email})\n`);
    } else {
      console.log('⚠️ No admin found (you can create one for testing)\n');
    }

    // 5. Find a customer
    console.log('5️⃣ Finding customer...');
    const customer = await prisma.customer.findFirst();
    
    if (customer) {
      console.log(`✅ Found customer: ${customer.firstName} ${customer.lastName} (${customer.email})\n`);
    } else {
      console.log('⚠️ No customer found (you can create one for testing)\n');
    }

    // 6. Create test message if tech exists
    if (tech) {
      console.log('6️⃣ Creating test message from manager to tech...');
      const testMessage = await prisma.directMessage.create({
        data: {
          senderId: manager.id,
          senderRole: 'manager',
          senderName: `${manager.firstName} ${manager.lastName}`,
          receiverId: tech.id,
          receiverRole: 'tech',
          receiverName: `${tech.firstName} ${tech.lastName}`,
          shopId: manager.shopId,
          subject: 'Welcome to the messaging system!',
          body: 'This is a test message from the manager. You can now receive messages through the messaging card on your dashboard!',
          isRead: false,
        },
      });
      
      console.log(`✅ Test message created with ID: ${testMessage.id}\n`);
    }

    // 7. Show messaging endpoints available
    console.log('📡 Available Messaging Endpoints:');
    console.log('   GET  /api/messages - Fetch conversations');
    console.log('   POST /api/messages - Send message');
    console.log('   PUT  /api/messages - Mark as read\n');

    console.log('🎯 Test Manager Credentials:');
    console.log(`   Email: ${manager.email}`);
    console.log(`   Login at: http://localhost:3000/auth/login\n`);

    console.log('✅ Messaging system is ready!');
    console.log('🚀 Login as the manager and check the Messages card on the dashboard\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMessaging();
