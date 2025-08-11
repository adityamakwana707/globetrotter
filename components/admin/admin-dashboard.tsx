"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { 
  Users, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Activity,
  ArrowLeft,
  RefreshCw,
  UserCheck,
  Globe,
  DollarSign,
  BarChart3,
  Shield,
  Settings
} from "lucide-react"
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts"

interface User {
  id: string
  name?: string | null
  email?: string | null
}

interface PlatformStats {
  total_users: number
  new_users_30d: number
  active_users_7d: number
  total_trips: number
  new_trips_30d: number
  active_trips: number
  total_cities: number
  total_activities: number
  total_budget_planned: number
  total_budget_spent: number
}

interface UserAnalytics {
  id: string
  display_id: number
  email: string
  first_name: string
  last_name: string
  role: string
  created_at: string
  last_login_at: string | null
  total_trips: number
  active_trips: number
  completed_trips: number
  total_budget_planned: number
  total_budget_spent: number
  last_trip_created: string | null
}

interface PopularCity {
  id: number
  name: string
  country: string
  trip_count: number
  avg_trip_duration: number
}

interface PopularActivity {
  id: number
  name: string
  category: string
  city_name: string
  country: string
  trip_count: number
  avg_estimated_cost: number
  rating: number
}

export default function AdminDashboard({ user }: { user: User }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null)
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics[]>([])
  const [popularCities, setPopularCities] = useState<PopularCity[]>([])
  const [popularActivities, setPopularActivities] = useState<PopularActivity[]>([])
  const [userGrowth, setUserGrowth] = useState<any[]>([])
  const [tripGrowth, setTripGrowth] = useState<any[]>([])
  const [systemMetrics, setSystemMetrics] = useState<any>({})

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    setIsLoading(true)
    try {
      const [
        platformResponse,
        usersResponse,
        analyticsResponse,
        userGrowthResponse,
        tripGrowthResponse,
        systemResponse
      ] = await Promise.all([
        fetch("/api/admin/stats?type=platform"),
        fetch("/api/admin/users?limit=20"),
        fetch("/api/admin/analytics"),
        fetch("/api/admin/stats?type=userGrowth"),
        fetch("/api/admin/stats?type=tripGrowth"),
        fetch("/api/admin/stats?type=system")
      ])

      if (platformResponse.ok) {
        const data = await platformResponse.json()
        setPlatformStats(data)
      }

      if (usersResponse.ok) {
        const data = await usersResponse.json()
        setUserAnalytics(data)
      }

      if (analyticsResponse.ok) {
        const data = await analyticsResponse.json()
        setPopularCities(data.cities || [])
        setPopularActivities(data.activities || [])
      }

      if (userGrowthResponse.ok) {
        const data = await userGrowthResponse.json()
        setUserGrowth(data.map((item: any) => ({
          ...item,
          month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        })))
      }

      if (tripGrowthResponse.ok) {
        const data = await tripGrowthResponse.json()
        setTripGrowth(data.map((item: any) => ({
          ...item,
          month: new Date(item.month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        })))
      }

      if (systemResponse.ok) {
        const data = await systemResponse.json()
        setSystemMetrics(data)
      }

    } catch (error) {
      console.error("Error fetching admin data:", error)
      toast({
        title: "Error",
        description: "Failed to load admin dashboard data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role: newRole }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User role updated successfully",
        })
        fetchAdminData() // Refresh data
      } else {
        throw new Error("Failed to update user role")
      }
    } catch (error) {
      console.error("Error updating user role:", error)
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleDateString()
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-600'
      case 'moderator': return 'bg-blue-600'
      default: return 'bg-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-gray-400 text-sm">Platform management and analytics</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, {user.name || user.email}</span>
            <Button 
              onClick={fetchAdminData} 
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">Overview</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gray-700">Users</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gray-700">Analytics</TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-gray-700">Content</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Platform Stats */}
            {platformStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Users</p>
                        <p className="text-2xl font-bold text-white">{platformStats.total_users}</p>
                        <p className="text-green-400 text-xs">+{platformStats.new_users_30d} this month</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Trips</p>
                        <p className="text-2xl font-bold text-white">{platformStats.total_trips}</p>
                        <p className="text-green-400 text-xs">+{platformStats.new_trips_30d} this month</p>
                      </div>
                      <MapPin className="w-8 h-8 text-green-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Active Users (7d)</p>
                        <p className="text-2xl font-bold text-white">{platformStats.active_users_7d}</p>
                      </div>
                      <UserCheck className="w-8 h-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Total Budget</p>
                        <p className="text-2xl font-bold text-white">{formatCurrency(platformStats.total_budget_planned)}</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-gray-400 text-sm">Content Items</p>
                        <p className="text-2xl font-bold text-white">{platformStats.total_cities + platformStats.total_activities}</p>
                        <p className="text-gray-400 text-xs">{platformStats.total_cities} cities, {platformStats.total_activities} activities</p>
                      </div>
                      <Globe className="w-8 h-8 text-orange-400" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Growth Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">User Growth</CardTitle>
                  <CardDescription className="text-gray-400">Monthly user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={userGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="new_users" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.3}
                        name="New Users"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Trip Growth</CardTitle>
                  <CardDescription className="text-gray-400">Monthly trip creation</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={tripGrowth}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="month" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }} 
                      />
                      <Bar dataKey="new_trips" fill="#10B981" name="New Trips" />
                      <Bar dataKey="completed_trips" fill="#F59E0B" name="Completed" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* System Metrics */}
            {systemMetrics && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Today's Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{systemMetrics.users_today || 0}</p>
                      <p className="text-gray-400 text-sm">New Users</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-400">{systemMetrics.trips_today || 0}</p>
                      <p className="text-gray-400 text-sm">New Trips</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-400">{systemMetrics.expenses_today || 0}</p>
                      <p className="text-gray-400 text-sm">New Expenses</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-purple-400">{systemMetrics.activities_added_7d || 0}</p>
                      <p className="text-gray-400 text-sm">Activities Added (7d)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">User Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage user accounts and roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userAnalytics.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-300" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">
                            {user.first_name} {user.last_name}
                          </h3>
                          <p className="text-gray-400 text-sm">{user.email}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge className={`${getRoleColor(user.role)} text-white`}>
                              {user.role}
                            </Badge>
                            <span className="text-gray-400 text-xs">
                              {user.total_trips} trips • Joined {formatDate(user.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right mr-4">
                          <p className="text-white font-semibold">
                            {formatCurrency(user.total_budget_planned)}
                          </p>
                          <p className="text-gray-400 text-sm">Total Budget</p>
                        </div>
                        {user.role !== 'admin' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserRole(user.id, user.role === 'moderator' ? 'user' : 'moderator')}
                            className="border-gray-600 text-gray-300 hover:bg-gray-600"
                          >
                            {user.role === 'moderator' ? 'Remove Mod' : 'Make Mod'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Popular Cities</CardTitle>
                  <CardDescription className="text-gray-400">
                    Most visited destinations
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {popularCities.slice(0, 10).map((city, index) => (
                      <div key={city.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-white font-medium">{city.name}</p>
                            <p className="text-gray-400 text-sm">{city.country}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{city.trip_count}</p>
                          <p className="text-gray-400 text-sm">trips</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Popular Activities</CardTitle>
                  <CardDescription className="text-gray-400">
                    Most booked activities
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {popularActivities.slice(0, 10).map((activity, index) => (
                      <div key={activity.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-white font-medium">{activity.name}</p>
                            <p className="text-gray-400 text-sm">
                              {activity.city_name}, {activity.country}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-white font-semibold">{activity.trip_count}</p>
                          <p className="text-gray-400 text-sm">bookings</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Cities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-400 mb-2">
                      {platformStats?.total_cities || 0}
                    </p>
                    <p className="text-gray-400">Total cities in database</p>
                    <Button className="mt-4 w-full" variant="outline" onClick={() => router.push("/admin/cities")}>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Cities
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Activities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-green-400 mb-2">
                      {platformStats?.total_activities || 0}
                    </p>
                    <p className="text-gray-400">Total activities in database</p>
                    <Button className="mt-4 w-full" variant="outline" onClick={() => router.push("/admin/activities")}>
                      <Settings className="w-4 h-4 mr-2" />
                      Manage Activities
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Database</span>
                      <Badge className="bg-green-600">Healthy</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">API</span>
                      <Badge className="bg-green-600">Online</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Storage</span>
                      <Badge className="bg-green-600">Available</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Rating</span>
                      <span className="text-white">{systemMetrics.avg_activity_rating || 'N/A'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
