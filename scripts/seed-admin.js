const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

// Skip seeding if DATABASE_URL is not set (e.g. during CI with placeholder URL)
if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('placeholder')) {
  console.log('[seed-admin] DATABASE_URL not available — skipping admin seed.');
  process.exit(0);
}

(async () => {
  const prisma = new PrismaClient();
  const username = 'admin1006';
  const password = 'SupAdm1006';
  const email = 'admin@example.com';

  try {
    const hashed = await bcrypt.hash(password, 12);
    const existing = await prisma.admin.findUnique({ where: { username } });
    if (existing) {
      await prisma.admin.update({ where: { username }, data: { password: hashed, isSuperAdmin: true } });
      console.log('[seed-admin] Admin password updated:', username);
    } else {
      await prisma.admin.create({
        data: {
          username,
          password: hashed,
          email,
          isSuperAdmin: true,
        },
      });
      console.log('[seed-admin] Admin created:', username);
    }
  } catch (err) {
    console.error('[seed-admin] Failed to seed admin (non-fatal):', err?.message || err);
    // Exit 0 so the build continues even if seeding fails
    process.exit(0);
  } finally {
    await prisma.$disconnect();
  }
})();
