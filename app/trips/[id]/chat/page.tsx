import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { isUserAdmin, getComprehensiveTripDetails } from "@/lib/database"
import { isTripMember, isTripPublic } from "@/lib/trip-chat"
import { TripChat } from '@/components/trips/trip-chat';
import { TripInviteModal } from '@/components/trips/trip-invite-modal';
import { TripJoinButton } from '@/components/trips/trip-join-button';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Users, MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface TripChatPageProps {
  params: {
    id: string
  }
}

export default async function TripChatPage({ params }: TripChatPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Check if user is admin and redirect to admin dashboard
  const isAdmin = await isUserAdmin(session.user.id)
  
  if (isAdmin) {
    redirect("/admin")
  }

  // Parse the ID as number since we're using display_id for URLs
  const tripDisplayId = parseInt(params.id)
  if (isNaN(tripDisplayId)) {
    redirect("/dashboard")
  }

  let tripDetails: {
    trip: any | null,
    cities: any[],
    activities: any[],
    budgets: any[],
    expenses: any[],
    destinations: string[],
    itinerary: any[]
  } = {
    trip: null,
    cities: [],
    activities: [],
    budgets: [],
    expenses: [],
    destinations: [],
    itinerary: []
  }
  
  try {
    tripDetails = await getComprehensiveTripDetails(tripDisplayId, session.user.id)
  } catch (error) {
    console.error("Error fetching comprehensive trip details:", error)
  }

  if (!tripDetails.trip) {
    redirect("/dashboard")
  }

  // Check trip access permissions
  const isMember = await isTripMember(tripDisplayId, session.user.id);
  const isPublic = await isTripPublic(tripDisplayId);
  const isOwner = tripDetails.trip.user_id === session.user.id;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/trips/${params.id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trip
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{tripDetails.trip.name}</h1>
            <p className="text-muted-foreground">Trip Chat</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isOwner && (
            <TripInviteModal 
              tripId={tripDisplayId} 
              tripName={tripDetails.trip.name}
              trigger={
                <Button variant="outline" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Invite Members
                </Button>
              }
            />
          )}
        </div>
      </div>

      {/* Trip Info Card */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-muted-foreground">Dates:</span>
            <p>{new Date(tripDetails.trip.start_date).toLocaleDateString()} - {new Date(tripDetails.trip.end_date).toLocaleDateString()}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Status:</span>
            <p className="capitalize">{tripDetails.trip.status}</p>
          </div>
          <div>
            <span className="font-medium text-muted-foreground">Privacy:</span>
            <p className="capitalize">{tripDetails.trip.privacy || 'private'}</p>
          </div>
        </div>
      </div>

      {/* Chat Access Control */}
      {!isMember && !isPublic ? (
        <div className="text-center py-12">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Private Trip</h3>
          <p className="text-muted-foreground mb-6">
            This is a private trip. You need an invitation to access the chat.
          </p>
          <p className="text-sm text-muted-foreground">
            Contact the trip owner to get an invitation.
          </p>
        </div>
      ) : !isMember && isPublic ? (
        <div className="text-center py-12">
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-xl font-semibold mb-2">Join to Chat</h3>
          <p className="text-muted-foreground mb-6">
            This is a public trip. Join to participate in the chat.
          </p>
          <TripJoinButton tripId={tripDisplayId} tripName={tripDetails.trip.name} />
        </div>
      ) : (
        /* Chat Component */
        <TripChat 
          tripId={tripDisplayId}
          tripName={tripDetails.trip.name}
          isPublic={isPublic}
          isOwner={isOwner}
        />
      )}
    </div>
  )
}