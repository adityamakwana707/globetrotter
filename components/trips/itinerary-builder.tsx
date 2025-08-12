"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { 
  Plus, 
  Search, 
  MapPin, 
  Clock, 
  Star, 
  DollarSign,
  Trash2,
  Calendar
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import LocationSearch from "@/components/maps/location-search"
import LeafletMap from "@/components/maps/leaflet-map"
import TravelTimeCalculator from "./travel-time-calculator"
import DragDropItinerary from "./drag-drop-itinerary"

interface City {
  id: string
  name: string
  country: string
  image_url?: string
}

interface Activity {
  id: string
  name: string
  description?: string
  category?: string
  price_range?: string
  rating?: number
  duration_hours?: number
  image_url?: string
}

interface TripCity {
  id: string
  city_id: string
  name: string
  country: string
  order_index: number
  arrival_date?: string
  departure_date?: string
  latitude?: number
  longitude?: number
}

interface TripActivity {
  id: string
  activity_id: string
  name: string
  description?: string
  category?: string
  price_range?: string
  rating?: number
  duration_hours?: number
  scheduled_date?: string
  scheduled_time?: string
  notes?: string
  estimated_cost?: number
}

interface ItineraryBuilderProps {
  tripId: string
}

export default function ItineraryBuilder({ tripId }: ItineraryBuilderProps) {
  const [tripCities, setTripCities] = useState<TripCity[]>([])
  const [tripActivities, setTripActivities] = useState<TripActivity[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [searchCity, setSearchCity] = useState("")
  const [searchActivity, setSearchActivity] = useState("")
  const [isAddingCity, setIsAddingCity] = useState(false)
  const [isAddingActivity, setIsAddingActivity] = useState(false)
  const [selectedCity, setSelectedCity] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTripData()
  }, [tripId])

  const fetchTripData = async () => {
    setIsLoading(true)
    try {
      const [citiesResponse, activitiesResponse] = await Promise.all([
        fetch(`/api/trips/${tripId}/cities`),
        fetch(`/api/trips/${tripId}/activities`)
      ])

      if (citiesResponse.ok) {
        const citiesData = await citiesResponse.json()
        setTripCities(citiesData)
      }

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setTripActivities(activitiesData)
      }
    } catch (error) {
      console.error("Error fetching trip data:", error)
      toast({
        title: "Error",
        description: "Failed to load trip data.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const searchCities = async (query: string) => {
    try {
      const response = await fetch(`/api/cities?search=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setCities(data)
      }
    } catch (error) {
      console.error("Error searching cities:", error)
    }
  }

  const searchActivities = async (query: string, cityId?: string) => {
    try {
      const params = new URLSearchParams()
      if (query) params.append('search', query)
      if (cityId) params.append('cityId', cityId)
      
      const response = await fetch(`/api/activities?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error("Error searching activities:", error)
    }
  }

  const addCityToTrip = async (cityId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/cities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cityId,
          orderIndex: tripCities.length
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add city')
      }

      await fetchTripData()
      setIsAddingCity(false)
      setSearchCity("")
      toast({
        title: "City added",
        description: "City has been added to your trip.",
      })
    } catch (error) {
      console.error("Error adding city:", error)
      toast({
        title: "Error",
        description: "Failed to add city to trip.",
        variant: "destructive",
      })
    }
  }

  const addActivityToTrip = async (activityId: string) => {
    try {
      const response = await fetch(`/api/trips/${tripId}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityId,
          orderIndex: tripActivities.length
        })
      })

      if (!response.ok) {
        throw new Error('Failed to add activity')
      }

      await fetchTripData()
      setIsAddingActivity(false)
      setSearchActivity("")
      toast({
        title: "Activity added",
        description: "Activity has been added to your trip.",
      })
    } catch (error) {
      console.error("Error adding activity:", error)
      toast({
        title: "Error",
        description: "Failed to add activity to trip.",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="cities" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
          <TabsTrigger value="cities" className="data-[state=active]:bg-gray-700">
            Cities ({tripCities.length})
          </TabsTrigger>
          <TabsTrigger value="activities" className="data-[state=active]:bg-gray-700">
            Activities ({tripActivities.length})
          </TabsTrigger>
          <TabsTrigger value="map" className="data-[state=active]:bg-gray-700">
            Map View
          </TabsTrigger>
          <TabsTrigger value="travel" className="data-[state=active]:bg-gray-700">
            Travel Times
          </TabsTrigger>
          <TabsTrigger value="reorder" className="data-[state=active]:bg-gray-700">
            Reorder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cities" className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Cities & Destinations
                </CardTitle>
                <Dialog open={isAddingCity} onOpenChange={setIsAddingCity}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add City
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add City to Trip</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Search and select a city to add to your itinerary.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Search Cities</Label>
                        <LocationSearch
                          onLocationSelect={(location: { name: string; lat: number; lng: number; country: string }) => {
                            // We only have DB cities; try searching via our API too
                            searchCities(location.name)
                          }}
                          placeholder="Search for cities..."
                        />
                      </div>
                      
                      {cities.length > 0 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {cities.map((city) => (
                            <div
                              key={city.id}
                              className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                              onClick={() => addCityToTrip(city.id)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                                  <MapPin className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                  <p className="text-white font-medium">{city.name}</p>
                                  <p className="text-gray-400 text-sm">{city.country}</p>
                                </div>
                              </div>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {tripCities.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">No cities added yet</p>
                  <p className="text-sm text-gray-500">Start building your itinerary by adding cities to visit.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tripCities.map((city, index) => (
                    <div
                      key={city.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{city.name}</h3>
                          <p className="text-gray-400 text-sm">{city.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          Day {index + 1}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Activities & Attractions
                </CardTitle>
                <Dialog open={isAddingActivity} onOpenChange={setIsAddingActivity}>
                  <DialogTrigger asChild>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Activity
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-800 border-gray-700">
                    <DialogHeader>
                      <DialogTitle className="text-white">Add Activity to Trip</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        Search and select activities to add to your itinerary.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-white">Search Activities</Label>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search for activities..."
                            value={searchActivity}
                            onChange={(e) => {
                              setSearchActivity(e.target.value)
                              if (e.target.value.length > 2) {
                                searchActivities(e.target.value, selectedCity)
                              }
                            }}
                            className="bg-gray-700 border-gray-600 text-white pl-10"
                          />
                        </div>
                      </div>
                      
                      {activities.length > 0 && (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {activities.map((activity) => (
                            <div
                              key={activity.id}
                              className="flex items-center justify-between p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer"
                              onClick={() => addActivityToTrip(activity.id)}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                                  <Star className="w-5 h-5 text-gray-400" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-white font-medium">{activity.name}</p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {activity.category && (
                                      <Badge variant="outline" className="border-gray-600 text-gray-400 text-xs">
                                        {activity.category}
                                      </Badge>
                                    )}
                                    {activity.rating && (
                                      <div className="flex items-center space-x-1">
                                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                                        <span className="text-gray-400 text-xs">{activity.rating}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                Add
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {tripActivities.length === 0 ? (
                <div className="text-center py-12">
                  <Star className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">No activities added yet</p>
                  <p className="text-sm text-gray-500">Add activities and attractions to make your trip memorable.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tripActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">{activity.name}</h3>
                          {activity.description && (
                            <p className="text-gray-400 text-sm mb-2">{activity.description}</p>
                          )}
                          <div className="flex items-center space-x-4">
                            {activity.category && (
                              <Badge variant="outline" className="border-gray-600 text-gray-300">
                                {activity.category}
                              </Badge>
                            )}
                            {activity.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                <span className="text-gray-300">{activity.rating}</span>
                              </div>
                            )}
                            {activity.duration_hours && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-300 text-sm">{activity.duration_hours}h</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map" className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Trip Map
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tripCities.length === 0 ? (
                <div className="text-center py-12">
                  <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400 mb-4">No locations to display</p>
                  <p className="text-sm text-gray-500">Add cities to your trip to see them on the map.</p>
                </div>
              ) : (
                <LeafletMap
                  locations={tripCities
                    .filter(c => !!c.latitude && !!c.longitude)
                    .map(c => ({ lat: c.latitude as number, lng: c.longitude as number, title: c.name, description: c.country }))}
                  showRoute={tripCities.filter(c => !!c.latitude && !!c.longitude).length > 1}
                  height="500px"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="travel" className="mt-6">
          <TravelTimeCalculator 
            tripId={tripId}
            locations={tripCities
              .filter(c => !!c.latitude && !!c.longitude)
              .map(c => ({ id: c.id, name: c.name, latitude: c.latitude as number, longitude: c.longitude as number, type: 'city' as const }))}
          />
        </TabsContent>

        <TabsContent value="reorder" className="mt-6">
          <DragDropItinerary tripId={tripId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
