import { Loader } from '@googlemaps/js-api-loader'

// Google Maps configuration
const GOOGLE_MAPS_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  version: 'weekly',
  libraries: ['places', 'geometry'] as const,
}

// Initialize Google Maps loader
export const googleMapsLoader = new Loader(GOOGLE_MAPS_CONFIG)

// Cache for loaded Google Maps instance
let googleMapsInstance: typeof google | null = null

/**
 * Load Google Maps API
 */
export async function loadGoogleMaps(): Promise<typeof google> {
  if (googleMapsInstance) {
    return googleMapsInstance
  }

  try {
    googleMapsInstance = await googleMapsLoader.load()
    return googleMapsInstance
  } catch (error) {
    console.error('Failed to load Google Maps:', error)
    throw new Error('Google Maps failed to load')
  }
}

/**
 * Initialize Places Autocomplete
 */
export async function initializePlacesAutocomplete(
  input: HTMLInputElement,
  options?: google.maps.places.AutocompleteOptions
): Promise<google.maps.places.Autocomplete> {
  const google = await loadGoogleMaps()
  
  const defaultOptions: google.maps.places.AutocompleteOptions = {
    types: ['(cities)'],
    fields: ['place_id', 'name', 'formatted_address', 'geometry', 'photos', 'types'],
    ...options,
  }

  return new google.maps.places.Autocomplete(input, defaultOptions)
}

/**
 * Get place details by place ID
 */
export async function getPlaceDetails(
  placeId: string,
  fields?: string[]
): Promise<google.maps.places.PlaceResult | null> {
  const google = await loadGoogleMaps()
  
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(
      document.createElement('div')
    )

    service.getDetails(
      {
        placeId,
        fields: fields || [
          'place_id',
          'name',
          'formatted_address',
          'geometry',
          'photos',
          'types',
          'rating',
          'user_ratings_total',
        ],
      },
      (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place)
        } else {
          reject(new Error(`Places service failed: ${status}`))
        }
      }
    )
  })
}

/**
 * Search for places nearby
 */
export async function searchNearbyPlaces(
  location: google.maps.LatLngLiteral,
  radius: number = 5000,
  type?: string
): Promise<google.maps.places.PlaceResult[]> {
  const google = await loadGoogleMaps()
  
  return new Promise((resolve, reject) => {
    const service = new google.maps.places.PlacesService(
      document.createElement('div')
    )

    const request: google.maps.places.PlaceSearchRequest = {
      location,
      radius,
      type: type as any,
    }

    service.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        resolve(results)
      } else {
        reject(new Error(`Nearby search failed: ${status}`))
      }
    })
  })
}

/**
 * Calculate distance between two points
 */
export async function calculateDistance(
  origin: google.maps.LatLngLiteral,
  destination: google.maps.LatLngLiteral
): Promise<{
  distance: string
  duration: string
  distanceValue: number
  durationValue: number
}> {
  const google = await loadGoogleMaps()
  
  return new Promise((resolve, reject) => {
    const service = new google.maps.DistanceMatrixService()

    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
        unitSystem: google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response) {
          const element = response.rows[0]?.elements[0]
          if (element && element.status === 'OK') {
            resolve({
              distance: element.distance?.text || '',
              duration: element.duration?.text || '',
              distanceValue: element.distance?.value || 0,
              durationValue: element.duration?.value || 0,
            })
          } else {
            reject(new Error('Distance calculation failed'))
          }
        } else {
          reject(new Error(`Distance Matrix service failed: ${status}`))
        }
      }
    )
  })
}

/**
 * Geocode an address
 */
export async function geocodeAddress(
  address: string
): Promise<google.maps.GeocoderResult[]> {
  const google = await loadGoogleMaps()
  
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder()

    geocoder.geocode({ address }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results) {
        resolve(results)
      } else {
        reject(new Error(`Geocoding failed: ${status}`))
      }
    })
  })
}

/**
 * Reverse geocode coordinates
 */
export async function reverseGeocode(
  location: google.maps.LatLngLiteral
): Promise<google.maps.GeocoderResult[]> {
  const google = await loadGoogleMaps()
  
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder()

    geocoder.geocode({ location }, (results, status) => {
      if (status === google.maps.GeocoderStatus.OK && results) {
        resolve(results)
      } else {
        reject(new Error(`Reverse geocoding failed: ${status}`))
      }
    })
  })
}

/**
 * Get photo URL from place photo reference
 */
export function getPlacePhotoUrl(
  photoReference: string,
  maxWidth: number = 400
): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_CONFIG.apiKey}`
}

/**
 * Format place result for our database
 */
export function formatPlaceForDatabase(place: google.maps.places.PlaceResult) {
  return {
    name: place.name || '',
    formatted_address: place.formatted_address || '',
    place_id: place.place_id || '',
    latitude: place.geometry?.location?.lat() || 0,
    longitude: place.geometry?.location?.lng() || 0,
    types: place.types || [],
    rating: place.rating || null,
    user_ratings_total: place.user_ratings_total || null,
    photo_reference: place.photos?.[0]?.photo_reference || null,
  }
}
