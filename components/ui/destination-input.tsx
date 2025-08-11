"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Globe, Building, X } from "lucide-react"

interface City {
  id: number
  name: string
  country: string
  latitude?: number
  longitude?: number
  type?: string
  importance?: number
}

interface DestinationInputProps {
  onDestinationAdd: (destination: string) => void
  placeholder?: string
  className?: string
}

export default function DestinationInput({
  onDestinationAdd,
  placeholder = "Type destination or search cities...",
  className = ""
}: DestinationInputProps) {
  const [inputValue, setInputValue] = useState("")
  const [suggestions, setSuggestions] = useState<City[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [isLoading, setIsLoading] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  // Fetch suggestions from OpenStreetMap Nominatim API (same as test-maps)
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    if (inputValue.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true)
      try {
        // Using our proxy API to avoid CORS issues
        const response = await fetch(`/api/geocode?q=${encodeURIComponent(inputValue)}`)

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const filteredResults = await response.json()

        setSuggestions(filteredResults)
        setShowSuggestions(true)
      } catch (error) {
        console.warn('OpenStreetMap search error, allowing manual input:', error)
        setSuggestions([])
        setShowSuggestions(false)
      } finally {
        setIsLoading(false)
        setSelectedIndex(-1)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [inputValue])

  // Helper function to extract location name (same logic as test-maps)
  const getLocationName = (location: any): string => {
    const parts = location.display_name.split(', ')
    
    // For cities, return city name
    if (location.class === 'place' && (location.type === 'city' || location.type === 'town')) {
      return parts[0]
    }
    
    // For countries, return country name
    if (location.class === 'place' && location.type === 'country') {
      return parts[0]
    }
    
    // For other places, return first part
    return parts[0]
  }

  // Helper function to extract country from display_name
  const getCountryFromDisplay = (displayName: string): string => {
    const parts = displayName.split(', ')
    return parts[parts.length - 1] || ''
  }

  const handleSuggestionClick = (city: City) => {
    const destination = `${city.name}, ${city.country}`
    onDestinationAdd(destination)
    setInputValue("")
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) {
      // Allow manual entry when no suggestions
      if (e.key === 'Enter') {
        e.preventDefault()
        if (inputValue.trim()) {
          onDestinationAdd(inputValue.trim())
          setInputValue("")
        }
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % suggestions.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else if (inputValue.trim()) {
          // Manual entry if no suggestion selected
          onDestinationAdd(inputValue.trim())
          setInputValue("")
          setShowSuggestions(false)
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        setSelectedIndex(-1)
        inputRef.current?.blur()
        break
      case 'Tab':
        // Allow manual entry on tab
        if (inputValue.trim()) {
          onDestinationAdd(inputValue.trim())
          setInputValue("")
          setShowSuggestions(false)
        }
        break
    }
  }

  const getLocationIcon = (city: City) => {
    switch (city.type) {
      case 'country':
        return <Globe className="w-4 h-4 text-blue-500" />
      case 'city':
      case 'town':
        return <Building className="w-4 h-4 text-green-500" />
      case 'state':
      case 'province':
        return <MapPin className="w-4 h-4 text-purple-500" />
      default:
        return <MapPin className="w-4 h-4 text-gray-500" />
    }
  }

  const getLocationBadge = (city: City) => {
    switch (city.type) {
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

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
          className="pl-10 bg-gray-700 border-gray-600 text-white"
        />
        {isLoading && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-800 border-gray-700 max-h-64 overflow-y-auto">
          <CardContent className="p-0">
            {suggestions.map((city, index) => (
              <div
                key={city.id}
                onClick={() => handleSuggestionClick(city)}
                className={`p-3 cursor-pointer border-b border-gray-700 last:border-b-0 hover:bg-gray-700 transition-colors ${
                  index === selectedIndex ? 'bg-gray-700' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    <div className="mt-0.5">
                      {getLocationIcon(city)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium truncate">
                        {city.name}
                      </h4>
                      <p className="text-gray-400 text-sm truncate">
                        {city.country}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getLocationBadge(city)}
                        {city.importance && (
                          <span className="text-xs text-gray-500">
                            {Math.round(city.importance * 100)}% relevance
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

      {/* Manual Entry Hint */}
      {inputValue.length >= 2 && !isLoading && suggestions.length === 0 && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-800 border-gray-700">
          <CardContent className="p-3 text-center">
            <MapPin className="w-6 h-6 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 text-sm mb-1">No suggestions found</p>
            <p className="text-gray-500 text-xs">Press Enter to add "{inputValue}" manually</p>
          </CardContent>
        </Card>
      )}

      {/* Click outside to close */}
      {showSuggestions && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  )
}
