// Debug script to check what shop John belongs to
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Find John
    const john = await prisma.tech.findFirst({
      where: {
        firstName: 'john',
        lastName: 'john',
      },
      include: {
        shop: true,
        timeEntries: {
          where: {
            clockOut: null,
          },
        },
      },
    });

    console.log('\n=== John\'s Info ===');
    if (john) {
      console.log('Name:', `${john.firstName} ${john.lastName}`);
      console.log('Role:', john.role);
      console.log('Shop:', john.shop.shopName);
      console.log('Shop ID:', john.shopId);
      console.log('Shop Username:', john.shop.username);
      console.log('\nActive time entries:', john.timeEntries.length);
      if (john.timeEntries.length > 0) {
        john.timeEntries.forEach(entry => {
          console.log(`  - Clocked in at: ${entry.clockIn}`);
          console.log(`    Entry Shop ID: ${entry.shopId}`);
        });
      }
    } else {
      console.log('John not found!');
    }

    // Check what shop owner should see
    console.log('\n=== Test Prism1 Shop Info ===');
    const testPrism1 = await prisma.shop.findFirst({
      where: {
        shopName: 'test_prism1',
      },
      include: {
        techs: true,
      },
    });

    if (testPrism1) {
      console.log('Shop Name:', testPrism1.shopName);
      console.log('Shop ID:', testPrism1.id);
      console.log('Shop Username:', testPrism1.username);
      console.log('Total employees:', testPrism1.techs.length);
      console.log('\nEmployees:');
      testPrism1.techs.forEach(tech => {
        console.log(`  - ${tech.firstName} ${tech.lastName} (${tech.role})`);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
