"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { useTripStore } from "@/lib/store"
import { 
  Plus, 
  Search, 
  Filter,
  MapPin, 
  Calendar, 
  Edit,
  Trash2,
  Copy,
  ArrowLeft
} from "lucide-react"
import Image from "next/image"

interface Trip {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  status: "planning" | "active" | "completed"
  cover_image?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

export default function TripsListing() {
  const router = useRouter()
  const [trips, setTrips] = useState<Trip[]>([])
  const [filteredTrips, setFilteredTrips] = useState<Trip[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const { trips: storeTrips, setTrips: setStoreTrips } = useTripStore()

  useEffect(() => {
    fetchTrips()
  }, [])

  useEffect(() => {
    filterTrips()
  }, [trips, searchQuery, statusFilter])

  const fetchTrips = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/trips')
      if (response.ok) {
        const data = await response.json()
        setTrips(data)
        setStoreTrips(data)
      } else {
        throw new Error('Failed to fetch trips')
      }
    } catch (error) {
      console.error('Error fetching trips:', error)
      toast({
        title: "Error",
        description: "Failed to load trips. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterTrips = () => {
    let filtered = trips

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(trip =>
        trip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trip.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(trip => trip.status === statusFilter)
    }

    setFilteredTrips(filtered)
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">My Trips</h1>
              <p className="text-gray-400">Manage all your travel plans</p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/trips/create')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Trip
          </Button>
        </div>

        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search trips..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white pl-10"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all" className="text-white hover:bg-gray-600">All Status</SelectItem>
                    <SelectItem value="planning" className="text-white hover:bg-gray-600">Planning</SelectItem>
                    <SelectItem value="active" className="text-white hover:bg-gray-600">Active</SelectItem>
                    <SelectItem value="completed" className="text-white hover:bg-gray-600">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trips Grid */}
        {filteredTrips.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-12">
              <div className="text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {searchQuery || statusFilter !== "all" ? "No trips found" : "No trips yet"}
                </h3>
                <p className="text-gray-400 mb-6">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria." 
                    : "Start planning your first adventure!"}
                </p>
                {!searchQuery && statusFilter === "all" && (
                  <Button 
                    onClick={() => router.push('/trips/create')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Trip
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <Card key={trip.id} className="bg-gray-800 border-gray-700 hover:border-gray-600 transition-colors">
                <CardContent className="p-0">
                  {/* Cover Image */}
                  <div className="relative h-48 bg-gray-700 rounded-t-lg overflow-hidden">
                    {trip.cover_image ? (
                      <Image
                        src={trip.cover_image}
                        alt={trip.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="w-12 h-12 text-gray-500" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Badge className={`${getStatusColor(trip.status)} text-white`}>
                        {trip.status}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-2 truncate">
                      {trip.name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                      {trip.description || "No description"}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-gray-300 text-sm">
                        <Calendar className="w-4 h-4 mr-2" />
                        <span>
                          {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-300 text-sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>{calculateDuration(trip.start_date, trip.end_date)} days</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-between items-center">
                      <Button
                        onClick={() => router.push(`/trips/${trip.id}`)}
                        className="bg-blue-600 hover:bg-blue-700 flex-1 mr-2"
                      >
                        View Trip
                      </Button>
                      <div className="flex space-x-1">
                        <Button
                          onClick={() => router.push(`/trips/${trip.id}/edit`)}
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
