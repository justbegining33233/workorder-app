// Socket.io server configuration
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as ServerIO, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/prisma';

export type NextApiResponseServerIo = NextApiResponse & {
  socket: any & {
    server: NetServer & {
      io: ServerIO;
    };
  };
};

interface AuthenticatedSocket extends Socket {
  userId?: string;
  role?: string;
  shopId?: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const initSocketServer = (httpServer: NetServer) => {
  const io = new ServerIO(httpServer, {
    path: '/api/socket',
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : '*',
      methods: ['GET', 'POST'],
    },
  });

  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      socket.userId = decoded.id;
      socket.role = decoded.role;
      socket.shopId = decoded.shopId;

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.userId} connected`);

    // Join user-specific room
    socket.join(`user_${socket.userId}`);

    // Join role-specific room
    if (socket.role) {
      socket.join(`role_${socket.role}`);
    }

    // Join shop-specific room
    if (socket.shopId) {
      socket.join(`shop_${socket.shopId}`);
    }

    // Handle work order status updates
    socket.on('workorder:status_update', async (data) => {
      try {
        const { workOrderId, status, updatedBy } = data;

        // Update in database
        await prisma.workOrder.update({
          where: { id: workOrderId },
          data: { status, updatedAt: new Date() },
        });

        // Broadcast to relevant users
        const workOrder = await prisma.workOrder.findUnique({
          where: { id: workOrderId },
          include: { customer: true, shop: true },
        });

        if (workOrder) {
          // Notify customer
          io.to(`user_${workOrder.customerId}`).emit('workorder:updated', {
            workOrderId,
            status,
            updatedBy,
          });

          // Notify shop team
          io.to(`shop_${workOrder.shopId}`).emit('workorder:updated', {
            workOrderId,
            status,
            updatedBy,
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to update work order status' });
      }
    });

    // Handle chat messages
    socket.on('chat:send', async (data) => {
      try {
        const { workOrderId, message, senderId, senderRole } = data;

        // Save message to database
        const chatMessage = await prisma.message.create({
          data: {
            workOrderId,
            sender: senderRole,
            senderName: data.senderName || 'Unknown',
            body: message,
          },
        });

        // Broadcast to work order participants
        const workOrder = await prisma.workOrder.findUnique({
          where: { id: workOrderId },
          include: { customer: true, shop: true },
        });

        if (workOrder) {
          const messageData = {
            id: chatMessage.id,
            message,
            senderId,
            senderRole,
            createdAt: chatMessage.createdAt,
          };

          // Send to customer
          io.to(`user_${workOrder.customerId}`).emit('chat:message', messageData);

          // Send to shop team
          io.to(`shop_${workOrder.shopId}`).emit('chat:message', messageData);
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('chat:typing', (data) => {
      const { workOrderId, isTyping } = data;
      socket.to(`workorder_${workOrderId}`).emit('chat:typing', {
        userId: socket.userId,
        isTyping,
      });
    });

    // Handle tech location updates
    socket.on('location:update', async (data) => {
      try {
        const { latitude, longitude, accuracy } = data;

        if (socket.role === 'tech' && socket.userId) {
          // Update tech location in database
          await prisma.tech.update({
            where: { id: socket.userId },
            data: {
              latitude,
              longitude,
              locationAccuracy: accuracy,
              lastLocationUpdate: new Date(),
            },
          });

          // Broadcast to shop team
          if (socket.shopId) {
            io.to(`shop_${socket.shopId}`).emit('tech:location_updated', {
              techId: socket.userId,
              latitude,
              longitude,
              accuracy,
            });
          }
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};