"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { calculateTripStatus, getStatusBadgeStyle, getMotivationalMessage } from "@/lib/trip-status"
import { 
  Calendar, MapPin, Users, Share2, Edit, Trash2, 
  DollarSign, Clock, Camera, FileText, CheckCircle,
  ArrowLeft, Copy, ExternalLink, Download, Sparkles,
  TrendingUp, Heart, Star
} from "lucide-react"
import Image from "next/image"
import ItineraryTimeline from "./itinerary-timeline"
import BudgetManager from "@/components/budget/budget-manager"
import WeatherWidget from "@/components/weather/weather-widget"
import TripSharing from "./trip-sharing"
import LeafletMap from "@/components/maps/leaflet-map"
import SimpleMap from "@/components/maps/simple-map"
import { formatDate, formatDateRange, calculateDaysBetween } from "@/lib/date-utils"

interface Trip {
  id: number
  display_id: number
  user_id: string
  name: string
  description: string
  start_date: Date
  end_date: Date
  status: "planning" | "active" | "completed"
  cover_image?: string
  is_public: boolean
  share_token?: string
  allow_copy: boolean
  created_at: Date
  updated_at: Date
}

interface City {
  id: number
  name: string
  country: string
  latitude?: number
  longitude?: number
  timezone?: string
  image_url?: string
  order_index: number
  arrival_date?: Date
  departure_date?: Date
}

interface Activity {
  id: number
  name: string
  description?: string
  category?: string
  price_range?: string
  rating?: number
  duration_hours?: number
  image_url?: string
  scheduled_date?: Date
  scheduled_time?: string
  order_index?: number
  notes?: string
  estimated_cost?: number
  actual_cost?: number
}

interface EnhancedTripDetailsProps {
  trip: Trip
  cities: City[]
  activities: Activity[]
}

export default function EnhancedTripDetails({
  trip,
  cities,
  activities
}: EnhancedTripDetailsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [isDeleting, setIsDeleting] = useState(false)
  const [tripStatusInfo, setTripStatusInfo] = useState<any>(null)

  const tripDuration = calculateDaysBetween(trip.start_date, trip.end_date)

  // Calculate trip status on component mount and update
  useEffect(() => {
    const statusInfo = calculateTripStatus(trip.start_date, trip.end_date)
    setTripStatusInfo(statusInfo)
  }, [trip.start_date, trip.end_date])

  const statusBadgeStyle = getStatusBadgeStyle(trip.status)

  const handleEdit = () => {
    router.push(`/trips/${trip.display_id}/edit`)
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
      return
    }

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/trips/${trip.display_id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete trip')
      }

      toast({
        title: "Trip deleted",
        description: "Your trip has been successfully deleted.",
      })

      router.push("/dashboard")
    } catch (error) {
      console.error('Error deleting trip:', error)
      toast({
        title: "Error",
        description: "Failed to delete trip. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    try {
      const response = await fetch(`/api/trips/${trip.display_id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${trip.name} (Copy)`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate trip')
      }

      const result = await response.json()
      
      toast({
        title: "Trip duplicated",
        description: "A copy of your trip has been created.",
      })

      router.push(`/trips/${result.trip.display_id}`)
    } catch (error) {
      console.error('Error duplicating trip:', error)
      toast({
        title: "Error",
        description: "Failed to duplicate trip. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Trip Status Info Banner */}
          {tripStatusInfo && (
            <div className="mb-6 p-4 bg-gradient-to-r from-gray-900/80 to-gray-800/80 border border-gray-700 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <span className="text-3xl">{tripStatusInfo.statusIcon}</span>
                    {trip.status === 'active' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${tripStatusInfo.statusColor}`}>
                      {tripStatusInfo.statusMessage}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {getMotivationalMessage(tripStatusInfo.status, tripStatusInfo.daysUntilStart || tripStatusInfo.daysRemaining)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {tripStatusInfo.progressPercentage > 0 && (
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-blue-400">
                        {tripStatusInfo.progressPercentage}%
                      </div>
                      <Progress 
                        value={tripStatusInfo.progressPercentage} 
                        className="w-24 h-2 bg-gray-700"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={handleDuplicate}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                onClick={handleEdit}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>

          {/* Trip Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trip Info */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{trip.name}</h1>
                {trip.description && (
                  <p className="text-gray-300 text-lg">{trip.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-300">
                    {formatDateRange(trip.start_date, trip.end_date)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-gray-300">{tripDuration} days</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span className="text-gray-300">{cities.length} destinations</span>
                </div>

                <Badge 
                  variant="secondary" 
                  className={statusBadgeStyle.className}
                >
                  <span className="mr-1">{statusBadgeStyle.icon}</span>
                  {statusBadgeStyle.label}
                </Badge>

                {trip.is_public && (
                  <Badge variant="secondary" className="bg-blue-600 text-white">
                    <Share2 className="w-3 h-3 mr-1" />
                    Public
                  </Badge>
                )}
              </div>
            </div>

            {/* Cover Image */}
            {trip.cover_image && (
              <div className="lg:col-span-1">
                <div className="relative h-48 lg:h-full rounded-lg overflow-hidden">
                  <Image
                    src={trip.cover_image}
                    alt={trip.name}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8 bg-gray-800 border-gray-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
              <FileText className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="data-[state=active]:bg-gray-700">
              <Calendar className="w-4 h-4 mr-2" />
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-gray-700">
              <MapPin className="w-4 h-4 mr-2" />
              Map
            </TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-gray-700">
              <DollarSign className="w-4 h-4 mr-2" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="weather" className="data-[state=active]:bg-gray-700">
              <Calendar className="w-4 h-4 mr-2" />
              Weather
            </TabsTrigger>
            <TabsTrigger value="sharing" className="data-[state=active]:bg-gray-700">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trip Summary */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Trip Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-400">{cities.length}</div>
                      <div className="text-gray-400 text-sm">Cities</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-400">{activities.length}</div>
                      <div className="text-gray-400 text-sm">Activities</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-400">{tripDuration}</div>
                      <div className="text-gray-400 text-sm">Days</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-400">
                        {trip.status === 'completed' ? '100%' : trip.status === 'active' ? '50%' : '0%'}
                      </div>
                      <div className="text-gray-400 text-sm">Complete</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Destinations */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Destinations</CardTitle>
                </CardHeader>
                <CardContent>
                  {cities.length > 0 ? (
                    <div className="space-y-3">
                      {cities.map((city, index) => (
                        <div key={city.id} className="flex items-center justify-between p-3 bg-gray-700 rounded">
                          <div className="flex items-center space-x-3">
                            <Badge variant="secondary" className="bg-blue-600 text-white">
                              {index + 1}
                            </Badge>
                            <div>
                              <div className="text-white font-medium">{city.name}</div>
                              <div className="text-gray-400 text-sm">{city.country}</div>
                            </div>
                          </div>
                          {city.arrival_date && (
                            <div className="text-gray-400 text-sm">
                              {new Date(city.arrival_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-4">No destinations added yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activities Preview */}
            {activities.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activities.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="p-3 bg-gray-700 rounded">
                        <h4 className="text-white font-medium mb-1">{activity.name}</h4>
                        {activity.category && (
                          <Badge variant="secondary" className="bg-purple-600 text-white text-xs mb-2">
                            {activity.category}
                          </Badge>
                        )}
                        {activity.description && (
                          <p className="text-gray-400 text-sm line-clamp-2">{activity.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                  {activities.length > 6 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab("itinerary")}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        View All Activities
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Itinerary Tab */}
          <TabsContent value="itinerary" className="space-y-6">
            <ItineraryTimeline
              trip={trip}
              cities={cities}
              activities={activities}
            />
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Trip Route</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Try Leaflet first, fallback to SimpleMap */}
                <div className="relative">
                  <LeafletMap
                    locations={cities.map(city => ({
                      lat: city.latitude || 0,
                      lng: city.longitude || 0,
                      title: city.name,
                      description: city.country
                    }))}
                    showRoute={true}
                    height="384px"
                    className="rounded-b-lg"
                  />
                  
                  {/* Fallback message */}
                  <div className="absolute bottom-2 right-2 z-20">
                    <div className="bg-green-600/90 backdrop-blur-sm rounded-lg px-2 py-1 shadow-lg">
                      <span className="text-xs text-white font-medium">
                        Free OpenStreetMap
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Tab */}
          <TabsContent value="budget" className="space-y-6">
            <BudgetManager tripId={trip.id} />
          </TabsContent>

          {/* Weather Tab */}
          <TabsContent value="weather" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cities.map((city) => (
                city.latitude && city.longitude && (
                  <WeatherWidget
                    key={city.id}
                    location={{
                      lat: city.latitude,
                      lng: city.longitude,
                      name: city.name
                    }}
                  />
                )
              ))}
            </div>
          </TabsContent>

          {/* Sharing Tab */}
          <TabsContent value="sharing" className="space-y-6">
            <TripSharing tripId={trip.id} isPublic={trip.is_public} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
