import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query || query.length < 2) {
      return NextResponse.json([])
    }

    // Make the request from our server (no CORS issues)
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
      `format=json&` +
      `q=${encodeURIComponent(query)}&` +
      `limit=6&` +
      `addressdetails=1&` +
      `extratags=1&` +
      `accept-language=en`

    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'GlobeTrotter-App/1.0 (travel-planning-app)', // Required by Nominatim
      },
    })

    if (!response.ok) {
      console.error(`Nominatim API error: ${response.status} ${response.statusText}`)
      return NextResponse.json([], { status: 500 })
    }

    const data = await response.json()
    
    // Filter and format the results
    const filteredResults = data
      .filter((location: any) => location.importance > 0.3)
      .sort((a: any, b: any) => b.importance - a.importance)
      .slice(0, 6)
      .map((location: any) => ({
        id: parseInt(location.place_id) || Math.random(),
        name: getLocationName(location),
        country: getCountryFromDisplay(location.display_name),
        latitude: parseFloat(location.lat),
        longitude: parseFloat(location.lon),
        type: location.type,
        importance: location.importance,
        display_name: location.display_name
      }))

    return NextResponse.json(filteredResults)

  } catch (error) {
    console.error('Geocoding API error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

// Helper function to extract location name
function getLocationName(location: any): string {
  const parts = location.display_name.split(', ')
  
  // For cities, return city name
  if (location.class === 'place' && (location.type === 'city' || location.type === 'town')) {
    return parts[0]
  }
  
  // For countries, return country name
  if (location.class === 'place' && location.type === 'country') {
    return parts[0]
  }
  
  // For other places, return first part
  return parts[0]
}

// Helper function to extract country from display_name
function getCountryFromDisplay(displayName: string): string {
  const parts = displayName.split(', ')
  return parts[parts.length - 1] || ''
}
