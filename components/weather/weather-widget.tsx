"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Cloud,
  CloudRain,
  Sun,
  CloudSnow,
  Wind,
  Droplets,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  RefreshCw,
  AlertTriangle,
  Thermometer,
  Calendar
} from "lucide-react"
import {
  getLocationWeather,
  getWeatherIconUrl,
  getWeatherConditionColor,
  formatTemperature,
  getWeatherRecommendations,
  getBestTimeToVisit,
  type LocationWeather,
  type WeatherData,
  type WeatherForecast
} from "@/lib/weather"
import { toast } from "@/hooks/use-toast"

interface WeatherWidgetProps {
  latitude: number
  longitude: number
  locationName?: string
  className?: string
}

export default function WeatherWidget({
  latitude,
  longitude,
  locationName,
  className = ""
}: WeatherWidgetProps) {
  const [weatherData, setWeatherData] = useState<LocationWeather | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    if (latitude && longitude) {
      fetchWeatherData()
    }
  }, [latitude, longitude, locationName])

  const fetchWeatherData = async () => {
    if (!latitude || !longitude) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await getLocationWeather(latitude, longitude, locationName)
      setWeatherData(data)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Weather fetch error:', err)
      setError('Failed to load weather data')
      toast({
        title: "Weather Error",
        description: "Could not load weather information. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getWeatherIcon = (iconCode: string) => {
    const iconMap: { [key: string]: any } = {
      '01d': Sun,
      '01n': Sun,
      '02d': Cloud,
      '02n': Cloud,
      '03d': Cloud,
      '03n': Cloud,
      '04d': Cloud,
      '04n': Cloud,
      '09d': CloudRain,
      '09n': CloudRain,
      '10d': CloudRain,
      '10n': CloudRain,
      '11d': CloudRain,
      '11n': CloudRain,
      '13d': CloudSnow,
      '13n': CloudSnow,
      '50d': Cloud,
      '50n': Cloud,
    }

    const IconComponent = iconMap[iconCode] || Cloud
    return <IconComponent className="w-8 h-8" style={{ color: getWeatherConditionColor(iconCode) }} />
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  if (isLoading) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Loading weather...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !weatherData) {
    return (
      <Card className={`bg-gray-800 border-gray-700 ${className}`}>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-400" />
            <p className="text-gray-400 mb-4">{error || 'Weather data unavailable'}</p>
            <Button onClick={fetchWeatherData} variant="outline" className="border-gray-600 text-gray-300">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { location, current, forecast } = weatherData
  const recommendations = getWeatherRecommendations(current)
  const { bestDay, worstDay, recommendation } = getBestTimeToVisit(forecast)

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Weather */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              {getWeatherIcon(current.icon)}
              Weather in {location.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-gray-400 text-sm">
                  Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
              <Button
                onClick={fetchWeatherData}
                size="sm"
                variant="ghost"
                className="text-gray-400 hover:text-white"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Temperature */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Thermometer className="w-5 h-5 text-red-400 mr-2" />
                <span className="text-3xl font-bold text-white">
                  {formatTemperature(current.temperature)}
                </span>
              </div>
              <p className="text-gray-400 text-sm">
                Feels like {formatTemperature(current.feels_like)}
              </p>
              <p className="text-gray-300 capitalize">{current.description}</p>
            </div>

            {/* Wind */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Wind className="w-5 h-5 text-blue-400 mr-2" />
                <span className="text-xl font-semibold text-white">
                  {current.wind_speed} m/s
                </span>
              </div>
              <p className="text-gray-400 text-sm">Wind Speed</p>
              <p className="text-gray-300 text-sm">{current.wind_direction}°</p>
            </div>

            {/* Humidity */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Droplets className="w-5 h-5 text-cyan-400 mr-2" />
                <span className="text-xl font-semibold text-white">
                  {current.humidity}%
                </span>
              </div>
              <p className="text-gray-400 text-sm">Humidity</p>
              <p className="text-gray-300 text-sm">{current.clouds}% clouds</p>
            </div>

            {/* Visibility */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Eye className="w-5 h-5 text-green-400 mr-2" />
                <span className="text-xl font-semibold text-white">
                  {current.visibility} km
                </span>
              </div>
              <p className="text-gray-400 text-sm">Visibility</p>
              <p className="text-gray-300 text-sm">{current.pressure} hPa</p>
            </div>
          </div>

          {/* Sunrise/Sunset */}
          {current.sunrise && current.sunset && (
            <div className="flex justify-center space-x-8 mt-4 pt-4 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <Sunrise className="w-4 h-4 text-yellow-400" />
                <span className="text-gray-300 text-sm">
                  {formatTime(current.sunrise)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Sunset className="w-4 h-4 text-orange-400" />
                <span className="text-gray-300 text-sm">
                  {formatTime(current.sunset)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast and Recommendations */}
      <Tabs defaultValue="forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800 border-gray-700">
          <TabsTrigger value="forecast" className="data-[state=active]:bg-gray-700">
            7-Day Forecast
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-gray-700">
            Recommendations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Weather Forecast
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {forecast.map((day, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="text-center min-w-[80px]">
                        <p className="text-white font-medium">
                          {index === 0 ? 'Today' : new Date(day.date).toLocaleDateString([], { weekday: 'short' })}
                        </p>
                        <p className="text-gray-400 text-xs">
                          {new Date(day.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getWeatherIcon(day.icon)}
                        <span className="text-gray-300 capitalize text-sm">
                          {day.description}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <p className="text-white font-semibold">
                          {formatTemperature(day.temperature_max)} / {formatTemperature(day.temperature_min)}
                        </p>
                        <p className="text-gray-400 text-xs">High / Low</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <CloudRain className="w-4 h-4 text-blue-400" />
                          <span className="text-white text-sm">{day.precipitation_probability}%</span>
                        </div>
                        <p className="text-gray-400 text-xs">Rain</p>
                      </div>
                      
                      <div className="text-center">
                        <div className="flex items-center space-x-1">
                          <Wind className="w-4 h-4 text-gray-400" />
                          <span className="text-white text-sm">{day.wind_speed} m/s</span>
                        </div>
                        <p className="text-gray-400 text-xs">Wind</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Best/Worst day indicators */}
              {bestDay && worstDay && (
                <div className="mt-6 p-4 bg-gray-700 rounded-lg">
                  <h4 className="text-white font-semibold mb-3">Weather Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-green-600 text-white">Best Day</Badge>
                      <span className="text-gray-300">
                        {new Date(bestDay.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className="bg-red-600 text-white">Challenging</Badge>
                      <span className="text-gray-300">
                        {new Date(worstDay.date).toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm mt-2">{recommendation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="mt-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Travel Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="text-white font-semibold mb-3">Current Conditions</h4>
                  <div className="space-y-2">
                    {recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-gray-300 text-sm">{rec}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-700">
                  <h4 className="text-white font-semibold mb-3">What to Pack</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-gray-300 font-medium mb-2">Clothing</h5>
                      <div className="space-y-1">
                        {current.temperature < 10 && (
                          <p className="text-gray-400 text-sm">• Warm layers, jacket, gloves</p>
                        )}
                        {current.temperature >= 10 && current.temperature < 20 && (
                          <p className="text-gray-400 text-sm">• Light layers, sweater</p>
                        )}
                        {current.temperature >= 20 && current.temperature < 30 && (
                          <p className="text-gray-400 text-sm">• Comfortable clothes, light jacket</p>
                        )}
                        {current.temperature >= 30 && (
                          <p className="text-gray-400 text-sm">• Light, breathable clothing</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <h5 className="text-gray-300 font-medium mb-2">Accessories</h5>
                      <div className="space-y-1">
                        {current.description.includes('rain') && (
                          <p className="text-gray-400 text-sm">• Umbrella, waterproof jacket</p>
                        )}
                        {current.description.includes('sun') && (
                          <p className="text-gray-400 text-sm">• Sunglasses, hat, sunscreen</p>
                        )}
                        {current.wind_speed > 10 && (
                          <p className="text-gray-400 text-sm">• Windbreaker, secure accessories</p>
                        )}
                        <p className="text-gray-400 text-sm">• Comfortable walking shoes</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
