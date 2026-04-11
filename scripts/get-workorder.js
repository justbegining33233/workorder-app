const {PrismaClient} = require('@prisma/client');
const fs = require('fs');
(async () => {
  const prisma = new PrismaClient();
  try {
    const id = process.argv[2] || 'cml2y0i1100038juaq4ucnvzk';
    const wo = await prisma.workOrder.findUnique({ where: { id }, include: { shop: true, tracking: true } });
    fs.writeFileSync('workorder.json', JSON.stringify(wo, null, 2));
    console.log('Saved workorder.json');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
})();