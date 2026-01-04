const { PrismaClient } = require('@prisma/client');

// Connect to the workorders database
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://postgres:10062001@localhost:5432/workorders'
    }
  }
});

async function checkWorkordersDB() {
  try {
    console.log('\n🔍 Checking "workorders" database...\n');
    
    // Check if it has the right tables
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    
    console.log(`📋 Tables in workorders database (${tables.length} total):`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Try to count records
    try {
      const customerCount = await prisma.customer.count();
      const shopCount = await prisma.shop.count();
      const adminCount = await prisma.admin.count();
      
      console.log(`\n👥 Record counts in "workorders" database:`);
      console.log(`   Customers: ${customerCount}`);
      console.log(`   Shops: ${shopCount}`);
      console.log(`   Admins: ${adminCount}`);
    } catch (err) {
      console.log('\n⚠️  Could not query record counts (tables might not exist)');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkWorkordersDB();
