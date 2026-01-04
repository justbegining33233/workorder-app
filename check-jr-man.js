const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkJrMan() {
  try {
    console.log('\n🔍 Searching for "jr man" manager...\n');

    // Find jr man
    const jrMan = await prisma.tech.findFirst({
      where: {
        OR: [
          { email: { contains: 'jr', mode: 'insensitive' } },
          { firstName: { contains: 'jr', mode: 'insensitive' } },
          { lastName: { contains: 'jr', mode: 'insensitive' } },
        ]
      },
      include: {
        shop: true
      }
    });

    if (!jrMan) {
      console.log('❌ No manager found with "jr" in name/email');
      console.log('\n📋 All managers in database:');
      const allManagers = await prisma.tech.findMany({
        where: { role: 'manager' },
        include: { shop: true }
      });
      
      allManagers.forEach(m => {
        console.log(`   - ${m.firstName} ${m.lastName} (${m.email})`);
        console.log(`     Shop: ${m.shop.shopName} (ID: ${m.shopId})`);
      });
      return;
    }

    console.log('✅ Found manager:');
    console.log(`   Name: ${jrMan.firstName} ${jrMan.lastName}`);
    console.log(`   Email: ${jrMan.email}`);
    console.log(`   Role: ${jrMan.role}`);
    console.log(`   Tech ID: ${jrMan.id}`);
    console.log(`   Shop ID: ${jrMan.shopId}`);
    console.log(`   Shop Name: ${jrMan.shop.shopName}`);
    console.log(`   Shop Email: ${jrMan.shop.email}`);
    console.log(`   Shop Status: ${jrMan.shop.status}`);

    console.log('\n📋 All shops in database:');
    const allShops = await prisma.shop.findMany({
      select: {
        id: true,
        shopName: true,
        email: true,
        status: true,
        _count: {
          select: {
            techs: true
          }
        }
      }
    });

    allShops.forEach(s => {
      console.log(`   - ${s.shopName} (${s.email})`);
      console.log(`     ID: ${s.id}`);
      console.log(`     Status: ${s.status}`);
      console.log(`     Employees: ${s._count.techs}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkJrMan();
