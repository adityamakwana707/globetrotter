"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
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
import { 
  Upload, Calendar, MapPin, Save, ArrowLeft, Plus, Trash2, 
  DollarSign, Clock, Search, CloudSun, FileText, Paperclip,
  GripVertical, Edit, Copy, CheckCircle, Sparkles, Rocket,
  PartyPopper, Target, Heart, Star, Zap, Trophy
} from "lucide-react"
import Image from "next/image"
import { formatDateForInput } from "@/lib/date-utils"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  DndContext, 
  DragOverlay, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  useDraggable,
  useDroppable
} from '@dnd-kit/core'
import {
  CSS
} from '@dnd-kit/utilities'
import ItineraryDayBuilder from "@/components/trips/itinerary-day-builder"
import ActivitySearchModal from "@/components/trips/activity-search-modal"
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
  attachments?: Array<{
    name: string
    url: string
    type: string
  }>
  notes?: string
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
  const [isLoadingAI, setIsLoadingAI] = useState(false)
  const [aiSuggestions, setAISuggestions] = useState<Array<any>>([])
  const [aiSchedule, setAISchedule] = useState<Array<any>>([])
  const [dragSuggestion, setDragSuggestion] = useState<any | null>(null)
  const [timeDialog, setTimeDialog] = useState<{ open: boolean; dayId: string; suggestion: any | null; slots: string[] }>({ open: false, dayId: "", suggestion: null, slots: [] })
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  )
  const [selectedDestinations, setSelectedDestinations] = useState<string[]>(
    existingDestinations.length > 0 ? existingDestinations : []
  )
  const [totalEstimatedBudget, setTotalEstimatedBudget] = useState(0)
  const [formProgress, setFormProgress] = useState(0)
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
      destinations: [],
      startDate: formatDateForInput(existingTrip.start_date),
      endDate: formatDateForInput(existingTrip.end_date),
      totalBudget: 0,
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
    
    // Recalculate total budget
    const total = updatedDays.reduce((sum, day) => sum + day.budget.estimated, 0)
    setTotalEstimatedBudget(total)
    setValue("totalBudget", total)
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
  const addActivityToDay = (dayId: string, activity: any, selectedTime?: string) => {
    const updatedDays = itineraryDays.map(day => {
      if (day.id === dayId) {
        // Calculate estimated cost from price_range if available
        let estimatedCost = 0
        if (activity.estimatedCost && typeof activity.estimatedCost === 'number') {
          estimatedCost = activity.estimatedCost
        } else if (activity.price_range) {
          // Convert price_range string to estimated cost
          // Assuming price_range is like "$", "$$", "$$$", "$$$$"
          const priceLevel = activity.price_range.length
          estimatedCost = priceLevel * 25 // $25 per level as a reasonable estimate
        }
        
        // Calculate end time based on duration
        const startTime = selectedTime || activity.startTime || '09:00:00'
        const duration = activity.duration_hours || 2
        const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
        const endMinutes = startMinutes + (duration * 60)
        const endTime = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}:00`
        
        const newActivity = {
          id: activity.id || null, // Keep original ID if from database
          name: activity.name || 'Untitled Activity',
          description: activity.description || activity.notes || '',
          category: activity.category || 'general',
          price_range: activity.price_range || '$',
          rating: activity.rating || null,
          duration_hours: activity.duration_hours || 2,
          city_id: activity.city_id || null,
          image_url: activity.image_url || null,
          startTime: startTime,
          endTime: endTime,
          orderIndex: day.activities.length + 1,
          notes: activity.notes || '',
          estimatedCost: estimatedCost,
          // Enhanced fields from web scraping
          coordinates: activity.coordinates || null,
          openingHours: activity.openingHours || null,
          wikipediaUrl: activity.wikipediaUrl || null,
          enriched: activity.enriched || false,
          enrichedAt: activity.enrichedAt || null
        }
        
        console.log(`Adding activity to day ${dayId}:`, newActivity)
        
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
    
    console.log(`Total activities across all days: ${updatedDays.reduce((sum, day) => sum + day.activities.length, 0)}`)
  }

  // Fetch AI suggestions for the first destination
  const fetchAISuggestions = async () => {
    if (selectedDestinations.length === 0) {
      toast({ title: "Add a destination first", variant: "destructive" })
      return
    }
    setIsLoadingAI(true)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: selectedDestinations[0], days: itineraryDays.length || 2, interests: [] })
      })
      const data = await res.json()
      setAISuggestions(Array.isArray(data?.suggestions) ? data.suggestions : [])
      setAISchedule(Array.isArray(data?.scheduled) ? data.scheduled : [])
      toast({ title: "AI suggestions ready", description: `Planned ${(data?.scheduled||[]).length} timed items` })
    } catch (e) {
      console.error(e)
      toast({ title: "Failed to get suggestions", variant: "destructive" })
    } finally {
      setIsLoadingAI(false)
    }
  }

  // Helpers: compute available slots for a day
  const timeToMinutes = useCallback((t: string) => {
    const [hh, mm] = t.split(":")
    return parseInt(hh) * 60 + parseInt(mm)
  }, [])
  
  const minutesToTime = useCallback((m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}:00`, [])
  
  const computeAvailableSlots = useCallback((day: ItineraryDay, durationHours: number) => {
    const startHour = 9
    const endHour = 18
    const step = 30 // minutes
    const durationMin = Math.round((durationHours || 2) * 60)
    const occupied: Array<[number, number]> = []
    for (const a of day.activities) {
      if (!a.startTime) continue
      const s = timeToMinutes(a.startTime)
      const d = Math.round(((a as any).duration_hours || 1) * 60)
      occupied.push([s, s + d])
    }
    occupied.sort((x, y) => x[0] - y[0])
    const free: string[] = []
    for (let t = startHour * 60; t + durationMin <= endHour * 60; t += step) {
      const slot: [number, number] = [t, t + durationMin]
      const overlaps = occupied.some(([s, e]) => Math.max(s, slot[0]) < Math.min(e, slot[1]))
      if (!overlaps) free.push(minutesToTime(t))
    }
    return free
  }, [timeToMinutes, minutesToTime])

  // Drag handlers with useCallback to prevent re-creation
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as string)
    const suggestionId = event.active.id as string
    if (suggestionId.startsWith('suggestion-')) {
      const index = parseInt(suggestionId.split('-')[1])
      setDragSuggestion(aiSuggestions[index])
    }
  }, [aiSuggestions])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    setActiveDragId(null)
    setDragSuggestion(null)

    if (!over) return

    const suggestionId = active.id as string
    const dayId = over.id as string

    if (suggestionId.startsWith('suggestion-') && dayId.startsWith('day-')) {
      const suggestionIndex = parseInt(suggestionId.split('-')[1])
      const suggestion = aiSuggestions[suggestionIndex]
      const targetDayId = dayId.replace('day-', '')
      
      const targetDay = itineraryDays.find(d => d.id === targetDayId)
      if (!targetDay || !suggestion) return

      // Show time slot selection dialog
      const slots = computeAvailableSlots(targetDay, suggestion.duration_hours || 2)
      setTimeDialog({ 
        open: true, 
        dayId: targetDayId, 
        suggestion: suggestion, 
        slots 
      })
    }
  }, [aiSuggestions, itineraryDays, computeAvailableSlots])

  // Enrich place information using web scraping
  const handleEnrichPlace = async (suggestion: any) => {
    try {
      const response = await fetch('/api/enrich-place', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: suggestion.name,
          city: selectedDestinations[0], // Use first destination as context
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to enrich place information')
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        // Update the suggestion with enriched information
        const enrichedSuggestion = {
          ...suggestion,
          description: result.data.description,
          duration_hours: result.data.estimatedDuration,
          openingHours: result.data.openingHours,
          coordinates: result.data.coordinates,
          enriched: true,
          enrichedAt: new Date().toISOString()
        }

        // Update the suggestions array
        setAISuggestions(prev => prev.map(s => 
          s.name === suggestion.name ? enrichedSuggestion : s
        ))

        toast({
          title: "Place enriched!",
          description: `Updated information for ${suggestion.name}`,
        })
      }
    } catch (error) {
      console.error('Error enriching place:', error)
      toast({
        title: "Enrichment failed",
        description: "Could not fetch additional information for this place.",
        variant: "destructive"
      })
    }
  }

  // Simple suggestion component with click-to-add
  const SuggestionCard = React.memo(({ suggestion, index }: { suggestion: any, index: number }) => {
    return (
      <div
        className={`p-3 bg-gray-50 rounded border ${
          suggestion.enriched ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-white font-medium text-sm">{suggestion.name}</p>
            <p className="text-xs text-gray-400">
              {suggestion.category || 'general'} 
              {suggestion.price_range ? ` • ${suggestion.price_range}` : ''}
              {suggestion.duration_hours ? ` • ${suggestion.duration_hours}h` : ''}
              {suggestion.enriched && <span className="text-green-400"> • Enriched</span>}
            </p>
            {suggestion.description && suggestion.enriched && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {suggestion.description.slice(0, 100)}...
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1 ml-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs border-gray-600 hover:bg-gray-600"
              onClick={(e) => {
                e.stopPropagation()
                handleEnrichPlace(suggestion)
              }}
            >
              Enrich
            </Button>
            <div className="flex gap-1">
              {itineraryDays.slice(0, 3).map(d => (
                <Button 
                  key={d.id} 
                  type="button" 
                  size="sm" 
                  className="text-xs bg-blue-600 hover:bg-blue-700" 
                  onClick={() => {
                    const slots = computeAvailableSlots(d, suggestion.duration_hours || 2)
                    setTimeDialog({ open: true, dayId: d.id, suggestion, slots })
                  }}
                >
                  Day {d.dayNumber}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  })

  // Simple droppable wrapper component
  const DroppableWrapper = React.memo(({ day, children }: { day: ItineraryDay, children: React.ReactNode }) => {
    const { setNodeRef, isOver } = useDroppable({ 
      id: `day-${day.id}`,
      data: { day }
    })

    return (
      <div ref={setNodeRef} className="relative">
        {/* Drop indicator overlay */}
        {isOver && (
          <div className="absolute -inset-2 bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-lg pointer-events-none z-10" />
        )}
        {children}
      </div>
    )
  })

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
      const tripData = {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
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
        description: "Your adventure is ready to begin!",
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
    <div className="min-h-screen bg-gray-50 py-8 sm:py-10">
    <div className="max-w-6xl mx-auto relative">
      {/* Progress Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
                <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
            </div>
            <div>
                <h2 className="text-2xl font-bold text-slate-900">Trip Builder</h2>
                <p className="text-slate-600">
                {formProgress < 25 ? "Let's start your adventure! 🌟" :
                 formProgress < 50 ? "Looking good! Keep going! 🚀" :
                 formProgress < 75 ? "Almost there! You're doing great! ⭐" :
                 formProgress < 100 ? "Final stretch! So close! 🎯" :
                 "Perfect! Ready to launch! 🎉"}
              </p>
            </div>
          </div>
          <div className="text-right">
              <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-emerald-500 to-green-500 bg-clip-text">
              {formProgress}%
            </div>
              <p className="text-slate-600 text-sm">Complete</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <Progress 
            value={formProgress} 
              className="h-3 bg-gray-200 border border-gray-300"
          />
            <div className="absolute top-0 left-0 h-3 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-700 ease-out" 
               style={{ width: `${formProgress}%` }}>
            <div className="absolute right-0 top-0 h-3 w-6 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full ">
            <TabsList className="grid w-full  grid-cols-2 sm:grid-cols-4 mb-[100px] bg-white border-gray-200 shadow-sm rounded-lg p-0 gap-0">
              <TabsTrigger 
                value="basic" 
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg"
              >
              <span className="text-2xl mr-2">{stepEmojis.basic}</span>
              Basic Details
                {formProgress >= 25 && <CheckCircle className="w-4 h-4 ml-2 text-emerald-500" />}
            </TabsTrigger>
              <TabsTrigger 
                value="itinerary" 
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg"
              >
              <span className="text-2xl mr-2">{stepEmojis.itinerary}</span>
              Itinerary
                {formProgress >= 55 && <CheckCircle className="w-4 h-4 ml-2 text-emerald-500" />}
            </TabsTrigger>
              <TabsTrigger 
                value="budget" 
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none border-r border-gray-200 transition-all duration-200 first:rounded-l-lg last:rounded-r-lg"
              >
              <span className="text-2xl mr-2">{stepEmojis.budget}</span>
              Budget
                {formProgress >= 75 && <CheckCircle className="w-4 h-4 ml-2 text-emerald-500" />}
            </TabsTrigger>
              <TabsTrigger 
                value="review" 
                className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800 data-[state=active]:font-semibold data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-white relative rounded-none transition-all duration-200 first:rounded-l-lg last:rounded-r-lg"
              >
              <span className="text-2xl mr-2">{stepEmojis.review}</span>
              Review
              {formProgress === 100 && (
                <div className="flex items-center ml-2">
                    <Trophy className="w-4 h-4 text-emerald-500 animate-bounce" />
                    <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse ml-1" />
                </div>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Basic Trip Details */}
          <TabsContent value="basic" className="space-y-6">
              <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader>
                  <CardTitle className="text-slate-900 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                  Basic Trip Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Trip Name */}
                <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-800">Trip Name *</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="e.g., Goa Beach Trip, Manali Trek"
                      className="bg-white border-gray-300 text-slate-900"
                  />
                  {errors.name && (
                      <p className="text-red-500 text-sm">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-800">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    placeholder="Describe your trip..."
                    rows={3}
                      className="bg-white border-gray-300 text-slate-900"
                  />
                  {errors.description && (
                      <p className="text-red-500 text-sm">{errors.description.message}</p>
                  )}
                </div>

                {/* Destinations */}
                <div className="space-y-2">
                    <Label className="text-slate-800">Destinations *</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedDestinations.map((dest, index) => (
                        <Badge key={index} variant="secondary" className="bg-emerald-600 text-white">
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
                    <Input
                      placeholder="Type destination and press Enter..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const input = e.target as HTMLInputElement
                          const destination = input.value.trim()
                          if (destination && !selectedDestinations.includes(destination)) {
                        const updated = [...selectedDestinations, destination]
                        setSelectedDestinations(updated)
                        setValue("destinations", updated)
                            input.value = ""
                        
                        toast({
                          title: `📍 ${destination} added!`,
                          description: "Great choice for your adventure!",
                        })
                          }
                        }
                      }}
                      className="bg-white border-gray-300 text-slate-900"
                    />
                    
                    <div className="mt-2 text-xs text-slate-500">
                      💡 Tip: Type any destination and press Enter to add it
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="startDate" className="text-slate-800">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      {...register("startDate")}
                        className="bg-white border-gray-300 text-slate-900"
                    />
                    {errors.startDate && (
                        <p className="text-red-500 text-sm">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                      <Label htmlFor="endDate" className="text-slate-800">End Date *</Label>
                    <Input
                      id="endDate"
                      type="date"
                      {...register("endDate")}
                        className="bg-white border-gray-300 text-slate-900"
                    />
                    {errors.endDate && (
                        <p className="text-red-500 text-sm">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                {/* Cover Image Upload */}
                <div className="space-y-2">
                    <Label className="text-slate-800">Cover Image</Label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
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
                              className="border-gray-300 text-slate-700 hover:bg-gray-50"
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

                  {/* Privacy Settings */}
                  <div className="space-y-2">
                    <Label className="text-slate-800">Privacy Settings</Label>
                    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg ring-1 ring-gray-200">
                      <Switch
                        id="isPublic"
                        onCheckedChange={(checked) => setValue("isPublic", checked)}
                      />
                      <Label htmlFor="isPublic" className="text-slate-700">
                        Make trip public (others can view your itinerary)
                      </Label>
                    </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      generateItineraryDays()
                      setCurrentTab("itinerary")
                      toast({
                        title: "🎉 Great start!",
                        description: "Your trip foundation is set! Let's build that itinerary!",
                      })
                    }}
                      className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg"
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
                    <Target className="w-8 h-8 text-emerald-500 animate-pulse" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                </div>
                <div>
                    <h3 className="text-2xl font-bold text-slate-900">Day-by-Day Itinerary</h3>
                    <p className="text-slate-600">
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
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold px-4 py-2 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Day
                <Zap className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {itineraryDays.map((day, index) => (
                <Card key={day.id} className="bg-white border-gray-200 shadow-md">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-slate-900 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                        {day.title}
                      </CardTitle>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                          {ACTIVITY_TYPES.find(type => type.value === day.activityType)?.icon} {day.activityType}
                        </Badge>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItineraryDay(day.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-slate-800">Date</Label>
                        <Input
                          type="date"
                          value={day.date}
                          onChange={(e) => updateItineraryDay(day.id, { date: e.target.value })}
                          className="bg-white border-gray-300 text-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-slate-800">Activity Type</Label>
                        <Select
                          value={day.activityType}
                          onValueChange={(value: any) => updateItineraryDay(day.id, { activityType: value })}
                        >
                          <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-gray-200">
                            {ACTIVITY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-slate-800">Location</Label>
                      <Input
                        value={day.location.name}
                        onChange={(e) => updateItineraryDay(day.id, { 
                          location: { ...day.location, name: e.target.value }
                        })}
                        placeholder="Where will you be?"
                        className="bg-white border-gray-300 text-slate-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-800">Description</Label>
                      <Textarea
                        value={day.description}
                        onChange={(e) => updateItineraryDay(day.id, { description: e.target.value })}
                        placeholder="What will you do on this day?"
                        rows={3}
                        className="bg-white border-gray-300 text-slate-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-800">Estimated Budget</Label>
                      <Input
                        type="number"
                        value={day.budget.estimated}
                        onChange={(e) => updateItineraryDay(day.id, { 
                          budget: { ...day.budget, estimated: parseFloat(e.target.value) || 0 }
                        })}
                        placeholder="0"
                        className="bg-white border-gray-300 text-slate-900"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-slate-800">Notes</Label>
                      <Textarea
                        value={day.notes || ""}
                        onChange={(e) => updateItineraryDay(day.id, { notes: e.target.value })}
                        placeholder="Any additional notes..."
                        rows={2}
                        className="bg-white border-gray-300 text-slate-900"
                      />
                    </div>
                  </CardContent>
                </Card>
            ))}

            {itineraryDays.length === 0 && (
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="relative">
                    <MapPin className="mx-auto h-16 w-16 text-gray-400 mb-4 animate-bounce" />
                    <div className="absolute -top-2 -right-2">
                        <Star className="w-6 h-6 text-emerald-500 animate-spin" />
                    </div>
                  </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Ready to Plan Your Adventure! 🗺️</h3>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">
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
                        className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold px-6 py-3 rounded-lg transform transition-all duration-200 hover:scale-105 shadow-lg"
                      disabled={!watchedStartDate || !watchedEndDate}
                    >
                      <Rocket className="w-5 h-5 mr-2" />
                      Generate My Days!
                      <Sparkles className="w-5 h-5 ml-2" />
                    </Button>
                      <p className="text-slate-500 text-sm">
                      Or go back to set your travel dates first
                    </p>
                    <Button
                      type="button"
                      onClick={() => setCurrentTab("basic")}
                      variant="outline"
                      size="sm"
                        className="border-gray-300 text-slate-700 hover:bg-gray-50"
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
                  className="border-gray-300 text-slate-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Basic Details
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentTab("budget")}
                  className="bg-emerald-600 hover:bg-emerald-700"
                disabled={itineraryDays.length === 0}
              >
                Continue to Budget
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </div>
          </TabsContent>

          {/* Budget Overview */}
          <TabsContent value="budget" className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="relative">
                  <DollarSign className="w-8 h-8 text-emerald-500 animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">Budget Overview</h3>
                  <p className="text-slate-600">
                    Plan and track your trip expenses! 💰
                  </p>
                </div>
              </div>
            {/* AI Suggestions Drawer */}
            <Card className="bg-white border-gray-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-slate-900">AI Suggestions</CardTitle>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="border-gray-300 text-slate-700 hover:bg-gray-50" onClick={fetchAISuggestions} disabled={isLoadingAI}>
                    {isLoadingAI ? 'Loading…' : 'Get Suggestions'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-slate-900 font-medium mb-2">Untimed suggestions</h4>
                    {aiSuggestions.length === 0 ? (
                      <p className="text-slate-600 text-sm">Click Get Suggestions.</p>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {aiSuggestions.map((s, i) => (
                          <SuggestionCard key={`sugg-${i}`} suggestion={s} index={i} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="text-slate-900 font-medium mb-2">Timed day plan</h4>
                    {aiSchedule.length === 0 ? (
                      <p className="text-slate-600 text-sm">Will appear if the model returns schedule.</p>
                    ) : (
                      <div className="space-y-2">
                        {aiSchedule.map((s, i) => (
                          <div key={`sched-${i}`} className="p-3 bg-gray-50 rounded border border-gray-200 flex items-center justify-between">
                            <div>
                              <p className="text-slate-900 text-sm">Day {s.dayNumber} • {s.startTime?.slice(0,5) || '09:00'} • {s.name}</p>
                              <p className="text-xs text-slate-600">{s.category || 'general'} {s.price_range ? `• ${s.price_range}` : ''}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button type="button" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => {
                                const day = itineraryDays.find(d => d.dayNumber === s.dayNumber) || itineraryDays[0]
                                if (!day) return
                                const slots = computeAvailableSlots(day, s.duration_hours || 2)
                                // preselect the suggested time if available, otherwise show slots
                                setTimeDialog({ open: true, dayId: day.id, suggestion: { ...s }, slots })
                              }}>Add</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {itineraryDays.map((day, index) => (
              <ItineraryDayBuilder
                key={day.id}
                day={day}
                onUpdate={(updates: Partial<ItineraryDay>) => updateItineraryDay(day.id, updates)}
                onRemove={() => removeItineraryDay(day.id)}
                activityTypes={ACTIVITY_TYPES}
                destinations={selectedDestinations}
              />
            ))}

                          {itineraryDays.length === 0 && (
                <Card className="bg-white border-gray-200 border-2 border-dashed">
                <CardContent className="py-12 text-center">
                  <div className="relative">
                    <MapPin className="mx-auto h-16 w-16 text-slate-400 mb-4 animate-bounce" />
                    <div className="absolute -top-2 -right-2">
                      <Star className="w-6 h-6 text-yellow-400 animate-spin" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-900">Budget Breakdown by Day</h4>
                    <div className="space-y-2">
                      {itineraryDays.map((day) => (
                        <div key={day.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-semibold text-emerald-700">{day.dayNumber}</span>
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{day.title}</p>
                              <p className="text-sm text-slate-600">{day.location.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-slate-900">${day.budget.estimated}</p>
                            <p className="text-xs text-slate-500">{day.activityType}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-slate-900">Budget Categories</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {ACTIVITY_TYPES.map((type) => {
                        const categoryTotal = itineraryDays
                          .filter(day => day.activityType === type.value)
                          .reduce((sum, day) => sum + day.budget.estimated, 0)
                        
                        return (
                          <div key={type.value} className="p-3 bg-gray-50 rounded-lg text-center">
                            <div className="text-2xl mb-1">{type.icon}</div>
                            <p className="text-sm font-medium text-slate-900">{type.label}</p>
                            <p className="text-lg font-bold text-emerald-600">${categoryTotal}</p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

            )}
            <div className="flex justify-between">
              <Button
                type="button"
                onClick={() => setCurrentTab("itinerary")}
                variant="outline"
                  className="border-gray-300 text-slate-700 hover:bg-gray-50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Itinerary
              </Button>
              <Button
                type="button"
                onClick={() => setCurrentTab("review")}
                  className="bg-emerald-600 hover:bg-emerald-700"
              >
                Review Trip
                <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
              </Button>
            </div>
          </TabsContent>

          {/* Review & Submit */}
          <TabsContent value="review" className="space-y-6">
              <Card className="bg-white border-gray-200 shadow-md">
              <CardHeader>
                  <CardTitle className="text-slate-900">Review Your Trip</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-600">Trip Name</Label>
                    <p className="text-slate-900 font-medium">{watchedName || "Untitled Trip"}</p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Duration</Label>
                    <p className="text-slate-900 font-medium">
                      {itineraryDays.length} {itineraryDays.length === 1 ? "day" : "days"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Destinations</Label>
                    <p className="text-slate-900 font-medium">
                      {selectedDestinations.join(", ") || "No destinations"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-slate-600">Total Budget</Label>
                    <p className="text-slate-900 font-medium">
                      ${totalEstimatedBudget.toLocaleString()} {watch("currency")}
                    </p>
                  </div>
                </div>

                <Separator className="bg-gray-200" />

                <div>
                  <Label className="text-slate-600">Description</Label>
                  <p className="text-slate-900 font-medium">{watch("description") || "No description"}</p>
                </div>

                <div>
                  <Label className="text-slate-600">Itinerary Summary</Label>
                  <div className="mt-2 space-y-2">
                    {itineraryDays.map((day) => (
                      <div key={day.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-slate-900">{day.title}</span>
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
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
          onSelectDestination={(destination: string) => {
            if (!selectedDestinations.includes(destination)) {
              const updated = [...selectedDestinations, destination]
              setSelectedDestinations(updated)
              setValue("destinations", updated)
            }
            setShowActivitySearch(false)
          }}
          onSelectActivity={(activity: any) => {
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
      {/* Time selection dialog for dropped/added suggestion */}
      <Dialog open={timeDialog.open} onOpenChange={(open) => setTimeDialog(prev => ({ ...prev, open }))}>
        <DialogContent className="bg-white border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Select a start time</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-gray-300 text-sm">{timeDialog.suggestion?.name}</p>
            <div className="flex flex-wrap gap-2">
              {(timeDialog.slots || []).slice(0, 20).map((t) => (
                <Button key={t} type="button" size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => {
                  const s = timeDialog.suggestion || {}
                  addActivityToDay(timeDialog.dayId, s, t)
                  setTimeDialog({ open: false, dayId: "", suggestion: null, slots: [] })
                }}>{t.slice(0,5)}</Button>
              ))}
            </div>
            {timeDialog.slots.length === 0 && (
              <p className="text-gray-400 text-sm">No free slots available. Adjust existing items or day times.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
