#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const email = process.argv[2] || 'test@example.com';
const prisma = new PrismaClient();
(async () => {
  try {
    const existing = await prisma.customer.findUnique({ where: { email } }).catch(()=>null);
    if (existing) {
      console.log('Customer already exists:', existing.email);
      process.exit(0);
    }
    const c = await prisma.customer.create({ data: {
      email,
      password: 'TempPass123!',
      firstName: 'Test',
      lastName: 'User'
    }});
    console.log('Created test customer:', c.email, c.id);
  } catch (e) {
    console.error('Error creating test customer:', e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
