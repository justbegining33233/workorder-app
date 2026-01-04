const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCategories() {
  try {
    const services = await prisma.shopService.findMany({
      where: {
        shopId: 'cmjv8gsr000017c5appehoqjb' // test_prism1
      },
      select: {
        id: true,
        serviceName: true,
        category: true
      }
    });

    console.log(`\nTotal services: ${services.length}\n`);

    // Group by category
    const byCategory = {};
    services.forEach(service => {
      const cat = service.category || 'NO_CATEGORY';
      if (!byCategory[cat]) {
        byCategory[cat] = [];
      }
      byCategory[cat].push(service.serviceName);
    });

    console.log('Services by category:\n');
    Object.keys(byCategory).forEach(cat => {
      console.log(`${cat}: ${byCategory[cat].length} services`);
      byCategory[cat].forEach(name => console.log(`  - ${name}`));
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCategories();
