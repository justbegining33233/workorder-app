const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function setupTestCustomer() {
  try {
    console.log('\n🔍 Checking for existing customers...\n');
    
    const customers = await prisma.customer.findMany();
    console.log(`Found ${customers.length} customer(s) in database`);
    
    if (customers.length > 0) {
      customers.forEach(c => {
        console.log(`  - ${c.email} (${c.firstName} ${c.lastName}) - username: ${c.username || 'N/A'}`);
      });
    }
    
    // Create a test customer if none exist
    const testEmail = 'test@customer.com';
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: testEmail }
    });
    
    if (!existingCustomer) {
      console.log('\n📝 Creating test customer...');
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      
      const newCustomer = await prisma.customer.create({
        data: {
          email: testEmail,
          username: 'testcustomer',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'Customer',
          phone: '555-0100'
        }
      });
      
      console.log('✅ Test customer created:');
      console.log('   Email:', testEmail);
      console.log('   Username:', 'testcustomer');
      console.log('   Password:', 'Password123!');
      console.log('   ID:', newCustomer.id);
    } else {
      console.log('\n✅ Test customer already exists');
      console.log('   Email:', testEmail);
      console.log('   Username:', existingCustomer.username || 'N/A');
      console.log('   Password: Password123!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupTestCustomer();
