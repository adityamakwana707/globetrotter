"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Activity, Star, Clock, DollarSign, Search, Filter, SortAsc, SortDesc, Users, Calendar } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"

interface ActivityType {
  id: string
  display_id: string
  name: string
  description: string
  category: string
  city_id?: string
  city_name?: string
  price_range: string
  rating?: number | string
  duration_hours?: number | string
  image_url?: string
  min_participants?: number | string
  max_participants?: number | string
  available_dates?: string[]
}

interface City {
  id: string
  name: string
  country: string
}

export default function ActivitiesSearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [activities, setActivities] = useState<ActivityType[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState("rating")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [priceFilter, setPriceFilter] = useState("all")
  const [cityFilter, setCityFilter] = useState("all")
  const [durationFilter, setDurationFilter] = useState("all")

  useEffect(() => {
    loadCities()
    const initialQuery = searchParams.get("q")
    if (initialQuery) {
      setSearchQuery(initialQuery)
      handleSearch(initialQuery)
    } else {
      // Load all activities initially
      handleSearch("")
    }
  }, [])

  const loadCities = async () => {
    try {
      const response = await fetch("/api/cities")
      if (response.ok) {
        const data = await response.json()
        setCities(data)
      }
    } catch (error) {
      console.error("Error loading cities:", error)
    }
  }

  const handleSearch = async (query: string = searchQuery) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) {
        params.append("search", query)
      }
      if (cityFilter !== "all") {
        params.append("cityId", cityFilter)
      }

      const response = await fetch(`/api/activities?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const sortedAndFilteredActivities = activities
    .filter(activity => {
      let categoryMatch = categoryFilter === "all" || activity.category.toLowerCase() === categoryFilter.toLowerCase()
      let priceMatch = priceFilter === "all" || activity.price_range.toLowerCase() === priceFilter.toLowerCase()
      let durationMatch = true

      if (durationFilter !== "all") {
        const duration = Number(activity.duration_hours) || 0
        switch (durationFilter) {
          case "short":
            durationMatch = duration <= 2
            break
          case "medium":
            durationMatch = duration > 2 && duration <= 6
            break
          case "long":
            durationMatch = duration > 6
            break
        }
      }
      
      return categoryMatch && priceMatch && durationMatch
    })
    .sort((a, b) => {
      let aValue: number | string = 0
      let bValue: number | string = 0

      switch (sortBy) {
        case "rating":
          aValue = Number(a.rating) || 0
          bValue = Number(b.rating) || 0
          break
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "price":
          const priceMap: Record<string, number> = { "free": 0, "low": 1, "medium": 2, "high": 3, "luxury": 4 }
          aValue = priceMap[a.price_range.toLowerCase()] || 0
          bValue = priceMap[b.price_range.toLowerCase()] || 0
          break
        case "duration":
          aValue = Number(a.duration_hours) || 0
          bValue = Number(b.duration_hours) || 0
          break
        default:
          aValue = Number(a.rating) || 0
          bValue = Number(b.rating) || 0
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })

  const uniqueCategories = [...new Set(activities.map(a => a.category))].filter(Boolean)
  const uniquePriceRanges = [...new Set(activities.map(a => a.price_range))].filter(Boolean)

  const getPriceIcon = (price: string) => {
    const count = price.toLowerCase() === "free" ? 0 : 
                  price.toLowerCase() === "low" ? 1 :
                  price.toLowerCase() === "medium" ? 2 :
                  price.toLowerCase() === "high" ? 3 : 4
    return "💰".repeat(Math.max(1, count))
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <Activity className="h-8 w-8 text-emerald-600" />
          Activity Search
        </h1>
        <p className="text-slate-600">Discover exciting activities and experiences for your next adventure</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search activities by name, category, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10 bg-white border-gray-300 text-slate-900"
            />
          </div>
          <Button onClick={() => handleSearch()} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="mb-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-slate-600" />
          <span className="font-medium text-slate-900">Filters & Sorting</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block text-slate-800">Category</label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category} className="text-slate-900 hover:bg-gray-50">{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-800">City</label>
            <Select value={cityFilter} onValueChange={(value) => { setCityFilter(value); handleSearch(); }}>
              <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map(city => (
                  <SelectItem key={city.id} value={city.id} className="text-slate-900 hover:bg-gray-50">
                    {city.name}, {city.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-800">Price Range</label>
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all">All Prices</SelectItem>
                {uniquePriceRanges.map(price => (
                  <SelectItem key={price} value={price} className="text-slate-900 hover:bg-gray-50">
                    {price.charAt(0).toUpperCase() + price.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-800">Duration</label>
            <Select value={durationFilter} onValueChange={setDurationFilter}>
              <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                <SelectValue placeholder="Any Duration" />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="all">Any Duration</SelectItem>
                <SelectItem value="short">Short (≤2h)</SelectItem>
                <SelectItem value="medium">Medium (2-6h)</SelectItem>
                <SelectItem value="long">Long (&gt;6h)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-800">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block text-slate-800">Order</label>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="w-full justify-start border-gray-300 text-slate-700 hover:bg-gray-50"
            >
              {sortOrder === "asc" ? <SortAsc className="h-4 w-4 mr-2" /> : <SortDesc className="h-4 w-4 mr-2" />}
              {sortOrder === "asc" ? "Ascending" : "Descending"}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="border-gray-300 text-slate-700 hover:bg-gray-50"
            onClick={() => {
              setCategoryFilter("all")
              setCityFilter("all")
              setPriceFilter("all")
              setDurationFilter("all")
              handleSearch()
            }}
          >
            Clear Filters
          </Button>
          <div className="text-sm text-slate-600 flex items-center">
            Showing {sortedAndFilteredActivities.length} activities
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <Card key={i} className="h-[320px] bg-white border-gray-200 shadow-md">
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedAndFilteredActivities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAndFilteredActivities.map((activity) => (
            <Card key={activity.id} className="bg-white border-gray-200 shadow-md hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-1 text-slate-900">{activity.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-xs border-gray-300 text-slate-700">
                        {activity.category}
                      </Badge>
                      {activity.city_name && (
                        <span className="text-xs flex items-center gap-1 text-slate-600">
                          <MapPin className="h-3 w-3" />
                          {activity.city_name}
                        </span>
                      )}
                    </CardDescription>
                  </div>
                  {activity.rating && !isNaN(Number(activity.rating)) && (
                    <Badge variant="secondary" className="text-xs ml-2 bg-amber-100 text-amber-800">
                      <Star className="h-3 w-3 mr-1 fill-current" />
                      {Number(activity.rating).toFixed(1)}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4 line-clamp-2">
                  {activity.description}
                </p>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      <span className="capitalize font-medium text-slate-900">{activity.price_range}</span>
                      <span className="ml-1">{getPriceIcon(activity.price_range)}</span>
                    </div>
                    {activity.duration_hours && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{activity.duration_hours}h</span>
                      </div>
                    )}
                  </div>
                  
                  {(activity.min_participants || activity.max_participants) && (
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Users className="h-3 w-3" />
                      <span>
                        {activity.min_participants && activity.max_participants
                          ? `${activity.min_participants}-${activity.max_participants} people`
                          : activity.min_participants
                          ? `Min ${activity.min_participants} people`
                          : `Max ${activity.max_participants} people`
                        }
                      </span>
                    </div>
                  )}
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-500">
                    {activity.available_dates && activity.available_dates.length > 0 ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>Available dates</span>
                      </div>
                    ) : (
                      <span>Contact for availability</span>
                    )}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="border-gray-300 text-slate-700 hover:bg-gray-50"
                    onClick={() => router.push(`/activities/${activity.id}`)}
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : searchQuery || categoryFilter !== "all" || priceFilter !== "all" || cityFilter !== "all" || durationFilter !== "all" ? (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-slate-900">No activities found</h3>
          <p className="text-slate-600 mb-4">Try adjusting your search terms or filters</p>
          <Button 
            variant="outline" 
            className="border-gray-300 text-slate-700 hover:bg-gray-50"
            onClick={() => {
              setSearchQuery("")
              setCategoryFilter("all")
              setCityFilter("all")
              setPriceFilter("all")
              setDurationFilter("all")
              handleSearch("")
            }}
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <Activity className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-slate-900">Discover Activities</h3>
          <p className="text-slate-600">Search or browse our collection of exciting activities and experiences</p>
        </div>
      )}
      </div>
    </div>
  )
}
