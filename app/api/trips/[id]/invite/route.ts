import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { 
  createTripInvite, 
  isTripOwner, 
  isTripMember 
} from '@/lib/trip-chat';
import { pool } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    console.log('🔐 Session check:', { 
      hasSession: !!session, 
      hasUser: !!session?.user, 
      userId: session?.user?.id,
      email: session?.user?.email 
    });
    
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
    const trip = tripResult.rows[0];

    // Check if user is the owner
    console.log('🏠 Trip ownership check:', { tripDisplayId, tripId, userId: session.user.id });
    
    // Debug: Check what trips exist for this user
    const userTripsResult = await pool.query(
      'SELECT id, display_id, name, user_id FROM trips WHERE user_id = $1',
      [session.user.id]
    );
    console.log('📋 User trips:', userTripsResult.rows);
    console.log('🎯 Specific trip:', trip);
    
    const isOwner = await isTripOwner(tripId, session.user.id);
    console.log('✅ Is owner result:', isOwner);
    
    if (!isOwner) {
      return NextResponse.json({ error: 'Only trip owners can invite members' }, { status: 403 });
    }

    const { email } = await request.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Find user by email
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const invitedUserId = userResult.rows[0].id;

    // Check if user is already a member
    const isAlreadyMember = await isTripMember(tripId, invitedUserId);
    if (isAlreadyMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
    }

    // Create invite
    const invite = await createTripInvite(tripId, invitedUserId, session.user.id);
    if (!invite) {
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Invite sent successfully', 
      invite 
    });
  } catch (error) {
    console.error('Error creating trip invite:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}