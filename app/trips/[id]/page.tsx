import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { isUserAdmin, getComprehensiveTripDetails } from "@/lib/database"
import { getTripById, getTripCities, getTripActivities, getTripByDisplayId } from "@/lib/database"
import EnhancedTripDetails from "@/components/trips/enhanced-trip-details"
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

interface TripPageProps {
  params: {
    id: string
  }
}

export default async function TripPage({ params }: TripPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Check if user is admin and redirect to admin dashboard
  const isAdmin = await isUserAdmin(session.user.id)
  
  if (isAdmin) {
    redirect("/admin")
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
    // Parse the ID as number since we're using display_id for URLs
    const tripDisplayId = parseInt(params.id)
    if (isNaN(tripDisplayId)) {
      redirect("/dashboard")
    }

    tripDetails = await getComprehensiveTripDetails(tripDisplayId, session.user.id)
  } catch (error) {
    console.error("Error fetching comprehensive trip details:", error)
  }

  if (!tripDetails.trip) {
    redirect("/dashboard")
  }

  return (
    <div>
      {/* Chat Button Header */}
      <div className="container mx-auto px-4 py-4 max-w-6xl">
        <div className="flex justify-end">
          <Link href={`/trips/${params.id}/chat`}>
            <Button variant="outline" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              Open Chat
            </Button>
          </Link>
        </div>
      </div>

      {/* Existing Trip Details */}
      <EnhancedTripDetails 
        trip={tripDetails.trip} 
        cities={tripDetails.cities}
        activities={tripDetails.activities}
        budgets={tripDetails.budgets}
        expenses={tripDetails.expenses}
        destinations={tripDetails.destinations}
        itinerary={tripDetails.itinerary}
      />
    </div>
  )
}
