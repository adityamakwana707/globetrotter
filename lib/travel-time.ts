import { calculateDistance } from './google-maps'

export interface TravelTime {
  distance: string
  duration: string
  distanceValue: number // in meters
  durationValue: number // in seconds
  mode: 'driving' | 'walking' | 'transit'
}

export interface RouteSegment {
  from: {
    name: string
    latitude: number
    longitude: number
  }
  to: {
    name: string
    latitude: number
    longitude: number
  }
  travelTime: TravelTime
  estimatedCost?: number
}

export interface TripRoute {
  segments: RouteSegment[]
  totalDistance: number // in km
  totalDuration: number // in minutes
  totalCost?: number
  suggestions: string[]
}

/**
 * Calculate travel time between two locations
 */
export async function calculateTravelTime(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): Promise<TravelTime> {
  try {
    const result = await calculateDistance(origin, destination)
    
    return {
      distance: result.distance,
      duration: result.duration,
      distanceValue: result.distanceValue,
      durationValue: result.durationValue,
      mode
    }
  } catch (error) {
    console.error('Failed to calculate travel time:', error)
    
    // Fallback calculation using straight-line distance
    const straightLineDistance = calculateStraightLineDistance(origin, destination)
    const estimatedDuration = estimateTimeFromDistance(straightLineDistance, mode)
    
    return {
      distance: `${straightLineDistance.toFixed(1)} km`,
      duration: formatDuration(estimatedDuration),
      distanceValue: straightLineDistance * 1000, // convert to meters
      durationValue: estimatedDuration * 60, // convert to seconds
      mode
    }
  }
}

/**
 * Calculate straight-line distance between two points (Haversine formula)
 */
function calculateStraightLineDistance(
  point1: { latitude: number; longitude: number },
  point2: { latitude: number; longitude: number }
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRad(point2.latitude - point1.latitude)
  const dLon = toRad(point2.longitude - point1.longitude)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Estimate travel time from distance and mode
 */
function estimateTimeFromDistance(distanceKm: number, mode: string): number {
  const speeds = {
    driving: 50,    // km/h average city driving
    walking: 5,     // km/h average walking
    transit: 30     // km/h average public transport
  }
  
  const speed = speeds[mode as keyof typeof speeds] || speeds.driving
  return (distanceKm / speed) * 60 // return minutes
}

/**
 * Format duration in minutes to human readable format
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)} min`
  } else {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }
}

/**
 * Calculate complete route for multiple locations
 */
export async function calculateTripRoute(
  locations: Array<{
    id: string
    name: string
    latitude: number
    longitude: number
  }>,
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): Promise<TripRoute> {
  if (locations.length < 2) {
    return {
      segments: [],
      totalDistance: 0,
      totalDuration: 0,
      suggestions: ['Add more locations to calculate route']
    }
  }

  const segments: RouteSegment[] = []
  let totalDistance = 0
  let totalDuration = 0
  const suggestions: string[] = []

  // Calculate travel time between consecutive locations
  for (let i = 0; i < locations.length - 1; i++) {
    const from = locations[i]
    const to = locations[i + 1]

    try {
      const travelTime = await calculateTravelTime(
        { latitude: from.latitude, longitude: from.longitude },
        { latitude: to.latitude, longitude: to.longitude },
        mode
      )

      const segment: RouteSegment = {
        from: {
          name: from.name,
          latitude: from.latitude,
          longitude: from.longitude
        },
        to: {
          name: to.name,
          latitude: to.latitude,
          longitude: to.longitude
        },
        travelTime,
        estimatedCost: estimateTransportCost(travelTime, mode)
      }

      segments.push(segment)
      totalDistance += travelTime.distanceValue / 1000 // convert to km
      totalDuration += travelTime.durationValue / 60 // convert to minutes

      // Add suggestions based on travel time
      if (travelTime.durationValue > 4 * 60 * 60) { // > 4 hours
        suggestions.push(`Consider flying between ${from.name} and ${to.name} (${travelTime.duration})`)
      } else if (travelTime.durationValue > 2 * 60 * 60) { // > 2 hours
        suggestions.push(`Long journey from ${from.name} to ${to.name} - plan rest stops`)
      }
    } catch (error) {
      console.error(`Failed to calculate route from ${from.name} to ${to.name}:`, error)
      suggestions.push(`Could not calculate route from ${from.name} to ${to.name}`)
    }
  }

  // Add general suggestions
  if (totalDuration > 8 * 60) { // > 8 hours total
    suggestions.push('Consider splitting this journey over multiple days')
  }

  if (mode === 'driving' && totalDistance > 500) {
    suggestions.push('Long driving route - ensure proper rest and fuel stops')
  }

  if (mode === 'transit') {
    suggestions.push('Check local public transport schedules and connections')
  }

  return {
    segments,
    totalDistance,
    totalDuration,
    totalCost: segments.reduce((sum, segment) => sum + (segment.estimatedCost || 0), 0),
    suggestions
  }
}

/**
 * Estimate transport cost based on travel time and mode
 */
function estimateTransportCost(travelTime: TravelTime, mode: string): number {
  const distanceKm = travelTime.distanceValue / 1000

  switch (mode) {
    case 'driving':
      // Estimate fuel cost + tolls + parking
      return distanceKm * 0.15 + 10 // $0.15 per km + $10 for tolls/parking
    
    case 'transit':
      // Estimate public transport cost
      if (distanceKm < 10) return 3
      if (distanceKm < 50) return 8
      if (distanceKm < 200) return 25
      return 50
    
    case 'walking':
      return 0 // Walking is free!
    
    default:
      return 0
  }
}

/**
 * Get optimal travel mode suggestion
 */
export function getOptimalTravelMode(
  distance: number, // in km
  duration: number  // in minutes
): {
  recommended: 'driving' | 'walking' | 'transit' | 'flying'
  reason: string
  alternatives: Array<{
    mode: string
    pros: string[]
    cons: string[]
  }>
} {
  if (distance < 2) {
    return {
      recommended: 'walking',
      reason: 'Short distance, walking is healthy and free',
      alternatives: [
        {
          mode: 'transit',
          pros: ['Faster', 'Less effort'],
          cons: ['Costs money', 'May have limited schedule']
        }
      ]
    }
  }

  if (distance < 10) {
    return {
      recommended: 'transit',
      reason: 'Medium distance, public transport is efficient',
      alternatives: [
        {
          mode: 'driving',
          pros: ['More flexible timing', 'Direct route'],
          cons: ['Parking costs', 'Traffic congestion']
        },
        {
          mode: 'walking',
          pros: ['Free', 'Good exercise'],
          cons: ['Time consuming', 'Weather dependent']
        }
      ]
    }
  }

  if (distance < 300) {
    return {
      recommended: 'driving',
      reason: 'Long distance, driving offers flexibility',
      alternatives: [
        {
          mode: 'transit',
          pros: ['No driving stress', 'Can relax/work'],
          cons: ['Limited schedules', 'May require transfers']
        }
      ]
    }
  }

  return {
    recommended: 'flying',
    reason: 'Very long distance, flying is most time-efficient',
    alternatives: [
      {
        mode: 'driving',
        pros: ['Scenic route', 'Flexible stops'],
        cons: ['Very time consuming', 'Tiring']
      },
      {
        mode: 'transit',
        pros: ['Comfortable', 'Can work/relax'],
        cons: ['Very long journey time']
      }
    ]
  }
}

/**
 * Calculate daily travel budget
 */
export function calculateDailyTravelBudget(
  route: TripRoute,
  days: number,
  includeAccommodation: boolean = false
): {
  transportationPerDay: number
  accommodationPerDay: number
  totalPerDay: number
  suggestions: string[]
} {
  const transportationPerDay = (route.totalCost || 0) / Math.max(days, 1)
  
  // Rough accommodation estimates based on route distance/complexity
  let accommodationPerDay = 0
  if (includeAccommodation) {
    if (route.totalDistance > 500) {
      accommodationPerDay = 80 // Higher end for long routes
    } else if (route.totalDistance > 200) {
      accommodationPerDay = 60 // Mid-range
    } else {
      accommodationPerDay = 40 // Budget option
    }
  }

  const totalPerDay = transportationPerDay + accommodationPerDay

  const suggestions = []
  if (transportationPerDay > 50) {
    suggestions.push('Consider group travel or ride-sharing to reduce transport costs')
  }
  if (includeAccommodation && accommodationPerDay > 100) {
    suggestions.push('Look for alternative accommodations like hostels or Airbnb')
  }

  return {
    transportationPerDay,
    accommodationPerDay,
    totalPerDay,
    suggestions
  }
}
