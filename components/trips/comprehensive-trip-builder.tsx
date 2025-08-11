"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { toast } from "@/hooks/use-toast"
import { useTripStore } from "@/lib/store"
import { calculateTripStatus, getMotivationalMessage } from "@/lib/trip-status"
import { 
  Upload, Calendar, MapPin, Save, ArrowLeft, Plus, Trash2, 
  DollarSign, Clock, Search, CloudSun, FileText, Paperclip,
  GripVertical, Edit, Copy, CheckCircle, Sparkles, Rocket,
  PartyPopper, Target, Heart, Star, Zap, Trophy
} from "lucide-react"
import Image from "next/image"
import ItineraryDayBuilder from "./itinerary-day-builder"
import ActivitySearchModal from "./activity-search-modal"
import WeatherForecastWidget from "./weather-forecast-widget"
import BudgetCalculator from "./budget-calculator"
import FileUploadZone from "./file-upload-zone"
import DestinationInput from "@/components/ui/destination-input"
import { formatDateForInput } from "@/lib/date-utils"

// Enhanced schema with itinerary validation
const tripSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(255, "Trip name too long"),
  description: z.string().max(1000, "Description too long"),
  destinations: z.array(z.string()).min(1, "At least one destination is required"),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  totalBudget: z.number().min(0, "Budget must be positive").optional(),
  currency: z.string().default("USD"),
  status: z.enum(["planning", "active", "completed"]).optional(),
  isPublic: z.boolean(),
  itinerary: z.array(z.object({
    id: z.string(),
    dayNumber: z.number(),
    title: z.string(),
    description: z.string(),
    date: z.string(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    location: z.object({
      name: z.string(),
      coordinates: z.object({
        lat: z.number(),
        lng: z.number()
      }).optional(),
      address: z.string().optional()
    }),
    activityType: z.enum(["travel", "accommodation", "sightseeing", "adventure", "dining", "shopping", "entertainment", "other"]),
    budget: z.object({
      estimated: z.number(),
      actual: z.number().optional(),
      breakdown: z.array(z.object({
        category: z.string(),
        amount: z.number(),
        description: z.string().optional()
      }))
    }),
    weather: z.object({
      temperature: z.number().optional(),
      condition: z.string().optional(),
      icon: z.string().optional()
    }).optional(),
    notes: z.string().optional(),
    attachments: z.array(z.object({
      name: z.string(),
      url: z.string(),
      type: z.string()
    })).optional(),
    completed: z.boolean().default(false),
    activities: z.array(z.object({
      id: z.number(),
      name: z.string(),
      description: z.string().optional(),
      category: z.string().optional(),
      price_range: z.string().optional(),
      rating: z.number().optional(),
      duration_hours: z.number().optional(),
      city_id: z.number(),
      image_url: z.string().optional(),
      startTime: z.string().optional(),
      endTime: z.string().optional(),
      orderIndex: z.number().optional(),
      notes: z.string().optional(),
      estimatedCost: z.number().optional()
    })).default([])
  })).optional()
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}, {
  message: "End date must be after start date",
  path: ["endDate"]
})

type TripFormData = z.infer<typeof tripSchema>

interface ItineraryDay {
  id: string
  dayNumber: number
  title: string
  description: string
  date: string
  startTime?: string
  endTime?: string
  location: {
    name: string
    coordinates?: { lat: number; lng: number }
    address?: string
  }
  activityType: "travel" | "accommodation" | "sightseeing" | "adventure" | "dining" | "shopping" | "entertainment" | "other"
  budget: {
    estimated: number
    actual?: number
    breakdown: Array<{
      category: string
      amount: number
      description?: string
    }>
  }
  weather?: {
    temperature?: number
    condition?: string
    icon?: string
  }
  notes?: string
  attachments?: Array<{
    name: string
    url: string
    type: string
  }>
  completed: boolean
  activities: Array<{
    id: number
    name: string
    description?: string
    category?: string
    price_range?: string
    rating?: number
    duration_hours?: number
    city_id: number
    image_url?: string
    startTime?: string
    endTime?: string
    orderIndex?: number
    notes?: string
    estimatedCost?: number
  }>
}

const ACTIVITY_TYPES = [
  { value: "travel", label: "Travel", icon: "🚗", color: "bg-blue-500" },
  { value: "accommodation", label: "Accommodation", icon: "🏨", color: "bg-purple-500" },
  { value: "sightseeing", label: "Sightseeing", icon: "📸", color: "bg-green-500" },
  { value: "adventure", label: "Adventure", icon: "🏔️", color: "bg-red-500" },
  { value: "dining", label: "Dining", icon: "🍽️", color: "bg-orange-500" },
  { value: "shopping", label: "Shopping", icon: "🛍️", color: "bg-pink-500" },
  { value: "entertainment", label: "Entertainment", icon: "🎭", color: "bg-indigo-500" },
  { value: "other", label: "Other", icon: "📝", color: "bg-gray-500" }
]

interface Trip {
  id: number
  display_id: number
  user_id: string
  name: string
  description: string
  start_date: string
  end_date: string
  status: "planning" | "active" | "completed"
  cover_image?: string
  is_public: boolean
  share_token?: string
  allow_copy: boolean
  created_at: string
  updated_at: string
}

interface ComprehensiveTripBuilderProps {
  existingTrip?: Trip
  existingCities?: any[]
  existingActivities?: any[]
  existingBudgets?: any[]
  existingDestinations?: string[]
  existingItinerary?: any[]
}

export default function ComprehensiveTripBuilder({ 
  existingTrip, 
  existingCities = [], 
  existingActivities = [], 
  existingBudgets = [], 
  existingDestinations = [], 
  existingItinerary = [] 
}: ComprehensiveTripBuilderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [coverImage, setCoverImage] = useState<string>(existingTrip?.cover_image || "")
  const [currentTab, setCurrentTab] = useState("basic")
  const [itineraryDays, setItineraryDays] = useState<ItineraryDay[]>(
    existingItinerary.length > 0 ? existingItinerary : []
  )
  const [showActivitySearch, setShowActivitySearch] = useState(false)
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    existingDestinations.length > 0 ? existingDestinations : []
  )
  const [totalEstimatedBudget, setTotalEstimatedBudget] = useState(0)
  const [formProgress, setFormProgress] = useState(0)
  const [showCelebration, setShowCelebration] = useState(false)
  const [motivationalMessage, setMotivationalMessage] = useState("")
  const [tripStatusInfo, setTripStatusInfo] = useState<any>(null)
  const { addTrip } = useTripStore()

  // Fun emojis for different sections
  const stepEmojis = {
    basic: "🎯",
    itinerary: "🗓️", 
    budget: "💰",
    review: "🚀"
  }

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: existingTrip ? {
      name: existingTrip.name,
      description: existingTrip.description,
      destinations: [], // Will be populated from trip data
      startDate: formatDateForInput(existingTrip.start_date),
      endDate: formatDateForInput(existingTrip.end_date),
      totalBudget: 0, // Will be calculated from budget data
      currency: "USD",
      isPublic: existingTrip.is_public,
      itinerary: []
    } : {
      name: "",
      description: "",
      destinations: [],
      startDate: "",
      endDate: "",
      totalBudget: 0,
      currency: "USD",
      isPublic: false,
      itinerary: []
    }
  })

  const watchedStartDate = watch("startDate")
  const watchedEndDate = watch("endDate")
  const watchedName = watch("name")

  // Load existing trip data when editing
  useEffect(() => {
    if (existingTrip && existingBudgets.length > 0) {
      // Calculate total budget from existing budgets
      const totalBudget = existingBudgets.reduce((sum, budget) => sum + (budget.planned_amount || 0), 0)
      setTotalEstimatedBudget(totalBudget)
      setValue("totalBudget", totalBudget)
      console.log('Loaded existing trip data:', {
        name: existingTrip.name,
        destinations: existingDestinations.length,
        cities: existingCities.length,
        activities: existingActivities.length,
        budgets: existingBudgets.length,
        totalBudget
      })
    }
  }, [existingTrip, existingBudgets, existingDestinations, existingCities, existingActivities, setValue])

  // Calculate form completion percentage
  useEffect(() => {
    let progress = 0
    
    // Basic details (40%)
    if (watchedName) progress += 10
    if (selectedDestinations.length > 0) progress += 10
    if (watchedStartDate && watchedEndDate) progress += 20
    
    // Itinerary (30%)
    if (itineraryDays.length > 0) progress += 15
    if (itineraryDays.some(day => day.description)) progress += 15
    
    // Budget (20%)
    if (totalEstimatedBudget > 0) progress += 20
    
    // Review (10%)
    if (currentTab === "review") progress += 10
    
    setFormProgress(Math.min(progress, 100))
  }, [watchedName, selectedDestinations, watchedStartDate, watchedEndDate, itineraryDays, totalEstimatedBudget, currentTab])

  // Update trip status info when dates change
  useEffect(() => {
    if (watchedStartDate && watchedEndDate) {
      const statusInfo = calculateTripStatus(watchedStartDate, watchedEndDate)
      setTripStatusInfo(statusInfo)
      setMotivationalMessage(getMotivationalMessage(statusInfo.status, statusInfo.daysUntilStart))
    }
  }, [watchedStartDate, watchedEndDate])

  // Show celebration when form is completed
  useEffect(() => {
    if (formProgress === 100 && !showCelebration) {
      setShowCelebration(true)
      setTimeout(() => setShowCelebration(false), 3000)
    }
  }, [formProgress])

  // Calculate trip duration and generate initial days
  const generateItineraryDays = () => {
    if (!watchedStartDate || !watchedEndDate) return

    const start = new Date(watchedStartDate)
    const end = new Date(watchedEndDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1

    const newDays: ItineraryDay[] = []
    for (let i = 0; i < diffDays; i++) {
      const currentDate = new Date(start)
      currentDate.setDate(start.getDate() + i)
      
      newDays.push({
        id: `day-${i + 1}-${Date.now()}`,
        dayNumber: i + 1,
        title: i === 0 ? "Arrival Day" : i === diffDays - 1 ? "Departure Day" : `Day ${i + 1}`,
        description: "",
        date: currentDate.toISOString().split('T')[0],
        location: {
          name: selectedDestinations[0] || "",
        },
        activityType: i === 0 ? "travel" : "sightseeing",
        budget: {
          estimated: 0,
          breakdown: []
        },
        notes: "",
        attachments: [],
        completed: false,
        activities: []
      })
    }

    setItineraryDays(newDays)
    setValue("itinerary", newDays)
  }

  // Add new itinerary day
  const addItineraryDay = () => {
    const newDay: ItineraryDay = {
      id: `day-${itineraryDays.length + 1}-${Date.now()}`,
      dayNumber: itineraryDays.length + 1,
      title: `Day ${itineraryDays.length + 1}`,
      description: "",
      date: watchedStartDate || new Date().toISOString().split('T')[0],
      location: {
        name: selectedDestinations[0] || "",
      },
      activityType: "sightseeing",
      budget: {
        estimated: 0,
        breakdown: []
      },
      notes: "",
      attachments: [],
      completed: false,
      activities: []
    }

    const updatedDays = [...itineraryDays, newDay]
    setItineraryDays(updatedDays)
    setValue("itinerary", updatedDays)
  }

  // Update itinerary day
  const updateItineraryDay = (dayId: string, updates: Partial<ItineraryDay>) => {
    const updatedDays = itineraryDays.map(day => 
      day.id === dayId ? { ...day, ...updates } : day
    )
    setItineraryDays(updatedDays)
    setValue("itinerary", updatedDays)
    
    // Recalculate total budget
    const total = updatedDays.reduce((sum, day) => sum + day.budget.estimated, 0)
    setTotalEstimatedBudget(total)
    setValue("totalBudget", total)
  }

  // Remove itinerary day
  const removeItineraryDay = (dayId: string) => {
    const updatedDays = itineraryDays.filter(day => day.id !== dayId)
      .map((day, index) => ({ ...day, dayNumber: index + 1 }))
    
    setItineraryDays(updatedDays)
    setValue("itinerary", updatedDays)
    
    // Recalculate total budget
    const total = updatedDays.reduce((sum, day) => sum + day.budget.estimated, 0)
    setTotalEstimatedBudget(total)
    setValue("totalBudget", total)
  }

  // Add activity to a specific day
  const addActivityToDay = (dayId: string, activity: any) => {
    const updatedDays = itineraryDays.map(day => {
      if (day.id === dayId) {
        // Calculate estimated cost from price_range if available
        let estimatedCost = 0
        if (activity.price_range) {
          // Convert price_range string to estimated cost
          // Assuming price_range is like "$", "$$", "$$$", "$$$$"
          const priceLevel = activity.price_range.length
          estimatedCost = priceLevel * 25 // $25 per level as a reasonable estimate
        }
        
        const newActivity = {
          ...activity,
          startTime: '09:00:00',
          endTime: '10:00:00',
          orderIndex: day.activities.length + 1,
          notes: '',
          estimatedCost: estimatedCost
        }
        
        return {
          ...day,
          activities: [...day.activities, newActivity],
          budget: {
            ...day.budget,
            estimated: day.budget.estimated + estimatedCost
          }
        }
      }
      return day
    })
    
    setItineraryDays(updatedDays)
    setValue("itinerary", updatedDays)
    
    // Recalculate total budget
    const total = updatedDays.reduce((sum, day) => sum + day.budget.estimated, 0)
    setTotalEstimatedBudget(total)
    setValue("totalBudget", total)
  }

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Upload failed')
      }

      const result = await response.json()
      setCoverImage(result.url)
      
      toast({
        title: "Image uploaded successfully",
        description: "Your trip cover image has been uploaded.",
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  // Handle form submission
  const onSubmit = async (data: TripFormData) => {
    setIsSubmitting(true)
    try {
      // Prepare trip data (status will be auto-calculated on backend)
      const tripData = {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        currency: data.currency,
        isPublic: data.isPublic,
        destinations: selectedDestinations,
        totalBudget: totalEstimatedBudget,
        itinerary: itineraryDays,
        ...(coverImage && coverImage.trim() !== "" && { coverImage })
      }

      const isEditing = !!existingTrip
      const url = isEditing ? `/api/trips/${existingTrip.id}` : '/api/trips'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)

        if (error.errors && Array.isArray(error.errors)) {
          const errorMessages = error.errors.map((err: any) => 
            `${err.path?.join('.')}: ${err.message}`
          ).join(', ')
          throw new Error(errorMessages)
        }

        throw new Error(error.message || `Failed to ${isEditing ? 'update' : 'create'} trip`)
      }

      const result = await response.json()
      
      // Add to store (result is the trip directly, not wrapped)
      if (!isEditing) {
        addTrip({
          id: result.display_id.toString(),
          name: result.name,
          description: result.description,
          start_date: result.start_date,
          end_date: result.end_date,
          status: result.status,
          cover_image: result.cover_image,
          is_public: result.is_public,
          user_id: result.user_id,
          created_at: result.created_at,
          updated_at: result.updated_at
        })
      }

      // Calculate and show the auto-detected status
      const now = new Date()
      const startDate = new Date(data.startDate)
      const endDate = new Date(data.endDate)
      
      let autoStatus = 'planning'
      let statusIcon = '📋'
      let statusMessage = 'Trip is in planning phase'
      
      if (now >= startDate && now <= endDate) {
        autoStatus = 'active'
        statusIcon = '🌍'
        statusMessage = 'Your adventure is active!'
      } else if (now > endDate) {
        autoStatus = 'completed'
        statusIcon = '🏆'
        statusMessage = 'Trip completed'
      }

      toast({
        title: `🎉 Trip ${isEditing ? 'updated' : 'created'} successfully!`,
        description: `${statusIcon} ${statusMessage} - Status auto-detected as "${autoStatus.charAt(0).toUpperCase() + autoStatus.slice(1)}"`,
        duration: 5000,
      })

      // Redirect to trip details
      router.push(`/trips/${result.display_id || result.id || existingTrip?.id}`)
    } catch (error) {
      console.error('Error creating trip:', error)
      const isEditing = !!existingTrip
      toast({
        title: `Failed to ${isEditing ? 'update' : 'create'} trip`,
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto relative">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="animate-bounce text-6xl">
            <PartyPopper className="w-16 h-16 text-yellow-400 animate-spin" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 animate-pulse"></div>
        </div>
      )}

      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-pink-500 rounded-full animate-ping"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Trip Builder</h2>
              <p className="text-gray-400">
                {formProgress < 25 ? "Let's start your adventure! 🌟" :
                 formProgress < 50 ? "Looking good! Keep going! 🚀" :
                 formProgress < 75 ? "Almost there! You're doing great! ⭐" :
                 formProgress < 100 ? "Final stretch! So close! 🎯" :
                 "Perfect! Ready to launch! 🎉"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text">
              {formProgress}%
            </div>
            <p className="text-gray-400 text-sm">Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <Progress 
            value={formProgress} 
            className="h-3 bg-gray-800 border border-gray-700"
          />
          <div className="absolute top-0 left-0 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-700 ease-out" 
               style={{ width: `${formProgress}%` }}>
            <div className="absolute right-0 top-0 h-3 w-6 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
          </div>
        </div>

        {/* Motivational Message */}
        {motivationalMessage && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-700/50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-400 animate-pulse" />
              <p className="text-blue-300 font-medium">{motivationalMessage}</p>
            </div>
          </div>
        )}

        {/* Trip Status Preview */}
        {tripStatusInfo && (
          <div className="mt-4 p-3 bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{tripStatusInfo.statusIcon}</span>
                <div>
                  <p className={`font-medium ${tripStatusInfo.statusColor}`}>
                    {tripStatusInfo.statusMessage}
                  </p>
                  <p className="text-gray-400 text-sm">
                    Status: {tripStatusInfo.status.charAt(0).toUpperCase() + tripStatusInfo.status.slice(1)}
                  </p>
                </div>
              </div>
              {tripStatusInfo.progressPercentage > 0 && (
                <Badge variant="secondary" className="bg-blue-600 text-white">
                  {tripStatusInfo.progressPercentage}% Progress
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 bg-gray-800 border-gray-700">
            <TabsTrigger value="basic" className="data-[state=active]:bg-gray-700 relative">
              <span className="text-2xl mr-2">{stepEmojis.basic}</span>
              Basic Details
              {formProgress >= 25 && <CheckCircle className="w-4 h-4 ml-2 text-green-400" />}
            </TabsTrigger>
            <TabsTrigger value="itinerary" className="data-[state=active]:bg-gray-700 relative">
              <span className="text-2xl mr-2">{stepEmojis.itinerary}</span>
              Itinerary
              {formProgress >= 55 && <CheckCircle className="w-4 h-4 ml-2 text-green-400" />}
            </TabsTrigger>
            <TabsTrigger value="budget" className="data-[state=active]:bg-gray-700 relative">
              <span className="text-2xl mr-2">{stepEmojis.budget}</span>
              Budget
              {formProgress >= 75 && <CheckCircle className="w-4 h-4 ml-2 text-green-400" />}
            </TabsTrigger>
            <TabsTrigger value="review" className="data-[state=active]:bg-gray-700 relative">
              <span className="text-2xl mr-2">{stepEmojis.review}</span>
              Review
              {formProgress === 100 && (
                <div className="flex items-center ml-2">
                  <Trophy className="w-4 h-4 text-yellow-400 animate-bounce" />
                  <Sparkles className="w-3 h-3 text-yellow-400 animate-pulse ml-1" />
                </div>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Basic Trip Details */}
          <TabsContent value="basic" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  Basic Trip Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trip Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Trip Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="e.g., Goa Beach Trip, Manali Trek"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe your trip..."
                    rows={3}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                  {errors.description && (
                    <p className="text-red-400 text-sm">{errors.description.message}</p>
                  )}
                </div>

                {/* Destinations */}
                <div className="space-y-2">
                  <Label className="text-white">Destinations *</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedDestinations.map((dest, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-600 text-white">
                        {dest}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = selectedDestinations.filter((_, i) => i !== index)
                            setSelectedDestinations(updated)
                            setValue("destinations", updated)
                          }}
                          className="ml-2 text-white hover:text-red-300"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <DestinationInput
                    placeholder="Search cities or type destination..."
                    onDestinationAdd={(destination) => {
                      if (!selectedDestinations.includes(destination)) {
                        const updated = [...selectedDestinations, destination]
                        setSelectedDestinations(updated)
                        setValue("destinations", updated)
                        
                        toast({
                          title: `📍 ${destination} added!`,
                          description: "Great choice for your adventure!",
                        })
                      } else {
                        toast({
                          title: "📍 Already added",
                          description: `${destination} is already in your destinations list.`,
                          variant: "destructive",
                        })
                      }
                    }}
                  />
                  
                  <div className="mt-2 text-xs text-gray-500">
                    💡 Tip: Type any destination and press Enter, or select from suggestions if available
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-white">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register("startDate")}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    {errors.startDate && (
                      <p className="text-red-400 text-sm">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate" className="text-white">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register("endDate")}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    {errors.endDate && (
                      <p className="text-red-400 text-sm">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-2">
                  <Label className="text-white">Cover Image</Label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6">
                    {coverImage ? (
                      <div className="relative">
                        <Image
                          src={coverImage}
                          alt="Trip cover"
                          width={200}
                          height={120}
                          className="rounded-lg object-cover mx-auto"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => setCoverImage("")}
                          className="absolute top-2 right-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            {isUploading ? "Uploading..." : "Upload Cover Image"}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>

                {/* Trip Settings */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-white">Privacy Settings</Label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-700 rounded-lg">
                      <Switch
                        id="isPublic"
                        onCheckedChange={(checked) => setValue("isPublic", checked)}
                      />
                      <Label htmlFor="isPublic" className="text-gray-300">
                        Make trip public (others can view your itinerary)
                      </Label>
                    </div>
                  </div>

                  {/* Status Preview - Read Only */}
                  {tripStatusInfo && (
                    <div className="space-y-2">
                      <Label className="text-white">Trip Status (Auto-detected)</Label>
                      <div className="p-3 bg-gray-700 rounded-lg border-2 border-dashed border-gray-600">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{tripStatusInfo.statusIcon}</span>
                          <div>
                            <p className={`font-medium ${tripStatusInfo.statusColor}`}>
                              Status: {tripStatusInfo.status.charAt(0).toUpperCase() + tripStatusInfo.status.slice(1)}
                            </p>
                            <p className="text-gray-400 text-sm">
                              {tripStatusInfo.statusMessage}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-500 text-xs">
                        ℹ️ Status is automatically determined based on your travel dates
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      generateItineraryDays()
                      setCurrentTab("itinerary")
                      // Fun success message
                      toast({
                        title: "🎉 Great start!",
                        description: "Your trip foundation is set! Let's build that itinerary!",
                      })
                    }}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg"
                    disabled={!watchedStartDate || !watchedEndDate || selectedDestinations.length === 0}
                  >
                    <Rocket className="w-4 h-4 mr-2" />
                    Continue to Itinerary
                    <Sparkles className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Itinerary Builder */}
          <TabsContent value="itinerary" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Target className="w-8 h-8 text-green-400 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Day-by-Day Itinerary</h3>
                  <p className="text-gray-400">
                    {itineraryDays.length === 0 
                      ? "Let's plan your perfect days! ✨"
                      : `${itineraryDays.length} amazing ${itineraryDays.length === 1 ? 'day' : 'days'} planned! 🗓️`
                    }
                  </p>
                </div>
              </div>
              <Button
                type="button"
                onClick={() => {
                  addItineraryDay()
                  toast({
                    title: "🎯 New day added!",
                    description: "Another day of adventure awaits planning!",
                  })
                }}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold px-4 py-2 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Day
                <Zap className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {itineraryDays.map((day, index) => (
              <ItineraryDayBuilder
                key={day.id}
                day={day}
                onUpdate={(updates) => updateItineraryDay(day.id, updates)}
                onRemove={() => removeItineraryDay(day.id)}
                activityTypes={ACTIVITY_TYPES}
                destinations={selectedDestinations}
              />
            ))}

            {itineraryDays.length === 0 && (
              <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-gray-700 border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="relative">
                    <MapPin className="mx-auto h-16 w-16 text-gray-400 mb-4 animate-bounce" />
                    <div className="absolute -top-2 -right-2">
                      <Star className="w-6 h-6 text-yellow-400 animate-spin" />
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Plan Your Adventure! 🗺️</h3>
                  <p className="text-gray-300 mb-6 max-w-md mx-auto">
                    Your dates are set! Now let's create an amazing day-by-day itinerary that'll make this trip unforgettable! ✨
                  </p>
                  <div className="space-y-3">
                    <Button
                      type="button"
                      onClick={() => {
                        generateItineraryDays()
                        toast({
                          title: "🚀 Days generated!",
                          description: "Your itinerary framework is ready for customization!",
                        })
                      }}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-6 py-3 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg"
                      disabled={!watchedStartDate || !watchedEndDate}
                    >
                      <Rocket className="w-5 h-5 mr-2" />
                      Generate My Days!
                      <Sparkles className="w-5 h-5 ml-2" />
                    </Button>
                    <p className="text-gray-500 text-sm">
                      Or go back to set your travel dates first
                    </p>
                    <Button
                      type="button"
                      onClick={() => setCurrentTab("basic")}
                      variant="outline"
                      size="sm"
                      className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
                    >
                      ← Back to Dates
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                onClick={() => setCurrentTab("basic")}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Basic Details
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentTab("budget")}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={itineraryDays.length === 0}
              >
                Continue to Budget
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </div>
          </TabsContent>

          {/* Budget Overview */}
          <TabsContent value="budget" className="space-y-6">
            <BudgetCalculator
              itineraryDays={itineraryDays}
              totalBudget={totalEstimatedBudget}
              currency={watch("currency") || "USD"}
              onBudgetUpdate={(total) => {
                setTotalEstimatedBudget(total)
                setValue("totalBudget", total)
              }}
            />

            <div className="flex justify-between">
              <Button
                type="button"
                onClick={() => setCurrentTab("itinerary")}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Itinerary
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentTab("review")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Review Trip
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </div>
          </TabsContent>

          {/* Review & Submit */}
          <TabsContent value="review" className="space-y-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Review Your Trip</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-400">Trip Name</Label>
                    <p className="text-white font-medium">{watchedName || "Untitled Trip"}</p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Duration</Label>
                    <p className="text-white font-medium">
                      {itineraryDays.length} {itineraryDays.length === 1 ? "day" : "days"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Destinations</Label>
                    <p className="text-white font-medium">
                      {selectedDestinations.join(", ") || "No destinations"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-gray-400">Total Budget</Label>
                    <p className="text-white font-medium">
                      ${totalEstimatedBudget.toLocaleString()} {watch("currency")}
                    </p>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                <div>
                  <Label className="text-gray-400">Itinerary Summary</Label>
                  <div className="mt-2 space-y-2">
                    {itineraryDays.map((day) => (
                      <div key={day.id} className="flex justify-between items-center p-2 bg-gray-700 rounded">
                        <span className="text-white">{day.title}</span>
                        <Badge variant="secondary" className="bg-gray-600">
                          ${day.budget.estimated}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button
                type="button"
                onClick={() => setCurrentTab("budget")}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Budget
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || itineraryDays.length === 0}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold px-8 py-4 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-xl text-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                    {existingTrip ? 'Updating Your Adventure...' : 'Creating Your Adventure...'}
                  </>
                ) : (
                  <>
                    <Trophy className="w-5 h-5 mr-3" />
                    {existingTrip ? 'Update My Trip!' : 'Launch My Trip!'}
                    <Rocket className="w-5 h-5 ml-3" />
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </form>

      {/* Activity Search Modal */}
      {showActivitySearch && (
        <ActivitySearchModal
          isOpen={showActivitySearch}
          onClose={() => setShowActivitySearch(false)}
          onSelectDestination={(destination) => {
            if (!selectedDestinations.includes(destination)) {
              const updated = [...selectedDestinations, destination]
              setSelectedDestinations(updated)
              setValue("destinations", updated)
            }
            setShowActivitySearch(false)
          }}
          onSelectActivity={(activity) => {
            // For now, add to the first day that has no activities
            // In a real app, you'd want to let the user choose which day
            const firstEmptyDay = itineraryDays.find(day => day.activities.length === 0)
            if (firstEmptyDay) {
              addActivityToDay(firstEmptyDay.id, activity)
              toast({
                title: "Activity added!",
                description: `${activity.name} has been added to ${firstEmptyDay.title}`,
              })
            } else {
              toast({
                title: "No empty days",
                description: "All days already have activities. Add a new day first.",
                variant: "destructive",
              })
            }
            setShowActivitySearch(false)
          }}
        />
      )}
    </div>
  )
}
