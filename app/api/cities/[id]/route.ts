import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cityId = params.id

    // Fetch city details first with a simple query
    const cityResult = await pool.query(`
      SELECT * FROM cities 
      WHERE id = $1 OR display_id = $1
    `, [cityId])

    if (cityResult.rows.length === 0) {
      return NextResponse.json({ message: "City not found" }, { status: 404 })
    }

    const city = cityResult.rows[0]

    // Try to get trip count safely
    let tripCount = 0
    try {
      const tripCountResult = await pool.query(`
        SELECT COUNT(DISTINCT tc.trip_id) as trip_count
        FROM trip_cities tc
        WHERE tc.city_id = $1
      `, [city.id])
      tripCount = parseInt(tripCountResult.rows[0]?.trip_count || '0')
    } catch (error) {
      console.log("Could not fetch trip count:", error)
    }

    // Try to get activity count safely
    let activityCount = 0
    try {
      const activityCountResult = await pool.query(`
        SELECT COUNT(*) as activity_count
        FROM activities
        WHERE city_id = $1
      `, [city.id])
      activityCount = parseInt(activityCountResult.rows[0]?.activity_count || '0')
    } catch (error) {
      console.log("Could not fetch activity count:", error)
    }

    // Fetch activities in this city safely
    let activities = []
    try {
      const activitiesResult = await pool.query(`
        SELECT * FROM activities
        WHERE city_id = $1
        ORDER BY rating DESC NULLS LAST, name ASC
      `, [city.id])
      activities = activitiesResult.rows
    } catch (error) {
      console.log("Could not fetch activities:", error)
    }

    // Fetch trips that include this city safely
    let trips = []
    try {
      const tripsResult = await pool.query(`
        SELECT DISTINCT t.id, t.name as title, t.description, t.status, 
               t.start_date, t.end_date
        FROM trips t
        JOIN trip_cities tc ON t.id = tc.trip_id
        WHERE tc.city_id = $1 AND t.is_public = true
        ORDER BY t.created_at DESC
        LIMIT 10
      `, [city.id])
      trips = tripsResult.rows
    } catch (error) {
      console.log("Could not fetch trips:", error)
    }

    // Get nearby cities (same country, different city) safely
    let nearbyCities = []
    try {
      const nearbyCitiesResult = await pool.query(`
        SELECT id, display_id, name, country, latitude, longitude, 
               image_url, popularity_score, cost_index
        FROM cities 
        WHERE country = $1 AND id != $2
        ORDER BY popularity_score DESC NULLS LAST
        LIMIT 5
      `, [city.country, city.id])
      nearbyCities = nearbyCitiesResult.rows
    } catch (error) {
      console.log("Could not fetch nearby cities:", error)
    }

    const response = {
      city: {
        ...city,
        latitude: city.latitude ? parseFloat(city.latitude) : null,
        longitude: city.longitude ? parseFloat(city.longitude) : null,
        cost_index: city.cost_index ? parseInt(city.cost_index) : null,
        popularity_score: city.popularity_score ? parseInt(city.popularity_score) : null,
        trip_count: tripCount,
        activity_count: activityCount
      },
      activities: activities.map((activity: any) => ({
        ...activity,
        rating: activity.rating ? parseFloat(activity.rating) : null,
        duration: activity.duration_hours ? parseInt(activity.duration_hours) : null
      })),
      trips: trips,
      nearbyCities: nearbyCities.map((nearbyCity: any) => ({
        ...nearbyCity,
        latitude: nearbyCity.latitude ? parseFloat(nearbyCity.latitude) : null,
        longitude: nearbyCity.longitude ? parseFloat(nearbyCity.longitude) : null,
        cost_index: nearbyCity.cost_index ? parseInt(nearbyCity.cost_index) : null,
        popularity_score: nearbyCity.popularity_score ? parseInt(nearbyCity.popularity_score) : null
      }))
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching city details:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
