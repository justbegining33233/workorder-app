const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateCustomerPassword() {
  const email = process.env.CUSTOMER_EMAIL || process.argv[2];
  const newPassword = process.env.CUSTOMER_PASSWORD || process.argv[3];

  if (!email || !newPassword) {
    console.error('Usage: CUSTOMER_EMAIL=xxx CUSTOMER_PASSWORD=xxx node update-customer-password.js');
    console.error('   or: node update-customer-password.js <email> <new-password>');
    process.exit(1);
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    const customer = await prisma.customer.update({
      where: { email },
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