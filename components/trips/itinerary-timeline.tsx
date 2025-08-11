"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Calendar, Clock, MapPin, DollarSign, Star, 
  CheckCircle2, Circle, Edit, Trash2, Plus,
  Camera, FileText, Navigation, Users
} from "lucide-react"
import Image from "next/image"

interface Trip {
  id: number
  display_id: number
  name: string
  start_date: Date
  end_date: Date
  status: "planning" | "active" | "completed"
}

interface City {
  id: number
  name: string
  country: string
  latitude?: number
  longitude?: number
  timezone?: string
  image_url?: string
  order_index: number
  arrival_date?: Date
  departure_date?: Date
}

interface Activity {
  id: number
  name: string
  description?: string
  category?: string
  price_range?: string
  rating?: number
  duration_hours?: number
  image_url?: string
  scheduled_date?: Date
  scheduled_time?: string
  order_index?: number
  notes?: string
  estimated_cost?: number
  actual_cost?: number
}

interface ItineraryTimelineProps {
  trip: Trip
  cities: City[]
  activities: Activity[]
}

interface DaySchedule {
  date: Date
  dayNumber: number
  city?: City
  activities: Activity[]
  isToday: boolean
  isPast: boolean
}

export default function ItineraryTimeline({
  trip,
  cities,
  activities
}: ItineraryTimelineProps) {
  const [viewMode, setViewMode] = useState<"timeline" | "calendar">("timeline")

  // Generate day-by-day schedule
  const generateDaySchedule = (): DaySchedule[] => {
    const startDate = new Date(trip.start_date)
    const endDate = new Date(trip.end_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const days: DaySchedule[] = []
    const currentDate = new Date(startDate)
    let dayNumber = 1

    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0]
      
      // Find city for this day
      const dayCity = cities.find(city => {
        if (!city.arrival_date || !city.departure_date) return false
        const arrival = new Date(city.arrival_date)
        const departure = new Date(city.departure_date)
        return currentDate >= arrival && currentDate <= departure
      })

      // Find activities for this day
      const dayActivities = activities.filter(activity => {
        if (!activity.scheduled_date) return false
        const activityDate = new Date(activity.scheduled_date)
        return activityDate.toISOString().split('T')[0] === dateString
      }).sort((a, b) => {
        if (!a.scheduled_time || !b.scheduled_time) return 0
        return a.scheduled_time.localeCompare(b.scheduled_time)
      })

      const dayDate = new Date(currentDate)
      days.push({
        date: dayDate,
        dayNumber,
        city: dayCity,
        activities: dayActivities,
        isToday: dayDate.getTime() === today.getTime(),
        isPast: dayDate < today
      })

      currentDate.setDate(currentDate.getDate() + 1)
      dayNumber++
    }

    return days
  }

  const daySchedule = generateDaySchedule()

  const getActivityIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'travel': return '🚗'
      case 'accommodation': return '🏨'
      case 'sightseeing': return '📸'
      case 'adventure': return '🏔️'
      case 'dining': return '🍽️'
      case 'shopping': return '🛍️'
      case 'entertainment': return '🎭'
      default: return '📝'
    }
  }

  const formatTime = (time?: string) => {
    if (!time) return ''
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getDayStatus = (day: DaySchedule) => {
    if (day.isPast) return { color: 'text-gray-400', icon: CheckCircle2 }
    if (day.isToday) return { color: 'text-green-400', icon: Circle }
    return { color: 'text-blue-400', icon: Circle }
  }

  if (daySchedule.length === 0) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="py-12 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Building Your Itinerary</h3>
          <p className="text-gray-400 mb-6">
            Your detailed itinerary will appear here as you add scheduled activities to your trip.
          </p>
          
          {/* Show basic trip info even without detailed schedule */}
          <div className="space-y-6 mt-8">
            {cities.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">Planned Destinations:</h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {cities.map((city, index) => (
                    <Badge key={city.id} variant="secondary" className="bg-blue-600 text-white">
                      {index + 1}. {city.name}, {city.country}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {activities.length > 0 && (
              <div>
                <h4 className="text-white font-medium mb-3">Planned Activities:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                  {activities.slice(0, 4).map((activity) => (
                    <div key={activity.id} className="p-3 bg-gray-700 rounded text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{getActivityIcon(activity.category)}</span>
                        <span className="text-white font-medium text-sm">{activity.name}</span>
                      </div>
                      {activity.category && (
                        <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                          {activity.category}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
                {activities.length > 4 && (
                  <p className="text-gray-400 text-sm mt-2">
                    +{activities.length - 4} more activities
                  </p>
                )}
              </div>
            )}
            
            {cities.length === 0 && activities.length === 0 && (
              <p className="text-gray-400 text-lg">
                No destinations or activities added yet.
              </p>
            )}
          </div>
          
          <div className="mt-6">
            <Button 
              onClick={() => window.location.href = `/trips/${trip.display_id}/edit`}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Trip to Add Details
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-white">Trip Itinerary</h3>
        <div className="flex space-x-1 bg-gray-800 rounded-lg p-1">
          <Button
            variant={viewMode === "timeline" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("timeline")}
            className={viewMode === "timeline" ? "bg-blue-600" : "text-gray-400"}
          >
            Timeline
          </Button>
          <Button
            variant={viewMode === "calendar" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("calendar")}
            className={viewMode === "calendar" ? "bg-blue-600" : "text-gray-400"}
          >
            Calendar
          </Button>
        </div>
      </div>

      {/* Timeline View */}
      {viewMode === "timeline" && (
        <div className="space-y-6">
          {daySchedule.map((day, index) => {
            const status = getDayStatus(day)
            const StatusIcon = status.icon

            return (
              <Card key={index} className="bg-gray-800 border-gray-700 relative">
                {/* Timeline Connector */}
                {index < daySchedule.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-full bg-gray-600 z-0"></div>
                )}

                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gray-700 border-2 ${status.color.replace('text-', 'border-')} z-10`}>
                        <StatusIcon className={`w-6 h-6 ${status.color}`} />
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-bold text-white">
                          Day {day.dayNumber}
                        </h3>
                        <p className="text-gray-400">
                          {day.date.toLocaleDateString('en-US', { 
                            weekday: 'long',
                            month: 'long', 
                            day: 'numeric'
                          })}
                        </p>
                      </div>

                      {day.isToday && (
                        <Badge variant="secondary" className="bg-green-600 text-white">
                          Today
                        </Badge>
                      )}
                    </div>

                    {/* Day Location */}
                    {day.city && (
                      <div className="text-right">
                        <div className="flex items-center space-x-2 text-blue-400">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{day.city.name}</span>
                        </div>
                        <p className="text-gray-400 text-sm">{day.city.country}</p>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Activities for the day */}
                  {day.activities.length > 0 ? (
                    <div className="space-y-3">
                      {day.activities.map((activity, activityIndex) => (
                        <div key={activity.id} className="flex items-start space-x-4 p-4 bg-gray-700 rounded-lg">
                          {/* Activity Time */}
                          <div className="text-center min-w-[60px]">
                            {activity.scheduled_time ? (
                              <div className="text-blue-400 font-medium">
                                {formatTime(activity.scheduled_time)}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm">All Day</div>
                            )}
                          </div>

                          {/* Activity Details */}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">
                                  {getActivityIcon(activity.category)}
                                </span>
                                <h4 className="text-white font-medium">{activity.name}</h4>
                                {activity.category && (
                                  <Badge variant="secondary" className="bg-purple-600 text-white text-xs">
                                    {activity.category}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex items-center space-x-2">
                                {activity.rating && (
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-4 h-4 text-yellow-500" />
                                    <span className="text-gray-400 text-sm">{activity.rating}</span>
                                  </div>
                                )}
                                {activity.estimated_cost && (
                                  <div className="flex items-center space-x-1">
                                    <DollarSign className="w-4 h-4 text-green-400" />
                                    <span className="text-gray-400 text-sm">${activity.estimated_cost}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {activity.description && (
                              <p className="text-gray-300 text-sm mb-2">{activity.description}</p>
                            )}

                            {activity.notes && (
                              <div className="bg-gray-800 p-2 rounded text-gray-400 text-sm">
                                <FileText className="w-3 h-3 inline mr-1" />
                                {activity.notes}
                              </div>
                            )}

                            <div className="flex items-center justify-between mt-2">
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                {activity.duration_hours && (
                                  <div className="flex items-center space-x-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{activity.duration_hours}h</span>
                                  </div>
                                )}
                                {activity.price_range && (
                                  <Badge variant="secondary" className="bg-green-600 text-white text-xs">
                                    {activity.price_range}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex space-x-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-white"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-red-400"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Activity Image */}
                          {activity.image_url && (
                            <div className="w-16 h-16 rounded-lg overflow-hidden">
                              <Image
                                src={activity.image_url}
                                alt={activity.name}
                                width={64}
                                height={64}
                                className="object-cover w-full h-full"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-gray-400">No activities planned for this day</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Activity
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Calendar View */}
      {viewMode === "calendar" && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2 mb-4">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="text-center text-gray-400 font-medium p-2">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-2">
              {daySchedule.map((day, index) => {
                const status = getDayStatus(day)
                return (
                  <div
                    key={index}
                    className={`
                      p-2 border rounded-lg min-h-[100px] 
                      ${day.isToday ? 'border-green-500 bg-green-900/20' : 'border-gray-600'}
                      ${day.isPast ? 'bg-gray-700/50' : 'bg-gray-700'}
                    `}
                  >
                    <div className={`text-sm font-medium mb-1 ${status.color}`}>
                      {day.date.getDate()}
                    </div>
                    {day.city && (
                      <div className="text-xs text-blue-400 mb-1">
                        {day.city.name}
                      </div>
                    )}
                    <div className="space-y-1">
                      {day.activities.slice(0, 2).map(activity => (
                        <div key={activity.id} className="text-xs text-gray-300 truncate">
                          {getActivityIcon(activity.category)} {activity.name}
                        </div>
                      ))}
                      {day.activities.length > 2 && (
                        <div className="text-xs text-gray-400">
                          +{day.activities.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
