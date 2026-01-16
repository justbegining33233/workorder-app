const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    // Check active time entries
    const activeEntries = await prisma.timeEntry.findMany({
      where: { clockOut: null },
      include: {
        tech: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            shopId: true,
          },
        },
      },
    });

    console.log('\n=== Currently Clocked In Users ===');
    console.log('Total active entries:', activeEntries.length);
    console.log('\nDetails:');
    activeEntries.forEach(entry => {
      console.log(`- ${entry.tech.firstName} ${entry.tech.lastName} (${entry.tech.role})`);
      console.log(`  Shop ID: ${entry.tech.shopId}`);
      console.log(`  Clocked in at: ${entry.clockIn}`);
      console.log(`  Time entry ID: ${entry.id}`);
      console.log('');
    });

    // Check all techs/managers
    const allTechs = await prisma.tech.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        shopId: true,
        shop: {
          select: {
            shopName: true,
          },
        },
      },
    });

    console.log('\n=== All Techs/Managers ===');
    console.log('Total:', allTechs.length);
    console.log('\nDetails:');
    allTechs.forEach(tech => {
      console.log(`- ${tech.firstName} ${tech.lastName} (${tech.role})`);
      console.log(`  Shop: ${tech.shop.shopName} (ID: ${tech.shopId})`);
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
})();
