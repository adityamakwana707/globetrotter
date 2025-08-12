import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getComprehensiveTripDetails, isUserAdmin } from "@/lib/database"
import ComprehensiveTripBuilder from "@/components/trips/comprehensive-trip-builder"

interface EditTripPageProps {
  params: {
    id: string
  }
}

export default async function EditTripPage({ params }: EditTripPageProps) {
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center gap-2">
              ✏️ Edit Your Adventure
            </h1>
            <p className="text-gray-400 text-lg">Update your trip details and make it even more amazing!</p>
          </div>
          
          <ComprehensiveTripBuilder 
            existingTrip={tripDetails.trip}
            existingCities={tripDetails.cities}
            existingActivities={tripDetails.activities}
            existingBudgets={tripDetails.budgets}
            existingDestinations={tripDetails.destinations}
            existingItinerary={tripDetails.itinerary}
          />
        </div>
      </div>
    </div>
  )
}
