const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const dev = process.env.NODE_ENV !== 'production';
// Use 0.0.0.0 so Railway (and other hosts) can route external traffic to us.
// Next.js still serves as normal; 'localhost' would only accept loopback connections.
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

// Add global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Initialize Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL: JWT_SECRET must be set in production');
  process.exit(1);
}
const jwtSecret = JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-prod';

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      // Health check endpoint — used by Railway, Render, and load balancers.
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
        return;
      }
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (error) {
      console.error('Next.js request handling error:', error);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  });

  // Allowed CORS origins for Socket.IO — covers both bare and www domain.
  const allowedOrigins = dev
    ? true  // allow all in dev
    : [
        process.env.NEXT_PUBLIC_APP_URL,
        'https://fixtray.app',
        'https://www.fixtray.app',
      ].filter(Boolean);

  // Initialize Socket.IO with error handling
  let io;
  try {
    io = new Server(httpServer, {
      path: '/api/socket',
      cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });
    console.log('Socket.IO server initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Socket.IO:', error);
    // Continue without Socket.IO if it fails
  }

  // Authentication middleware — only attach if Socket.IO initialized successfully.
  if (io) io.use((socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, jwtSecret);
      socket.userId = decoded.id;
      socket.role = decoded.role;
      socket.shopId = decoded.shopId;
      socket.username = decoded.username;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error'));
    }
  });

  // Socket connection handling
  if (io) {  // eslint-disable-line — outer if(io) already checked above
    io.on('connection', (socket) => {
      try {
        console.log(`User ${socket.username} (${socket.role}) connected:`, socket.id);

        // Join user-specific room
        socket.join(`user_${socket.userId}`);

        // Join role-specific room
        socket.join(`role_${socket.role}`);

        // Join shop-specific room if applicable
        if (socket.shopId) {
          socket.join(`shop_${socket.shopId}`);
        }

        // Handle work order updates
        socket.on('work-order-update', (data) => {
          try {
            // Validate: only broadcast to the shop the sender belongs to
            const { workOrderId, assignedTo } = data;
            const shopId = socket.shopId; // Use authenticated shopId, not user-supplied

            // Notify shop admin
            if (shopId) {
              io.to(`shop_${shopId}`).emit('work-order-updated', {
                ...data,
                shopId, // enforce server-side shopId
                updatedBy: socket.userId,
                timestamp: new Date().toISOString(),
              });
            }

            // Notify assigned technician
            if (assignedTo) {
              io.to(`user_${assignedTo}`).emit('work-order-updated', {
                ...data,
                shopId,
                updatedBy: socket.userId,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error('Error handling work-order-update:', error);
          }
        });

        // Handle messaging
        socket.on('send-message', (data) => {
          try {
            const { receiverId, receiverRole, message } = data;

            const messageData = {
              ...data,
              senderId: socket.userId,
              senderRole: socket.role,
              timestamp: new Date().toISOString(),
            };

            // Send to specific receiver
            if (receiverId) {
              io.to(`user_${receiverId}`).emit('new-message', messageData);
            }

            // Send to role-based receivers
            if (receiverRole) {
              io.to(`role_${receiverRole}`).emit('new-message', messageData);
            }
          } catch (error) {
            console.error('Error handling send-message:', error);
          }
        });

        // Handle typing indicators
        socket.on('typing-start', (data) => {
          try {
            const { receiverId } = data;
            if (receiverId) {
              socket.to(`user_${receiverId}`).emit('user-typing', {
                from: socket.userId,
                fromName: socket.username,
              });
            }
          } catch (error) {
            console.error('Error handling typing-start:', error);
          }
        });

        socket.on('typing-stop', (data) => {
          try {
            const { receiverId } = data;
            if (receiverId) {
              socket.to(`user_${receiverId}`).emit('user-stopped-typing', {
                from: socket.userId,
              });
            }
          } catch (error) {
            console.error('Error handling typing-stop:', error);
          }
        });

        // Handle location updates for technicians
        socket.on('location-update', (data) => {
          try {
            if (socket.role === 'tech' && socket.shopId) {
              // Broadcast location to shop admins
              io.to(`shop_${socket.shopId}`).emit('tech-location-updated', {
                techId: socket.userId,
                techName: socket.username,
                location: data,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error('Error handling location-update:', error);
          }
        });

        // Handle clock status changes
        socket.on('clock-status-change', (data) => {
          try {
            if (socket.shopId) {
              io.to(`shop_${socket.shopId}`).emit('clock-status-changed', {
                userId: socket.userId,
                userName: socket.username,
                ...data,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error('Error handling clock-status-change:', error);
          }
        });

        socket.on('disconnect', () => {
          try {
            console.log(`User ${socket.username} disconnected:`, socket.id);
          } catch (error) {
            console.error('Error handling disconnect:', error);
          }
        });
      } catch (error) {
        console.error('Error in socket connection handler:', error);
      }
    });
  }

  httpServer.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Socket.IO server initialized and ready`);
  });
}).catch((ex) => {
  console.error(ex.stack);
  process.exit(1);
});