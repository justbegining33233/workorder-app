const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStatsData() {
  try {
    const shopId = 'cmjv8gsr000017c5appehoqjb'; // test_prism1
    
    console.log('=== Checking Clock-In Data for Stats API ===\n');
    
    // This is the exact query from the stats API
    const clockedInNow = await prisma.timeEntry.findMany({
      where: {
        shopId,
        clockOut: null, // Currently clocked in
      },
      include: {
        tech: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
    
    console.log(`Total clocked in: ${clockedInNow.length}\n`);
    
    if (clockedInNow.length === 0) {
      console.log('❌ NO ONE CURRENTLY CLOCKED IN');
    } else {
      console.log('Currently Working:');
      clockedInNow.forEach(entry => {
        const name = `${entry.tech.firstName} ${entry.tech.lastName}`;
        const duration = Math.floor((Date.now() - entry.clockIn.getTime()) / (1000 * 60));
        console.log(`- ${name} (${entry.tech.role})`);
        console.log(`  Tech ID: ${entry.tech.id}`);
        console.log(`  Clocked in at: ${entry.clockIn}`);
        console.log(`  Duration: ${duration} minutes`);
        console.log(`  Clock out: ${entry.clockOut || 'NULL (still clocked in)'}`);
        console.log('');
      });
    }
    
    // Also check all time entries for this shop
    console.log('\n=== All Recent Time Entries (Last 10) ===\n');
    const allEntries = await prisma.timeEntry.findMany({
      where: { shopId },
      include: {
        tech: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { clockIn: 'desc' },
      take: 10,
    });
    
    allEntries.forEach(entry => {
      const name = `${entry.tech.firstName} ${entry.tech.lastName}`;
      console.log(`- ${name} (${entry.tech.role})`);
      console.log(`  Clocked in: ${entry.clockIn}`);
      console.log(`  Clocked out: ${entry.clockOut || '❌ NULL (still clocked in)'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkStatsData();
