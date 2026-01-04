const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const username = 'admin1006';
  const password = '10062001';
  const email = 'admin1006@workorder.local';
  const isSuperAdmin = true;

  const hashedPassword = await bcrypt.hash(password, 12);

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.log('Admin user already exists:', username);
    return;
  }

  const admin = await prisma.admin.create({
    data: {
      username,
      password: hashedPassword,
      email,
      isSuperAdmin,
    },
  });
  console.log('Super admin created:', admin);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
