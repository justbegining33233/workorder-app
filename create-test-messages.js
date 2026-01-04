const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🚀 Creating test data for messaging system...\n');

    // 1. Find or create a tech in test_prism1 shop
    const shop = await prisma.shop.findFirst({
      where: { email: 'joseruizvlla391@gmail.com' },
    });

    if (!shop) {
      console.log('❌ Shop not found');
      return;
    }

    console.log(`✅ Found shop: ${shop.shopName} (ID: ${shop.id})\n`);

    // Check if jr man (manager) exists
    const manager = await prisma.tech.findFirst({
      where: { email: 'jr1@gmail.com' },
    });

    if (!manager) {
      console.log('❌ Manager jr1@gmail.com not found');
      return;
    }

    console.log(`✅ Manager: ${manager.firstName} ${manager.lastName}\n`);

    // Create a tech if doesn't exist
    let tech = await prisma.tech.findFirst({
      where: {
        shopId: shop.id,
        role: 'tech',
      },
    });

    if (!tech) {
      const hashedPassword = await bcrypt.hash('tech123', 10);
      tech = await prisma.tech.create({
        data: {
          shopId: shop.id,
          email: 'tech1@testprism.com',
          password: hashedPassword,
          firstName: 'Tech',
          lastName: 'Smith',
          phone: '555-0101',
          role: 'tech',
          available: true,
          hourlyRate: 30.0,
        },
      });
      console.log(`✅ Created tech: ${tech.firstName} ${tech.lastName} (${tech.email})`);
      console.log(`   Password: tech123\n`);
    } else {
      console.log(`✅ Found tech: ${tech.firstName} ${tech.lastName} (${tech.email})\n`);
    }

    // Create some test messages

    // 1. Message from manager to tech
    const msg1 = await prisma.directMessage.create({
      data: {
        senderId: manager.id,
        senderRole: 'manager',
        senderName: `${manager.firstName} ${manager.lastName}`,
        receiverId: tech.id,
        receiverRole: 'tech',
        receiverName: `${tech.firstName} ${tech.lastName}`,
        shopId: shop.id,
        subject: 'Schedule Update',
        body: 'Hey, can you take the oil change appointment at 2 PM today? The customer called and needs it done urgently.',
        isRead: false,
      },
    });
    console.log(`✅ Created message 1: Manager → Tech (${msg1.id})`);

    // 2. Reply from tech to manager
    const msg2 = await prisma.directMessage.create({
      data: {
        senderId: tech.id,
        senderRole: 'tech',
        senderName: `${tech.firstName} ${tech.lastName}`,
        receiverId: manager.id,
        receiverRole: 'manager',
        receiverName: `${manager.firstName} ${manager.lastName}`,
        shopId: shop.id,
        body: 'Sure thing! I can handle that. Is it a regular oil change or synthetic?',
        isRead: false,
        threadId: msg1.id,
      },
    });
    console.log(`✅ Created message 2: Tech → Manager (${msg2.id})`);

    // 3. Another message from manager
    const msg3 = await prisma.directMessage.create({
      data: {
        senderId: manager.id,
        senderRole: 'manager',
        senderName: `${manager.firstName} ${manager.lastName}`,
        receiverId: tech.id,
        receiverRole: 'tech',
        receiverName: `${tech.firstName} ${tech.lastName}`,
        shopId: shop.id,
        body: 'Synthetic, 5W-30. Thanks! Customer wants a tire rotation too.',
        isRead: false,
        threadId: msg1.id,
      },
    });
    console.log(`✅ Created message 3: Manager → Tech (${msg3.id})`);

    // 4. Find or use existing admin
    const admin = await prisma.admin.findFirst();
    if (admin) {
      const msg4 = await prisma.directMessage.create({
        data: {
          senderId: manager.id,
          senderRole: 'manager',
          senderName: `${manager.firstName} ${manager.lastName}`,
          receiverId: admin.id,
          receiverRole: 'admin',
          receiverName: admin.username,
          shopId: shop.id,
          subject: 'Support Request',
          body: 'Hi Admin, we need help with inventory management. Some items are not updating correctly.',
          isRead: false,
        },
      });
      console.log(`✅ Created message 4: Manager → Admin (${msg4.id})`);
    }

    // 5. Find or use existing customer
    const customer = await prisma.customer.findFirst();
    if (customer) {
      const msg5 = await prisma.directMessage.create({
        data: {
          senderId: manager.id,
          senderRole: 'manager',
          senderName: `${manager.firstName} ${manager.lastName}`,
          receiverId: customer.id,
          receiverRole: 'customer',
          receiverName: `${customer.firstName} ${customer.lastName}`,
          subject: 'Service Update',
          body: 'Hi! Your vehicle is ready for pickup. We completed the oil change and tire rotation as requested.',
          isRead: false,
        },
      });
      console.log(`✅ Created message 5: Manager → Customer (${msg5.id})`);

      // Customer reply
      const msg6 = await prisma.directMessage.create({
        data: {
          senderId: customer.id,
          senderRole: 'customer',
          senderName: `${customer.firstName} ${customer.lastName}`,
          receiverId: manager.id,
          receiverRole: 'manager',
          receiverName: `${manager.firstName} ${manager.lastName}`,
          body: 'Great! What time can I come by? Also, how much is the total?',
          isRead: false,
          threadId: msg5.id,
        },
      });
      console.log(`✅ Created message 6: Customer → Manager (${msg6.id})`);
    }

    console.log('\n✅ Test data created successfully!\n');
    console.log('🎯 Login as manager:');
    console.log(`   Email: ${manager.email}`);
    console.log(`   Password: password123`);
    console.log(`   URL: http://localhost:3000/auth/login\n`);
    
    console.log('📱 You should now see:');
    console.log('   - 3 unread messages from Tech (in Techs tab)');
    console.log('   - 1 unread message from Admin (in Admin tab)');
    console.log('   - 2 unread messages from Customer (in Customers tab)\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
