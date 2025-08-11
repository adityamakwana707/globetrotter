"use client"

import { MapPin, Route, Navigation } from "lucide-react"

interface Location {
  lat: number
  lng: number
  title?: string
  description?: string
}

interface SimpleMapProps {
  locations: Location[]
  showRoute?: boolean
  className?: string
  height?: string
}

export default function SimpleMap({
  locations,
  showRoute = false,
  className = "",
  height = "400px"
}: SimpleMapProps) {
  // Generate OpenStreetMap URL for static map
  const generateMapUrl = () => {
    if (locations.length === 0) {
      return `https://www.openstreetmap.org/export/embed.html?bbox=-180%2C-85%2C180%2C85&layer=mapnik`
    }

    // For single location, center on it
    if (locations.length === 1) {
      const { lat, lng } = locations[0]
      const zoom = 12
      return `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`
    }

    // For multiple locations, calculate bounds
    const lats = locations.map(l => l.lat)
    const lngs = locations.map(l => l.lng)
    const minLat = Math.min(...lats) - 0.01
    const maxLat = Math.max(...lats) + 0.01
    const minLng = Math.min(...lngs) - 0.01
    const maxLng = Math.max(...lngs) + 0.01

    return `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik`
  }

  return (
    <div className={`relative ${className}`}>
      <div 
        style={{ height, width: '100%' }}
        className="rounded-lg overflow-hidden bg-gray-800 border border-gray-700"
      >
        {locations.length > 0 ? (
          <iframe
            src={generateMapUrl()}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            title="Trip Map"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p>Add locations to see them on the map</p>
            </div>
          </div>
        )}
      </div>

      {/* Map Info Overlay */}
      <div className="absolute top-2 right-2 z-10 space-y-2">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <MapPin className="w-3 h-3 text-blue-500" />
            <span>OpenStreetMap</span>
          </div>
        </div>
      </div>

      {/* Location List */}
      {locations.length > 0 && (
        <div className="absolute bottom-2 left-2 right-2 z-10">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg max-h-32 overflow-y-auto">
            <div className="flex items-center mb-2">
              <Route className="w-4 h-4 text-blue-500 mr-2" />
              <span className="text-sm font-medium text-gray-700">
                {locations.length} {locations.length === 1 ? 'location' : 'locations'}
              </span>
            </div>
            <div className="space-y-1">
              {locations.map((location, index) => (
                <div key={index} className="flex items-center text-xs text-gray-600">
                  <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                    {index + 1}
                  </span>
                  <div>
                    <span className="font-medium">{location.title || `Location ${index + 1}`}</span>
                    {location.description && (
                      <span className="text-gray-500 ml-1">- {location.description}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* External Link */}
      <div className="absolute top-2 left-2 z-10">
        <a
          href={locations.length > 0 ? `https://www.openstreetmap.org/#map=10/${locations[0].lat}/${locations[0].lng}` : 'https://www.openstreetmap.org/'}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white/90 backdrop-blur-sm rounded-lg p-2 shadow-lg hover:bg-white transition-colors"
          title="View on OpenStreetMap"
        >
          <Navigation className="w-4 h-4 text-gray-600" />
        </a>
      </div>
    </div>
  )
}
