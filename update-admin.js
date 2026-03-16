const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function updateAdmin() {
  const username = process.env.ADMIN_USERNAME || process.argv[2];
  const newPassword = process.env.ADMIN_PASSWORD || process.argv[3];

  if (!username || !newPassword) {
    console.error('Usage: ADMIN_USERNAME=xxx ADMIN_PASSWORD=xxx node update-admin.js');
    console.error('   or: node update-admin.js <username> <new-password>');
    process.exit(1);
  }

  try {
    const hashed = await bcrypt.hash(newPassword, 12);
    const result = await prisma.admin.updateMany({
      where: { username },
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