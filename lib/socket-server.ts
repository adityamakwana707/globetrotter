import { Server as SocketIOServer } from 'socket.io';
import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { getToken } from 'next-auth/jwt';

export interface ChatMessage {
  id: number;
  trip_id: number;
  sender_id: string;
  message: string;
  message_type: 'text' | 'system' | 'join' | 'leave';
  created_at: Date;
  sender_name: string;
  sender_avatar?: string;
}

export interface SocketUser {
  userId: string;
  tripId: number;
  socketId: string;
}

class SocketServer {
  private io: SocketIOServer | null = null;
  private users: Map<string, SocketUser> = new Map();

  init(server: NetServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    this.io.use(async (socket, next) => {
      try {
        const token = await getToken({ 
          req: socket.request as NextApiRequest, 
          secret: process.env.NEXTAUTH_SECRET 
        });
        
        if (!token) {
          return next(new Error('Authentication error'));
        }
        
        socket.data.user = token;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log('User connected:', socket.id);
      
      socket.on('join-trip', (tripId: number) => {
        this.joinTrip(socket, tripId);
      });
      
      socket.on('leave-trip', (tripId: number) => {
        this.leaveTrip(socket, tripId);
      });
      
      socket.on('send-message', (data: { tripId: number; message: string }) => {
        this.handleMessage(socket, data);
      });
      
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private joinTrip(socket: any, tripId: number) {
    const userId = socket.data.user.sub;
    
    // Leave any previous trip
    this.leaveTrip(socket, 0);
    
    // Join the new trip room
    socket.join(`trip-${tripId}`);
    
    // Store user info
    this.users.set(socket.id, { userId, tripId, socketId: socket.id });
    
    console.log(`User ${userId} joined trip ${tripId}`);
  }

  private leaveTrip(socket: any, tripId: number) {
    const userInfo = this.users.get(socket.id);
    if (userInfo) {
      socket.leave(`trip-${userInfo.tripId}`);
      this.users.delete(socket.id);
      console.log(`User ${userInfo.userId} left trip ${userInfo.tripId}`);
    }
  }

  private async handleMessage(socket: any, data: { tripId: number; message: string }) {
    const userId = socket.data.user.sub;
    const { tripId, message } = data;
    
    // Broadcast message to trip room
    this.io?.to(`trip-${tripId}`).emit('new-message', {
      tripId,
      senderId: userId,
      message,
      timestamp: new Date(),
    });
  }

  private handleDisconnect(socket: any) {
    this.leaveTrip(socket, 0);
    console.log('User disconnected:', socket.id);
  }

  // Method to emit messages from API routes
  emitToTrip(tripId: number, event: string, data: any) {
    this.io?.to(`trip-${tripId}`).emit(event, data);
  }

  // Method to emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    for (const [socketId, userInfo] of this.users.entries()) {
      if (userInfo.userId === userId) {
        this.io?.to(socketId).emit(event, data);
      }
    }
  }
}

export const socketServer = new SocketServer();
