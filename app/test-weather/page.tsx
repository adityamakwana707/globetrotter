"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import WeatherWidget from "@/components/weather/weather-widget"
import { Cloud, CheckCircle, XCircle, AlertTriangle, MapPin } from "lucide-react"

const SAMPLE_LOCATIONS = [
  { name: "New York City", lat: 40.7128, lng: -74.0060 },
  { name: "London", lat: 51.5074, lng: -0.1278 },
  { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
  { name: "Paris", lat: 48.8566, lng: 2.3522 },
  { name: "Sydney", lat: -33.8688, lng: 151.2093 },
]

export default function TestWeatherPage() {
  const [selectedLocation, setSelectedLocation] = useState(SAMPLE_LOCATIONS[0])
  const [customLat, setCustomLat] = useState("")
  const [customLng, setCustomLng] = useState("")
  const [customName, setCustomName] = useState("")
  const [apiStatus, setApiStatus] = useState<'unknown' | 'working' | 'error'>('unknown')
  const [testResults, setTestResults] = useState<string[]>([])

  const testWeatherAPI = async () => {
    setTestResults([])
    setTestResults(prev => [...prev, '🌤️ Testing Weather API...'])

    try {
      // Test if API key is present
      const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY
      if (!apiKey) {
        setTestResults(prev => [...prev, '❌ Weather API key not found in environment variables'])
        setApiStatus('error')
        return
      }

      setTestResults(prev => [...prev, '✅ API key found in environment'])

      // Test weather API call
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${selectedLocation.lat}&lon=${selectedLocation.lng}&appid=${apiKey}&units=metric`
      )

      if (response.ok) {
        const data = await response.json()
        setTestResults(prev => [...prev, `✅ Weather API call successful for ${data.name}`])
        setTestResults(prev => [...prev, `📊 Current temperature: ${Math.round(data.main.temp)}°C`])
        setTestResults(prev => [...prev, `🌤️ Condition: ${data.weather[0].description}`])
        setApiStatus('working')
      } else {
        setTestResults(prev => [...prev, `❌ Weather API call failed: ${response.status} ${response.statusText}`])
        setApiStatus('error')
      }
    } catch (error) {
      console.error('Weather API test error:', error)
      setTestResults(prev => [...prev, `❌ Error testing Weather API: ${error}`])
      setApiStatus('error')
    }
  }

  const handleCustomLocation = () => {
    const lat = parseFloat(customLat)
    const lng = parseFloat(customLng)
    
    if (isNaN(lat) || isNaN(lng)) {
      setTestResults(prev => [...prev, '❌ Invalid coordinates. Please enter valid numbers.'])
      return
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setTestResults(prev => [...prev, '❌ Coordinates out of range. Lat: -90 to 90, Lng: -180 to 180'])
      return
    }

    setSelectedLocation({
      name: customName || `Custom Location (${lat}, ${lng})`,
      lat,
      lng
    })

    setTestResults(prev => [...prev, `✅ Custom location set: ${customName || 'Custom Location'}`])
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-3">
              <Cloud className="w-6 h-6" />
              Weather API Integration Test
              {apiStatus === 'working' && <Badge className="bg-green-600">Working</Badge>}
              {apiStatus === 'error' && <Badge className="bg-red-600">Error</Badge>}
              {apiStatus === 'unknown' && <Badge className="bg-gray-600">Unknown</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              <Button onClick={testWeatherAPI} className="bg-blue-600 hover:bg-blue-700">
                Test Weather API
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

        {/* Location Selection */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">📍 Location Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Sample Locations:</h3>
                <div className="grid grid-cols-1 gap-2">
                  {SAMPLE_LOCATIONS.map((location, index) => (
                    <Button
                      key={index}
                      onClick={() => setSelectedLocation(location)}
                      variant={selectedLocation.name === location.name ? "default" : "outline"}
                      className={`justify-start ${
                        selectedLocation.name === location.name 
                          ? "bg-blue-600 hover:bg-blue-700" 
                          : "border-gray-600 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {location.name}
                      <span className="ml-auto text-xs text-gray-400">
                        {location.lat.toFixed(2)}, {location.lng.toFixed(2)}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-white font-semibold mb-2">Custom Location:</h3>
                <div className="space-y-2">
                  <Input
                    placeholder="Location name (optional)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Latitude (-90 to 90)"
                      value={customLat}
                      onChange={(e) => setCustomLat(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Input
                      placeholder="Longitude (-180 to 180)"
                      value={customLng}
                      onChange={(e) => setCustomLng(e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <Button 
                    onClick={handleCustomLocation}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Use Custom Location
                  </Button>
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
                  <span className="text-gray-300">Weather API Key</span>
                  {process.env.NEXT_PUBLIC_WEATHER_API_KEY ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Current Weather API</span>
                  {apiStatus === 'working' ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : apiStatus === 'error' ? (
                    <XCircle className="w-5 h-5 text-red-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Selected Location</span>
                  <span className="text-blue-400 text-sm">{selectedLocation.name}</span>
                </div>

                <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                  <h4 className="text-blue-400 font-semibold mb-2">💡 Setup Instructions:</h4>
                  <ol className="text-sm text-gray-300 space-y-1">
                    <li>1. Sign up at <a href="https://openweathermap.org/api" className="text-blue-400 underline" target="_blank" rel="noopener noreferrer">OpenWeatherMap</a></li>
                    <li>2. Get your free API key</li>
                    <li>3. Add key to NEXT_PUBLIC_WEATHER_API_KEY in .env.local</li>
                    <li>4. Restart your development server</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weather Widget Test */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">🌤️ Weather Widget Test</CardTitle>
            <p className="text-gray-400">Testing location: {selectedLocation.name}</p>
          </CardHeader>
          <CardContent>
            <WeatherWidget
              latitude={selectedLocation.lat}
              longitude={selectedLocation.lng}
              locationName={selectedLocation.name}
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
                    <span className="text-gray-300 text-sm">Current weather loads</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Weather icons display</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Temperature shows correctly</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-3">Advanced Tests:</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">7-day forecast works</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Weather recommendations show</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Different locations work</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-gray-300 text-sm">Error handling works</span>
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
