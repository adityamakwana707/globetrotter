"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { 
  MapPin, Star, DollarSign, Clock, ArrowLeft, Calendar, 
  Heart, Share2, Users, Navigation, Globe, Bookmark,
  Activity as ActivityIcon, Plane, ExternalLink, Map
} from "lucide-react"

interface Activity {
  id: number
  display_id: number
  name: string
  description: string | null
  category: string | null
  price_range: string | null
  rating: number | null
  duration_hours: number | null
  city_id: number | null
  latitude: number | null
  longitude: number | null
  image_url: string | null
  website_url: string | null
  city_name: string | null
  city_country: string | null
  city_latitude: number | null
  city_longitude: number | null
  city_timezone: string | null
  city_description: string | null
  booking_count: number
  created_at: string
}

interface Trip {
  id: number
  title: string
  description: string | null
  status: string
  start_date: string
  end_date: string
}

interface ActivityDetailData {
  activity: Activity
  similarActivities: Activity[]
  cityActivities: Activity[]
  trips: Trip[]
}

export default function ActivityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const activityId = params.id as string

  const [data, setData] = useState<ActivityDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [isBookmarked, setIsBookmarked] = useState(false)

  useEffect(() => {
    const fetchActivityDetails = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/activities/${activityId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Activity not found")
          } else {
            setError("Failed to load activity details")
          }
          return
        }

        const activityData = await response.json()
        setData(activityData)
      } catch (err) {
        console.error("Error fetching activity details:", err)
        setError("Failed to load activity details")
      } finally {
        setIsLoading(false)
      }
    }

    if (activityId) {
      fetchActivityDetails()
    }
  }, [activityId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900">
        <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 text-slate-900">
        <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <ActivityIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-slate-900">{error || "Activity not found"}</h3>
          <p className="text-slate-600 mb-4">
            Sorry, we couldn't find the activity you're looking for.
          </p>
          <Button onClick={() => router.push("/activities")} variant="outline" className="border-gray-300 text-slate-700 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Activities
          </Button>
        </div>
        </div>
      </div>
    )
  }

  const { activity, similarActivities, cityActivities, trips } = data

  // Get price category info
  const getPriceCategory = (priceRange: string | null) => {
    if (!priceRange) return { level: "Unknown", color: "bg-gray-100" }
    
    const price = priceRange.toLowerCase()
    if (price.includes('free') || price.includes('$0')) return { level: "Free", color: "bg-emerald-100 text-emerald-800" }
    if (price.includes('$') && (price.includes('1') || price.includes('2'))) return { level: "Budget", color: "bg-blue-100 text-blue-800" }
    if (price.includes('$') && (price.includes('3') || price.includes('4'))) return { level: "Moderate", color: "bg-amber-100 text-amber-800" }
    return { level: "Premium", color: "bg-red-100 text-red-800" }
  }

  const priceInfo = getPriceCategory(activity.price_range)

  const getDurationText = (hours: number | null) => {
    if (!hours) return "Duration varies"
    if (hours < 1) return `${hours * 60} minutes`
    if (hours === 1) return "1 hour"
    if (hours < 8) return `${hours} hours`
    if (hours < 24) return `${Math.floor(hours)} hours`
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''}`
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="border-gray-300 text-slate-700 hover:bg-gray-50"
          onClick={() => router.push("/activities")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Activities
        </Button>
        <div className="text-sm text-slate-600">
          <Link href="/activities" className="hover:text-slate-900">Activities</Link>
          <span className="mx-2">/</span>
          <span>{activity.name}</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden mb-8">
        <div className="aspect-[21/9] relative">
          <Image
            src={activity.image_url || "/placeholder.jpg"}
            alt={activity.name}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Hero Content */}
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {activity.category && (
                    <Badge className="bg-white/20 text-white border-white/30">
                      {activity.category}
                    </Badge>
                  )}
                  {activity.city_name && (
                    <div className="flex items-center gap-1 text-sm">
                      <MapPin className="h-4 w-4" />
                      <span>{activity.city_name}, {activity.city_country}</span>
                    </div>
                  )}
                </div>
                <h1 className="text-4xl font-bold mb-2">{activity.name}</h1>
                <p className="text-lg text-white/90 max-w-2xl">
                  {activity.description || `Experience ${activity.name} in ${activity.city_name}`}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isLiked ? "default" : "secondary"}
                  className={isLiked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white/20 text-white border-white/30 hover:bg-white/30"}
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                  {isLiked ? "Liked" : "Like"}
                </Button>
                <Button
                  size="sm"
                  variant={isBookmarked ? "default" : "secondary"}
                  className={isBookmarked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-white/20 text-white border-white/30 hover:bg-white/30"}
                  onClick={() => setIsBookmarked(!isBookmarked)}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? "fill-current" : ""}`} />
                  {isBookmarked ? "Saved" : "Save"}
                </Button>
                <Button size="sm" variant="secondary" className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-white border-gray-200 shadow-md">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-sm text-slate-600">Rating</p>
            <p className="font-semibold">
              {activity.rating ? `${activity.rating.toFixed(1)} ⭐` : "No rating"}
            </p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-200 shadow-md">
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-emerald-600" />
            <p className="text-sm text-slate-600">Price</p>
            <p className="font-semibold">{activity.price_range || "Contact for price"}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-200 shadow-md">
          <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-slate-600">Duration</p>
            <p className="font-semibold">{getDurationText(activity.duration_hours)}</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white border-gray-200 shadow-md">
          <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-slate-600">Bookings</p>
            <p className="font-semibold">{activity.booking_count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white border border-gray-200 shadow-sm rounded-lg p-0 gap-0 overflow-x-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=inactive]:text-slate-600 whitespace-nowrap">Overview</TabsTrigger>
          <TabsTrigger value="location" className="text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=inactive]:text-slate-600 whitespace-nowrap">Location</TabsTrigger>
          <TabsTrigger value="similar" className="text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=inactive]:text-slate-600 whitespace-nowrap">Similar ({similarActivities.length})</TabsTrigger>
          <TabsTrigger value="trips" className="text-xs sm:text-sm px-2 sm:px-3 py-2 data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=inactive]:text-slate-600 whitespace-nowrap">Trips ({trips.length})</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-12 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2">
              <Card className="bg-white border-gray-200 shadow-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <ActivityIcon className="h-5 w-5 text-emerald-600" />
                    Activity Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {activity.description && (
                    <div>
                      <h4 className="font-medium mb-2 text-slate-900">About this Activity</h4>
                      <p className="text-slate-600">{activity.description}</p>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      {activity.category && (
                        <div className="flex items-center gap-2">
                          <ActivityIcon className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-900">Category:</span>
                          <Badge variant="outline" className="border-gray-300 text-slate-700">{activity.category}</Badge>
                        </div>
                      )}
                      
                      {activity.price_range && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-900">Price Range:</span>
                          <Badge variant="outline" className={priceInfo.color}>
                            {activity.price_range}
                          </Badge>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {activity.duration_hours && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-900">Duration:</span>
                          <span>{getDurationText(activity.duration_hours)}</span>
                        </div>
                      )}
                      
                      {activity.rating && (
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-slate-500" />
                          <span className="font-medium text-slate-900">Rating:</span>
                          <div className="flex items-center gap-1">
                            <span>{activity.rating.toFixed(1)}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-3 w-3 ${
                                    i < Math.floor(activity.rating!)
                                      ? "text-yellow-400 fill-current"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {activity.website_url && (
                    <>
                      <Separator />
                      <div>
                        <Button variant="outline" asChild className="border-gray-300 text-slate-700 hover:bg-gray-50">
                          <a 
                            href={activity.website_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Visit Website
                          </a>
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div>
              {activity.city_name && (
                <Card className="bg-white border-gray-200 shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-slate-900">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      Location
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="font-medium text-slate-900">{activity.city_name}</p>
                      <p className="text-sm text-slate-600">{activity.city_country}</p>
                    </div>
                    
                    {activity.city_description && (
                      <p className="text-sm text-slate-600">{activity.city_description}</p>
                    )}
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      {activity.latitude && activity.longitude && (
                        <div className="flex items-center gap-2">
                          <Navigation className="h-3 w-3 text-slate-500" />
                          <span>{activity.latitude.toFixed(4)}, {activity.longitude.toFixed(4)}</span>
                        </div>
                      )}
                      
                      {activity.city_timezone && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-slate-500" />
                          <span>{activity.city_timezone}</span>
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full border-gray-300 text-slate-700 hover:bg-gray-50"
                      onClick={() => router.push(`/cities/${activity.city_id}`)}
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Explore {activity.city_name}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Location Tab */}
        <TabsContent value="location" className="mt-12">
          <Card className="bg-white border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Map className="h-5 w-5 text-emerald-600" />
                Location & Getting There
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-slate-900">Address & Coordinates</h4>
                  <div className="space-y-2 text-sm">
                    <p>{activity.city_name}, {activity.city_country}</p>
                    {activity.latitude && activity.longitude && (
                      <p className="text-slate-600">
                        Coordinates: {activity.latitude.toFixed(6)}, {activity.longitude.toFixed(6)}
                      </p>
                    )}
                    {activity.city_timezone && (
                      <p className="text-slate-600">Timezone: {activity.city_timezone}</p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 text-slate-900">Quick Actions</h4>
                  <div className="space-y-2">
                    {activity.website_url && (
                      <Button variant="outline" size="sm" asChild className="w-full justify-start border-gray-300 text-slate-700 hover:bg-gray-50">
                        <a href={activity.website_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Official Website
                        </a>
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start border-gray-300 text-slate-700 hover:bg-gray-50"
                      onClick={() => router.push(`/cities/${activity.city_id}`)}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      View City Details
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Other activities in the same city */}
          {cityActivities.length > 0 && (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-slate-900">More Activities in {activity.city_name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {cityActivities.slice(0, 3).map((cityActivity) => (
                    <Card 
                      key={cityActivity.id}
                      className="cursor-pointer hover:shadow-md transition-shadow bg-white border-gray-200 shadow-sm"
                      onClick={() => router.push(`/activities/${cityActivity.id}`)}
                    >
                      <div className="aspect-video relative">
                        <Image
                          src={cityActivity.image_url || "/placeholder.jpg"}
                          alt={cityActivity.name}
                          fill
                          className="object-cover rounded-t-lg"
                        />
                        {cityActivity.rating && (
                          <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                            <Star className="h-3 w-3 mr-1 fill-current" />
                            {cityActivity.rating.toFixed(1)}
                          </Badge>
                        )}
                      </div>
                      
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-slate-900">{cityActivity.name}</CardTitle>
                        {cityActivity.price_range && (
                          <CardDescription className="text-xs text-slate-600">
                            {cityActivity.price_range}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  ))}
                </div>
                
                {cityActivities.length > 3 && (
                  <div className="mt-4 text-center">
                    <Button 
                      variant="outline" 
                      className="border-gray-300 text-slate-700 hover:bg-gray-50"
                      onClick={() => router.push(`/cities/${activity.city_id}`)}
                    >
                      View All Activities in {activity.city_name}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Similar Activities Tab */}
        <TabsContent value="similar" className="mt-12">
          {similarActivities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarActivities.map((similar) => (
                <Card 
                  key={similar.id}
                  className="cursor-pointer hover:shadow-md transition-shadow bg-white border-gray-200 shadow-md"
                  onClick={() => router.push(`/activities/${similar.id}`)}
                >
                  <div className="aspect-video relative">
                    <Image
                      src={similar.image_url || "/placeholder.jpg"}
                      alt={similar.name}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    {similar.category && (
                      <Badge className="absolute top-2 left-2 bg-black/70 text-white">
                        {similar.category}
                      </Badge>
                    )}
                    {similar.rating && (
                      <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {similar.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-900">{similar.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {similar.city_name}, {similar.city_country}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        {similar.price_range && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {similar.price_range}
                          </span>
                        )}
                        {similar.duration_hours && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {getDurationText(similar.duration_hours)}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardContent className="text-center py-12">
                <ActivityIcon className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-slate-900">No similar activities</h3>
                <p className="text-slate-600">
                  We couldn't find other activities in the {activity.category} category.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trips Tab */}
        <TabsContent value="trips" className="mt-12">
          {trips.length > 0 ? (
            <div className="space-y-4">
              {trips.map((trip) => (
                <Card key={trip.id} className="bg-white border-gray-200 shadow-md">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-slate-900">{trip.title}</CardTitle>
                        <CardDescription className="text-slate-600">Status: {trip.status}</CardDescription>
                      </div>
                      <Badge variant="outline" className="border-gray-300 text-slate-700">
                        {new Date(trip.start_date).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {trip.description && (
                    <CardContent>
                      <p className="text-slate-600 mb-4">{trip.description}</p>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                          </span>
                        </div>
                        <Button size="sm" variant="outline" className="border-gray-300 text-slate-700 hover:bg-gray-50">
                          View Trip
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-white border-gray-200 shadow-md">
              <CardContent className="text-center py-12">
                <Plane className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-slate-900">No trips available</h3>
                <p className="text-slate-600">
                  This activity hasn't been included in any public trips yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
