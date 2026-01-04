import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setupAdmin() {
  try {
    console.log('\n=== Setting up admin account ===\n');
    
    const username = 'admin1006';
    const password = '10062001';
    const email = 'joseruizvilla391@gmail.com';

    // Check if admin already exists
    const existing = await prisma.admin.findUnique({
      where: { username }
    });

    if (existing) {
      console.log('✅ Admin account already exists');
      console.log(`   Username: ${existing.username}`);
      console.log(`   Email: ${existing.email}`);
      await prisma.$disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const admin = await prisma.admin.create({
      data: {
        username,
        password: hashedPassword,
        email,
        isSuperAdmin: true,
      }
    });

    console.log('✅ Admin account created successfully!');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Email: ${admin.email}`);
    console.log('\nYou can now log in with these credentials.');

    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error setting up admin:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

setupAdmin();
