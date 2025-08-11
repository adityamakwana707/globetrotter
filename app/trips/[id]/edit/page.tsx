import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getTripById, isUserAdmin } from "@/lib/database"
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

  // Check if user is admin and redirect to admin dashboard
  const isAdmin = await isUserAdmin(session.user.id)
  
  if (isAdmin) {
    redirect("/admin")
  }

  let trip = null
  try {
    // Parse the ID as number since we're using SERIAL IDs now
    const tripId = parseInt(params.id)
    if (isNaN(tripId)) {
      redirect("/dashboard")
    }

    trip = await getTripById(tripId, session.user.id)
  } catch (error) {
    console.error("Error fetching trip:", error)
  }

  if (!trip) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <TripForm trip={trip} />
        </div>
      </div>
    </div>
  )
}
