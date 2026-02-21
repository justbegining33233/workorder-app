#!/usr/bin/env node
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Connected to DB');

    const admins = await prisma.admin.findMany({ take: 5, select: { id: true, username: true, password: true } });
    console.log('\nAdmins:');
    admins.forEach(a => console.log(a.id, a.username, (a.password || '').slice(0, 40)));

    const techs = await prisma.tech.findMany({ take: 5, select: { id: true, email: true, password: true } });
    console.log('\nTechs:');
    techs.forEach(t => console.log(t.id, t.email, (t.password || '').slice(0, 40)));

    const shops = await prisma.shop.findMany({ take: 5, select: { id: true, email: true, password: true } });
    console.log('\nShops:');
    shops.forEach(s => console.log(s.id, s.email, (s.password || '').slice(0, 40)));

    const customers = await prisma.customer.findMany({ take: 5, select: { id: true, email: true, password: true } });
    console.log('\nCustomers:');
    customers.forEach(c => console.log(c.id, c.email, (c.password || '').slice(0, 40)));

  } catch (err) {
    console.error('Error inspecting passwords:', err.message || err);
    process.exit(2);
  } finally {
    try { await prisma.$disconnect(); } catch {};
  }
}

if (require.main === module) main();
