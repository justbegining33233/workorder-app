const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createTestTech() {
  try {
    // Get the shop ID
    const shop = await prisma.shop.findFirst({
      where: { status: 'approved' }
    });

    if (!shop) {
      console.log('❌ No approved shop found');
      return;
    }

    console.log('✅ Found shop:', shop.shopName, '(', shop.id, ')');

    // Check if tech already exists
    const existing = await prisma.tech.findFirst({
      where: { email: 'man1@gmail.com' }
    });

    if (existing) {
      console.log('⚠️  Tech already exists with email man1@gmail.com');
      console.log('   Deleting existing tech first...');
      await prisma.tech.delete({ where: { id: existing.id } });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);
    console.log('🔐 Password hashed, length:', hashedPassword.length);

    // Create tech
    const tech = await prisma.tech.create({
      data: {
        shopId: shop.id,
        email: 'man1@gmail.com',
        password: hashedPassword,
        firstName: 'Manager',
        lastName: 'One',
        phone: '555-0001',
        role: 'manager',
      }
    });

    console.log('\n✅ Tech created successfully!');
    console.log('   ID:', tech.id);
    console.log('   Email:', tech.email);
    console.log('   Name:', tech.firstName, tech.lastName);
    console.log('   Role:', tech.role);
    console.log('   Shop:', shop.shopName);
    console.log('\n🔑 Login credentials:');
    console.log('   Email: man1@gmail.com');
    console.log('   Password: password123');
    console.log('\nYou can now login at http://localhost:3000/auth/login');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTech();
