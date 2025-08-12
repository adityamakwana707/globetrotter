'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useChatStore } from '@/lib/stores/chat-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Users, MessageCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TripChatProps {
  tripId: number;
  tripName: string;
  isPublic: boolean;
  isOwner: boolean;
}

export function TripChat({ tripId, tripName, isPublic, isOwner }: TripChatProps) {
  const { data: session } = useSession();
  const { 
    messages, 
    connect, 
    disconnect, 
    setMessages 
  } = useChatStore();
  
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Connect to chat when component mounts
    connect(tripId);
    
    // Load existing messages
    loadMessages();
    
    return () => {
      disconnect();
    };
  }, [tripId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/trips/${tripId}/chat`);
      if (response.ok) {
        const data = await response.json();
        // Transform database format to store format
        const transformedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          tripId: msg.trip_id,
          senderId: msg.sender_id,
          message: msg.message,
          messageType: msg.message_type,
          createdAt: msg.created_at,
          senderName: msg.first_name ? `${msg.first_name} ${msg.last_name || ''}`.trim() : 'Unknown',
          senderAvatar: msg.profile_image
        }));
        setMessages(transformedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/trips/${tripId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'send', 
          message: newMessage.trim() 
        }),
      });

      if (response.ok) {
        setNewMessage('');
        // Reload messages to show the new one
        await loadMessages();
      } else {
        const errorData = await response.json();
        console.error('Error sending message:', errorData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'join':
        return '👋';
      case 'leave':
        return '👋';
      case 'system':
        return 'ℹ️';
      default:
        return null;
    }
  };

  const getMessageTypeText = (messageType: string) => {
    switch (messageType) {
      case 'join':
        return 'joined the trip';
      case 'leave':
        return 'left the trip';
      case 'system':
        return 'System message';
      default:
        return '';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Trip Chat - {tripName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Messages */}
        <ScrollArea 
          ref={scrollAreaRef}
          className="h-96 w-full rounded-md border p-4"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.senderId === session?.user?.id ? 'flex-row-reverse' : ''
                  }`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={message.senderAvatar} />
                    <AvatarFallback>
                      {message.senderName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div
                    className={`flex flex-col max-w-[70%] ${
                      message.senderId === session?.user?.id ? 'items-end' : 'items-start'
                    }`}
                  >
                    {message.messageType === 'text' ? (
                      <>
                        <div className="text-xs text-muted-foreground mb-1">
                          {message.senderName}
                        </div>
                        <div
                          className={`px-3 py-2 rounded-lg ${
                            message.senderId === session?.user?.id
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.message}
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">
                        {getMessageTypeIcon(message.messageType)} {message.senderName} {getMessageTypeText(message.messageType)}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground mt-1">
                      {message.createdAt ? formatDistanceToNow(new Date(message.createdAt), { addSuffix: true }) : 'Just now'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}