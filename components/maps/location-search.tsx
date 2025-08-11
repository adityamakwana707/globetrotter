"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MapPin, Globe, Building, Navigation } from "lucide-react"

interface Location {
  id: number
  name: string
  country: string
  latitude: number
  longitude: number
  type?: string
  importance?: number
  display_name?: string
}

interface LocationSearchProps {
  onLocationSelect: (location: {
    name: string
    lat: number
    lng: number
    country: string
    city?: string
  }) => void
  placeholder?: string
  className?: string
  value?: string
}

export default function LocationSearch({
  onLocationSelect,
  placeholder = "Search for cities, countries, or places...",
  className = "",
  value = ""
}: LocationSearchProps) {
  const [searchQuery, setSearchQuery] = useState(value)
  const [locations, setLocations] = useState<Location[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const debounceRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounced search function
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (searchQuery.length < 2) {
      setLocations([])
      setShowResults(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      searchLocations(searchQuery)
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [searchQuery])

  const searchLocations = async (query: string) => {
    if (!query.trim()) return

    setIsLoading(true)
    try {
      // Using our proxy API to avoid CORS issues
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`)

      if (!response.ok) throw new Error('Search failed')

      const filteredResults = await response.json()

      setLocations(filteredResults)
      setShowResults(true)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Location search error:', error)
      setLocations([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleLocationClick = (location: Location) => {
    const locationData = {
      name: location.name,
      lat: location.latitude,
      lng: location.longitude,
      country: location.country,
      city: location.name // Since our API already extracts the clean name
    }

    onLocationSelect(locationData)
    setSearchQuery(locationData.name)
    setShowResults(false)
    setSelectedIndex(-1)
  }



  const getLocationIcon = (location: Location) => {
    switch (location.type) {
      case 'country':
        return <Globe className="w-4 h-4 text-blue-500" />
      case 'city':
      case 'town':
        return <Building className="w-4 h-4 text-green-500" />
      case 'state':
      case 'province':
        return <MapPin className="w-4 h-4 text-purple-500" />
      default:
        return <Navigation className="w-4 h-4 text-gray-500" />
    }
  }

  const getLocationBadge = (location: Location) => {
    switch (location.type) {
      case 'country':
        return <Badge variant="secondary" className="bg-blue-600 text-white text-xs">Country</Badge>
      case 'city':
        return <Badge variant="secondary" className="bg-green-600 text-white text-xs">City</Badge>
      case 'town':
        return <Badge variant="secondary" className="bg-green-600 text-white text-xs">Town</Badge>
      case 'state':
      case 'province':
        return <Badge variant="secondary" className="bg-purple-600 text-white text-xs">State</Badge>
      default:
        return <Badge variant="secondary" className="bg-gray-600 text-white text-xs">Place</Badge>
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults || locations.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % locations.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev <= 0 ? locations.length - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleLocationClick(locations[selectedIndex])
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
          className="pl-10 bg-gray-700 border-gray-600 text-white"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && locations.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-800 border-gray-700 max-h-96 overflow-y-auto">
          <CardContent className="p-0">
            {locations.map((location, index) => (
              <div
                key={location.id || `location-${index}`}
                onClick={() => handleLocationClick(location)}
                className={`p-3 cursor-pointer border-b border-gray-700 last:border-b-0 hover:bg-gray-700 transition-colors ${
                  index === selectedIndex ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="mt-0.5">
                      {getLocationIcon(location)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">
                        {location.name}
                      </h4>
                      <p className="text-gray-400 text-sm truncate">
                        {location.country}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getLocationBadge(location)}
                        {location.importance && (
                          <span className="text-xs text-gray-500">
                            {Math.round(location.importance * 100)}% relevance
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <MapPin className="w-4 h-4 text-gray-400 ml-2 flex-shrink-0" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Results */}
      {showResults && !isLoading && searchQuery.length >= 2 && locations.length === 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-800 border-gray-700">
          <CardContent className="p-4 text-center">
            <MapPin className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400">No locations found</p>
            <p className="text-gray-500 text-sm">Try searching for cities, countries, or landmarks</p>
          </CardContent>
        </Card>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  )
}
