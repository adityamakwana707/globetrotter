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
  MapPin, Star, DollarSign, Globe, Users, Clock, 
  ArrowLeft, Calendar, Heart, Share2, Camera, 
  Thermometer, Navigation, Activity as ActivityIcon,
  Plane, TrendingUp, Award
} from "lucide-react"

interface City {
  id: number
  display_id: number
  name: string
  country: string
  latitude: number | null
  longitude: number | null
  timezone: string | null
  description: string | null
  image_url: string | null
  cost_index: number | null
  popularity_score: number | null
  trip_count: number
  activity_count: number
  created_at: string
}

interface Activity {
  id: number
  name: string
  description: string | null
  category: string | null
  price_range: string | null
  rating: number | null
  duration: number | null
  latitude: number | null
  longitude: number | null
  image_url: string | null
  city_name: string
  city_country: string
}

interface Trip {
  id: number
  title: string
  description: string | null
  status: string
  start_date: string
  end_date: string
  budget: number | null
  creator_name: string
}

interface CityDetailData {
  city: City
  activities: Activity[]
  trips: Trip[]
  nearbyCities: City[]
}

export default function CityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const cityId = params.id as string

  const [data, setData] = useState<CityDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)

  useEffect(() => {
    const fetchCityDetails = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/cities/${cityId}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("City not found")
          } else {
            setError("Failed to load city details")
          }
          return
        }

        const cityData = await response.json()
        setData(cityData)
      } catch (err) {
        console.error("Error fetching city details:", err)
        setError("Failed to load city details")
      } finally {
        setIsLoading(false)
      }
    }

    if (cityId) {
      fetchCityDetails()
    }
  }, [cityId])

  if (isLoading) {
    return (
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
    )
  }

  if (error || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{error || "City not found"}</h3>
          <p className="text-muted-foreground mb-4">
            Sorry, we couldn't find the city you're looking for.
          </p>
          <Button onClick={() => router.push("/cities")} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Cities
          </Button>
        </div>
      </div>
    )
  }

  const { city, activities, trips, nearbyCities } = data

  // Calculate cost info
  const getCostInfo = (costIndex: number | null) => {
    if (!costIndex) return { level: "Unknown", icon: "❓", color: "bg-gray-100" }
    
    if (costIndex <= 30) return { level: "Budget", icon: "💰", color: "bg-green-100 text-green-800" }
    if (costIndex <= 70) return { level: "Moderate", icon: "💰💰", color: "bg-yellow-100 text-yellow-800" }
    return { level: "Expensive", icon: "💰💰💰", color: "bg-red-100 text-red-800" }
  }

  const costInfo = getCostInfo(city.cost_index)

  const getPopularityLevel = (score: number | null) => {
    if (!score) return "Unknown"
    if (score >= 80) return "Very Popular"
    if (score >= 60) return "Popular" 
    if (score >= 40) return "Moderate"
    return "Emerging"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.push("/cities")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Cities
        </Button>
        <div className="text-sm text-muted-foreground">
          <Link href="/cities" className="hover:text-foreground">Cities</Link>
          <span className="mx-2">/</span>
          <span>{city.name}</span>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative rounded-xl overflow-hidden mb-8">
        <div className="aspect-[21/9] relative">
          <Image
            src={city.image_url || "/placeholder.jpg"}
            alt={city.name}
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
                  <Globe className="h-5 w-5" />
                  <span className="text-sm font-medium">{city.country}</span>
                </div>
                <h1 className="text-4xl font-bold mb-2">{city.name}</h1>
                <p className="text-lg text-white/90 max-w-2xl">
                  {city.description || `Discover the amazing city of ${city.name} in ${city.country}`}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={isLiked ? "default" : "secondary"}
                  onClick={() => setIsLiked(!isLiked)}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isLiked ? "fill-current" : ""}`} />
                  {isLiked ? "Saved" : "Save"}
                </Button>
                <Button size="sm" variant="secondary">
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
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-blue-600" />
            <p className="text-sm text-muted-foreground">Popularity</p>
            <p className="font-semibold">{getPopularityLevel(city.popularity_score)}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-6 w-6 mx-auto mb-2 text-green-600" />
            <p className="text-sm text-muted-foreground">Cost Level</p>
            <p className="font-semibold">{costInfo.level}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Plane className="h-6 w-6 mx-auto mb-2 text-purple-600" />
            <p className="text-sm text-muted-foreground">Trips</p>
            <p className="font-semibold">{city.trip_count}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <ActivityIcon className="h-6 w-6 mx-auto mb-2 text-orange-600" />
            <p className="text-sm text-muted-foreground">Activities</p>
            <p className="font-semibold">{city.activity_count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activities">Activities ({activities.length})</TabsTrigger>
          <TabsTrigger value="trips">Trips ({trips.length})</TabsTrigger>
          <TabsTrigger value="nearby">Nearby Cities</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                City Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {city.description && (
                <div>
                  <h4 className="font-medium mb-2">About {city.name}</h4>
                  <p className="text-muted-foreground">{city.description}</p>
                </div>
              )}
              
              <Separator />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Country:</span>
                    <span>{city.country}</span>
                  </div>
                  
                  {city.timezone && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Timezone:</span>
                      <span>{city.timezone}</span>
                    </div>
                  )}
                  
                  {city.latitude && city.longitude && (
                    <div className="flex items-center gap-2">
                      <Navigation className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Coordinates:</span>
                      <span>{city.latitude.toFixed(2)}, {city.longitude.toFixed(2)}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  {city.cost_index && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Cost Index:</span>
                      <Badge variant="outline" className={costInfo.color}>
                        {city.cost_index}/100 - {costInfo.level}
                      </Badge>
                    </div>
                  )}
                  
                  {city.popularity_score && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Popularity:</span>
                      <Badge variant="outline">
                        {city.popularity_score}/100 - {getPopularityLevel(city.popularity_score)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activities Tab */}
        <TabsContent value="activities">
          {activities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <div className="aspect-video relative">
                    <Image
                      src={activity.image_url || "/placeholder.jpg"}
                      alt={activity.name}
                      fill
                      className="object-cover rounded-t-lg"
                    />
                    {activity.category && (
                      <Badge className="absolute top-2 left-2 bg-black/70 text-white">
                        {activity.category}
                      </Badge>
                    )}
                    {activity.rating && (
                      <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {activity.rating.toFixed(1)}
                      </Badge>
                    )}
                  </div>
                  
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{activity.name}</CardTitle>
                    {activity.price_range && (
                      <CardDescription className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        {activity.price_range}
                      </CardDescription>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    {activity.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {activity.description}
                      </p>
                    )}
                    
                    <div className="flex justify-between items-center">
                      {activity.duration && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{activity.duration}h</span>
                        </div>
                      )}
                      
                      <Button size="sm" variant="outline">
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <ActivityIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No activities available</h3>
                <p className="text-muted-foreground">
                  We don't have any activities listed for {city.name} yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trips Tab */}
        <TabsContent value="trips">
          {trips.length > 0 ? (
            <div className="space-y-4">
              {trips.map((trip) => (
                <Card key={trip.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{trip.title}</CardTitle>
                        <CardDescription>
                          by {trip.creator_name} • {trip.status}
                        </CardDescription>
                      </div>
                      <Badge variant="outline">
                        {new Date(trip.start_date).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  {trip.description && (
                    <CardContent>
                      <p className="text-muted-foreground">{trip.description}</p>
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                          </span>
                          {trip.budget && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${trip.budget}
                            </span>
                          )}
                        </div>
                        <Button size="sm" variant="outline">
                          View Trip
                        </Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No trips available</h3>
                <p className="text-muted-foreground">
                  No public trips to {city.name} have been shared yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Nearby Cities Tab */}
        <TabsContent value="nearby">
          {nearbyCities.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {nearbyCities.map((nearbyCity) => {
                const nearbyCostInfo = getCostInfo(nearbyCity.cost_index)
                return (
                  <Card 
                    key={nearbyCity.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => router.push(`/cities/${nearbyCity.id}`)}
                  >
                    <div className="aspect-video relative">
                      <Image
                        src={nearbyCity.image_url || "/placeholder.jpg"}
                        alt={nearbyCity.name}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                      {nearbyCity.popularity_score && (
                        <Badge className="absolute top-2 right-2 bg-black/70 text-white">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          {nearbyCity.popularity_score}
                        </Badge>
                      )}
                    </div>
                    
                    <CardHeader>
                      <CardTitle className="text-lg">{nearbyCity.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        {nearbyCity.country}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className={nearbyCostInfo.color}>
                          {nearbyCostInfo.level}
                        </Badge>
                        <Button size="sm" variant="outline">
                          Explore
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No nearby cities</h3>
                <p className="text-muted-foreground">
                  We don't have other cities listed in {city.country} yet.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
