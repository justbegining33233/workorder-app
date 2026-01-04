const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllDatabases() {
  try {
    console.log('\n🔍 Checking current database connection...\n');
    console.log('DATABASE_URL from .env.local:', process.env.DATABASE_URL || 'NOT SET');
    
    // Try to connect and list all databases
    const result = await prisma.$queryRaw`
      SELECT datname FROM pg_database 
      WHERE datistemplate = false 
      ORDER BY datname;
    `;
    
    console.log('\n📊 Available PostgreSQL databases:');
    result.forEach((db, idx) => {
      console.log(`${idx + 1}. ${db.datname}`);
    });
    
    // Check current database
    const currentDb = await prisma.$queryRaw`SELECT current_database();`;
    console.log(`\n✅ Currently connected to: ${currentDb[0].current_database}`);
    
    // Count tables in current database
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `;
    console.log(`\n📋 Tables in current database (${tables.length} total):`);
    tables.forEach(t => console.log(`   - ${t.table_name}`));
    
    // Count customers
    const customerCount = await prisma.customer.count();
    const shopCount = await prisma.shop.count();
    const adminCount = await prisma.admin.count();
    
    console.log(`\n👥 Record counts:`);
    console.log(`   Customers: ${customerCount}`);
    console.log(`   Shops: ${shopCount}`);
    console.log(`   Admins: ${adminCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllDatabases();
