import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { isUserAdmin } from "@/lib/database"

import { getTripById, getTripCities, getTripActivities, getTripByDisplayId } from "@/lib/database"
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

  let trip = null
  let cities = []
  let activities = []
  
  try {
    // Parse the ID as number since we're using display_id for URLs
    const tripDisplayId = parseInt(params.id)
    if (isNaN(tripDisplayId)) {
      redirect("/dashboard")
    }

    trip = await getTripByDisplayId(tripDisplayId, session.user.id)
    if (trip) {
      // Fetch related data using the actual trip ID (UUID)
      cities = await getTripCities(Number(trip.id))
      activities = await getTripActivities(Number(trip.id))
    }
  } catch (error) {
    console.error("Error fetching trip:", error)
  }

  if (!trip) {
    redirect("/dashboard")
  }

  return (
    <EnhancedTripDetails 
      trip={{ ...trip, id: Number(trip.id) }} 
      cities={cities}
      activities={activities}
    />
  )
}
