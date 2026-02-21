#!/usr/bin/env node
// Prints admin stored password hash details and compares to a provided hash
// Usage: node scripts/inspect-admin-hash.js --username admin1006 --compareHash "$2a$..."
const argv = require('minimist')(process.argv.slice(2));
const username = argv.username || argv.u || 'admin1006';
const compareHash = argv.compareHash || argv.c;

(async () => {
  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    const admin = await prisma.admin.findUnique({ where: { username } });
    if (!admin) {
      console.error('Admin not found:', username);
      process.exit(1);
    }
    const stored = admin.password || '';
    console.log('Stored hash (raw):', stored);
    console.log('Stored hash (json):', JSON.stringify(stored));
    console.log('Stored length:', stored.length);
    // print char codes for first and last 60 chars
    const head = stored.slice(0, 60);
    const tail = stored.slice(-60);
    console.log('Head chars:', head.split('').map(c => c.charCodeAt(0)).join(','));
    console.log('Tail chars:', tail.split('').map(c => c.charCodeAt(0)).join(','));

    if (compareHash) {
      console.log('\nComparing to provided hash:');
      console.log('Provided (raw):', compareHash);
      console.log('Provided (json):', JSON.stringify(compareHash));
      console.log('Provided length:', compareHash.length);
      console.log('Strings equal:', stored === compareHash);
    }

    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(2);
  }
})();
