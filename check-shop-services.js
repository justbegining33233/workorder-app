const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkShopServices() {
  try {
    console.log('\n🔍 Checking shop services for test_prism1...\n');

    const shop = await prisma.shop.findFirst({
      where: {
        shopName: 'test_prism1',
      },
    });

    if (!shop) {
      console.log('❌ Shop not found');
      return;
    }

    console.log('Shop found:');
    console.log(`  ID: ${shop.id}`);
    console.log(`  Name: ${shop.shopName}`);
    console.log(`  Profile Complete: ${shop.profileComplete}`);
    console.log(`  Shop Type: ${shop.shopType || 'Not set'}`);
    console.log(`  Business License: ${shop.businessLicense || 'Not set'}`);
    console.log(`  Insurance Policy: ${shop.insurancePolicy || 'Not set'}`);
    console.log('');

    // Check services table
    const services = await prisma.shopService.findMany({
      where: {
        shopId: shop.id,
      },
    });

    console.log(`Services: ${services.length} found`);
    if (services.length > 0) {
      services.forEach((service, idx) => {
        console.log(`  ${idx + 1}. ${service.serviceName} (${service.category}) - $${service.price || 'N/A'}`);
      });
    } else {
      console.log('  ⚠️  No services configured for this shop');
      console.log('  Shop needs to complete their profile and add services');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkShopServices();
