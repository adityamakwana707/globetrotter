// Weather API integration using OpenWeatherMap
const WEATHER_API_KEY = process.env.NEXT_PUBLIC_WEATHER_API_KEY || ''
const WEATHER_API_BASE_URL = 'https://api.openweathermap.org/data/2.5'

export interface WeatherData {
  temperature: number
  feels_like: number
  humidity: number
  pressure: number
  visibility: number
  uv_index?: number
  description: string
  icon: string
  wind_speed: number
  wind_direction: number
  clouds: number
  sunrise?: number
  sunset?: number
}

export interface WeatherForecast {
  date: string
  temperature_min: number
  temperature_max: number
  description: string
  icon: string
  humidity: number
  wind_speed: number
  precipitation_probability: number
  precipitation_amount?: number
}

export interface LocationWeather {
  location: {
    name: string
    country: string
    latitude: number
    longitude: number
    timezone: string
  }
  current: WeatherData
  forecast: WeatherForecast[]
  alerts?: WeatherAlert[]
}

export interface WeatherAlert {
  event: string
  start: number
  end: number
  description: string
  severity: 'minor' | 'moderate' | 'severe' | 'extreme'
}

/**
 * Get current weather for a location
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  try {
    const response = await fetch(
      `${WEATHER_API_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
    )

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()

    return {
      temperature: Math.round(data.main.temp),
      feels_like: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      pressure: data.main.pressure,
      visibility: data.visibility / 1000, // Convert to km
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      wind_speed: data.wind.speed,
      wind_direction: data.wind.deg,
      clouds: data.clouds.all,
      sunrise: data.sys.sunrise,
      sunset: data.sys.sunset,
    }
  } catch (error) {
    console.error('Error fetching current weather:', error)
    throw error
  }
}

/**
 * Get 7-day weather forecast
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number
): Promise<WeatherForecast[]> {
  try {
    const response = await fetch(
      `${WEATHER_API_BASE_URL}/forecast?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}&units=metric`
    )

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()

    // Group forecast data by day (API returns 3-hour intervals)
    const dailyForecasts = new Map<string, any[]>()
    
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toDateString()
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, [])
      }
      dailyForecasts.get(date)!.push(item)
    })

    // Convert to daily forecast format
    const forecasts: WeatherForecast[] = []
    dailyForecasts.forEach((dayData, dateString) => {
      const temperatures = dayData.map(item => item.main.temp)
      const descriptions = dayData.map(item => item.weather[0].description)
      const icons = dayData.map(item => item.weather[0].icon)
      const humidities = dayData.map(item => item.main.humidity)
      const windSpeeds = dayData.map(item => item.wind.speed)
      const precipitations = dayData.map(item => item.pop * 100) // Probability of precipitation

      forecasts.push({
        date: dateString,
        temperature_min: Math.round(Math.min(...temperatures)),
        temperature_max: Math.round(Math.max(...temperatures)),
        description: descriptions[Math.floor(descriptions.length / 2)], // Take middle value
        icon: icons[Math.floor(icons.length / 2)],
        humidity: Math.round(humidities.reduce((a, b) => a + b) / humidities.length),
        wind_speed: Math.round(windSpeeds.reduce((a, b) => a + b) / windSpeeds.length),
        precipitation_probability: Math.round(Math.max(...precipitations)),
      })
    })

    return forecasts.slice(0, 7) // Return max 7 days
  } catch (error) {
    console.error('Error fetching weather forecast:', error)
    throw error
  }
}

/**
 * Get complete weather information for a location
 */
export async function getLocationWeather(
  latitude: number,
  longitude: number,
  locationName?: string
): Promise<LocationWeather> {
  try {
    const [current, forecast] = await Promise.all([
      getCurrentWeather(latitude, longitude),
      getWeatherForecast(latitude, longitude)
    ])

    // Get location info from reverse geocoding if not provided
    let locationInfo = {
      name: locationName || 'Unknown Location',
      country: 'Unknown',
      latitude,
      longitude,
      timezone: 'UTC'
    }

    try {
      const geoResponse = await fetch(
        `${WEATHER_API_BASE_URL}/weather?lat=${latitude}&lon=${longitude}&appid=${WEATHER_API_KEY}`
      )
      if (geoResponse.ok) {
        const geoData = await geoResponse.json()
        locationInfo = {
          name: geoData.name || locationName || 'Unknown Location',
          country: geoData.sys.country || 'Unknown',
          latitude,
          longitude,
          timezone: 'UTC' // OpenWeatherMap doesn't provide timezone
        }
      }
    } catch (geoError) {
      console.warn('Could not fetch location info:', geoError)
    }

    return {
      location: locationInfo,
      current,
      forecast
    }
  } catch (error) {
    console.error('Error fetching location weather:', error)
    throw error
  }
}

/**
 * Get weather icon URL
 */
export function getWeatherIconUrl(iconCode: string, size: '2x' | '4x' = '2x'): string {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`
}

/**
 * Get weather condition color
 */
export function getWeatherConditionColor(iconCode: string): string {
  const conditionColors: { [key: string]: string } = {
    '01d': '#FFD700', // Clear sky day
    '01n': '#191970', // Clear sky night
    '02d': '#87CEEB', // Few clouds day
    '02n': '#4682B4', // Few clouds night
    '03d': '#B0C4DE', // Scattered clouds
    '03n': '#708090',
    '04d': '#778899', // Broken clouds
    '04n': '#2F4F4F',
    '09d': '#4169E1', // Shower rain
    '09n': '#191970',
    '10d': '#1E90FF', // Rain day
    '10n': '#000080', // Rain night
    '11d': '#8B008B', // Thunderstorm
    '11n': '#4B0082',
    '13d': '#F0F8FF', // Snow
    '13n': '#E6E6FA',
    '50d': '#D3D3D3', // Mist
    '50n': '#A9A9A9'
  }

  return conditionColors[iconCode] || '#87CEEB'
}

/**
 * Format temperature with unit
 */
export function formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
  if (unit === 'F') {
    return `${Math.round(temp * 9/5 + 32)}°F`
  }
  return `${Math.round(temp)}°C`
}

/**
 * Get weather-based activity recommendations
 */
export function getWeatherRecommendations(weather: WeatherData): string[] {
  const recommendations: string[] = []
  const temp = weather.temperature
  const description = weather.description.toLowerCase()

  // Temperature-based recommendations
  if (temp < 5) {
    recommendations.push('Bundle up! Consider indoor activities or winter sports.')
  } else if (temp < 15) {
    recommendations.push('Cool weather - perfect for walking tours and museums.')
  } else if (temp < 25) {
    recommendations.push('Great weather for outdoor activities and sightseeing!')
  } else if (temp < 30) {
    recommendations.push('Warm weather - perfect for outdoor dining and parks.')
  } else {
    recommendations.push('Very hot! Stay hydrated and seek shade during midday.')
  }

  // Weather condition recommendations
  if (description.includes('rain')) {
    recommendations.push('Rain expected - bring an umbrella and plan indoor activities.')
  } else if (description.includes('snow')) {
    recommendations.push('Snow conditions - perfect for winter activities!')
  } else if (description.includes('clear')) {
    recommendations.push('Clear skies - excellent for photography and outdoor exploration.')
  } else if (description.includes('cloud')) {
    recommendations.push('Cloudy conditions - comfortable for walking and touring.')
  }

  // Wind recommendations
  if (weather.wind_speed > 10) {
    recommendations.push('Windy conditions - secure loose items and dress accordingly.')
  }

  // Humidity recommendations
  if (weather.humidity > 80) {
    recommendations.push('High humidity - stay cool and hydrated.')
  }

  return recommendations
}

/**
 * Determine best time to visit based on weather
 */
export function getBestTimeToVisit(forecasts: WeatherForecast[]): {
  bestDay: WeatherForecast | null
  worstDay: WeatherForecast | null
  recommendation: string
} {
  if (forecasts.length === 0) {
    return {
      bestDay: null,
      worstDay: null,
      recommendation: 'No forecast data available'
    }
  }

  // Score each day based on temperature, precipitation, and conditions
  const scoredDays = forecasts.map(forecast => {
    let score = 0
    
    // Temperature score (optimal range 18-25°C)
    const avgTemp = (forecast.temperature_min + forecast.temperature_max) / 2
    if (avgTemp >= 18 && avgTemp <= 25) {
      score += 10
    } else if (avgTemp >= 15 && avgTemp <= 30) {
      score += 7
    } else if (avgTemp >= 10 && avgTemp <= 35) {
      score += 5
    } else {
      score += 2
    }
    
    // Precipitation score
    score += (100 - forecast.precipitation_probability) / 10
    
    // Weather condition score
    if (forecast.description.includes('clear')) {
      score += 8
    } else if (forecast.description.includes('partly')) {
      score += 6
    } else if (forecast.description.includes('cloudy')) {
      score += 4
    } else if (forecast.description.includes('rain')) {
      score += 2
    }
    
    return { ...forecast, score }
  })

  const bestDay = scoredDays.reduce((best, current) => 
    current.score > best.score ? current : best
  )
  
  const worstDay = scoredDays.reduce((worst, current) => 
    current.score < worst.score ? current : worst
  )

  let recommendation = ''
  if (bestDay.score >= 15) {
    recommendation = 'Excellent weather conditions expected!'
  } else if (bestDay.score >= 12) {
    recommendation = 'Good weather conditions for most activities.'
  } else if (bestDay.score >= 8) {
    recommendation = 'Fair weather - plan indoor alternatives.'
  } else {
    recommendation = 'Challenging weather conditions - plan accordingly.'
  }

  return {
    bestDay,
    worstDay,
    recommendation
  }
}
