import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json([])
    }

    // Use Nominatim API for geocoding
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query.trim())}&format=json&limit=10&addressdetails=1&countrycodes=`
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    const response = await fetch(nominatimUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'GlobeTrotter/1.0 (https://yourdomain.com)'
      }
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`)
      return NextResponse.json([])
    }

    const data = await response.json()
    
    // Filter and format the results
    const formattedResults = data
      .filter((item: any) => item.display_name && item.lat && item.lon)
      .map((item: any) => ({
        name: item.name || item.display_name.split(',')[0],
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        importance: item.importance,
        country: item.address?.country,
        address: item.address
      }))
      .sort((a: any, b: any) => b.importance - a.importance) // Sort by importance
      .slice(0, 8) // Limit to top 8 results

    return NextResponse.json(formattedResults)

  } catch (error) {
    console.error('Geocoding error:', error)
    
    // Check if it's a timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      console.log('Geocoding request timed out')
      return NextResponse.json([])
    }
    
    return NextResponse.json([])
  }
}
