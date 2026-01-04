const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: ['error'] });

async function checkPayrollData() {
  try {
    console.log('🔍 Checking payroll data...\n');
    
    // Find test shop
    const shop = await prisma.shop.findFirst({
      where: { email: 'test@prism1.com' }
    });
    
    if (!shop) {
      console.log('❌ Test shop not found');
      return;
    }
    
    console.log('✅ Shop:', shop.shopName, '(', shop.id, ')\n');
    
    // Get all time entries (both completed and in-progress)
    const allEntries = await prisma.timeEntry.findMany({
      where: { shopId: shop.id },
      include: {
        tech: {
          select: {
            firstName: true,
            lastName: true,
            role: true,
            hourlyRate: true
          }
        }
      },
      orderBy: { clockIn: 'desc' }
    });
    
    console.log(`📊 Total time entries: ${allEntries.length}\n`);
    
    // Completed entries (with clockOut)
    const completed = allEntries.filter(e => e.clockOut !== null);
    console.log(`✅ Completed entries (with clock out): ${completed.length}`);
    completed.forEach((entry, idx) => {
      const duration = entry.hoursWorked || 0;
      const pay = duration * (entry.tech.hourlyRate || 0);
      console.log(`   ${idx + 1}. ${entry.tech.firstName} ${entry.tech.lastName}`);
      console.log(`      In: ${entry.clockIn.toLocaleString()}`);
      console.log(`      Out: ${entry.clockOut?.toLocaleString()}`);
      console.log(`      Hours: ${duration.toFixed(2)} | Pay: $${pay.toFixed(2)}`);
      console.log('');
    });
    
    // In-progress entries (no clockOut)
    const inProgress = allEntries.filter(e => e.clockOut === null);
    console.log(`⏰ In-progress entries (still clocked in): ${inProgress.length}`);
    inProgress.forEach((entry, idx) => {
      const elapsed = (Date.now() - new Date(entry.clockIn).getTime()) / (1000 * 60 * 60);
      console.log(`   ${idx + 1}. ${entry.tech.firstName} ${entry.tech.lastName} (${entry.tech.role})`);
      console.log(`      Clocked in: ${entry.clockIn.toLocaleString()}`);
      console.log(`      Elapsed: ${elapsed.toFixed(2)} hours`);
      console.log('');
    });
    
    // Summary by employee
    console.log('👥 Summary by employee:');
    const byEmployee = {};
    allEntries.forEach(entry => {
      const name = `${entry.tech.firstName} ${entry.tech.lastName}`;
      if (!byEmployee[name]) {
        byEmployee[name] = {
          role: entry.tech.role,
          rate: entry.tech.hourlyRate,
          totalHours: 0,
          totalPay: 0,
          completed: 0,
          inProgress: 0
        };
      }
      if (entry.clockOut) {
        byEmployee[name].totalHours += entry.hoursWorked || 0;
        byEmployee[name].totalPay += (entry.hoursWorked || 0) * (entry.tech.hourlyRate || 0);
        byEmployee[name].completed++;
      } else {
        byEmployee[name].inProgress++;
      }
    });
    
    Object.entries(byEmployee).forEach(([name, data]) => {
      console.log(`\n   ${name} (${data.role})`);
      console.log(`      Rate: $${data.rate || 0}/hr`);
      console.log(`      Completed shifts: ${data.completed}`);
      console.log(`      In progress: ${data.inProgress}`);
      console.log(`      Total hours: ${data.totalHours.toFixed(2)}`);
      console.log(`      Total pay: $${data.totalPay.toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPayrollData();
