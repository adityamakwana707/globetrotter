"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { 
  Plus, 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Activity, 
  MapPin, 
  Clock, 
  DollarSign,
  Star,
  Search,
  Filter,
  Eye,
  ImageIcon,
  Save,
  X,
  Users
} from "lucide-react"

interface User {
  id: string
  name?: string | null
  email?: string | null
}

interface ActivityData {
  id: number
  name: string
  description: string | null
  category: string | null
  price_range: string | null
  rating: string | number | null
  duration_hours: number | null
  city_id: number
  latitude: number | null
  longitude: number | null
  image_url: string | null
  website_url: string | null
  city_name: string
  city_country: string
  created_at: string
  booking_count?: number
}

interface City {
  id: number
  name: string
  country: string
}

interface NewActivityForm {
  name: string
  description: string
  category: string
  estimated_cost: string
  duration_hours: string
  image_url: string
  city_id: string
}

const categories = [
  "Sightseeing", "Adventure", "Cultural", "Food & Drink", "Shopping", 
  "Entertainment", "Sports", "Wellness", "Nature", "History", 
  "Art & Museums", "Nightlife", "Family", "Romance", "Photography"
]

export default function AdminActivitiesManagement({ user }: { user: User }) {
  const router = useRouter()
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [cities, setCities] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedCity, setSelectedCity] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingActivity, setEditingActivity] = useState<ActivityData | null>(null)
  const [newActivity, setNewActivity] = useState<NewActivityForm>({
    name: "",
    description: "",
    category: "",
    estimated_cost: "",
    duration_hours: "",
    image_url: "",
    city_id: ""
  })

  useEffect(() => {
    fetchActivities()
    fetchCities()
  }, [])

  const fetchActivities = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/activities")
      if (response.ok) {
        const data = await response.json()
        setActivities(data)
      } else {
        throw new Error("Failed to fetch activities")
      }
    } catch (error) {
      console.error("Error fetching activities:", error)
      toast({
        title: "Error",
        description: "Failed to load activities",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCities = async () => {
    try {
      const response = await fetch("/api/cities")
      if (response.ok) {
        const data = await response.json()
        setCities(data)
      }
    } catch (error) {
      console.error("Error fetching cities:", error)
    }
  }

  const handleAddActivity = async () => {
    try {
      const activityData = {
        ...newActivity,
        estimated_cost: newActivity.estimated_cost ? parseFloat(newActivity.estimated_cost) : null,
        duration_hours: newActivity.duration_hours ? parseFloat(newActivity.duration_hours) : null,
        city_id: parseInt(newActivity.city_id)
      }

      const response = await fetch("/api/admin/activities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(activityData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Activity added successfully",
        })
        setIsAddDialogOpen(false)
        setNewActivity({
          name: "",
          description: "",
          category: "",
          estimated_cost: "",
          duration_hours: "",
          image_url: "",
          city_id: ""
        })
        fetchActivities()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add activity")
      }
    } catch (error) {
      console.error("Error adding activity:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add activity",
        variant: "destructive",
      })
    }
  }

  const handleEditActivity = async () => {
    if (!editingActivity) return

    try {
      const response = await fetch(`/api/admin/activities`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingActivity),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Activity updated successfully",
        })
        setIsEditDialogOpen(false)
        setEditingActivity(null)
        fetchActivities()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update activity")
      }
    } catch (error) {
      console.error("Error updating activity:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update activity",
        variant: "destructive",
      })
    }
  }

  const handleDeleteActivity = async (activityId: number) => {
    if (!confirm("Are you sure you want to delete this activity? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/activities`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: activityId }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "Activity deleted successfully",
        })
        fetchActivities()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete activity")
      }
    } catch (error) {
      console.error("Error deleting activity:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete activity",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (activity: ActivityData) => {
    setEditingActivity({ ...activity })
    setIsEditDialogOpen(true)
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.city_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (activity.description && activity.description.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || activity.category === selectedCategory
    const matchesCity = selectedCity === "all" || activity.city_id.toString() === selectedCity
    return matchesSearch && matchesCategory && matchesCity
  })

  const uniqueCategories = Array.from(new Set(activities.map(activity => activity.category).filter(Boolean))).sort() as string[]

  const getCategoryColor = (category: string | null) => {
    if (!category) return "bg-gray-600"
    const colors = {
      "Sightseeing": "bg-blue-600",
      "Adventure": "bg-red-600",
      "Cultural": "bg-purple-600",
      "Food & Drink": "bg-green-600",
      "Shopping": "bg-pink-600",
      "Entertainment": "bg-yellow-600",
      "Sports": "bg-orange-600",
      "Wellness": "bg-teal-600",
      "Nature": "bg-emerald-600",
      "History": "bg-amber-600",
      "Art & Museums": "bg-violet-600",
      "Nightlife": "bg-indigo-600",
      "Family": "bg-cyan-600",
      "Romance": "bg-rose-600",
      "Photography": "bg-slate-600"
    }
    return colors[category as keyof typeof colors] || "bg-gray-600"
  }

  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      {/* Header */}
      <header className="bg-transparent border-0">
        <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start sm:items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10">
              <Activity className="text-emerald-600 w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight">Activities Management</h1>
              <p className="text-slate-600 text-sm sm:text-base">Manage activities in the platform</p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Activity
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-slate-900">Add New Activity</DialogTitle>
                <DialogDescription className="text-slate-600">
                  Add a new activity to the platform
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-slate-800">Activity Name</Label>
                  <Input
                    id="name"
                    value={newActivity.name}
                    onChange={(e) => setNewActivity({ ...newActivity, name: e.target.value })}
                    placeholder="Enter activity name"
                    className="bg-white border-gray-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="city_id" className="text-slate-800">City</Label>
                  <Select onValueChange={(value) => setNewActivity({ ...newActivity, city_id: value })}>
                    <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {cities.map(city => (
                        <SelectItem key={city.id} value={city.id.toString()} className="text-slate-900 hover:bg-gray-50">
                          {city.name}, {city.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category" className="text-slate-800">Category</Label>
                  <Select onValueChange={(value) => setNewActivity({ ...newActivity, category: value })}>
                    <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {categories.map(category => (
                        <SelectItem key={category} value={category} className="text-slate-900 hover:bg-gray-50">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimated_cost" className="text-slate-800">Estimated Cost ($)</Label>
                  <Input
                    id="estimated_cost"
                    type="number"
                    step="0.01"
                    value={newActivity.estimated_cost}
                    onChange={(e) => setNewActivity({ ...newActivity, estimated_cost: e.target.value })}
                    placeholder="e.g., 50.00"
                    className="bg-white border-gray-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="duration_hours" className="text-slate-800">Duration (hours)</Label>
                  <Input
                    id="duration_hours"
                    type="number"
                    step="0.5"
                    value={newActivity.duration_hours}
                    onChange={(e) => setNewActivity({ ...newActivity, duration_hours: e.target.value })}
                    placeholder="e.g., 2.5"
                    className="bg-white border-gray-300 text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description" className="text-slate-800">Description</Label>
                  <Textarea
                    id="description"
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                    placeholder="Enter activity description"
                    rows={3}
                    className="bg-white border-gray-300 text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="image_url" className="text-slate-800">Image URL</Label>
                  <Input
                    id="image_url"
                    value={newActivity.image_url}
                    onChange={(e) => setNewActivity({ ...newActivity, image_url: e.target.value })}
                    placeholder="Enter image URL"
                    className="bg-white border-gray-300 text-slate-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="border-gray-300 text-slate-700 hover:bg-gray-50"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddActivity} className="bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Activity
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="mb-6 bg-white border-gray-200 shadow-md">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-gray-300 text-slate-900"
                />
              </div>
              <div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all" className="text-slate-900 hover:bg-gray-50">All Categories</SelectItem>
                    {uniqueCategories.map(category => (
                      <SelectItem key={category} value={category} className="text-slate-900 hover:bg-gray-50">
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Select value={selectedCity} onValueChange={setSelectedCity}>
                  <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                    <SelectValue placeholder="Filter by city" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="all" className="text-slate-900 hover:bg-gray-50">All Cities</SelectItem>
                    {cities.map(city => (
                      <SelectItem key={city.id} value={city.id.toString()} className="text-slate-900 hover:bg-gray-50">
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="bg-white border-gray-200 shadow-md">
                <div className="animate-pulse">
                  <div className="h-48 bg-gray-100 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-100 rounded w-2/3"></div>
                  </CardContent>
                </div>
              </Card>
            ))
          ) : filteredActivities.length > 0 ? (
            filteredActivities.map(activity => (
              <Card key={activity.id} className="bg-white border-gray-200 shadow-md overflow-hidden">
                <div className="relative h-48">
                  {activity.image_url ? (
                    <img
                      src={activity.image_url}
                      alt={activity.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-slate-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(activity)}
                      className="h-8 w-8 p-0 bg-white/90 border-gray-300 text-slate-700 hover:bg-gray-50"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteActivity(activity.id)}
                      className="h-8 w-8 p-0 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {activity.category && (
                    <div className="absolute top-2 left-2">
                      <Badge className={`${getCategoryColor(activity.category)} text-white`}>
                        {activity.category}
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-slate-900 font-semibold text-lg line-clamp-1">{activity.name}</h3>
                    {activity.rating && (
                      <div className="flex items-center text-amber-500">
                        <Star className="w-4 h-4 fill-current" />
                        <span className="text-sm ml-1">{Number(activity.rating).toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  <p className="text-slate-600 text-sm mb-3 flex items-center">
                    <MapPin className="w-4 h-4 mr-1" />
                    {activity.city_name}, {activity.city_country}
                  </p>
                  {activity.description && (
                    <p className="text-slate-600 text-sm mb-3 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {activity.price_range && (
                        <span className="flex items-center">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {activity.price_range}
                        </span>
                      )}
                      {activity.duration_hours && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {activity.duration_hours}h
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    {activity.booking_count !== undefined && (
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {activity.booking_count} bookings
                      </span>
                    )}
                    <span>ID: {activity.id}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Activity className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-700 text-lg">No activities found</p>
              <p className="text-slate-500 text-sm">Try adjusting your search or add a new activity</p>
            </div>
          )}
        </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-3xl bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-900">Edit Activity</DialogTitle>
              <DialogDescription className="text-slate-600">
                Update activity information
              </DialogDescription>
            </DialogHeader>
            {editingActivity && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-slate-800">Activity Name</Label>
                  <Input
                    id="edit-name"
                    value={editingActivity.name}
                    onChange={(e) => setEditingActivity({ ...editingActivity, name: e.target.value })}
                    className="bg-white border-gray-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-city_id" className="text-slate-800">City</Label>
                  <Select 
                    value={editingActivity.city_id.toString()} 
                    onValueChange={(value) => setEditingActivity({ ...editingActivity, city_id: parseInt(value) })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {cities.map(city => (
                        <SelectItem key={city.id} value={city.id.toString()} className="text-slate-900 hover:bg-gray-50">
                          {city.name}, {city.country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-category" className="text-slate-800">Category</Label>
                  <Select 
                    value={editingActivity.category || ""} 
                    onValueChange={(value) => setEditingActivity({ ...editingActivity, category: value })}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {categories.map(category => (
                        <SelectItem key={category} value={category} className="text-slate-900 hover:bg-gray-50">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-estimated_cost" className="text-slate-800">Estimated Cost ($)</Label>
                  <Input
                    id="edit-estimated_cost"
                    type="number"
                    step="0.01"
                    value={editingActivity.price_range?.replace('$', '') || ""}
                    onChange={(e) => setEditingActivity({ ...editingActivity, price_range: e.target.value ? `$${e.target.value}` : null })}
                    className="bg-white border-gray-300 text-slate-900"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-duration_hours" className="text-slate-800">Duration (hours)</Label>
                  <Input
                    id="edit-duration_hours"
                    type="number"
                    step="0.5"
                    value={editingActivity.duration_hours || ""}
                    onChange={(e) => setEditingActivity({ ...editingActivity, duration_hours: e.target.value ? parseFloat(e.target.value) : null })}
                    className="bg-white border-gray-300 text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-description" className="text-slate-800">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingActivity.description || ""}
                    onChange={(e) => setEditingActivity({ ...editingActivity, description: e.target.value })}
                    rows={3}
                    className="bg-white border-gray-300 text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-image_url" className="text-slate-800">Image URL</Label>
                  <Input
                    id="edit-image_url"
                    value={editingActivity.image_url || ""}
                    onChange={(e) => setEditingActivity({ ...editingActivity, image_url: e.target.value })}
                    className="bg-white border-gray-300 text-slate-900"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                className="border-gray-300 text-slate-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button onClick={handleEditActivity} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
   
  )
}
