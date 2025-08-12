import { type NextRequest, NextResponse } from "next/server"
import { pool } from "@/lib/database"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const activityId = params.id

    // Fetch activity details with city information
    const activityResult = await pool.query(`
      SELECT a.*, c.name as city_name, c.country as city_country,
             c.latitude as city_latitude, c.longitude as city_longitude,
             c.timezone as city_timezone, c.description as city_description
      FROM activities a
      LEFT JOIN cities c ON a.city_id = c.id
      WHERE a.id = $1 OR a.display_id = $1
    `, [activityId])

    if (activityResult.rows.length === 0) {
      return NextResponse.json({ message: "Activity not found" }, { status: 404 })
    }

    const activity = activityResult.rows[0]

    // Try to get booking count safely
    let bookingCount = 0
    try {
      const bookingCountResult = await pool.query(`
        SELECT COUNT(*) as booking_count
        FROM trip_activities ta
        WHERE ta.activity_id = $1
      `, [activity.id])
      bookingCount = parseInt(bookingCountResult.rows[0]?.booking_count || '0')
    } catch (error) {
      console.log("Could not fetch booking count:", error)
    }

    // Get similar activities (same category, different activity) safely
    let similarActivities = []
    try {
      const similarActivitiesResult = await pool.query(`
        SELECT a.*, c.name as city_name, c.country as city_country
        FROM activities a
        LEFT JOIN cities c ON a.city_id = c.id
        WHERE a.category = $1 AND a.id != $2
        ORDER BY a.rating DESC NULLS LAST, a.name ASC
        LIMIT 6
      `, [activity.category, activity.id])
      similarActivities = similarActivitiesResult.rows
    } catch (error) {
      console.log("Could not fetch similar activities:", error)
    }

    // Get other activities in the same city safely
    let cityActivities = []
    try {
      if (activity.city_id) {
        const cityActivitiesResult = await pool.query(`
          SELECT a.*, c.name as city_name, c.country as city_country
          FROM activities a
          LEFT JOIN cities c ON a.city_id = c.id
          WHERE a.city_id = $1 AND a.id != $2
          ORDER BY a.rating DESC NULLS LAST, a.name ASC
          LIMIT 6
        `, [activity.city_id, activity.id])
        cityActivities = cityActivitiesResult.rows
      }
    } catch (error) {
      console.log("Could not fetch city activities:", error)
    }

    // Get trips that include this activity safely
    let trips = []
    try {
      const tripsResult = await pool.query(`
        SELECT DISTINCT t.id, t.name as title, t.description, t.status, 
               t.start_date, t.end_date
        FROM trips t
        JOIN trip_activities ta ON t.id = ta.trip_id
        WHERE ta.activity_id = $1 AND t.is_public = true
        ORDER BY t.created_at DESC
        LIMIT 5
      `, [activity.id])
      trips = tripsResult.rows
    } catch (error) {
      console.log("Could not fetch trips:", error)
    }

    const response = {
      activity: {
        ...activity,
        latitude: activity.latitude ? parseFloat(activity.latitude) : null,
        longitude: activity.longitude ? parseFloat(activity.longitude) : null,
        city_latitude: activity.city_latitude ? parseFloat(activity.city_latitude) : null,
        city_longitude: activity.city_longitude ? parseFloat(activity.city_longitude) : null,
        rating: activity.rating ? parseFloat(activity.rating) : null,
        duration_hours: activity.duration_hours ? parseInt(activity.duration_hours) : null,
        booking_count: bookingCount
      },
      similarActivities: similarActivities.map((similar: any) => ({
        ...similar,
        rating: similar.rating ? parseFloat(similar.rating) : null,
        duration_hours: similar.duration_hours ? parseInt(similar.duration_hours) : null,
        latitude: similar.latitude ? parseFloat(similar.latitude) : null,
        longitude: similar.longitude ? parseFloat(similar.longitude) : null
      })),
      cityActivities: cityActivities.map((cityAct: any) => ({
        ...cityAct,
        rating: cityAct.rating ? parseFloat(cityAct.rating) : null,
        duration_hours: cityAct.duration_hours ? parseInt(cityAct.duration_hours) : null,
        latitude: cityAct.latitude ? parseFloat(cityAct.latitude) : null,
        longitude: cityAct.longitude ? parseFloat(cityAct.longitude) : null
      })),
      trips: trips
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching activity details:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
