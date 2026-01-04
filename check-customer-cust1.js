const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function checkCustomer() {
  try {
    console.log('\n🔍 Searching for customer accounts...\n');
    
    // Find all customers
    const allCustomers = await prisma.customer.findMany();
    console.log(`Total customers in database: ${allCustomers.length}\n`);
    
    if (allCustomers.length > 0) {
      console.log('All customers:');
      allCustomers.forEach((c, idx) => {
        console.log(`${idx + 1}. ID: ${c.id}`);
        console.log(`   Email: ${c.email}`);
        console.log(`   Username: ${c.username || 'NULL'}`);
        console.log(`   Name: ${c.firstName} ${c.lastName}`);
        console.log(`   Has Password: ${!!c.password}`);
        console.log(`   Password Length: ${c.password?.length || 0}`);
        console.log('');
      });
    }
    
    // Check for cust1 specifically
    const cust1ByUsername = await prisma.customer.findFirst({
      where: {
        OR: [
          { username: 'cust1' },
          { email: 'cust1' }
        ]
      }
    });
    
    if (cust1ByUsername) {
      console.log('✅ Found "cust1":');
      console.log('   ID:', cust1ByUsername.id);
      console.log('   Email:', cust1ByUsername.email);
      console.log('   Username:', cust1ByUsername.username);
      console.log('   Name:', cust1ByUsername.firstName, cust1ByUsername.lastName);
      console.log('   Password Hash:', cust1ByUsername.password.substring(0, 20) + '...');
      
      // Test password
      console.log('\n🔐 Testing password...');
      const testPasswords = ['password', 'Password123!', 'cust1', '123456'];
      
      for (const pwd of testPasswords) {
        const isValid = await bcrypt.compare(pwd, cust1ByUsername.password).catch(() => false);
        console.log(`   "${pwd}": ${isValid ? '✅ MATCH' : '❌ no match'}`);
      }
    } else {
      console.log('❌ No customer found with username or email "cust1"');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomer();
