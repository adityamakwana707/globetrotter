import { NextRequest, NextResponse } from 'next/server';
import { getCities } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!query || query.trim().length < 2) {
      return NextResponse.json([]);
    }

    // 1. INSTANT: Get results from database (fast, no waiting)
    const dbResults = await getCities(query.trim(), limit);
    
    // 2. BACKGROUND: Fetch from Nominatim (slower, but more comprehensive)
    let geocodingResults: any[] = [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=10&addressdetails=1`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'GlobeTrotter/1.0'
          }
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        geocodingResults = data.map((item: any) => ({
          id: `geocoding_${item.place_id}`,
          display_id: item.place_id,
          name: item.name || item.display_name?.split(',')[0] || 'Unknown',
          country: item.address?.country || 'Unknown',
          latitude: parseFloat(item.lat) || 0,
          longitude: parseFloat(item.lon) || 0,
          timezone: null,
          description: item.display_name || '',
          image_url: null,
          cost_index: 50,
          popularity_score: 0,
          created_at: new Date(),
          source: 'geocoding',
          display_name: item.display_name,
          type: item.type,
          importance: item.importance || 0
        }));
      }
    } catch (error) {
      // Silently fail for geocoding - we still have database results
      console.log('Geocoding failed, using database results only:', error instanceof Error ? error.message : 'Unknown error');
    }

    // 3. COMBINE: Merge database and geocoding results
    const combinedResults = [...dbResults];
    
    // Add geocoding results that aren't duplicates
    geocodingResults.forEach(geoItem => {
      const isDuplicate = combinedResults.some(dbItem => 
        dbItem.name.toLowerCase() === geoItem.name.toLowerCase() &&
        dbItem.country.toLowerCase() === geoItem.country.toLowerCase()
      );
      
      if (!isDuplicate) {
        combinedResults.push(geoItem);
      }
    });

    // 4. SORT: Prioritize database results, then by importance
    combinedResults.sort((a, b) => {
      // Database results first (they don't have source property)
      if ('source' in a && a.source === 'geocoding' && 'source' in b && b.source !== 'geocoding') return 1;
      if ('source' in a && a.source !== 'geocoding' && 'source' in b && b.source === 'geocoding') return -1;
      
      // Then by popularity/importance
      if (!('source' in a) && !('source' in b)) {
        return (b.popularity_score || 0) - (a.popularity_score || 0);
      }
      
      // Geocoding results by importance
      if ('importance' in a && 'importance' in b) {
        return ((b as any).importance || 0) - ((a as any).importance || 0);
      }
      
      return 0;
    });

    // 5. RETURN: Limited results
    return NextResponse.json(combinedResults.slice(0, limit));

  } catch (error) {
    console.error('Error in destination search:', error);
    return NextResponse.json([], { status: 500 });
  }
}
