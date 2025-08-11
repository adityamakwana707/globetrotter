"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  MapPin, 
  Calendar, 
  Clock, 
  DollarSign,
  Star,
  Users,
  Camera,
  Navigation
} from "lucide-react"
import LeafletMap from "@/components/maps/leaflet-map"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface SharedTripContentProps {
  trip: any
}

const CATEGORY_COLORS = {
  'Accommodation': '#3B82F6',
  'Transportation': '#EF4444',
  'Food & Dining': '#10B981',
  'Activities': '#F59E0B',
  'Shopping': '#8B5CF6',
  'Entertainment': '#EC4899',
  'Emergency': '#EF4444',
  'Other': '#6B7280'
}

export default function SharedTripContent({ trip }: SharedTripContentProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const getBudgetChartData = () => {
    return trip.budget.map((item: any) => ({
      name: item.category,
      planned: item.total_planned,
      spent: item.total_spent,
      color: CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] || '#6B7280'
    }))
  }

  const getPieChartData = () => {
    return trip.budget.map((item: any) => ({
      name: item.category,
      value: item.total_spent,
      color: CATEGORY_COLORS[item.category as keyof typeof CATEGORY_COLORS] || '#6B7280'
    })).filter((item: any) => item.value > 0)
  }

  const getTotalBudget = () => {
    const totalPlanned = trip.budget.reduce((sum: number, item: any) => sum + item.total_planned, 0)
    const totalSpent = trip.budget.reduce((sum: number, item: any) => sum + item.total_spent, 0)
    return { totalPlanned, totalSpent }
  }

  const mapLocations = [
    ...trip.cities.map((city: any) => ({
      id: city.id,
      name: city.name,
      latitude: city.latitude || 0,
      longitude: city.longitude || 0,
      type: 'city' as const,
      description: `${city.name}, ${city.country}`
    })),
    ...trip.activities.map((activity: any) => ({
      id: activity.id,
      name: activity.name,
      latitude: activity.latitude || 0,
      longitude: activity.longitude || 0,
      type: 'activity' as const,
      description: activity.description || ''
    }))
  ].filter(location => location.latitude !== 0 && location.longitude !== 0)

  const { totalPlanned, totalSpent } = getTotalBudget()
  const budgetChartData = getBudgetChartData()
  const pieChartData = getPieChartData()

  return (
    <Tabs defaultValue="itinerary" className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-700">
        <TabsTrigger value="itinerary" className="data-[state=active]:bg-gray-700">
          Itinerary
        </TabsTrigger>
        <TabsTrigger value="map" className="data-[state=active]:bg-gray-700">
          Map View
        </TabsTrigger>
        <TabsTrigger value="budget" className="data-[state=active]:bg-gray-700">
          Budget
        </TabsTrigger>
        <TabsTrigger value="details" className="data-[state=active]:bg-gray-700">
          Details
        </TabsTrigger>
      </TabsList>

      <TabsContent value="itinerary" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cities */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Cities ({trip.cities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trip.cities.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No cities in this itinerary</p>
              ) : (
                <div className="space-y-4">
                  {trip.cities.map((city: any, index: number) => (
                    <div key={city.id} className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold">{city.name}</h3>
                        <p className="text-gray-400 text-sm">{city.country}</p>
                        {city.arrival_date && (
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-400">
                            <span>Arrive: {formatDate(city.arrival_date)}</span>
                            {city.departure_date && (
                              <span>Depart: {formatDate(city.departure_date)}</span>
                            )}
                          </div>
                        )}
                      </div>
                      {city.rating && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className="text-gray-300 text-sm">{city.rating}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activities */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Activities ({trip.activities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trip.activities.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No activities planned</p>
              ) : (
                <div className="space-y-4">
                  {trip.activities.map((activity: any) => (
                    <div key={activity.id} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold mb-1">{activity.name}</h3>
                          {activity.description && (
                            <p className="text-gray-400 text-sm mb-2">{activity.description}</p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span className="flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {activity.city || 'Location TBD'}
                            </span>
                            {activity.scheduled_date && (
                              <span className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                {formatDate(activity.scheduled_date)}
                              </span>
                            )}
                            {activity.price && (
                              <span className="flex items-center">
                                <DollarSign className="w-3 h-3 mr-1" />
                                ${activity.price}
                              </span>
                            )}
                          </div>
                        </div>
                        {activity.rating && (
                          <div className="flex items-center space-x-1 ml-4">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-gray-300 text-sm">{activity.rating}</span>
                          </div>
                        )}
                      </div>
                      {activity.notes && (
                        <div className="mt-3 p-2 bg-gray-600 rounded text-sm text-gray-300">
                          <strong>Notes:</strong> {activity.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="map" className="mt-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Navigation className="w-5 h-5" />
              Trip Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mapLocations.length === 0 ? (
              <div className="text-center py-12">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-400 mb-4">No locations to display</p>
                <p className="text-sm text-gray-500">This trip doesn't have location coordinates available.</p>
              </div>
            ) : (
              <InteractiveMap
                locations={mapLocations}
                showRoute={mapLocations.length > 1}
                height="500px"
              />
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="budget" className="mt-6">
        {trip.budget.length === 0 ? (
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-12 text-center">
              <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-4">Budget information not available</p>
              <p className="text-sm text-gray-500">The trip owner hasn't shared budget details publicly.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Budget Overview */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Budget Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Total Planned</p>
                    <p className="text-2xl font-bold text-blue-400">${totalPlanned.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Total Spent</p>
                    <p className="text-2xl font-bold text-red-400">${totalSpent.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-400 text-sm">Remaining</p>
                    <p className={`text-2xl font-bold ${(totalPlanned - totalSpent) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${(totalPlanned - totalSpent).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Budget vs Spending</CardTitle>
                </CardHeader>
                <CardContent>
                  {budgetChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={budgetChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9CA3AF"
                          fontSize={12}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis stroke="#9CA3AF" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="planned" fill="#3B82F6" name="Planned" />
                        <Bar dataKey="spent" fill="#EF4444" name="Spent" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      No budget data to display
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Spending Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieChartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1F2937', 
                            border: '1px solid #374151',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number) => [`$${value.toLocaleString()}`, 'Spent']}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-gray-400">
                      No expense data to display
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="details" className="mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Trip Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Cities to Visit</span>
                  <Badge className="bg-blue-600">{trip.cities.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Planned Activities</span>
                  <Badge className="bg-green-600">{trip.activities.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Budget Categories</span>
                  <Badge className="bg-purple-600">{trip.budget.length}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                  <span className="text-gray-300">Trip Status</span>
                  <Badge className={`${trip.status === 'completed' ? 'bg-green-600' : trip.status === 'active' ? 'bg-blue-600' : 'bg-yellow-600'}`}>
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Trip Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-white font-medium">Created</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(trip.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-white font-medium">Last Updated</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(trip.updated_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-white font-medium">Shared By</p>
                    <p className="text-gray-400 text-sm">{trip.owner_name}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  )
}
