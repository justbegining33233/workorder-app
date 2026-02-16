const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

(async () => {
  const prisma = new PrismaClient();
  try {
    const admin = await prisma.admin.findUnique({ where: { username: 'admin1006' } });
    if (!admin) {
      console.log('admin not found');
      return;
    }
    const refreshRaw = crypto.randomBytes(24).toString('hex');
    const refreshHash = await bcrypt.hash(refreshRaw, 12);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 days
    const refresh = await prisma.refreshToken.create({
      data: {
        tokenHash: refreshHash,
        adminId: admin.id,
        metadata: JSON.stringify({ ip: '', agent: '', csrfToken: 'x' }),
        expiresAt,
      }
    });
    console.log('refresh created:', { id: refresh.id, adminId: refresh.adminId, expiresAt: refresh.expiresAt });
  } catch (err) {
    console.error('error creating refresh token:', err);
  } finally {
    await prisma.$disconnect();
  }
})();