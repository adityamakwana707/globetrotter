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
  MapPin, 
  Globe, 
  Users, 
  Search,
  Filter,
  Eye,
  ImageIcon,
  Save,
  X
} from "lucide-react"

interface User {
  id: string
  name?: string | null
  email?: string | null
}

interface City {
  id: number
  name: string
  country: string
  description: string | null
  image_url: string | null
  latitude: number | null
  longitude: number | null
  cost_index: number | null
  timezone: string | null
  created_at: string
  trip_count?: number
}

interface NewCityForm {
  name: string
  country: string
  description: string
  image_url: string
  latitude: string
  longitude: string
  cost_index: string
  timezone: string
}

export default function AdminCitiesManagement({ user }: { user: User }) {
  const router = useRouter()
  const [cities, setCities] = useState<City[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCountry, setSelectedCountry] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingCity, setEditingCity] = useState<City | null>(null)
  const [newCity, setNewCity] = useState<NewCityForm>({
    name: "",
    country: "",
    description: "",
    image_url: "",
    latitude: "",
    longitude: "",
    cost_index: "",
    timezone: ""
  })

  const countries = [
    "United States", "United Kingdom", "France", "Germany", "Italy", "Spain", 
    "Japan", "Australia", "Canada", "Brazil", "India", "China", "Thailand",
    "Netherlands", "Switzerland", "Austria", "Greece", "Turkey", "Egypt",
    "Morocco", "South Africa", "Mexico", "Argentina", "Chile", "Peru",
    "Singapore", "Malaysia", "Indonesia", "Philippines", "Vietnam", "South Korea",
    "New Zealand", "Norway", "Sweden", "Denmark", "Finland", "Iceland",
    "Portugal", "Belgium", "Czech Republic", "Poland", "Hungary", "Croatia",
    "Slovenia", "Estonia", "Latvia", "Lithuania", "Ireland", "Scotland"
  ]

  useEffect(() => {
    fetchCities()
  }, [])

  const fetchCities = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/cities")
      if (response.ok) {
        const data = await response.json()
        setCities(data)
      } else {
        throw new Error("Failed to fetch cities")
      }
    } catch (error) {
      console.error("Error fetching cities:", error)
      toast({
        title: "Error",
        description: "Failed to load cities",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddCity = async () => {
    try {
      const cityData = {
        ...newCity,
        latitude: newCity.latitude ? parseFloat(newCity.latitude) : null,
        longitude: newCity.longitude ? parseFloat(newCity.longitude) : null,
        cost_index: newCity.cost_index ? parseInt(newCity.cost_index) : null
      }

      const response = await fetch("/api/admin/cities", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cityData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "City added successfully",
        })
        setIsAddDialogOpen(false)
        setNewCity({
          name: "",
          country: "",
          description: "",
          image_url: "",
          latitude: "",
          longitude: "",
          cost_index: "",
          timezone: ""
        })
        fetchCities()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to add city")
      }
    } catch (error) {
      console.error("Error adding city:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add city",
        variant: "destructive",
      })
    }
  }

  const handleEditCity = async () => {
    if (!editingCity) return

    try {
      const response = await fetch(`/api/admin/cities`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editingCity),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "City updated successfully",
        })
        setIsEditDialogOpen(false)
        setEditingCity(null)
        fetchCities()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to update city")
      }
    } catch (error) {
      console.error("Error updating city:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update city",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCity = async (cityId: number) => {
    if (!confirm("Are you sure you want to delete this city? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/cities`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: cityId }),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "City deleted successfully",
        })
        fetchCities()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Failed to delete city")
      }
    } catch (error) {
      console.error("Error deleting city:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete city",
        variant: "destructive",
      })
    }
  }

  const openEditDialog = (city: City) => {
    setEditingCity({ ...city })
    setIsEditDialogOpen(true)
  }

  const filteredCities = cities.filter(city => {
    const matchesSearch = city.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         city.country.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCountry = selectedCountry === "all" || city.country === selectedCountry
    return matchesSearch && matchesCountry
  })

  const uniqueCountries = Array.from(new Set(cities.map(city => city.country))).sort()

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-800/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/admin')}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Cities Management</h1>
                <p className="text-gray-400 text-sm">Manage cities in the platform</p>
              </div>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Add City
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Add New City</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Add a new city to the platform
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-gray-300">City Name</Label>
                  <Input
                    id="name"
                    value={newCity.name}
                    onChange={(e) => setNewCity({ ...newCity, name: e.target.value })}
                    placeholder="Enter city name"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="country" className="text-gray-300">Country</Label>
                  <Select onValueChange={(value) => setNewCity({ ...newCity, country: value })}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {countries.map(country => (
                        <SelectItem key={country} value={country} className="text-white hover:bg-gray-600">
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="description"
                    value={newCity.description}
                    onChange={(e) => setNewCity({ ...newCity, description: e.target.value })}
                    placeholder="Enter city description"
                    rows={3}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="image_url" className="text-gray-300">Image URL</Label>
                  <Input
                    id="image_url"
                    value={newCity.image_url}
                    onChange={(e) => setNewCity({ ...newCity, image_url: e.target.value })}
                    placeholder="Enter image URL"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="latitude" className="text-gray-300">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={newCity.latitude}
                    onChange={(e) => setNewCity({ ...newCity, latitude: e.target.value })}
                    placeholder="e.g., 40.7128"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude" className="text-gray-300">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={newCity.longitude}
                    onChange={(e) => setNewCity({ ...newCity, longitude: e.target.value })}
                    placeholder="e.g., -74.0060"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="cost_index" className="text-gray-300">Cost Index (1-100)</Label>
                  <Input
                    id="cost_index"
                    type="number"
                    min="1"
                    max="100"
                    value={newCity.cost_index}
                    onChange={(e) => setNewCity({ ...newCity, cost_index: e.target.value })}
                    placeholder="e.g., 75 (higher = more expensive)"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone" className="text-gray-300">Timezone</Label>
                  <Input
                    id="timezone"
                    value={newCity.timezone}
                    onChange={(e) => setNewCity({ ...newCity, timezone: e.target.value })}
                    placeholder="e.g., America/New_York"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddDialogOpen(false)
                  }}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddCity} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Add City
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Filters */}
        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search cities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
              <div className="w-full md:w-48">
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Filter by country" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-700 border-gray-600">
                    <SelectItem value="all" className="text-white hover:bg-gray-600">All Countries</SelectItem>
                    {uniqueCountries.map(country => (
                      <SelectItem key={country} value={country} className="text-white hover:bg-gray-600">
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <div className="animate-pulse">
                  <div className="h-48 bg-gray-700 rounded-t-lg"></div>
                  <CardContent className="p-4">
                    <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2 mb-4"></div>
                    <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </CardContent>
                </div>
              </Card>
            ))
          ) : filteredCities.length > 0 ? (
            filteredCities.map(city => (
              <Card key={city.id} className="bg-gray-800 border-gray-700 overflow-hidden">
                <div className="relative h-48">
                  {city.image_url ? (
                    <img
                      src={city.image_url}
                      alt={city.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-gray-500" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditDialog(city)}
                      className="h-8 w-8 p-0 bg-gray-800/80 border-gray-600 hover:bg-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteCity(city.id)}
                      className="h-8 w-8 p-0 bg-red-800/80 border-red-600 hover:bg-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-white font-semibold text-lg">{city.name}</h3>
                    {city.trip_count !== undefined && (
                      <Badge variant="outline" className="border-gray-600 text-gray-300">
                        {city.trip_count} trips
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm mb-3 flex items-center">
                    <Globe className="w-4 h-4 mr-1" />
                    {city.country}
                  </p>
                  {city.description && (
                    <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                      {city.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    {city.cost_index && (
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        Cost Index: {city.cost_index}
                      </span>
                    )}
                    <span>ID: {city.id}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No cities found</p>
              <p className="text-gray-500 text-sm">Try adjusting your search or add a new city</p>
            </div>
          )}
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl bg-gray-800 border-gray-700">
            <DialogHeader>
              <DialogTitle className="text-white">Edit City</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update city information
              </DialogDescription>
            </DialogHeader>
            {editingCity && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-name" className="text-gray-300">City Name</Label>
                  <Input
                    id="edit-name"
                    value={editingCity.name}
                    onChange={(e) => setEditingCity({ ...editingCity, name: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-country" className="text-gray-300">Country</Label>
                  <Select 
                    value={editingCity.country} 
                    onValueChange={(value) => setEditingCity({ ...editingCity, country: value })}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {countries.map(country => (
                        <SelectItem key={country} value={country} className="text-white hover:bg-gray-600">
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-description" className="text-gray-300">Description</Label>
                  <Textarea
                    id="edit-description"
                    value={editingCity.description || ""}
                    onChange={(e) => setEditingCity({ ...editingCity, description: e.target.value })}
                    rows={3}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-image_url" className="text-gray-300">Image URL</Label>
                  <Input
                    id="edit-image_url"
                    value={editingCity.image_url || ""}
                    onChange={(e) => setEditingCity({ ...editingCity, image_url: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-latitude" className="text-gray-300">Latitude</Label>
                  <Input
                    id="edit-latitude"
                    type="number"
                    step="any"
                    value={editingCity.latitude || ""}
                    onChange={(e) => setEditingCity({ ...editingCity, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-longitude" className="text-gray-300">Longitude</Label>
                  <Input
                    id="edit-longitude"
                    type="number"
                    step="any"
                    value={editingCity.longitude || ""}
                    onChange={(e) => setEditingCity({ ...editingCity, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-cost_index" className="text-gray-300">Cost Index (1-100)</Label>
                  <Input
                    id="edit-cost_index"
                    type="number"
                    min="1"
                    max="100"
                    value={editingCity.cost_index || ""}
                    onChange={(e) => setEditingCity({ ...editingCity, cost_index: e.target.value ? parseInt(e.target.value) : null })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-timezone" className="text-gray-300">Timezone</Label>
                  <Input
                    id="edit-timezone"
                    value={editingCity.timezone || ""}
                    onChange={(e) => setEditingCity({ ...editingCity, timezone: e.target.value })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsEditDialogOpen(false)
                }}
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button onClick={handleEditCity} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
