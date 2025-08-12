import { pool } from './database';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Types for trip chat
export interface TripMember {
  id: number;
  trip_id: number;
  user_id: string;
  role: 'owner' | 'member' | 'admin';
  status: 'pending' | 'accepted' | 'declined';
  joined_at: Date;
  invited_at: Date;
  invited_by?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ChatMessage {
  id: number;
  trip_id: number;
  sender_id: string;
  message: string;
  message_type: 'text' | 'system' | 'join' | 'leave';
  created_at: Date;
  updated_at: Date;
}

export interface TripInvite {
  id: number;
  trip_id: number;
  invited_user_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Check if user is a member of a trip
export async function isTripMember(tripId: number, userId: string): Promise<boolean> {
  try {
    // First check if user is the owner
    const ownerResult = await pool.query(
      'SELECT 1 FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, userId]
    );
    if (ownerResult.rows.length > 0) {
      return true; // Owner is always a member
    }
    
    // Then check if user is an invited member
    const memberResult = await pool.query(
      'SELECT 1 FROM trip_members WHERE trip_id = $1 AND user_id = $2 AND status = $3',
      [tripId, userId, 'accepted']
    );
    return memberResult.rows.length > 0;
  } catch (error) {
    console.error('Error checking trip membership:', error);
    return false;
  }
}

// Check if user is the owner of a trip
export async function isTripOwner(tripId: number, userId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT 1 FROM trips WHERE id = $1 AND user_id = $2',
      [tripId, userId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error checking trip ownership:', error);
    return false;
  }
}

// Get trip members
export async function getTripMembers(tripId: number): Promise<TripMember[]> {
  try {
    const result = await pool.query(
      `SELECT tm.*, u.first_name, u.last_name, u.profile_image
       FROM trip_members tm
       JOIN users u ON tm.user_id = u.id
       WHERE tm.trip_id = $1 AND tm.status = $2
       ORDER BY tm.role DESC, tm.joined_at ASC`,
      [tripId, 'accepted']
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting trip members:', error);
    return [];
  }
}

// Add member to trip
export async function addTripMember(tripId: number, userId: string, role: string = 'member', invitedBy?: string): Promise<boolean> {
  try {
    await pool.query(
      `INSERT INTO trip_members (trip_id, user_id, role, status, invited_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (trip_id, user_id) 
       DO UPDATE SET status = $4, updated_at = CURRENT_TIMESTAMP`,
      [tripId, userId, role, 'accepted', invitedBy]
    );
    return true;
  } catch (error) {
    console.error('Error adding trip member:', error);
    return false;
  }
}

// Remove member from trip
export async function removeTripMember(tripId: number, userId: string): Promise<boolean> {
  try {
    await pool.query(
      'DELETE FROM trip_members WHERE trip_id = $1 AND user_id = $2',
      [tripId, userId]
    );
    return true;
  } catch (error) {
    console.error('Error removing trip member:', error);
    return false;
  }
}

// Get chat messages for a trip
export async function getChatMessages(tripId: number, limit: number = 50): Promise<ChatMessage[]> {
  try {
    const result = await pool.query(
      `SELECT cm.*, u.first_name, u.last_name, u.profile_image
       FROM chat_messages cm
       JOIN users u ON cm.sender_id = u.id
       WHERE cm.trip_id = $1
       ORDER BY cm.created_at DESC
       LIMIT $2`,
      [tripId, limit]
    );
    return result.rows.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Error getting chat messages:', error);
    return [];
  }
}

// Add chat message
export async function addChatMessage(tripId: number, senderId: string, message: string, messageType: string = 'text'): Promise<ChatMessage | null> {
  try {
    const result = await pool.query(
      `INSERT INTO chat_messages (trip_id, sender_id, message, message_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [tripId, senderId, message, messageType]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error adding chat message:', error);
    return null;
  }
}

// Create trip invite
export async function createTripInvite(tripId: number, invitedUserId: string, invitedBy: string): Promise<TripInvite | null> {
  try {
    const result = await pool.query(
      `INSERT INTO trip_invites (trip_id, invited_user_id, invited_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [tripId, invitedUserId, invitedBy]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error creating trip invite:', error);
    return null;
  }
}

// Accept trip invite
export async function acceptTripInvite(tripId: number, userId: string): Promise<boolean> {
  try {
    await pool.query('BEGIN');
    
    // Update invite status
    await pool.query(
      'UPDATE trip_invites SET status = $1 WHERE trip_id = $2 AND invited_user_id = $3',
      ['accepted', tripId, userId]
    );
    
    // Add user as trip member
    await addTripMember(tripId, userId, 'member');
    
    await pool.query('COMMIT');
    return true;
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error accepting trip invite:', error);
    return false;
  }
}

// Decline trip invite
export async function declineTripInvite(tripId: number, userId: string): Promise<boolean> {
  try {
    await pool.query(
      'UPDATE trip_invites SET status = $1 WHERE trip_id = $2 AND invited_user_id = $3',
      ['declined', tripId, userId]
    );
    return true;
  } catch (error) {
    console.error('Error declining trip invite:', error);
    return false;
  }
}

// Get user's pending invites
export async function getUserPendingInvites(userId: string): Promise<TripInvite[]> {
  try {
    const result = await pool.query(
      `SELECT ti.*, t.name as trip_name, t.description as trip_description,
              u.first_name, u.last_name
       FROM trip_invites ti
       JOIN trips t ON ti.trip_id = t.id
       JOIN users u ON ti.invited_by = u.id
       WHERE ti.invited_user_id = $1 AND ti.status = $2
       ORDER BY ti.created_at DESC`,
      [userId, 'pending']
    );
    return result.rows;
  } catch (error) {
    console.error('Error getting user pending invites:', error);
    return [];
  }
}

// Check if trip is public
export async function isTripPublic(tripId: number): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT is_public FROM trips WHERE id = $1',
      [tripId]
    );
    return result.rows[0]?.is_public === true;
  } catch (error) {
    console.error('Error checking trip privacy:', error);
    return false;
  }
}

// Join public trip
export async function joinPublicTrip(tripId: number, userId: string): Promise<boolean> {
  try {
    const isPublic = await isTripPublic(tripId);
    if (!isPublic) {
      return false;
    }
    
    return await addTripMember(tripId, userId, 'member');
  } catch (error) {
    console.error('Error joining public trip:', error);
    return false;
  }
}