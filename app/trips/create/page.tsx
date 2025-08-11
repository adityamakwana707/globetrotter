import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import TripForm from "@/components/trips/trip-form"

export default async function CreateTripPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create New Trip</h1>
            <p className="text-gray-400">Plan your next adventure with detailed itinerary and budget tracking.</p>
          </div>
          
          <TripForm />
        </div>
      </div>
    </div>
  )
}
