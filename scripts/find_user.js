#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');
const ident = process.argv[2];
if (!ident) {
  console.error('Usage: node scripts/find_user.js <identifier>');
  process.exit(2);
}
const p = new PrismaClient();
(async () => {
  try {
    console.log('Searching for:', ident);
    const admin = await p.admin.findUnique({ where: { username: ident } }).catch(()=>null);
    const shop = await p.shop.findUnique({ where: { username: ident } }).catch(()=>null);
    const customer = await p.customer.findUnique({ where: { email: ident } }).catch(()=>null);
    const tech = await p.tech.findUnique({ where: { email: ident } }).catch(()=>null);
    console.log('admin:', !!admin, admin ? { id: admin.id, username: admin.username, email: admin.email } : null);
    console.log('shop :', !!shop, shop ? { id: shop.id, username: shop.username, email: shop.email } : null);
    console.log('customer:', !!customer, customer ? { id: customer.id, email: customer.email } : null);
    console.log('tech:', !!tech, tech ? { id: tech.id, email: tech.email } : null);
  } catch (e) {
    console.error('Error querying DB:', e);
    process.exitCode = 1;
  } finally {
    await p.$disconnect();
  }
})();
