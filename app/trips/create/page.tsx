import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { isUserAdmin } from "@/lib/database"
import TripForm from "@/components/trips/trip-form"

export default async function CreateTripPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Check if user is admin and redirect to admin dashboard
  const isAdmin = await isUserAdmin(session.user.id)
  
  if (isAdmin) {
    redirect("/admin")
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <TripForm />
        </div>
      </div>
    </div>
  )
}
