/**
 * socket-server.js
 * Standalone Socket.IO server — intended to be deployed separately from the
 * Next.js app (e.g. Railway, Render, Fly.io).
 *
 * Environment variables required:
 *   PORT            — TCP port to listen on (default: 3001)
 *   JWT_SECRET      — Same value as Vercel JWT_SECRET
 *   ALLOWED_ORIGINS — Comma-separated list of allowed CORS origins
 *                     e.g. "https://fixtray.app,https://www.fixtray.app"
 *
 * After deploying, set NEXT_PUBLIC_SOCKET_URL in Vercel to this server's URL.
 *
 * Local test: node socket-server.js
 */

const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-prod';
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
  : ['http://localhost:3000', 'https://fixtray.app', 'https://www.fixtray.app'];

// ─── HTTP server (Socket.IO only, no Next.js) ────────────────────────
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }
  res.writeHead(404);
  res.end('Not found');
});

// ─── Socket.IO ────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // No custom path — the standalone server handles all WS connections at root
});

// JWT authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.data.user = decoded;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// ─── Connection handler ───────────────────────────────────────────────
io.on('connection', (socket) => {
  const { id: userId, role, shopId } = socket.data.user || {};
  console.log(`[socket] connected: ${socket.id}  user=${userId}  role=${role}`);

  // Join personal room so we can target this user directly
  if (userId) socket.join(`user:${userId}`);
  if (shopId) socket.join(`shop:${shopId}`);
  if (role === 'admin') socket.join('admin');

  // ─── Work Order events ─────────────────────────────────────────────
  socket.on('work-order-update', (data) => {
    // Broadcast to all users in the relevant shop room
    const room = data.shopId ? `shop:${data.shopId}` : null;
    if (room) io.to(room).emit('work-order-updated', data);
  });

  // ─── Messaging events ──────────────────────────────────────────────
  socket.on('send-message', (data) => {
    const { toUserId, ...rest } = data;
    if (toUserId) {
      io.to(`user:${toUserId}`).emit('new-message', { ...rest, fromUserId: userId });
    }
  });

  // ─── Typing indicators ─────────────────────────────────────────────
  socket.on('typing-start', (data) => {
    const { toUserId } = data;
    if (toUserId) io.to(`user:${toUserId}`).emit('user-typing', { fromUserId: userId });
  });

  socket.on('typing-stop', (data) => {
    const { toUserId } = data;
    if (toUserId) io.to(`user:${toUserId}`).emit('user-stopped-typing', { fromUserId: userId });
  });

  // ─── Tech location updates ─────────────────────────────────────────
  socket.on('location-update', (data) => {
    // Broadcast to the shop so admin/customer can see tech location
    const { sShopId, ...rest } = data;
    const target = sShopId ? `shop:${sShopId}` : null;
    if (target) io.to(target).emit('tech-location-updated', { ...rest, techId: userId });
  });

  // ─── Clock-in / Clock-out ──────────────────────────────────────────
  socket.on('clock-status-change', (data) => {
    const { sShopId, ...rest } = data;
    const target = sShopId ? `shop:${sShopId}` : null;
    if (target) io.to(target).emit('clock-status-changed', { ...rest, techId: userId });
  });

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${socket.id}  reason=${reason}`);
  });

  socket.on('error', (err) => {
    console.error(`[socket] error on ${socket.id}:`, err.message);
  });
});

// ─── Start ────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`FixTray socket server running on port ${PORT}`);
  console.log(`Allowed origins: ${ALLOWED_ORIGINS.join(', ')}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received — shutting down gracefully');
  io.close();
  httpServer.close(() => process.exit(0));
});
