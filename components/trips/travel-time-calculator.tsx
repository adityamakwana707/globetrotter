"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Route, 
  Clock, 
  Navigation, 
  DollarSign,
  MapPin,
  Car,
  Train,
  Plane,
  Users,
  RefreshCw,
  TrendingUp,
  AlertTriangle
} from "lucide-react"
import { 
  calculateTripRoute, 
  getOptimalTravelMode,
  calculateDailyTravelBudget,
  type TripRoute 
} from "@/lib/travel-time"
import { toast } from "@/hooks/use-toast"

interface TravelTimeCalculatorProps {
  tripId: string
  locations: Array<{
    id: string
    name: string
    latitude: number
    longitude: number
    type: 'city' | 'activity'
  }>
}

export default function TravelTimeCalculator({ tripId, locations }: TravelTimeCalculatorProps) {
  const [route, setRoute] = useState<TripRoute | null>(null)
  const [travelMode, setTravelMode] = useState<'driving' | 'walking' | 'transit'>('driving')
  const [isCalculating, setIsCalculating] = useState(false)
  const [tripDays, setTripDays] = useState(7)

  useEffect(() => {
    if (locations.length >= 2) {
      calculateRoute()
    }
  }, [locations, travelMode])

  const calculateRoute = async () => {
    if (locations.length < 2) {
      setRoute(null)
      return
    }

    setIsCalculating(true)
    try {
      const calculatedRoute = await calculateTripRoute(locations, travelMode)
      setRoute(calculatedRoute)
    } catch (error) {
      console.error('Failed to calculate route:', error)
      toast({
        title: "Route Calculation Failed",
        description: "Could not calculate travel times. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCalculating(false)
    }
  }

  const getTravelModeIcon = (mode: string) => {
    switch (mode) {
      case 'driving': return <Car className="w-4 h-4" />
      case 'walking': return <Users className="w-4 h-4" />
      case 'transit': return <Train className="w-4 h-4" />
      default: return <Navigation className="w-4 h-4" />
    }
  }

  const getTravelModeColor = (mode: string) => {
    switch (mode) {
      case 'driving': return 'bg-blue-600'
      case 'walking': return 'bg-green-600'
      case 'transit': return 'bg-purple-600'
      default: return 'bg-gray-600'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`
    } else {
      const hours = Math.floor(minutes / 60)
      const mins = Math.round(minutes % 60)
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
    }
  }

  const budgetInfo = route ? calculateDailyTravelBudget(route, tripDays, true) : null

  if (locations.length < 2) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-8 text-center">
          <Route className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-4">Add at least 2 locations</p>
          <p className="text-sm text-gray-500">Travel times will be calculated automatically between your destinations.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Route className="w-5 h-5" />
              Travel Time Calculator
            </CardTitle>
            <Button
              onClick={calculateRoute}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={isCalculating}
            >
              <RefreshCw className={`w-4 h-4 ${isCalculating ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <label className="text-white text-sm mb-2 block">Travel Mode</label>
              <Select value={travelMode} onValueChange={(value: any) => setTravelMode(value)}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  <SelectItem value="driving" className="text-white hover:bg-gray-600">
                    <div className="flex items-center space-x-2">
                      <Car className="w-4 h-4" />
                      <span>Driving</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="transit" className="text-white hover:bg-gray-600">
                    <div className="flex items-center space-x-2">
                      <Train className="w-4 h-4" />
                      <span>Public Transit</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="walking" className="text-white hover:bg-gray-600">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Walking</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-white text-sm mb-2 block">Trip Duration</label>
              <Select value={tripDays.toString()} onValueChange={(value) => setTripDays(parseInt(value))}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-700 border-gray-600">
                  {[3, 5, 7, 10, 14, 21, 30].map(days => (
                    <SelectItem key={days} value={days.toString()} className="text-white hover:bg-gray-600">
                      {days} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Route Overview */}
      {route && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Route Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <Navigation className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p className="text-2xl font-bold text-white">{route.totalDistance.toFixed(0)} km</p>
                <p className="text-gray-400 text-sm">Total Distance</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <Clock className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-2xl font-bold text-white">{formatDuration(route.totalDuration)}</p>
                <p className="text-gray-400 text-sm">Travel Time</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <DollarSign className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
                <p className="text-2xl font-bold text-white">${route.totalCost?.toFixed(0) || 0}</p>
                <p className="text-gray-400 text-sm">Est. Cost</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <MapPin className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <p className="text-2xl font-bold text-white">{route.segments.length}</p>
                <p className="text-gray-400 text-sm">Route Segments</p>
              </div>
            </div>

            {/* Route Segments */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold mb-3">Route Details</h3>
              {route.segments.map((segment, index) => (
                <div key={index} className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-medium">{segment.from.name}</span>
                      <Navigation className="w-4 h-4 text-gray-400" />
                      <span className="text-white font-medium">{segment.to.name}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span className="flex items-center">
                        <Navigation className="w-3 h-3 mr-1" />
                        {segment.travelTime.distance}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {segment.travelTime.duration}
                      </span>
                      {segment.estimatedCost && (
                        <span className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          ${segment.estimatedCost.toFixed(0)}
                        </span>
                      )}
                    </div>
                  </div>

                  <Badge className={`${getTravelModeColor(segment.travelTime.mode)} text-white`}>
                    {getTravelModeIcon(segment.travelTime.mode)}
                    <span className="ml-1 capitalize">{segment.travelTime.mode}</span>
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Budget Breakdown */}
      {budgetInfo && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Daily Budget Estimate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-blue-400">${budgetInfo.transportationPerDay.toFixed(0)}</p>
                <p className="text-gray-400 text-sm">Transportation/Day</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-green-400">${budgetInfo.accommodationPerDay.toFixed(0)}</p>
                <p className="text-gray-400 text-sm">Accommodation/Day</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-purple-400">${budgetInfo.totalPerDay.toFixed(0)}</p>
                <p className="text-gray-400 text-sm">Total/Day</p>
              </div>
            </div>

            {budgetInfo.suggestions.length > 0 && (
              <div className="mt-4">
                <h4 className="text-white font-semibold mb-2">Budget Tips</h4>
                <div className="space-y-2">
                  {budgetInfo.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-300 text-sm">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {route && route.suggestions.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Travel Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {route.suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <p className="text-gray-300 text-sm">{suggestion}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {isCalculating && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Calculating travel times...</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
