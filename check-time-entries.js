const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['error']
});

async function checkTimeEntries() {
  try {
    console.log('🔍 Checking time entries for jr man...\n');
    
    // Find jr man
    const jr = await prisma.tech.findFirst({
      where: { email: 'jr1@gmail.com' }
    });
    
    if (!jr) {
      console.log('❌ jr man not found');
      return;
    }
    
    console.log('✅ Found jr man:', jr.firstName, jr.lastName);
    console.log('   ID:', jr.id);
    console.log('   Shop ID:', jr.shopId);
    console.log('   Role:', jr.role);
    console.log('');
    
    // Check for active clock-in (clockOut is null)
    const activeEntry = await prisma.timeEntry.findFirst({
      where: {
        techId: jr.id,
        clockOut: null
      },
      orderBy: { clockIn: 'desc' }
    });
    
    if (activeEntry) {
      console.log('🟢 CURRENTLY CLOCKED IN:');
      console.log('   Clock In:', activeEntry.clockIn);
      console.log('   Location:', activeEntry.location || 'N/A');
      console.log('   Notes:', activeEntry.notes || 'N/A');
      
      // Calculate time elapsed
      const now = new Date();
      const clockInTime = new Date(activeEntry.clockIn);
      const hoursElapsed = ((now - clockInTime) / (1000 * 60 * 60)).toFixed(2);
      console.log('   Time Elapsed:', hoursElapsed, 'hours');
      console.log('');
    } else {
      console.log('⚪ Not currently clocked in\n');
    }
    
    // Check all time entries for this tech
    const allEntries = await prisma.timeEntry.findMany({
      where: { techId: jr.id },
      orderBy: { clockIn: 'desc' },
      take: 5
    });
    
    console.log(`📋 Last ${allEntries.length} time entries:`);
    allEntries.forEach((entry, idx) => {
      console.log(`   ${idx + 1}. Clock In: ${entry.clockIn}`);
      console.log(`      Clock Out: ${entry.clockOut || 'STILL CLOCKED IN'}`);
      console.log(`      Hours: ${entry.hoursWorked || 'In progress'}`);
      console.log('');
    });
    
    // Check all techs for the shop
    const allTechs = await prisma.tech.findMany({
      where: { shopId: jr.shopId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        hourlyRate: true
      }
    });
    
    console.log(`\n👥 All team members for shop ${jr.shopId}:`);
    allTechs.forEach((tech, idx) => {
      console.log(`   ${idx + 1}. ${tech.firstName} ${tech.lastName} (${tech.role})`);
      console.log(`      Email: ${tech.email}`);
      console.log(`      Rate: $${tech.hourlyRate || 'N/A'}/hr`);
    });
    
    // Check who is currently clocked in for this shop
    console.log('\n⏰ Currently clocked in members:');
    const clockedIn = await prisma.timeEntry.findMany({
      where: {
        shopId: jr.shopId,
        clockOut: null
      },
      include: {
        tech: {
          select: {
            firstName: true,
            lastName: true,
            role: true
          }
        }
      }
    });
    
    if (clockedIn.length === 0) {
      console.log('   No one currently clocked in');
    } else {
      clockedIn.forEach((entry, idx) => {
        const elapsed = ((new Date() - new Date(entry.clockIn)) / (1000 * 60 * 60)).toFixed(2);
        console.log(`   ${idx + 1}. ${entry.tech.firstName} ${entry.tech.lastName} (${entry.tech.role})`);
        console.log(`      Clocked in: ${entry.clockIn}`);
        console.log(`      Elapsed: ${elapsed} hours`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimeEntries();
