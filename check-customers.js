const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCustomers() {
  try {
    const customers = await prisma.customer.findMany();
    console.log('Customers:');
    customers.forEach(cust => {
      console.log(` - Username: ${cust.username}, Email: ${cust.email}, Name: ${cust.firstName} ${cust.lastName}`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCustomers();