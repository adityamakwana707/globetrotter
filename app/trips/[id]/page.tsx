import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { getTripById } from "@/lib/database"
import TripDetails from "@/components/trips/trip-details"

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
  try {
    trip = await getTripById(params.id, session.user.id)
  } catch (error) {
    console.error("Error fetching trip:", error)
  }

  if (!trip) {
    redirect("/dashboard")
  }

  return <TripDetails trip={trip} />
}
