const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('\n=== Setting up super admin account ===\n');

    const username = 'admin1006';
    const password = 'SupAdm1006';
    const email = 'joseruizvilla391@gmail.com';

    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 12);

    // Upsert: create if not exists, update password if already exists
    const existing = await prisma.admin.findUnique({ where: { username } });

    if (existing) {
      await prisma.admin.update({
        where: { username },
        data: { password: hashedPassword, isSuperAdmin: true },
      });
      console.log('✅ Super admin password updated');
      console.log(`   Username: ${username}`);
      console.log(`   Email: ${existing.email}`);
    } else {
      const admin = await prisma.admin.create({
        data: {
          username,
          password: hashedPassword,
          email,
          isSuperAdmin: true,
        }
      });
      console.log('✅ Super admin account created successfully!');
      console.log(`   Username: ${admin.username}`);
      console.log(`   Email: ${admin.email}`);
    }

    console.log('\nLogin at /auth/login or /admin/login');
    console.log(`  Username: ${username}`);

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error setting up admin:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

setupAdmin();
