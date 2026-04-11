#!/usr/bin/env node
require('dotenv').config();
(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    const rows = await prisma.$queryRaw`SELECT id, "adminId", "createdAt", "expiresAt", metadata FROM refresh_tokens ORDER BY "createdAt" DESC LIMIT 50`;
    console.log(JSON.stringify(rows, null, 2));
    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
