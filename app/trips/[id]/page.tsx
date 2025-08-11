import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getTripById, getTripCities, getTripActivities } from "@/lib/database"
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

  let trip = null
  let cities = []
  let activities = []
  
  try {
    // Parse the ID as number since we're using SERIAL IDs now
    const tripId = parseInt(params.id)
    if (isNaN(tripId)) {
      redirect("/dashboard")
    }

    trip = await getTripById(tripId, session.user.id)
    if (trip) {
      // Fetch related data
      cities = await getTripCities(tripId)
      activities = await getTripActivities(tripId)
    }
  } catch (error) {
    console.error("Error fetching trip:", error)
  }

  if (!trip) {
    redirect("/dashboard")
  }

  return (
    <EnhancedTripDetails 
      trip={trip} 
      cities={cities}
      activities={activities}
    />
  )
}
