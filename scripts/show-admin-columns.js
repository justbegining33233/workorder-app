#!/usr/bin/env node
require('dotenv').config();
(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    const cols = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_name='admins' ORDER BY ordinal_position`;
    console.log(JSON.stringify(cols, null, 2));
    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
