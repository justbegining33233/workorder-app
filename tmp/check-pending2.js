/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.shop.findMany({
  select: { id: true, shopName: true, email: true, username: true, status: true, createdAt: true }
}).then(r => {
  console.log('ALL SHOPS:');
  console.log(JSON.stringify(r, null, 2));
  p.$disconnect();
}).catch(e => {
  console.error(e);
  p.$disconnect();
});
