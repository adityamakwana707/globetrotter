import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import ComprehensiveTripBuilder from "@/components/trips/comprehensive-trip-builder"

export default async function CreateTripPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-2">Create Your Perfect Trip</h1>
          <p className="text-gray-400 text-lg">Plan every detail with our comprehensive itinerary builder</p>
        </div>
        
        <ComprehensiveTripBuilder />
      </div>
    </div>
  )
}
