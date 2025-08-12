import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  joinPublicTrip, 
  isTripPublic, 
  isTripMember, 
  getChatMessages, 
  addChatMessage 
} from '@/lib/trip-chat';
import { pool } from '@/lib/database';

// GET: Fetch chat messages
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tripDisplayId = parseInt(params.id);
    if (isNaN(tripDisplayId)) {
      return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });
    }

    // First get the actual trip ID from display_id
    const tripResult = await pool.query(
      'SELECT id, display_id, name, user_id FROM trips WHERE display_id = $1',
      [tripDisplayId]
    );
    
    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    
    const tripId = tripResult.rows[0].id;

    // Check if user is a member or trip is public
    const isMember = await isTripMember(tripId, session.user.id);
    const isPublic = await isTripPublic(tripId);
    
    if (!isMember && !isPublic) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get chat messages
    const messages = await getChatMessages(tripId, 50);
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: Send a message or join trip
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tripDisplayId = parseInt(params.id);
    if (isNaN(tripDisplayId)) {
      return NextResponse.json({ error: 'Invalid trip ID' }, { status: 400 });
    }

    // First get the actual trip ID from display_id
    const tripResult = await pool.query(
      'SELECT id, display_id, name, user_id FROM trips WHERE display_id = $1',
      [tripDisplayId]
    );
    
    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }
    
    const tripId = tripResult.rows[0].id;

    const body = await request.json();
    const { action, message } = body;

    // Handle different actions
    if (action === 'join') {
      // Join public trip
      const isPublic = await isTripPublic(tripId);
      if (!isPublic) {
        return NextResponse.json({ error: 'Trip is not public' }, { status: 403 });
      }

      const success = await joinPublicTrip(tripId, session.user.id);
      if (!success) {
        return NextResponse.json({ error: 'Failed to join trip' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Successfully joined trip' });
    } else if (action === 'send') {
      // Send a message
      if (!message || typeof message !== 'string') {
        return NextResponse.json({ error: 'Message is required' }, { status: 400 });
      }

      // Check if user is a member
      const isMember = await isTripMember(tripId, session.user.id);
      if (!isMember) {
        return NextResponse.json({ error: 'You must be a member to send messages' }, { status: 403 });
      }

      // Add the message
      const chatMessage = await addChatMessage(tripId, session.user.id, message);
      if (!chatMessage) {
        return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Message sent successfully', chatMessage });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in chat POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}