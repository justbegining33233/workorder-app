const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTechs() {
  try {
    console.log('\n🔍 Checking all techs in database...\n');
    
    const techs = await prisma.tech.findMany({
      include: {
        shop: {
          select: {
            id: true,
            shopName: true,
          }
        }
      }
    });

    if (techs.length === 0) {
      console.log('❌ No techs found in database');
    } else {
      console.log(`✅ Found ${techs.length} tech(s):\n`);
      techs.forEach((tech, index) => {
        console.log(`Tech #${index + 1}:`);
        console.log(`  ID: ${tech.id}`);
        console.log(`  Email: ${tech.email}`);
        console.log(`  Phone: ${tech.phone}`);
        console.log(`  Name: ${tech.firstName} ${tech.lastName}`);
        console.log(`  Role: ${tech.role}`);
        console.log(`  Shop: ${tech.shop ? tech.shop.shopName : 'No shop'} (${tech.shopId})`);
        console.log(`  Has Password: ${tech.password ? 'Yes' : 'No'}`);
        console.log(`  Password Length: ${tech.password ? tech.password.length : 0}`);
        console.log(`  Created: ${tech.createdAt}`);
        console.log('');
      });
    }

    // Also check shops
    const shops = await prisma.shop.findMany({
      where: { status: 'approved' },
      select: {
        id: true,
        shopName: true,
        email: true,
        username: true,
      }
    });

    console.log(`\n📍 Approved Shops (${shops.length}):`);
    shops.forEach(shop => {
      console.log(`  - ${shop.shopName} (ID: ${shop.id})`);
      console.log(`    Username: ${shop.username}`);
      console.log(`    Email: ${shop.email}`);
    });

  } catch (error) {
    console.error('Error checking techs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTechs();
