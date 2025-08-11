"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import LocationAutocomplete from "@/components/maps/location-autocomplete"
import InteractiveMap from "@/components/maps/interactive-map"
import { MapPin, CheckCircle, XCircle, AlertTriangle } from "lucide-react"

interface TestLocation {
  id: string
  name: string
  latitude: number
  longitude: number
  type: 'city' | 'activity'
  description: string
}

export default function TestMapsPage() {
  const [selectedLocations, setSelectedLocations] = useState<TestLocation[]>([])
  const [apiStatus, setApiStatus] = useState<'unknown' | 'working' | 'error'>('unknown')
  const [testResults, setTestResults] = useState<string[]>([])

  const handleLocationSelect = (location: any) => {
    const newLocation: TestLocation = {
      id: location.place_id || Math.random().toString(),
      name: location.name,
      latitude: location.latitude,
      longitude: location.longitude,
      type: 'city',
      description: location.formatted_address || location.name
    }

    setSelectedLocations(prev => [...prev, newLocation])
    setApiStatus('working')
    setTestResults(prev => [...prev, `✅ Successfully selected: ${location.name}`])
  }

  const testGoogleMapsAPI = async () => {
    setTestResults([])
    setTestResults(prev => [...prev, '🧪 Testing Google Maps API...'])

    try {
      // Test if API key is present
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey) {
        setTestResults(prev => [...prev, '❌ Google Maps API key not found in environment variables'])
        setApiStatus('error')
        return
      }

      setTestResults(prev => [...prev, '✅ API key found in environment'])

      // Test Google Maps loading
      const { loadGoogleMaps } = await import('@/lib/google-maps')
      const google = await loadGoogleMaps()
      
      if (google) {
        setTestResults(prev => [...prev, '✅ Google Maps API loaded successfully'])
        setApiStatus('working')
      }
    } catch (error) {
      console.error('Maps API test error:', error)
      setTestResults(prev => [...prev, `❌ Error loading Google Maps: ${error}`])
      setApiStatus('error')
    }
  }

  const clearLocations = () => {
    setSelectedLocations([])
    setTestResults([])
    setApiStatus('unknown')
  }

  const addSampleLocations = () => {
    const sampleLocations: TestLocation[] = [
      {
        id: '1',
        name: 'New York City',
        latitude: 40.7128,
        longitude: -74.0060,
        type: 'city',
        description: 'New York, NY, USA'
      },
      {
        id: '2',
        name: 'Los Angeles',
        latitude: 34.0522,
        longitude: -118.2437,
        type: 'city',
        description: 'Los Angeles, CA, USA'
      },
      {
        id: '3',
        name: 'Chicago',
        latitude: 41.8781,
        longitude: -87.6298,
        type: 'city',
        description: 'Chicago, IL, USA'
      }
    ]
    
    setSelectedLocations(sampleLocations)
    setTestResults(prev => [...prev, '✅ Added sample locations for testing'])
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <MapPin className="w-6 h-6" />
              Google Maps Integration Test
              {apiStatus === 'working' && <Badge className="bg-green-600">Working</Badge>}
              {apiStatus === 'error' && <Badge className="bg-red-600">Error</Badge>}
              {apiStatus === 'unknown' && <Badge className="bg-gray-600">Unknown</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button onClick={testGoogleMapsAPI} className="bg-blue-600 hover:bg-blue-700">
                Test Google Maps API
              </Button>
              <Button onClick={addSampleLocations} variant="outline" className="border-gray-600 text-gray-300">
                Add Sample Locations
              </Button>
              <Button onClick={clearLocations} variant="outline" className="border-gray-600 text-gray-300">
                Clear All
              </Button>
            </div>

            {/* Test Results */}
            {testResults.length > 0 && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-white font-semibold mb-2">Test Results:</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <p key={index} className="text-sm font-mono text-gray-300">{result}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Search Test */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">🔍 Location Search Test</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Search for locations:</h3>
                <LocationAutocomplete
                  onLocationSelect={handleLocationSelect}
                  placeholder="Try searching for 'New York', 'Paris', 'Tokyo'..."
                  types={['(cities)']}
                />
              </div>

              <div>
                <h3 className="text-white font-semibold mb-2">Selected Locations ({selectedLocations.length}):</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedLocations.map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <div>
                        <p className="text-white font-medium">{location.name}</p>
                        <p className="text-gray-400 text-sm">{location.description}</p>
                        <p className="text-gray-500 text-xs">
                          {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                        </p>
                      </div>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                  ))}
                  {selectedLocations.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No locations selected yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* API Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">📊 API Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Google Maps API Key</span>
                  {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Maps JavaScript API</span>
                  {apiStatus === 'working' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : apiStatus === 'error' ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Places API</span>
                  {selectedLocations.length > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  )}
                </div>

                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                  <h4 className="text-blue-400 font-semibold mb-2">💡 Setup Instructions:</h4>
                  <ol className="text-sm text-gray-300 space-y-1">
                    <li>1. Get API key from Google Cloud Console</li>
                    <li>2. Enable Maps JavaScript API & Places API</li>
                    <li>3. Add key to NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in .env.local</li>
                    <li>4. Restart your development server</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Map Test */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🗺️ Interactive Map Test</CardTitle>
          </CardHeader>
          <CardContent>
            <InteractiveMap
              locations={selectedLocations}
              showRoute={selectedLocations.length > 1}
              height="500px"
            />
          </CardContent>
        </Card>

        {/* Testing Checklist */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">✅ Testing Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-white font-semibold mb-3">Basic Tests:</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">API key configured</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Location search working</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Map displays correctly</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Markers appear on map</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Advanced Tests:</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Route drawing between points</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Info windows on marker click</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Map controls working</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Fullscreen mode</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
