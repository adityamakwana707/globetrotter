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
  TrendingUp, Heart, Star, CircleIcon
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
  budgets?: any[]
  expenses?: any[]
  destinations?: string[]
  itinerary?: any[]
}

export default function EnhancedTripDetails({
  trip,
  cities,
  activities,
  budgets = [],
  expenses = [],
  destinations = [],
  itinerary = []
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
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {/* Trip Status Info Banner */}
                      {tripStatusInfo && (
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <span className="text-3xl">{tripStatusInfo.statusIcon}</span>
                    {trip.status === 'active' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                    )}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${tripStatusInfo.statusColor} text-emerald-700`}>
                      {tripStatusInfo.statusMessage}
                    </h3>
                    <p className="text-emerald-700/80 text-sm">
                      {getMotivationalMessage(tripStatusInfo.status, tripStatusInfo.daysUntilStart || tripStatusInfo.daysRemaining)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {tripStatusInfo.progressPercentage > 0 && (
                    <div className="space-y-2 text-right">
                      <div className="text-2xl font-bold text-transparent bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text">
                        {tripStatusInfo.progressPercentage}%
                      </div>
                      <Progress 
                        value={tripStatusInfo.progressPercentage} 
                        className="w-24 h-2 bg-gray-200 border border-gray-300"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="border-gray-300 text-slate-700 hover:bg-gray-50 w-full sm:w-auto"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleDuplicate}
                className="border-gray-300 text-slate-700 hover:bg-gray-50"
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
              <Button
                variant="outline"
                onClick={handleEdit}
                className="border-gray-300 text-slate-700 hover:bg-gray-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
                title={isDeleting ? "Deleting..." : "Delete"}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Trip Header */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Trip Info */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h1 className="text-4xl font-bold text-slate-900 mb-2">{trip.name}</h1>
                {trip.description && (
                  <p className="text-slate-600 text-lg">{trip.description}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-700">
                    {formatDateRange(trip.start_date, trip.end_date)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-green-400" />
                  <span className="text-slate-700">{tripDuration} days</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span className="text-slate-700">{cities.length} destinations</span>
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
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 mb-8 bg-white border-gray-200 shadow-sm rounded-lg p-0 gap-0">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg text-xs sm:text-sm px-2 sm:px-4 py-2">
              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg text-xs sm:text-sm px-2 sm:px-4 py-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="map" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg text-xs sm:text-sm px-2 sm:px-4 py-2">
              <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Map
            </TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg text-xs sm:text-sm px-2 sm:px-4 py-2">
              <DollarSign className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="weather" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg text-xs sm:text-sm px-2 sm:px-4 py-2">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Weather
            </TabsTrigger>
            <TabsTrigger value="sharing" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none transition-all duration-200 first:rounded-l-lg last:rounded-r-lg text-xs sm:text-sm px-2 sm:px-4 py-2">
              <Share2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              Share
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-8 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trip Summary */}
              <Card className="bg-white border-gray-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-slate-900">Trip Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-6 sm:gap-8">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl sm:text-4xl font-bold text-blue-600 mb-2">{cities.length}</div>
                      <div className="text-slate-600 text-sm font-medium">Cities</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl sm:text-4xl font-bold text-emerald-600 mb-2">{activities.length}</div>
                      <div className="text-slate-600 text-sm font-medium">Activities</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl sm:text-4xl font-bold text-purple-600 mb-2">{tripDuration}</div>
                      <div className="text-slate-600 text-sm font-medium">Days</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl sm:text-4xl font-bold text-amber-600 mb-2">
                        {trip.status === 'completed' ? '100%' : trip.status === 'active' ? '50%' : '0%'}
                      </div>
                      <div className="text-slate-600 text-sm font-medium">Complete</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Destinations */}
              <Card className="bg-white border-gray-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-slate-900">Destinations</CardTitle>
                </CardHeader>
                <CardContent>
                  {cities.length > 0 ? (
                    <div className="space-y-3">
                      {cities.map((city, index) => (
                        <div key={city.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <Badge variant="secondary" className="bg-blue-600 text-white">
                              {index + 1}
                            </Badge>
                            <div>
                              <div className="text-slate-900 font-medium">{city.name}</div>
                              <div className="text-slate-600 text-sm">{city.country}</div>
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
                    <p className="text-slate-500 text-center py-4">No destinations added yet</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Activities Preview */}
            {activities.length > 0 && (
              <Card className="bg-white border-gray-200 shadow-md">
                <CardHeader>
                  <CardTitle className="text-slate-900">Recent Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activities.slice(0, 6).map((activity) => (
                      <div key={activity.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="text-slate-900 font-medium mb-1">{activity.name}</h4>
                        {activity.category && (
                          <Badge variant="secondary" className="bg-purple-600 text-white text-xs mb-2">
                            {activity.category}
                          </Badge>
                        )}
                        {activity.description && (
                          <p className="text-slate-600 text-sm line-clamp-2">{activity.description}</p>
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
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-white">Trip Itinerary</CardTitle>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-blue-600">
                    {activities.length} Activities
                  </Badge>
                  <Badge variant="secondary" className="bg-purple-600">
                    {cities.length} Cities
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {itinerary && itinerary.length > 0 ? (
                  <ItineraryTimeline 
                    trip={trip} 
                    cities={cities} 
                    activities={activities} 
                    itinerary={itinerary}
                  />
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      No Itinerary Yet
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      Your trip itinerary will appear here once you start adding activities 
                      and organizing your schedule.
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleEdit}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Plan Itinerary
                    </Button>
                  </div>
                )}

                {/* Daily Summary Cards */}
                {itinerary && itinerary.length > 0 && (
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {itinerary.map((day: any, index: number) => (
                      <Card key={index} className="bg-gray-700 border-gray-600">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-400">Day {index + 1}</p>
                              <h4 className="text-white font-medium">
                                {formatDate(day.date)}
                              </h4>
                            </div>
                            <Badge 
                              variant="secondary"
                              className={
                                new Date(day.date) < new Date() 
                                  ? "bg-gray-600" 
                                  : new Date(day.date).toDateString() === new Date().toDateString()
                                  ? "bg-green-600"
                                  : "bg-blue-600"
                              }
                            >
                              {new Date(day.date) < new Date() 
                                ? "Past" 
                                : new Date(day.date).toDateString() === new Date().toDateString()
                                ? "Today"
                                : "Upcoming"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {day.city && (
                            <div className="flex items-center text-sm">
                              <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-gray-300">{day.city.name}</span>
                            </div>
                          )}
                          {day.activities && day.activities.length > 0 ? (
                            <div className="space-y-2">
                              {day.activities.map((activity: Activity, actIndex: number) => (
                                <div 
                                  key={actIndex}
                                  className="flex items-start p-2 rounded bg-gray-800"
                                >
                                  <div className="mr-3 mt-1">
                                    <CircleIcon className="w-2 h-2 text-blue-400" />
                                  </div>
                                  <div>
                                    <p className="text-sm text-white">{activity.name}</p>
                                    {activity.scheduled_time && (
                                      <p className="text-xs text-gray-400">
                                        {new Date(`2000-01-01T${activity.scheduled_time}`)
                                          .toLocaleTimeString('en-US', {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                          })}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-400">No activities planned</p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="mt-8 space-y-6">
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-900">Trip Route</CardTitle>
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
            <BudgetManager tripId={trip.id.toString()} />
          </TabsContent>

          {/* Weather Tab */}
          <TabsContent value="weather" className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cities.map((city) => (
                city.latitude && city.longitude && (
                  <WeatherWidget
                    key={city.id}
                    latitude={city.latitude}
                    longitude={city.longitude}
                    locationName={city.name}
                  />
                )
              ))}
            </div>
          </TabsContent>

          {/* Sharing Tab */}
          <TabsContent value="sharing" className="mt-8 space-y-6">
            <TripSharing tripId={trip.id} isPublic={trip.is_public} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
