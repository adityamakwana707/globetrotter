"use client"

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'

interface Location {
  lat: number
  lng: number
  title?: string
  description?: string
}

interface LeafletMapProps {
  locations: Location[]
  showRoute?: boolean
  className?: string
  height?: string
  zoom?: number
  center?: { lat: number; lng: number }
}

// Client-side only Leaflet component
function LeafletMapClient({
  locations,
  showRoute = false,
  className = "",
  height = "400px",
  zoom = 10,
  center
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    // Dynamic import of Leaflet to avoid SSR issues
    const loadLeaflet = async () => {
      if (typeof window === 'undefined') return

      try {
        const L = await import('leaflet')
        await import('leaflet/dist/leaflet.css')

        // Fix for default markers in React
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
          iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
        })

        if (!mapRef.current) return

        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove()
        }

        // Determine center point
        const mapCenter = center || (locations.length > 0 
          ? { lat: locations[0].lat, lng: locations[0].lng }
          : { lat: 51.505, lng: -0.09 }) // Default to London

        // Create map
        const map = L.map(mapRef.current).setView([mapCenter.lat, mapCenter.lng], zoom)
        mapInstanceRef.current = map

        // Add OpenStreetMap tiles (free!)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(map)

        // Add markers
        const markers: any[] = []
        locations.forEach((location, index) => {
          const marker = L.marker([location.lat, location.lng]).addTo(map)
          
          if (location.title || location.description) {
            const popupContent = `
              <div class="p-2">
                ${location.title ? `<h3 class="font-bold text-gray-900">${location.title}</h3>` : ''}
                ${location.description ? `<p class="text-gray-700 text-sm">${location.description}</p>` : ''}
                <p class="text-xs text-gray-500 mt-1">Stop ${index + 1}</p>
              </div>
            `
            marker.bindPopup(popupContent)
          }
          
          markers.push(marker)
        })

        // Add route if requested and we have multiple locations
        if (showRoute && locations.length > 1) {
          const routeCoordinates: [number, number][] = locations.map(loc => [loc.lat, loc.lng])
          
          // Simple polyline route
          const polyline = L.polyline(routeCoordinates, {
            color: '#3B82F6',
            weight: 4,
            opacity: 0.8,
            dashArray: '10, 10'
          }).addTo(map)

          // Fit map to show all points
          if (locations.length > 0) {
            const group = new L.FeatureGroup(markers)
            map.fitBounds(group.getBounds().pad(0.1))
          }
        } else if (locations.length > 1) {
          // Fit map to show all markers without route
          const group = new L.FeatureGroup(markers)
          map.fitBounds(group.getBounds().pad(0.1))
        }

        setIsLoaded(true)
      } catch (error) {
        console.error('Error loading Leaflet:', error)
      }
    }

    loadLeaflet()

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [locations, showRoute, zoom, center])

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={mapRef} 
        style={{ height, width: '100%' }}
        className="rounded-lg z-0"
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Map Controls Overlay */}
      {isLoaded && (
        <div className="absolute top-2 right-2 z-10 space-y-2">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              <span>Route</span>
            </div>
          </div>
        </div>
      )}

      {/* Location Count */}
      {isLoaded && locations.length > 0 && (
        <div className="absolute bottom-2 left-2 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg">
            <span className="text-sm font-medium text-gray-700">
              {locations.length} {locations.length === 1 ? 'location' : 'locations'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

// Export with dynamic import to prevent SSR issues
const LeafletMap = dynamic(() => Promise.resolve(LeafletMapClient), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-gray-800 rounded-lg" style={{ height: '400px' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
        <p className="text-gray-400 text-sm">Loading map...</p>
      </div>
    </div>
  )
})

export default LeafletMap