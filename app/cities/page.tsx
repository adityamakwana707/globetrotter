"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MapPin, Star, DollarSign, Search, Filter, SortAsc, SortDesc, Globe, Thermometer, Users } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

interface City {
  id: string
  display_id: string
  name: string
  country: string
  latitude?: number | string
  longitude?: number | string
  timezone?: string
  description?: string
  cost_index?: number | string
  popularity_score?: number | string
  image_url?: string
  trip_count?: number | string
}

export default function CitiesSearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "")
  const [cities, setCities] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sortBy, setSortBy] = useState("popularity")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [costFilter, setCostFilter] = useState("all")
  const [countryFilter, setCountryFilter] = useState("all")

  useEffect(() => {
    const initialQuery = searchParams.get("q")
    if (initialQuery) {
      setSearchQuery(initialQuery)
      handleSearch(initialQuery)
    } else {
      // Load all cities initially
      handleSearch("")
    }
  }, [])

  const handleSearch = async (query: string = searchQuery) => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (query.trim()) {
        params.append("search", query)
      }

      const response = await fetch(`/api/cities?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setCities(data)
      }
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const sortedAndFilteredCities = cities
    .filter(city => {
      let costMatch = true
      let countryMatch = countryFilter === "all" || city.country === countryFilter

      if (costFilter !== "all") {
        const costIndex = Number(city.cost_index) || 0
        switch (costFilter) {
          case "low":
            costMatch = costIndex <= 3
            break
          case "medium":
            costMatch = costIndex > 3 && costIndex <= 6
            break
          case "high":
            costMatch = costIndex > 6
            break
        }
      }
      
      return costMatch && countryMatch
    })
    .sort((a, b) => {
      let aValue: number | string = 0
      let bValue: number | string = 0

      switch (sortBy) {
        case "popularity":
          aValue = Number(a.popularity_score) || 0
          bValue = Number(b.popularity_score) || 0
          break
        case "name":
          aValue = a.name
          bValue = b.name
          break
        case "cost":
          aValue = Number(a.cost_index) || 0
          bValue = Number(b.cost_index) || 0
          break
        case "trips":
          aValue = Number(a.trip_count) || 0
          bValue = Number(b.trip_count) || 0
          break
        default:
          aValue = Number(a.popularity_score) || 0
          bValue = Number(b.popularity_score) || 0
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortOrder === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
      }

      return sortOrder === "asc" ? (aValue as number) - (bValue as number) : (bValue as number) - (aValue as number)
    })

  const uniqueCountries = [...new Set(cities.map(c => c.country))].filter(Boolean).sort()

  const getCostLevel = (costIndex?: number) => {
    if (!costIndex) return { level: "Unknown", color: "secondary", icon: "❓" }
    if (costIndex <= 3) return { level: "Budget", color: "default", icon: "💰" }
    if (costIndex <= 6) return { level: "Moderate", color: "secondary", icon: "💰💰" }
    return { level: "Expensive", color: "destructive", icon: "💰💰💰" }
  }

  const getPopularityLevel = (score?: number) => {
    if (!score) return "New"
    if (score >= 8) return "Must Visit"
    if (score >= 6) return "Popular"
    if (score >= 4) return "Emerging"
    return "Hidden Gem"
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4 flex items-center gap-2">
          <MapPin className="h-8 w-8 text-primary" />
          City Search
        </h1>
        <p className="text-muted-foreground">Explore amazing destinations around the world for your next adventure</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search cities by name, country, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={() => handleSearch()} disabled={isLoading}>
            {isLoading ? "Searching..." : "Search"}
          </Button>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4" />
          <span className="font-medium">Filters & Sorting</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Country</label>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                {uniqueCountries.map(country => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Cost Level</label>
            <Select value={costFilter} onValueChange={setCostFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Costs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cost Levels</SelectItem>
                <SelectItem value="low">Budget (≤3)</SelectItem>
                <SelectItem value="medium">Moderate (3-6)</SelectItem>
                <SelectItem value="high">Expensive (&gt;6)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="cost">Cost Index</SelectItem>
                <SelectItem value="trips">Trip Count</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Order</label>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="w-full justify-start"
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
            onClick={() => {
              setCountryFilter("all")
              setCostFilter("all")
              handleSearch()
            }}
          >
            Clear Filters
          </Button>
          <div className="text-sm text-muted-foreground flex items-center">
            Showing {sortedAndFilteredCities.length} cities
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(9)].map((_, i) => (
            <Card key={i} className="h-[360px]">
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardHeader>
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedAndFilteredCities.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedAndFilteredCities.map((city) => {
            const costInfo = getCostLevel(Number(city.cost_index))
            const popularityLevel = getPopularityLevel(Number(city.popularity_score))
            
            return (
              <Card key={city.id} className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden">
                {/* City Image */}
                <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
                  {city.image_url ? (
                    <Image
                      src={city.image_url}
                      alt={city.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <MapPin className="h-16 w-16 text-white/70" />
                    </div>
                  )}
                  
                  {/* Overlay badges */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    {city.popularity_score && !isNaN(Number(city.popularity_score)) && (
                      <Badge variant="secondary" className="text-xs bg-black/70 text-white border-0">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {Number(city.popularity_score).toFixed(1)}
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs bg-white/90 text-black border-0">
                      {popularityLevel}
                    </Badge>
                  </div>
                </div>

                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{city.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 text-base">
                        <Globe className="h-4 w-4" />
                        {city.country}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {city.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {city.description}
                    </p>
                  )}
                  
                  <div className="space-y-3">
                    {/* Cost and Trip Info */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-sm font-medium">{costInfo.level}</span>
                        <span>{costInfo.icon}</span>
                      </div>
                      {city.trip_count !== undefined && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-3 w-3" />
                          <span>{city.trip_count} trips</span>
                        </div>
                      )}
                    </div>

                    {/* Coordinates and Timezone */}
                    <div className="text-xs text-muted-foreground space-y-1">
                      {city.latitude && city.longitude && !isNaN(Number(city.latitude)) && !isNaN(Number(city.longitude)) && (
                        <div>📍 {Number(city.latitude).toFixed(2)}, {Number(city.longitude).toFixed(2)}</div>
                      )}
                      {city.timezone && (
                        <div className="flex items-center gap-1">
                          <Thermometer className="h-3 w-3" />
                          {city.timezone}
                        </div>
                      )}
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-muted-foreground">
                        {city.cost_index && !isNaN(Number(city.cost_index)) && `Cost Index: ${Number(city.cost_index).toFixed(1)}`}
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => router.push(`/cities/${city.id}`)}
                      >
                        Explore City
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : searchQuery || costFilter !== "all" || countryFilter !== "all" ? (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No cities found</h3>
          <p className="text-muted-foreground mb-4">Try adjusting your search terms or filters</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchQuery("")
              setCountryFilter("all")
              setCostFilter("all")
              handleSearch("")
            }}
          >
            Clear all filters
          </Button>
        </div>
      ) : (
        <div className="text-center py-12">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Explore Cities</h3>
          <p className="text-muted-foreground">Search or browse our collection of amazing destinations worldwide</p>
        </div>
      )}
    </div>
  )
}
