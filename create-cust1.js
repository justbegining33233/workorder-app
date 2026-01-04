const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createCust1() {
  try {
    console.log('\n📝 Creating cust1 customer account...\n');
    
    const hashedPassword = await bcrypt.hash('Password123!', 10);
    
    const customer = await prisma.customer.create({
      data: {
        username: 'cust1',
        email: 'cust1@example.com',
        password: hashedPassword,
        firstName: 'Customer',
        lastName: 'One',
        phone: '555-1234'
      }
    });
    
    console.log('✅ Customer "cust1" created successfully!');
    console.log('\nLogin credentials:');
    console.log('   Username: cust1');
    console.log('   Email: cust1@example.com');
    console.log('   Password: Password123!');
    console.log('\nCustomer ID:', customer.id);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createCust1();
