import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { isUserAdmin } from "@/lib/database"
import TripsListing from "@/components/trips/trips-listing"

export default async function TripsPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Check if user is admin and redirect to admin dashboard
  const isAdmin = await isUserAdmin(session.user.id)
  
  if (isAdmin) {
    redirect("/admin")
  }

  return <TripsListing />
}
