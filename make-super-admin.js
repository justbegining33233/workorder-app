import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function makeSuperAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('10062001', 12);
    await prisma.admin.upsert({
      where: { username: 'admin1006' },
      update: { isSuperAdmin: true },
      create: {
        username: 'admin1006',
        password: hashedPassword,
        email: 'admin@example.com',
        isSuperAdmin: true
      }
    });
    console.log('Admin created/updated to super admin');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

makeSuperAdmin();