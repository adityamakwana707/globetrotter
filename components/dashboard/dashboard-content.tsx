"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Plus, TrendingUp, Users, LogOut, Shield } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useTripStore } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

interface User {
  id: string
  name?: string | null
  email?: string | null
}

interface Trip {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  status: "planning" | "active" | "completed"
  cover_image?: string
}

export default function DashboardContent({ user }: { user: User }) {
  const [recentTrips, setRecentTrips] = useState<Trip[]>([])
  const [stats, setStats] = useState({
    totalTrips: 0,
    activeTrips: 0,
    completedTrips: 0,
    totalBudget: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const { trips, setTrips, clearStore } = useTripStore()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [tripsResponse, statsResponse, adminCheckResponse] = await Promise.all([
        fetch("/api/trips?limit=5"),
        fetch("/api/dashboard/stats"),
        fetch("/api/admin/stats?type=platform").then(res => res.ok).catch(() => false)
      ])

      if (tripsResponse.ok) {
        const tripsData = await tripsResponse.json()
        setRecentTrips(tripsData)
        setTrips(tripsData) // Update Zustand store
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      // Check if user has admin access
      setIsAdmin(adminCheckResponse)
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
      clearStore() // Clear Zustand store
      await signOut({ 
        redirect: true,
        callbackUrl: "/" 
      })
      toast({
        title: "Logged out successfully",
        description: "You have been logged out of your account.",
      })
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600"
      case "completed":
        return "bg-blue-600"
      default:
        return "bg-yellow-600"
    }
  }

  const popularDestinations = [
    { name: "Paris, France", image: "/paris-eiffel-tower.png" },
    { name: "Tokyo, Japan", image: "/placeholder-eoa7r.png" },
    { name: "New York, USA", image: "/vibrant-nyc-street.png" },
    { name: "Bali, Indonesia", image: "/bali-beach.png" },
  ]

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">GT</span>
            </div>
            <span className="text-2xl font-bold">GlobeTrotter</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, {user.name || user.email}</span>
            {isAdmin && (
              <Button 
                onClick={() => router.push("/admin")} 
                variant="outline"
                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
            <Button onClick={() => router.push("/trips/create")} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Trip
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline" 
              className="border-gray-600 text-gray-300 hover:bg-red-600 hover:text-white hover:border-red-600"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Trips</p>
                  <p className="text-2xl font-bold text-white">{stats.totalTrips}</p>
                </div>
                <MapPin className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Trips</p>
                  <p className="text-2xl font-bold text-white">{stats.activeTrips}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Completed</p>
                  <p className="text-2xl font-bold text-white">{stats.completedTrips}</p>
                </div>
                <Users className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Budget</p>
                  <p className="text-2xl font-bold text-white">${stats.totalBudget.toLocaleString()}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Trips */}
          <div className="lg:col-span-2">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Recent Trips</CardTitle>
                  <Link href="/trips">
                    <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300">
                      View All
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentTrips.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400 mb-4">No trips yet. Start planning your first adventure!</p>
                    <Button onClick={() => router.push("/trips/create")} className="bg-blue-600 hover:bg-blue-700">
                      Create Your First Trip
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentTrips.map((trip) => (
                      <div
                        key={trip.id}
                        className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                        onClick={() => router.push(`/trips/${trip.id}`)}
                      >
                        <div className="w-16 h-16 bg-gray-600 rounded-lg flex-shrink-0">
                          {trip.cover_image ? (
                            <img
                              src={trip.cover_image || "/placeholder.svg"}
                              alt={trip.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <MapPin className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-white font-semibold truncate">{trip.name}</h3>
                          <p className="text-gray-400 text-sm truncate">{trip.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={`${getStatusColor(trip.status)} text-white`}>{trip.status}</Badge>
                            <span className="text-gray-400 text-xs">
                              {new Date(trip.start_date).toLocaleDateString()} -{" "}
                              {new Date(trip.end_date).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Popular Destinations */}
          <div>
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Popular Destinations</CardTitle>
                <CardDescription className="text-gray-400">Trending places to visit</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {popularDestinations.map((destination, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-gray-600 rounded-lg flex-shrink-0">
                        <img
                          src={destination.image || "/placeholder.svg"}
                          alt={destination.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{destination.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gray-800 border-gray-700 mt-6">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => router.push("/trips/create")}
                  className="w-full bg-blue-600 hover:bg-blue-700 justify-start"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Trip
                </Button>
                <Button
                  onClick={() => router.push("/destinations")}
                  variant="outline"
                  className="w-full border-gray-600 text-white hover:bg-gray-700 justify-start"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Browse Destinations
                </Button>
                <Button
                  onClick={() => router.push("/profile")}
                  variant="outline"
                  className="w-full border-gray-600 text-white hover:bg-gray-700 justify-start"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
