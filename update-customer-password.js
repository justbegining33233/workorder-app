const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateCustomerPassword() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 12);

    const customer = await prisma.customer.update({
      where: { email: 'test@example.com' },
      data: {
        password: hashedPassword
      }
    });

    console.log('Customer password updated:', customer.id);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateCustomerPassword();