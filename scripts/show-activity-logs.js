#!/usr/bin/env node
require('dotenv').config();
(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    const rows = await prisma.$queryRaw`SELECT id, type, action, details, "user", metadata, "createdAt" FROM activity_logs WHERE action ILIKE '%login%' OR details ILIKE '%login%' ORDER BY "createdAt" DESC LIMIT 200`;
    console.log(JSON.stringify(rows, null, 2));
    await prisma.$disconnect();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
