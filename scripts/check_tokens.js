#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
(async () => {
  const p = new PrismaClient();
  try {
    const tokens = await p.verificationToken.findMany({ take: 10, orderBy: { createdAt: 'desc' } });
    console.log('Latest verification tokens:');
    console.dir(tokens, { depth: 2 });
  } catch (e) {
    console.error('Error querying verificationToken:', e);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
})();
