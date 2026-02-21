#!/usr/bin/env node
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function find(id) {
  console.log('Searching for id:', id);
  const results = {};
  try {
    results.shop = await prisma.shop.findUnique({ where: { id } });
  } catch (e) { results.shop = { error: e.message } }
  try {
    results.customer = await prisma.customer.findUnique({ where: { id } });
  } catch (e) { results.customer = { error: e.message } }
  try {
    results.admin = await prisma.admin.findUnique({ where: { id } });
  } catch (e) { results.admin = { error: e.message } }
  try {
    results.tech = await prisma.tech.findUnique({ where: { id } });
  } catch (e) { results.tech = { error: e.message } }

  console.log('\nResults:');
  for (const k of Object.keys(results)) {
    if (!results[k]) console.log(`- ${k}: not found`);
    else if (results[k] && results[k].error) console.log(`- ${k}: error - ${results[k].error}`);
    else console.log(`- ${k}: found`);
  }
  await prisma.$disconnect();
}

if (require.main === module) {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node scripts/find-record.js <id>');
    process.exit(2);
  }
  find(id).catch(err => { console.error(err); process.exit(1); });
}
