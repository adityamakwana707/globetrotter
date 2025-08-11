"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, RefreshCw, CheckCircle } from "lucide-react"

interface WeatherDebugProps {
  latitude: number
  longitude: number
  locationName?: string
}

export default function WeatherDebug({
  latitude,
  longitude,
  locationName
}: WeatherDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testWeatherAPI = async () => {
    setIsLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      // Test the weather API directly
      const testUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=demo&units=metric`
      
      setDebugInfo({
        coordinates: { latitude, longitude },
        locationName,
        testUrl,
        status: 'Testing API...'
      })

      // Try to call our internal weather API
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitude,
          longitude,
          locationName
        })
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      setDebugInfo({
        coordinates: { latitude, longitude },
        locationName,
        testUrl,
        status: 'Success',
        apiResponse: data,
        responseSize: JSON.stringify(data).length
      })

    } catch (err: any) {
      console.error('Weather debug error:', err)
      setError(err.message)
      setDebugInfo({
        coordinates: { latitude, longitude },
        locationName,
        testUrl: `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=demo&units=metric`,
        status: 'Failed',
        error: err.message
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Weather Debug - {locationName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-300">
            <div>Coordinates: {latitude}, {longitude}</div>
            <div>Location: {locationName || 'Unknown'}</div>
          </div>
          <Button
            onClick={testWeatherAPI}
            disabled={isLoading}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Test API
          </Button>
        </div>

        {debugInfo && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              {debugInfo.status === 'Success' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : debugInfo.status === 'Failed' ? (
                <AlertTriangle className="w-4 h-4 text-red-400" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
              )}
              <span className="text-sm font-medium text-white">
                Status: {debugInfo.status}
              </span>
            </div>

            <div className="bg-gray-900 rounded p-3 text-xs font-mono">
              <pre className="text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-500/20 rounded">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Error</span>
            </div>
            <p className="text-red-300 text-sm mt-1">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
