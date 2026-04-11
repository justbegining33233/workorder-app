#!/usr/bin/env node
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

(async function test() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Prisma connected to DATABASE_URL');
  } catch (err) {
    console.error('Prisma connect failed:', err && err.message ? err.message : err);
    process.exitCode = 2;
  } finally {
    try { await prisma.$disconnect(); } catch (e) {}
  }
})();
