"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Plus, Users, LogOut, Pencil } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
// import { useTripStore } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import EditProfileModal from "./edit-profile-modal"

interface UserType {
  id: string
  name: string
  email: string
  image?: string | null
  first_name: string
  last_name: string
  phone_number?: string
  city?: string
  country?: string
  role: string
  email_verified: boolean
}

interface Trip {
  id: string
  display_id?: number
  name: string
  description: string
  start_date: string
  end_date: string
  status: "planning" | "active" | "completed"
  cover_image?: string
}

export default function DashboardContent({ user, session }: { user: UserType; session?: any }) {
  const [recentTrips, setRecentTrips] = useState<Trip[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<UserType>(user)
  const router = useRouter()
  // const { trips, setTrips, clearStore } = useTripStore()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const tripsResponse = await fetch("/api/trips?limit=12")

      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json()
        setRecentTrips(tripsData)
        // setTrips(tripsData)
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // clearStore()
      await signOut({ redirect: true, callbackUrl: "/" })
      toast({ title: "Logged out successfully" })
    } catch (error) {
      console.error("Logout error:", error)
      toast({ title: "Logout failed", variant: "destructive" })
    }
  }

  const handleProfileUpdate = (updatedUser: UserType) => {
    setCurrentUser(updatedUser)
    // Update the session user data if needed
    if (session?.user) {
      session.user.name = updatedUser.name
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-600"
      case "completed":
        return "bg-blue-600"
      default:
        return "bg-yellow-600"
    }
  }

  const allTrips = recentTrips
  const preplanned = allTrips.filter((t) => t.status === "planning")
  const previous = allTrips.filter((t) => t.status === "completed")

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="h-[4vh]" />

      <div className="container mx-auto px-4 py-8">
        {/* Profile header card */}
        <Card className="bg-white border-gray-200 shadow-sm rounded-2xl mb-8">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
            <CardDescription>Manage your details and review your trips</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex justify-center md:justify-start">
                <div className="h-28 w-28 rounded-full bg-gray-100 grid place-items-center text-slate-500 border border-gray-200">
                  <Users className="h-12 w-12" />
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <p className="text-lg font-semibold">{currentUser.name || currentUser.email}</p>
                <p className="text-slate-500 text-sm break-all">{currentUser.email}</p>
                {currentUser.city && currentUser.country && (
                  <p className="text-slate-500 text-sm">
                    📍 {currentUser.city}, {currentUser.country}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-gray-300 text-slate-700 hover:bg-gray-50"
                    onClick={() => setIsEditProfileOpen(true)}
                  >
                    <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                  </Button>
                  <Link href="/trips">
                    <Button size="sm" variant="outline" className="border-gray-300 text-slate-700 hover:bg-gray-50">
                      <Users className="w-4 h-4 mr-2" /> My Trips
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preplanned Trips */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold">Preplanned Trips</h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          {preplanned.length === 0 ? (
            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardContent className="p-6 text-slate-500">No preplanned trips yet.</CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {preplanned.map((trip) => (
                <Card key={trip.id} className="bg-white border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="h-40 bg-gray-100">
                      {trip.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={trip.cover_image} alt={trip.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-slate-400"><MapPin className="w-6 h-6" /></div>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="font-semibold truncate">{trip.name}</p>
                      <p className="text-slate-500 text-sm truncate">{trip.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={`${getStatusColor(trip.status)} text-white`}>{trip.status}</Badge>
                        <Button size="sm" variant="outline" className="border-gray-300" onClick={() => router.push(`/trips/${trip.display_id || trip.id}`)}>View</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Previous Trips */}
        <div className="mb-4">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-semibold">Previous Trips</h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          {previous.length === 0 ? (
            <Card className="bg-white border-gray-200 rounded-2xl shadow-sm">
              <CardContent className="p-6 text-slate-500">No previous trips found.</CardContent>
            </Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {previous.map((trip) => (
                <Card key={trip.id} className="bg-white border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <CardContent className="p-0">
                    <div className="h-40 bg-gray-100">
                      {trip.cover_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={trip.cover_image} alt={trip.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-slate-400"><MapPin className="w-6 h-6" /></div>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <p className="font-semibold truncate">{trip.name}</p>
                      <p className="text-slate-500 text-sm truncate">{trip.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge className={`${getStatusColor(trip.status)} text-white`}>{trip.status}</Badge>
                        <Button size="sm" variant="outline" className="border-gray-300" onClick={() => router.push(`/trips/${trip.display_id || trip.id}`)}>View</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        user={currentUser}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  )
}
