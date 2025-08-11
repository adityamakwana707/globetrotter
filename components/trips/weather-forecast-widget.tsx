"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CloudSun, Cloud, Sun, CloudRain, CloudSnow, Wind, Droplets, Eye, RefreshCw } from "lucide-react"

interface WeatherData {
  temperature: number
  condition: string
  description: string
  humidity: number
  windSpeed: number
  visibility: number
  icon: string
}

interface WeatherForecastWidgetProps {
  latitude: number
  longitude: number
  date: string
  locationName: string
  className?: string
}

export default function WeatherForecastWidget({
  latitude,
  longitude,
  date,
  locationName,
  className = ""
}: WeatherForecastWidgetProps) {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWeatherData()
  }, [latitude, longitude, date])

  const fetchWeatherData = async () => {
    if (!process.env.NEXT_PUBLIC_WEATHER_API_KEY) {
      setError("Weather API key not configured")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // For demo purposes, we'll simulate weather data
      // In production, you'd call the actual OpenWeatherMap API
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call

      // Mock weather data based on location and date
      const mockWeatherData: WeatherData = {
        temperature: Math.floor(Math.random() * 30) + 10, // 10-40°C
        condition: ["Clear", "Partly Cloudy", "Cloudy", "Light Rain", "Sunny"][Math.floor(Math.random() * 5)],
        description: "Perfect weather for outdoor activities",
        humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
        windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
        visibility: Math.floor(Math.random() * 5) + 10, // 10-15 km
        icon: "01d"
      }

      setWeatherData(mockWeatherData)
    } catch (err) {
      console.error('Weather fetch error:', err)
      setError('Failed to load weather data')
    } finally {
      setIsLoading(false)
    }
  }

  const getWeatherIcon = (condition: string) => {
    switch (condition.toLowerCase()) {
      case "clear":
      case "sunny":
        return <Sun className="w-8 h-8 text-yellow-500" />
      case "partly cloudy":
        return <CloudSun className="w-8 h-8 text-blue-400" />
      case "cloudy":
        return <Cloud className="w-8 h-8 text-gray-400" />
      case "light rain":
      case "rain":
        return <CloudRain className="w-8 h-8 text-blue-600" />
      case "snow":
        return <CloudSnow className="w-8 h-8 text-white" />
      default:
        return <CloudSun className="w-8 h-8 text-blue-400" />
    }
  }

  const getWeatherRecommendation = (condition: string, temperature: number) => {
    if (condition.toLowerCase().includes("rain")) {
      return "Don't forget your umbrella! Indoor activities recommended."
    }
    if (temperature > 30) {
      return "Hot weather! Stay hydrated and plan indoor activities during midday."
    }
    if (temperature < 10) {
      return "Cold weather! Pack warm clothes and plan accordingly."
    }
    if (condition.toLowerCase().includes("clear") || condition.toLowerCase().includes("sunny")) {
      return "Perfect weather for outdoor activities and sightseeing!"
    }
    return "Good weather for most activities. Check conditions before heading out."
  }

  if (isLoading) {
    return (
      <Card className={`bg-gray-700 border-gray-600 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <span className="text-gray-400">Loading weather...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={`bg-gray-700 border-gray-600 ${className}`}>
        <CardContent className="p-4">
          <div className="text-center">
            <CloudSun className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-400 text-sm">{error}</p>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={fetchWeatherData}
              className="mt-2 text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!weatherData) {
    return null
  }

  return (
    <Card className={`bg-gray-700 border-gray-600 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center">
          <CloudSun className="w-5 h-5 mr-2" />
          Weather for {locationName}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Main Weather Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {getWeatherIcon(weatherData.condition)}
            <div>
              <div className="text-2xl font-bold text-white">
                {weatherData.temperature}°C
              </div>
              <div className="text-gray-300">
                {weatherData.condition}
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <Badge variant="secondary" className="bg-blue-600 text-white mb-2">
              {new Date(date).toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Badge>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <Droplets className="w-4 h-4 text-blue-400 mx-auto mb-1" />
            <div className="text-gray-400">Humidity</div>
            <div className="text-white font-medium">{weatherData.humidity}%</div>
          </div>
          
          <div className="text-center">
            <Wind className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <div className="text-gray-400">Wind</div>
            <div className="text-white font-medium">{weatherData.windSpeed} km/h</div>
          </div>
          
          <div className="text-center">
            <Eye className="w-4 h-4 text-gray-400 mx-auto mb-1" />
            <div className="text-gray-400">Visibility</div>
            <div className="text-white font-medium">{weatherData.visibility} km</div>
          </div>
        </div>

        {/* Weather Recommendation */}
        <div className="bg-gray-800 p-3 rounded-lg">
          <h4 className="text-white font-medium mb-1">Travel Tip</h4>
          <p className="text-gray-300 text-sm">
            {getWeatherRecommendation(weatherData.condition, weatherData.temperature)}
          </p>
        </div>

        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={fetchWeatherData}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
