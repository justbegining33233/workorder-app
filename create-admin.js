import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('\n=== Create Admin User ===\n');
    
    const username = await question('Enter admin username: ');
    const password = await question('Enter admin password: ');
    const firstName = await question('Enter first name: ');
    const lastName = await question('Enter last name: ');
    const email = await question('Enter email: ');
    
    if (!username || !password || !firstName || !lastName || !email) {
      console.error('\n❌ All fields are required');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Check if username already exists
    const existing = await prisma.user.findUnique({
      where: { username }
    });

    if (existing) {
      console.error(`\n❌ Username "${username}" already exists`);
      rl.close();
      await prisma.$disconnect();
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        role: 'admin',
        isSuperAdmin: true,
        verified: true,
      }
    });

    console.log('\n✅ Admin user created successfully!');
    console.log(`   Username: ${admin.username}`);
    console.log(`   Name: ${admin.firstName} ${admin.lastName}`);
    console.log(`   Email: ${admin.email}`);
    console.log('\nYou can now log in with these credentials.');

    rl.close();
    await prisma.$disconnect();
  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    rl.close();
    await prisma.$disconnect();
    process.exit(1);
  }
}

createAdmin();
