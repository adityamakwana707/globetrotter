"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Star, DollarSign, Clock, Plus } from "lucide-react"

interface City {
  id: number
  display_id: number
  name: string
  country: string
  cost_index: number
  popularity_score: number
  description?: string
  image_url?: string
}

interface Activity {
  id: number
  display_id: number
  name: string
  description?: string
  category?: string
  price_range?: string
  rating?: number
  duration_hours?: number
  city_id: number
  image_url?: string
}

interface ActivitySearchModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectDestination: (destination: string) => void
}

export default function ActivitySearchModal({
  isOpen,
  onClose,
  onSelectDestination
}: ActivitySearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchType, setSearchType] = useState<"cities" | "activities">("cities")
  const [cities, setCities] = useState<City[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      searchCities("")
    }
  }, [isOpen])

  const searchCities = async (query: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('search', query)
      
      const response = await fetch(`/api/cities?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCities(data)
      }
    } catch (error) {
      console.error('Error searching cities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchActivities = async (query: string) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query) params.append('search', query)
      
      const response = await fetch(`/api/activities?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error('Error searching activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (searchType === "cities") {
      searchCities(query)
    } else {
      searchActivities(query)
    }
  }

  const getCostBadgeColor = (costIndex: number) => {
    if (costIndex < 30) return "bg-green-600"
    if (costIndex < 60) return "bg-yellow-600"
    return "bg-red-600"
  }

  const getCostLabel = (costIndex: number) => {
    if (costIndex < 30) return "Budget"
    if (costIndex < 60) return "Moderate"
    return "Expensive"
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-white">Search Destinations & Activities</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Controls */}
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder={`Search ${searchType === "cities" ? "cities" : "activities"}...`}
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="bg-gray-700 border-gray-600 text-white pl-10"
              />
            </div>
            <div className="flex space-x-1 bg-gray-700 rounded-lg p-1">
              <Button
                type="button"
                variant={searchType === "cities" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setSearchType("cities")
                  searchCities(searchQuery)
                }}
                className={searchType === "cities" ? "bg-blue-600" : "text-gray-400"}
              >
                Cities
              </Button>
              <Button
                type="button"
                variant={searchType === "activities" ? "default" : "ghost"}
                size="sm"
                onClick={() => {
                  setSearchType("activities")
                  searchActivities(searchQuery)
                }}
                className={searchType === "activities" ? "bg-blue-600" : "text-gray-400"}
              >
                Activities
              </Button>
            </div>
          </div>

          {/* Search Results */}
          <div className="overflow-y-auto max-h-96 space-y-3">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-400 mt-2">Searching...</p>
              </div>
            ) : (
              <>
                {/* Cities Results */}
                {searchType === "cities" && cities.map((city) => (
                  <Card key={city.id} className="bg-gray-700 border-gray-600 hover:bg-gray-600 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-white font-semibold">{city.name}</h3>
                            <Badge variant="secondary" className="bg-gray-600 text-gray-300">
                              {city.country}
                            </Badge>
                            <Badge 
                              variant="secondary" 
                              className={`${getCostBadgeColor(city.cost_index)} text-white`}
                            >
                              {getCostLabel(city.cost_index)}
                            </Badge>
                          </div>
                          
                          {city.description && (
                            <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                              {city.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <div className="flex items-center space-x-1">
                              <DollarSign className="w-4 h-4" />
                              <span>Cost Index: {city.cost_index}/100</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Star className="w-4 h-4" />
                              <span>Popularity: {city.popularity_score}/100</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={() => onSelectDestination(city.name)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Activities Results */}
                {searchType === "activities" && activities.map((activity) => (
                  <Card key={activity.id} className="bg-gray-700 border-gray-600 hover:bg-gray-600 transition-colors">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-white font-semibold">{activity.name}</h3>
                            {activity.category && (
                              <Badge variant="secondary" className="bg-purple-600 text-white">
                                {activity.category}
                              </Badge>
                            )}
                            {activity.price_range && (
                              <Badge variant="secondary" className="bg-green-600 text-white">
                                {activity.price_range}
                              </Badge>
                            )}
                          </div>
                          
                          {activity.description && (
                            <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                              {activity.description}
                            </p>
                          )}

                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            {activity.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="w-4 h-4 text-yellow-500" />
                                <span>{activity.rating}/5</span>
                              </div>
                            )}
                            {activity.duration_hours && (
                              <div className="flex items-center space-x-1">
                                <Clock className="w-4 h-4" />
                                <span>{activity.duration_hours}h</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          type="button"
                          onClick={() => {
                            // For activities, we could add them directly to the itinerary
                            // For now, just close the modal
                            onClose()
                          }}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Activity
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* No Results */}
                {!isLoading && (
                  (searchType === "cities" && cities.length === 0) ||
                  (searchType === "activities" && activities.length === 0)
                ) && (
                  <div className="text-center py-8">
                    <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      No {searchType} found
                    </h3>
                    <p className="text-gray-400">
                      Try adjusting your search terms or browse popular destinations.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
