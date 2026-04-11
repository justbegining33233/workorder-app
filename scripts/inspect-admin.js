#!/usr/bin/env node
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

(async () => {
  if (!process.env.DATABASE_URL) {
    console.error('Set DATABASE_URL to your DB before running this script.');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    const admin = await prisma.admin.findUnique({ where: { username: 'admin1006' }, select: { id: true, username: true, password: true, email: true } });
    console.log(admin);
  } catch (e) {
    console.error('Error querying admin:', e && e.message ? e.message : e);
    process.exitCode = 2;
  } finally {
    await prisma.$disconnect();
  }
})();
