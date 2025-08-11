import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getTripById } from "@/lib/database"
import TripForm from "@/components/trips/trip-form"

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

  let trip = null
  try {
    trip = await getTripById(params.id, session.user.id)
  } catch (error) {
    console.error("Error fetching trip:", error)
  }

  if (!trip) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Edit Trip</h1>
            <p className="text-gray-400">Update your trip details and itinerary.</p>
          </div>
          
          <TripForm trip={trip} />
        </div>
      </div>
    </div>
  )
}
