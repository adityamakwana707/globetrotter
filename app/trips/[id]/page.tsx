import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { isUserAdmin, getComprehensiveTripDetails } from "@/lib/database"
import EnhancedTripDetails from "@/components/trips/enhanced-trip-details"

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
    // Parse the ID as number since we're using SERIAL IDs now
    const tripId = parseInt(params.id)
    if (isNaN(tripId)) {
      redirect("/dashboard")
    }

    tripDetails = await getComprehensiveTripDetails(tripId, session.user.id)
  } catch (error) {
    console.error("Error fetching comprehensive trip details:", error)
  }

  if (!tripDetails.trip) {
    redirect("/dashboard")
  }

  return (
    <EnhancedTripDetails 
      trip={tripDetails.trip} 
      cities={tripDetails.cities}
      activities={tripDetails.activities}
      budgets={tripDetails.budgets}
      expenses={tripDetails.expenses}
      destinations={tripDetails.destinations}
      itinerary={tripDetails.itinerary}
    />
  )
}
