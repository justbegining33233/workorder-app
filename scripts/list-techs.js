const { PrismaClient } = require('@prisma/client');

(async () => {
  const prisma = new PrismaClient();
  try {
    const techs = await prisma.tech.findMany({
      select: { id: true, email: true, phone: true, firstName: true, lastName: true, role: true, shopId: true }
    });
    console.log('Techs:', techs);
  } catch (err) {
    console.error('Error listing techs:', err);
  } finally {
    await prisma.$disconnect();
  }
})();
