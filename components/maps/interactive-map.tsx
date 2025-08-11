"use client"

import { useEffect, useRef, useState } from "react"
import { loadGoogleMaps } from "@/lib/google-maps"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MapPin, Navigation, Maximize2, Minimize2 } from "lucide-react"

interface MapLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  type?: 'city' | 'activity' | 'hotel'
  description?: string
}

interface InteractiveMapProps {
  locations: MapLocation[]
  center?: { lat: number; lng: number }
  zoom?: number
  height?: string
  onLocationClick?: (location: MapLocation) => void
  showRoute?: boolean
  className?: string
}

export default function InteractiveMap({
  locations,
  center,
  zoom = 10,
  height = "400px",
  onLocationClick,
  showRoute = false,
  className = ""
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const routeRef = useRef<google.maps.DirectionsRenderer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)

  useEffect(() => {
    initializeMap()
  }, [])

  useEffect(() => {
    if (mapInstanceRef.current) {
      updateMarkers()
      if (showRoute && locations.length > 1) {
        drawRoute()
      }
    }
  }, [locations, showRoute])

  const initializeMap = async () => {
    if (!mapRef.current) return

    try {
      setIsLoading(true)
      const google = await loadGoogleMaps()

      // Calculate center if not provided
      const mapCenter = center || calculateCenter(locations)

      const map = new google.maps.Map(mapRef.current, {
        center: mapCenter,
        zoom,
        styles: [
          // Dark theme map styles
          {
            "elementType": "geometry",
            "stylers": [{"color": "#242f3e"}]
          },
          {
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#242f3e"}]
          },
          {
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#746855"}]
          },
          {
            "featureType": "administrative.locality",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#d59563"}]
          },
          {
            "featureType": "poi",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#d59563"}]
          },
          {
            "featureType": "poi.park",
            "elementType": "geometry",
            "stylers": [{"color": "#263c3f"}]
          },
          {
            "featureType": "poi.park",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#6b9a76"}]
          },
          {
            "featureType": "road",
            "elementType": "geometry",
            "stylers": [{"color": "#38414e"}]
          },
          {
            "featureType": "road",
            "elementType": "geometry.stroke",
            "stylers": [{"color": "#212a37"}]
          },
          {
            "featureType": "road",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#9ca5b3"}]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry",
            "stylers": [{"color": "#746855"}]
          },
          {
            "featureType": "road.highway",
            "elementType": "geometry.stroke",
            "stylers": [{"color": "#1f2835"}]
          },
          {
            "featureType": "road.highway",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#f3d19c"}]
          },
          {
            "featureType": "transit",
            "elementType": "geometry",
            "stylers": [{"color": "#2f3948"}]
          },
          {
            "featureType": "transit.station",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#d59563"}]
          },
          {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{"color": "#17263c"}]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.fill",
            "stylers": [{"color": "#515c6d"}]
          },
          {
            "featureType": "water",
            "elementType": "labels.text.stroke",
            "stylers": [{"color": "#17263c"}]
          }
        ]
      })

      mapInstanceRef.current = map
      setMapError(null)
      updateMarkers()

      if (showRoute && locations.length > 1) {
        drawRoute()
      }
    } catch (error) {
      console.error('Failed to initialize map:', error)
      setMapError('Failed to load map. Please check your internet connection.')
    } finally {
      setIsLoading(false)
    }
  }

  const calculateCenter = (locations: MapLocation[]) => {
    if (locations.length === 0) {
      return { lat: 0, lng: 0 }
    }

    if (locations.length === 1) {
      return { lat: locations[0].latitude, lng: locations[0].longitude }
    }

    const bounds = new google.maps.LatLngBounds()
    locations.forEach(location => {
      bounds.extend({ lat: location.latitude, lng: location.longitude })
    })

    return bounds.getCenter().toJSON()
  }

  const updateMarkers = async () => {
    if (!mapInstanceRef.current) return

    const google = await loadGoogleMaps()

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add new markers
    locations.forEach((location, index) => {
      const marker = new google.maps.Marker({
        position: { lat: location.latitude, lng: location.longitude },
        map: mapInstanceRef.current,
        title: location.name,
        icon: getMarkerIcon(location.type, index),
        animation: google.maps.Animation.DROP,
      })

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: createInfoWindowContent(location)
      })

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current, marker)
        if (onLocationClick) {
          onLocationClick(location)
        }
      })

      markersRef.current.push(marker)
    })

    // Fit bounds to show all markers
    if (locations.length > 1) {
      const bounds = new google.maps.LatLngBounds()
      locations.forEach(location => {
        bounds.extend({ lat: location.latitude, lng: location.longitude })
      })
      mapInstanceRef.current?.fitBounds(bounds)
    }
  }

  const getMarkerIcon = (type?: string, index?: number) => {
    const colors = {
      city: '#3B82F6',     // Blue
      activity: '#EF4444',  // Red
      hotel: '#10B981',     // Green
      default: '#6B7280'    // Gray
    }

    const color = colors[type as keyof typeof colors] || colors.default

    return {
      path: google.maps.SymbolPath.CIRCLE,
      fillColor: color,
      fillOpacity: 1,
      strokeColor: '#ffffff',
      strokeWeight: 2,
      scale: 8,
    }
  }

  const createInfoWindowContent = (location: MapLocation) => {
    return `
      <div style="color: #000; padding: 8px; min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: bold;">${location.name}</h3>
        ${location.description ? `<p style="margin: 0 0 8px 0; font-size: 14px;">${location.description}</p>` : ''}
        <p style="margin: 0; font-size: 12px; color: #666;">
          ${location.type || 'Location'} • ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}
        </p>
      </div>
    `
  }

  const drawRoute = async () => {
    if (!mapInstanceRef.current || locations.length < 2) return

    try {
      const google = await loadGoogleMaps()

      // Clear existing route
      if (routeRef.current) {
        routeRef.current.setMap(null)
      }

      const directionsService = new google.maps.DirectionsService()
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // We'll use our custom markers
        polylineOptions: {
          strokeColor: '#3B82F6',
          strokeWeight: 4,
          strokeOpacity: 0.8,
        }
      })

      directionsRenderer.setMap(mapInstanceRef.current)
      routeRef.current = directionsRenderer

      // Create waypoints (all locations except first and last)
      const waypoints = locations.slice(1, -1).map(location => ({
        location: { lat: location.latitude, lng: location.longitude },
        stopover: true,
      }))

      const request: google.maps.DirectionsRequest = {
        origin: { lat: locations[0].latitude, lng: locations[0].longitude },
        destination: { lat: locations[locations.length - 1].latitude, lng: locations[locations.length - 1].longitude },
        waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
      }

      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result)
        } else {
          console.error('Directions request failed:', status)
        }
      })
    } catch (error) {
      console.error('Failed to draw route:', error)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const centerMap = () => {
    if (mapInstanceRef.current && locations.length > 0) {
      if (locations.length === 1) {
        mapInstanceRef.current.setCenter({
          lat: locations[0].latitude,
          lng: locations[0].longitude
        })
        mapInstanceRef.current.setZoom(15)
      } else {
        const bounds = new google.maps.LatLngBounds()
        locations.forEach(location => {
          bounds.extend({ lat: location.latitude, lng: location.longitude })
        })
        mapInstanceRef.current.fitBounds(bounds)
      }
    }
  }

  if (mapError) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardContent className="p-8 text-center">
          <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-4">{mapError}</p>
          <Button onClick={initializeMap} variant="outline" className="border-gray-600 text-gray-300">
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`relative ${className} ${isFullscreen ? 'fixed inset-0 z-50 bg-gray-900' : ''}`}>
      <Card className="bg-gray-800 border-gray-700 h-full">
        <CardContent className="p-0 relative">
          {/* Map controls */}
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            <Button
              onClick={centerMap}
              size="sm"
              variant="outline"
              className="bg-gray-800/80 border-gray-600 text-white hover:bg-gray-700"
            >
              <Navigation className="w-4 h-4" />
            </Button>
            <Button
              onClick={toggleFullscreen}
              size="sm"
              variant="outline"
              className="bg-gray-800/80 border-gray-600 text-white hover:bg-gray-700"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>

          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-gray-400">Loading map...</p>
              </div>
            </div>
          )}

          {/* Map container */}
          <div
            ref={mapRef}
            style={{ height: isFullscreen ? '100vh' : height }}
            className="w-full rounded-lg"
          />

          {/* Location count badge */}
          {locations.length > 0 && (
            <div className="absolute bottom-4 left-4 z-10">
              <div className="bg-gray-800/80 text-white px-3 py-1 rounded-full text-sm">
                {locations.length} location{locations.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
