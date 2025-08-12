import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: number;
  tripId: number;
  senderId: string;
  message: string;
  messageType: 'text' | 'system' | 'join' | 'leave';
  createdAt: Date;
  senderName?: string;
  senderAvatar?: string;
}

interface ChatState {
  messages: ChatMessage[];
  socket: Socket | null;
  isConnected: boolean;
  currentTripId: number | null;
  
  // Actions
  connect: (tripId: number) => void;
  disconnect: () => void;
  sendMessage: (message: string) => void;
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  socket: null,
  isConnected: false,
  currentTripId: null,

  connect: (tripId: number) => {
    const { socket, disconnect } = get();
    
    // Disconnect from previous trip if any
    if (socket) {
      disconnect();
    }

    // Create new socket connection
    const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000', {
      auth: {
        token: localStorage.getItem('next-auth.session-token') || '',
      },
    });

    newSocket.on('connect', () => {
      set({ isConnected: true });
      newSocket.emit('join-trip', tripId);
    });

    newSocket.on('disconnect', () => {
      set({ isConnected: false });
    });

    newSocket.on('new-message', (message: ChatMessage) => {
      get().addMessage(message);
    });

    set({ 
      socket: newSocket, 
      currentTripId: tripId,
      isConnected: true 
    });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
    }
    set({ 
      socket: null, 
      isConnected: false, 
      currentTripId: null,
      messages: [] 
    });
  },

  sendMessage: (message: string) => {
    const { socket, currentTripId } = get();
    if (socket && currentTripId) {
      socket.emit('send-message', {
        tripId: currentTripId,
        message,
      });
    }
  },

  addMessage: (message: ChatMessage) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  setMessages: (messages: ChatMessage[]) => {
    set({ messages });
  },

  clearMessages: () => {
    set({ messages: [] });
  },
}));