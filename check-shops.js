const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkShops() {
  try {
    const shops = await prisma.shop.findMany();
    console.log('Shops in database:', shops.length);
    shops.forEach(s => console.log('-', s.username, s.status));
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
    await prisma.$disconnect();
  }
}

checkShops();