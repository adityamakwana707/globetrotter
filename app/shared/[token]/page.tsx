import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign, 
  Share2, 
  Copy,
  ExternalLink,
  User,
  Globe,
  Lock
} from "lucide-react"
import { pool } from "@/lib/database"
import Image from "next/image"
import Link from "next/link"
import SharedTripContent from "@/components/shared/shared-trip-content"

interface SharedTripPageProps {
  params: { token: string }
}

async function getSharedTrip(token: string) {
  try {
    const result = await pool.query(
      `SELECT 
        t.id, t.name, t.description, t.start_date, t.end_date, t.status, 
        t.cover_image, t.is_public, t.allow_copy, t.share_expires_at,
        t.created_at, t.updated_at,
        u.name as owner_name, u.email as owner_email
       FROM trips t
       JOIN users u ON t.user_id = u.id
       WHERE t.share_token = $1 AND t.is_public = true
       AND (t.share_expires_at IS NULL OR t.share_expires_at > CURRENT_TIMESTAMP)`,
      [token]
    )

    if (result.rows.length === 0) {
      return null
    }

    const trip = result.rows[0]

    // Get trip cities
    const citiesResult = await pool.query(
      `SELECT c.*, tc.order_index, tc.arrival_date, tc.departure_date
       FROM cities c
       JOIN trip_cities tc ON c.id = tc.city_id
       WHERE tc.trip_id = $1
       ORDER BY tc.order_index`,
      [trip.id]
    )

    // Get trip activities
    const activitiesResult = await pool.query(
      `SELECT a.*, ta.order_index, ta.scheduled_date, ta.notes
       FROM activities a
       JOIN trip_activities ta ON a.id = ta.activity_id
       WHERE ta.trip_id = $1
       ORDER BY ta.order_index`,
      [trip.id]
    )

    // Get budget summary (only if public)
    const budgetResult = await pool.query(
      `SELECT 
        category,
        SUM(planned_amount) as total_planned,
        SUM(spent_amount) as total_spent,
        currency
       FROM budgets
       WHERE trip_id = $1
       GROUP BY category, currency
       ORDER BY category`,
      [trip.id]
    )

    return {
      ...trip,
      cities: citiesResult.rows,
      activities: activitiesResult.rows,
      budget: budgetResult.rows
    }
  } catch (error) {
    console.error("Error fetching shared trip:", error)
    return null
  }
}

export default async function SharedTripPage({ params }: SharedTripPageProps) {
  const trip = await getSharedTrip(params.token)

  if (!trip) {
    notFound()
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getDuration = () => {
    const start = new Date(trip.start_date)
    const end = new Date(trip.end_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-600'
      case 'active': return 'bg-blue-600'
      case 'planning': return 'bg-yellow-600'
      default: return 'bg-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Globe className="w-6 h-6 text-blue-400" />
              <div>
                <h1 className="text-lg font-semibold">Shared Trip</h1>
                <p className="text-gray-400 text-sm">Public itinerary by {trip.owner_name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className="bg-green-600 text-white">
                <Globe className="w-3 h-3 mr-1" />
                Public
              </Badge>
              <Link href="/">
                <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Visit GlobeTrotter
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Trip Header */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Trip Image */}
              <div className="lg:col-span-1">
                {trip.cover_image ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden">
                    <Image
                      src={trip.cover_image}
                      alt={trip.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-square bg-gray-700 rounded-lg flex items-center justify-center">
                    <MapPin className="w-16 h-16 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Trip Details */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold text-white">{trip.name}</h1>
                    <Badge className={`${getStatusColor(trip.status)} text-white`}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </Badge>
                  </div>
                  {trip.description && (
                    <p className="text-gray-300 text-lg">{trip.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Start Date</p>
                      <p className="text-gray-400 text-sm">{formatDate(trip.start_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-white font-medium">End Date</p>
                      <p className="text-gray-400 text-sm">{formatDate(trip.end_date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <div>
                      <p className="text-white font-medium">Duration</p>
                      <p className="text-gray-400 text-sm">{getDuration()} days</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-300">Created by {trip.owner_name}</span>
                  </div>
                  
                  {trip.allow_copy && (
                    <Link href={`/trips/copy/${params.token}`}>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Copy className="w-4 h-4 mr-2" />
                        Copy This Trip
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trip Content */}
        <SharedTripContent trip={trip} />

        {/* Footer */}
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-2">
                <Share2 className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300">Shared via GlobeTrotter</span>
              </div>
              <p className="text-gray-400 text-sm">
                Create your own travel itineraries and share them with the world
              </p>
              <Link href="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Get Started - It's Free
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
