const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
function generateRandomToken(bytes = 48){ return crypto.randomBytes(bytes).toString('hex'); }

(async () => {
  const prisma = new PrismaClient();
  try {
    const username = 'admin1006';
    const password = '10062001';
    console.log('Looking up admin', username);
    const admin = await prisma.admin.findUnique({ where: { username } });
    console.log('admin:', !!admin, admin ? admin.id : null);
    if (!admin) return process.exit(1);
    const match = await bcrypt.compare(password, admin.password);
    console.log('password match:', match);
    const token = jwt.sign({ id: admin.id, username: admin.username, role: 'admin' }, process.env.JWT_SECRET || 'fallback-secret-key', { expiresIn: '15m' });
    console.log('jwt created length:', token.length);
    const raw = generateRandomToken(48);
    const hash = await bcrypt.hash(raw, 12);
    const expiresAt = new Date(Date.now() + 30*24*60*60*1000);
    console.log('creating refresh token...');
    const refresh = await prisma.refreshToken.create({ data: { tokenHash: hash, adminId: admin.id, expiresAt, metadata: JSON.stringify({ note: 'debug' }) } });
    console.log('refresh id', refresh.id);
  } catch (err) {
    console.error('debug flow error:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();