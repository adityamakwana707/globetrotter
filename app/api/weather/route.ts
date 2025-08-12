import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    
    if (!city && (!lat || !lon)) {
      return NextResponse.json({ 
        error: 'City name or coordinates required',
        available: false 
      }, { status: 400 })
    }

    // Use OpenWeatherMap API (free tier)
    const apiKey = process.env.OPENWEATHER_API_KEY
    let weatherUrl = ''
    
    // If no API key, return demo data with available: false flag
    if (!apiKey || apiKey === 'demo_key') {
      const demoWeatherData = {
        available: false, // Flag to indicate this is demo data
        location: city || 'Demo City',
        country: 'Demo Country',
        temperature: Math.floor(Math.random() * 30) + 10, // Random temp between 10-40°C
        feels_like: Math.floor(Math.random() * 30) + 10,
        humidity: Math.floor(Math.random() * 40) + 40, // Random humidity between 40-80%
        description: ['sunny', 'cloudy', 'partly cloudy', 'clear'][Math.floor(Math.random() * 4)],
        icon: '01d',
        wind_speed: Math.floor(Math.random() * 20) + 5, // Random wind between 5-25 km/h
        pressure: 1013,
        visibility: 10,
        sunrise: Date.now() / 1000 - 21600, // 6 hours ago
        sunset: Date.now() / 1000 + 21600, // 6 hours from now
        timestamp: Date.now() / 1000
      }
      return NextResponse.json(demoWeatherData)
    }
    
    if (lat && lon) {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    } else {
      weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city!)}&appid=${apiKey}&units=metric`
    }

    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(weatherUrl, {
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Weather API error: ${response.status} ${response.statusText}`)
      return NextResponse.json({ 
        error: 'Weather data not available',
        available: false 
      }, { status: 404 })
    }

    const data = await response.json()
    
    // Validate that we have the minimum required data
    if (!data.name || !data.main || !data.weather || !data.weather[0]) {
      console.error('Invalid weather data structure:', data)
      return NextResponse.json({ 
        error: 'Invalid weather data received',
        available: false 
      }, { status: 500 })
    }
    
    // Format the weather data
    const weatherData = {
      available: true, // Flag to indicate this is real data
      location: data.name,
      country: data.sys?.country || 'Unknown',
      temperature: Math.round(data.main?.temp) || null,
      feels_like: Math.round(data.main?.feels_like) || null,
      humidity: data.main?.humidity || null,
      description: data.weather?.[0]?.description || 'Unknown',
      icon: data.weather?.[0]?.icon || '01d',
      wind_speed: data.wind?.speed ? Math.round(data.wind.speed * 3.6) : null, // Convert m/s to km/h
      pressure: data.main?.pressure || null,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : null, // Convert to km
      sunrise: data.sys?.sunrise || null,
      sunset: data.sys?.sunset || null,
      timestamp: data.dt || null
    }

    return NextResponse.json(weatherData)

  } catch (error) {
    console.error('Weather API error:', error)
    
    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Weather request timed out',
        available: false 
      }, { status: 408 })
    }
    
    return NextResponse.json({ 
      error: 'Weather service unavailable',
      available: false 
    }, { status: 500 })
  }
}
