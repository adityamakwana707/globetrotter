"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Star, Clock, X } from "lucide-react"
import { initializePlacesAutocomplete, formatPlaceForDatabase } from "@/lib/google-maps"
import { toast } from "@/hooks/use-toast"

interface LocationResult {
  name: string
  formatted_address: string
  place_id: string
  latitude: number
  longitude: number
  types: string[]
  rating?: number
  user_ratings_total?: number
  photo_reference?: string
}

interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationResult) => void
  placeholder?: string
  types?: string[]
  className?: string
  showSuggestions?: boolean
  value?: string
  onChange?: (value: string) => void
}

export default function LocationAutocomplete({
  onLocationSelect,
  placeholder = "Search for a location...",
  types = ['(cities)'],
  className = "",
  showSuggestions = true,
  value,
  onChange
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value || "")
  const [isLoading, setIsLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<LocationResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value)
    }
  }, [value])

  useEffect(() => {
    initializeAutocomplete()
    return () => {
      // Cleanup
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current)
      }
    }
  }, [types])

  const initializeAutocomplete = async () => {
    if (!inputRef.current) return

    try {
      const autocomplete = await initializePlacesAutocomplete(inputRef.current, {
        types: types as any,
        fields: [
          'place_id',
          'name',
          'formatted_address',
          'geometry',
          'types',
          'rating',
          'user_ratings_total',
          'photos'
        ]
      })

      autocompleteRef.current = autocomplete

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace()
        if (place && place.place_id) {
          handlePlaceSelect(place)
        }
      })
    } catch (error) {
      console.error('Failed to initialize autocomplete:', error)
      toast({
        title: "Maps Error",
        description: "Failed to load location search. Please check your internet connection.",
        variant: "destructive",
      })
    }
  }

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (!place.geometry?.location) return

    const locationData = formatPlaceForDatabase(place)
    setInputValue(place.name || place.formatted_address || "")
    setShowDropdown(false)
    onLocationSelect(locationData)

    if (onChange) {
      onChange(place.name || place.formatted_address || "")
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    if (onChange) {
      onChange(newValue)
    }

    if (newValue.length > 2 && showSuggestions) {
      setShowDropdown(true)
    } else {
      setShowDropdown(false)
    }
  }

  const handleClear = () => {
    setInputValue("")
    setShowDropdown(false)
    setSuggestions([])
    
    if (onChange) {
      onChange("")
    }
  }

  const handleFocus = () => {
    if (inputValue.length > 2 && showSuggestions) {
      setShowDropdown(true)
    }
  }

  const handleBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
      setShowDropdown(false)
    }, 200)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="bg-gray-700 border-gray-600 text-white pl-10 pr-10"
        />
        {inputValue && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1 h-8 w-8 p-0 hover:bg-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                <span className="text-gray-400 text-sm">Searching locations...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Enhanced version with manual suggestions (fallback when Google Maps is not available)
export function LocationAutocompleteWithFallback({
  onLocationSelect,
  placeholder = "Search for a location...",
  className = ""
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<LocationResult[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const searchLocations = async (query: string) => {
    if (query.length < 3) return

    setIsLoading(true)
    try {
      // Try Google Maps first
      const autocomplete = document.createElement('input')
      const googleAutocomplete = await initializePlacesAutocomplete(autocomplete)
      // ... implement fallback logic
    } catch (error) {
      // Fallback to our own city database
      try {
        const response = await fetch(`/api/cities?search=${encodeURIComponent(query)}`)
        if (response.ok) {
          const cities = await response.json()
          setSuggestions(cities.map((city: any) => ({
            name: city.name,
            formatted_address: `${city.name}, ${city.country}`,
            place_id: city.id,
            latitude: city.latitude || 0,
            longitude: city.longitude || 0,
            types: ['locality'],
          })))
          setShowDropdown(true)
        }
      } catch (fallbackError) {
        console.error('Fallback search failed:', fallbackError)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    searchLocations(value)
  }

  const handleLocationSelect = (location: LocationResult) => {
    setInputValue(location.name)
    setShowDropdown(false)
    onLocationSelect(location)
  }

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          className="bg-gray-700 border-gray-600 text-white pl-10"
        />
      </div>

      {/* Suggestions dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <Card className="bg-gray-800 border-gray-700 max-h-60 overflow-y-auto">
            <CardContent className="p-0">
              {suggestions.map((suggestion, index) => (
                <div
                  key={suggestion.place_id || index}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-700 cursor-pointer border-b border-gray-700 last:border-b-0"
                  onClick={() => handleLocationSelect(suggestion)}
                >
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{suggestion.name}</p>
                    <p className="text-gray-400 text-sm truncate">{suggestion.formatted_address}</p>
                  </div>
                  {suggestion.rating && (
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-400 fill-current" />
                      <span className="text-gray-400 text-xs">{suggestion.rating}</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                <span className="text-gray-400 text-sm">Searching locations...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
