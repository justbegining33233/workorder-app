const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateAdmin() {
  try {
    const hashed = await bcrypt.hash('SupAdm1006', 12);
    const result = await prisma.admin.updateMany({
      where: { username: 'admin1006' },
      data: { password: hashed }
    });
    console.log('Admin password updated, affected:', result.count);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateAdmin();