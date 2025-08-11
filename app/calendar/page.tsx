"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Calendar as CalendarIcon,
  Plus,
  MapPin,
  Clock,
  Users,
  Star,
  Plane,
  Activity as ActivityIcon,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Search
} from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, isWithinInterval } from "date-fns"

interface Trip {
  id: number
  name: string
  description: string | null
  start_date: string
  end_date: string
  status: "planning" | "active" | "completed"
  cover_image: string | null
  is_public: boolean
}

interface TripActivity {
  id: number
  activity_id: number
  scheduled_date: string | null
  scheduled_time: string | null
  notes: string | null
  activity_name: string
  activity_description: string | null
  activity_category: string | null
  city_name: string
  city_country: string
}

interface CalendarEvent {
  id: string
  title: string
  date: Date
  type: "trip_start" | "trip_end" | "activity" | "note"
  trip_id?: number
  activity_id?: number
  description?: string
  location?: string
  time?: string
  status?: string
}

export default function CalendarPage() {
  const { data: session } = useSession()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [trips, setTrips] = useState<Trip[]>([])
  const [activities, setActivities] = useState<TripActivity[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [view, setView] = useState<"calendar" | "list">("calendar")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [isAddEventOpen, setIsAddEventOpen] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    type: "note" as const
  })

  // Fetch user trips and activities
  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.id) return

      try {
        setIsLoading(true)

        // Fetch trips
        const tripsResponse = await fetch("/api/trips")
        let tripsData: Trip[] = []
        if (tripsResponse.ok) {
          tripsData = await tripsResponse.json()
          setTrips(tripsData)
        }

        // Fetch trip activities for the current month
        const startDate = startOfMonth(currentMonth)
        const endDate = endOfMonth(currentMonth)
        
        // This would need a new API endpoint to fetch activities by date range
        // For now, we'll simulate with sample data
        generateCalendarEvents(tripsData)
      } catch (error) {
        console.error("Error fetching calendar data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [session, currentMonth])

  // Generate calendar events from trips
  const generateCalendarEvents = (tripsData: Trip[]) => {
    const calendarEvents: CalendarEvent[] = []

    tripsData.forEach(trip => {
      const startDate = parseISO(trip.start_date)
      const endDate = parseISO(trip.end_date)

      // Add trip start event
      calendarEvents.push({
        id: `trip_start_${trip.id}`,
        title: `🛫 ${trip.name}`,
        date: startDate,
        type: "trip_start",
        trip_id: trip.id,
        description: `Trip starts: ${trip.description}`,
        status: trip.status
      })

      // Add trip end event
      calendarEvents.push({
        id: `trip_end_${trip.id}`,
        title: `🛬 ${trip.name}`,
        date: endDate,
        type: "trip_end",
        trip_id: trip.id,
        description: `Trip ends: ${trip.description}`,
        status: trip.status
      })
    })

    // Add sample activities (in a real app, this would come from API)
    const sampleActivities = [
      {
        id: "activity_1",
        title: "🗼 Eiffel Tower Visit",
        date: new Date(2024, 0, 8), // January 8, 2024
        type: "activity" as const,
        description: "Visit the iconic Eiffel Tower",
        location: "Paris, France",
        time: "10:00 AM"
      },
      {
        id: "activity_2",
        title: "🏛️ Louvre Museum",
        date: new Date(2024, 0, 10), // January 10, 2024
        type: "activity" as const,
        description: "Explore the world's largest art museum",
        location: "Paris, France",
        time: "2:00 PM"
      },
      {
        id: "activity_3",
        title: "🗽 Statue of Liberty",
        date: new Date(2024, 0, 17), // January 17, 2024
        type: "activity" as const,
        description: "Visit iconic symbol of freedom",
        location: "New York, USA",
        time: "11:00 AM"
      }
    ]

    calendarEvents.push(...sampleActivities)
    setEvents(calendarEvents)
  }

  // Get events for selected date
  useEffect(() => {
    const dayEvents = events.filter(event => isSameDay(event.date, selectedDate))
    setSelectedEvents(dayEvents)
  }, [selectedDate, events])

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.date, date))
  }

  // Filter events based on status
  const filteredEvents = events.filter(event => {
    if (filterStatus === "all") return true
    return event.status === filterStatus
  })

  // Handle month navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  // Handle add event
  const handleAddEvent = () => {
    if (!newEvent.title || !newEvent.date) return

    const event: CalendarEvent = {
      id: `custom_${Date.now()}`,
      title: newEvent.title,
      date: new Date(newEvent.date),
      type: newEvent.type,
      description: newEvent.description,
      time: newEvent.time
    }

    setEvents([...events, event])
    setNewEvent({ title: "", description: "", date: "", time: "", type: "note" })
    setIsAddEventOpen(false)
  }

  // Day cell content with events
  const renderDay = (date: Date) => {
    const dayEvents = getEventsForDate(date)
    
    return (
      <div className="w-full h-full min-h-[80px] p-1">
        <div className="text-sm font-medium">{date.getDate()}</div>
        <div className="space-y-1 mt-1">
          {dayEvents.slice(0, 2).map(event => (
            <div
              key={event.id}
              className={`text-xs p-1 rounded truncate cursor-pointer ${
                event.type === "trip_start" ? "bg-blue-100 text-blue-800" :
                event.type === "trip_end" ? "bg-green-100 text-green-800" :
                event.type === "activity" ? "bg-purple-100 text-purple-800" :
                "bg-gray-100 text-gray-800"
              }`}
              onClick={() => setSelectedDate(date)}
            >
              {event.title}
            </div>
          ))}
          {dayEvents.length > 2 && (
            <div className="text-xs text-muted-foreground">
              +{dayEvents.length - 2} more
            </div>
          )}
        </div>
      </div>
    )
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case "trip_start": return "bg-blue-500"
      case "trip_end": return "bg-green-500"
      case "activity": return "bg-purple-500"
      default: return "bg-gray-500"
    }
  }

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case "trip_start": return <Plane className="h-4 w-4" />
      case "trip_end": return <Plane className="h-4 w-4" />
      case "activity": return <ActivityIcon className="h-4 w-4" />
      default: return <CalendarIcon className="h-4 w-4" />
    }
  }

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your calendar</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Travel Calendar</h1>
          <p className="text-muted-foreground">Manage your trips and activities</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* View Toggle */}
          <Tabs value={view} onValueChange={(v) => setView(v as "calendar" | "list")}>
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Add Event Dialog */}
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Calendar Event</DialogTitle>
                <DialogDescription>
                  Add a custom note or reminder to your calendar
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="Event title"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Event description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsAddEventOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddEvent}>Add Event</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Calendar/List View */}
        <div className="lg:col-span-3">
          {view === "calendar" ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5" />
                    {format(currentMonth, "MMMM yyyy")}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={goToNextMonth}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                    <div key={day} className="p-2 text-center font-medium text-sm text-muted-foreground">
                      {day}
                    </div>
                  ))}
                </div>
                
                <div className="grid grid-cols-7 gap-1">
                  {eachDayOfInterval({
                    start: startOfMonth(currentMonth),
                    end: endOfMonth(currentMonth)
                  }).map(date => {
                    const isSelected = isSameDay(date, selectedDate)
                    const isToday = isSameDay(date, new Date())
                    
                    return (
                      <div
                        key={date.toISOString()}
                        className={`border rounded-lg cursor-pointer transition-colors ${
                          isSelected ? "bg-primary/10 border-primary" :
                          isToday ? "bg-accent border-accent-foreground/20" :
                          "border-border hover:bg-accent/50"
                        }`}
                        onClick={() => setSelectedDate(date)}
                      >
                        {renderDay(date)}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Events List</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredEvents.map(event => (
                    <div key={event.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full ${getEventTypeColor(event.type)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getEventTypeIcon(event.type)}
                          <h3 className="font-medium">{event.title}</h3>
                          {event.status && (
                            <Badge variant="outline">{event.status}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(event.date, "MMMM d, yyyy")} {event.time && `at ${event.time}`}
                        </p>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                        )}
                        {event.location && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Selected Date Events */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {format(selectedDate, "MMMM d, yyyy")}
              </CardTitle>
              <CardDescription>
                {selectedEvents.length} event{selectedEvents.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedEvents.length > 0 ? (
                <div className="space-y-3">
                  {selectedEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`w-2 h-2 rounded-full mt-2 ${getEventTypeColor(event.type)}`} />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        {event.time && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {event.time}
                          </p>
                        )}
                        {event.location && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </p>
                        )}
                        {event.description && (
                          <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No events for this date
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Trips</span>
                  <Badge variant="outline">{trips.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Active Trips</span>
                  <Badge variant="outline">
                    {trips.filter(trip => trip.status === "active").length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Upcoming Events</span>
                  <Badge variant="outline">
                    {events.filter(event => event.date > new Date()).length}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Trip Start</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-sm">Trip End</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <span className="text-sm">Activity</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500" />
                  <span className="text-sm">Note/Reminder</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
