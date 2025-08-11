import { NextResponse } from "next/server"
import { z } from "zod"

const enrichRequestSchema = z.object({
  name: z.string().min(1),
  city: z.string().optional(),
  country: z.string().optional(),
})

// Simple web scraping function using fetch (no external libraries)
async function scrapePlaceInfo(placeName: string, city?: string) {
  try {
    // Use Wikipedia API for basic place information
    const searchQuery = city ? `${placeName} ${city}` : placeName
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(searchQuery)}`
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'GlobeTrotter-App/1.0 (https://example.com/contact)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Wikipedia API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    // Extract useful information
    const enrichedInfo = {
      description: data.extract || '',
      thumbnail: data.thumbnail?.source || null,
      coordinates: data.coordinates ? {
        lat: data.coordinates.lat,
        lon: data.coordinates.lon
      } : null,
      wikipediaUrl: data.content_urls?.desktop?.page || null,
      // Default opening hours (can be enhanced with more specific APIs)
      openingHours: {
        typical: "09:00-17:00",
        note: "Hours may vary - please verify locally"
      },
      // Estimate duration based on place type
      estimatedDuration: estimateDuration(data.extract || ''),
      lastUpdated: new Date().toISOString()
    }
    
    return enrichedInfo
  } catch (error) {
    console.error('Wikipedia scraping error:', error)
    return null
  }
}

// Simple duration estimation based on content
function estimateDuration(description: string): number {
  const text = description.toLowerCase()
  
  if (text.includes('museum') || text.includes('gallery')) {
    return 2.5 // 2.5 hours for museums
  }
  if (text.includes('park') || text.includes('garden')) {
    return 1.5 // 1.5 hours for parks
  }
  if (text.includes('restaurant') || text.includes('cafe')) {
    return 1.0 // 1 hour for dining
  }
  if (text.includes('monument') || text.includes('statue') || text.includes('landmark')) {
    return 0.5 // 30 minutes for monuments
  }
  if (text.includes('beach') || text.includes('lake')) {
    return 3.0 // 3 hours for beaches/lakes
  }
  if (text.includes('shopping') || text.includes('market')) {
    return 2.0 // 2 hours for shopping
  }
  
  // Default duration
  return 2.0
}

// Alternative: Try OpenStreetMap Nominatim for basic place info
async function tryNominatimSearch(placeName: string, city?: string) {
  try {
    const searchQuery = city ? `${placeName}, ${city}` : placeName
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&extratags=1`
    
    const response = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'GlobeTrotter-App/1.0 (https://example.com/contact)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (data.length > 0) {
      const place = data[0]
      return {
        description: place.display_name || '',
        coordinates: {
          lat: parseFloat(place.lat),
          lon: parseFloat(place.lon)
        },
        category: place.category || 'general',
        type: place.type || 'place',
        openingHours: place.extratags?.opening_hours ? {
          typical: place.extratags.opening_hours,
          note: "From OpenStreetMap data"
        } : {
          typical: "09:00-17:00",
          note: "Estimated hours - please verify locally"
        },
        estimatedDuration: estimateDuration(place.display_name || ''),
        lastUpdated: new Date().toISOString()
      }
    }
    
    return null
  } catch (error) {
    console.error('Nominatim scraping error:', error)
    return null
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validation = enrichRequestSchema.parse(body)
    
    console.log(`Enriching place info for: ${validation.name}${validation.city ? ` in ${validation.city}` : ''}`)
    
    // Try Wikipedia first, then Nominatim as fallback
    let enrichedInfo = await scrapePlaceInfo(validation.name, validation.city)
    
    if (!enrichedInfo) {
      enrichedInfo = await tryNominatimSearch(validation.name, validation.city)
    }
    
    if (!enrichedInfo) {
      // Final fallback - return basic estimated info
      enrichedInfo = {
        description: `${validation.name}${validation.city ? ` in ${validation.city}` : ''}`,
        coordinates: null,
        openingHours: {
          typical: "09:00-17:00",
          note: "Estimated hours - please verify locally"
        },
        estimatedDuration: 2.0,
        lastUpdated: new Date().toISOString()
      }
    }
    
    return NextResponse.json({
      success: true,
      data: enrichedInfo
    })
    
  } catch (error: any) {
    console.error('Enrich place API error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to enrich place information' },
      { status: 500 }
    )
  }
}
