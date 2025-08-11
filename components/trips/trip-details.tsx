"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/hooks/use-toast"
import { useTripStore } from "@/lib/store"
import { 
  ArrowLeft, 
  Edit, 
  Copy, 
  Share2, 
  Trash2, 
  MapPin, 
  Calendar, 
  Users,
  Plus,
  Clock,
  DollarSign
} from "lucide-react"
import Image from "next/image"
import ItineraryBuilder from "./itinerary-builder"
import BudgetManager from "@/components/budget/budget-manager"
import WeatherWidget from "@/components/weather/weather-widget"
import TripSharing from "./trip-sharing"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Trip {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  status: "planning" | "active" | "completed"
  cover_image?: string
  is_public: boolean
  created_at: string
  updated_at: string
}

interface TripDetailsProps {
  trip: Trip
}

export default function TripDetails({ trip }: TripDetailsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const { deleteTrip: deleteTripFromStore, addTrip } = useTripStore()

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-600"
      case "completed":
        return "bg-blue-600"
      default:
        return "bg-yellow-600"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const calculateDuration = () => {
    const start = new Date(trip.start_date)
    const end = new Date(trip.end_date)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/trips/${trip.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete trip')
      }

      deleteTripFromStore(trip.id)
      toast({
        title: "Trip deleted",
        description: "Your trip has been deleted successfully.",
      })
      router.push('/dashboard')
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete trip. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDuplicate = async () => {
    setIsDuplicating(true)
    try {
      const response = await fetch(`/api/trips/${trip.id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: `${trip.name} (Copy)`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate trip')
      }

      const newTrip = await response.json()
      addTrip(newTrip)
      
      toast({
        title: "Trip duplicated",
        description: "Your trip has been duplicated successfully.",
      })
      router.push(`/trips/${newTrip.id}`)
    } catch (error) {
      console.error('Duplicate error:', error)
      toast({
        title: "Error",
        description: "Failed to duplicate trip. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDuplicating(false)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: trip.name,
          text: trip.description,
          url: window.location.href
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback to clipboard
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Trip link has been copied to clipboard.",
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/trips/${trip.id}/edit`)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
            
            <Button
              variant="outline"
              onClick={handleDuplicate}
              disabled={isDuplicating}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Copy className="w-4 h-4 mr-2" />
              {isDuplicating ? "Duplicating..." : "Duplicate"}
            </Button>

            <Button
              variant="outline"
              onClick={handleShare}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-800 border-gray-700">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete Trip</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Are you sure you want to delete this trip? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Trip Overview */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardContent className="p-0">
            {trip.cover_image && (
              <div className="relative w-full h-64 bg-gray-700">
                <Image
                  src={trip.cover_image}
                  alt={trip.name}
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{trip.name}</h1>
                  <p className="text-gray-400 text-lg">{trip.description}</p>
                </div>
                <Badge className={`${getStatusColor(trip.status)} text-white`}>
                  {trip.status}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                <div className="flex items-center space-x-3 text-gray-300">
                  <Calendar className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Duration</p>
                    <p className="text-sm text-gray-400">{calculateDuration()} days</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-gray-300">
                  <MapPin className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Dates</p>
                    <p className="text-sm text-gray-400">
                      {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-gray-300">
                  <Users className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Privacy</p>
                    <p className="text-sm text-gray-400">
                      {trip.is_public ? "Public" : "Private"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different sections */}
        <Tabs defaultValue="itinerary" className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
            <TabsTrigger value="itinerary" className="data-[state=active]:bg-gray-700">
              Itinerary
            </TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-gray-700">
              Budget
            </TabsTrigger>
            <TabsTrigger value="weather" className="data-[state=active]:bg-gray-700">
              Weather
            </TabsTrigger>
            <TabsTrigger value="sharing" className="data-[state=active]:bg-gray-700">
              Sharing
            </TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-gray-700">
              Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary" className="mt-6">
            <ItineraryBuilder tripId={trip.id} />
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <BudgetManager tripId={trip.id} />
          </TabsContent>

          <TabsContent value="weather" className="mt-6">
            <WeatherWidget
              latitude={40.7128} // Default to NYC, would get from trip cities
              longitude={-74.0060}
              locationName="New York" // Would get from trip destination
            />
          </TabsContent>

          <TabsContent value="sharing" className="mt-6">
            <TripSharing tripId={trip.id} tripName={trip.name} />
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Trip Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <p className="text-gray-400 mb-4">Notes feature coming soon!</p>
                  <p className="text-sm text-gray-500">Add personal notes, reminders, and important information for your trip.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
