"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  GripVertical, 
  MapPin, 
  Calendar, 
  Clock, 
  Star,
  Route,
  Save,
  RotateCcw
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface DragDropItineraryProps {
  tripId: string
}

interface ItineraryItem {
  id: string
  name: string
  type: 'city' | 'activity'
  description?: string
  scheduledDate?: string
  duration?: number
  rating?: number
  order: number
}

interface SortableItemProps {
  item: ItineraryItem
}

function SortableItem({ item }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const getTypeIcon = () => {
    switch (item.type) {
      case 'city':
        return <MapPin className="w-4 h-4 text-blue-400" />
      case 'activity':
        return <Calendar className="w-4 h-4 text-green-400" />
      default:
        return <Calendar className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeColor = () => {
    switch (item.type) {
      case 'city':
        return 'bg-blue-600'
      case 'activity':
        return 'bg-green-600'
      default:
        return 'bg-gray-600'
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center space-x-3 p-4 bg-gray-700 rounded-lg border-2 border-transparent hover:border-gray-600 transition-all ${
        isDragging ? 'shadow-lg ring-2 ring-blue-500' : ''
      }`}
    >
      <div
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-300"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div className="flex-shrink-0">
        <Badge className={`${getTypeColor()} text-white`}>
          {getTypeIcon()}
          <span className="ml-1 capitalize">{item.type}</span>
        </Badge>
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="text-white font-semibold truncate">{item.name}</h3>
        {item.description && (
          <p className="text-gray-400 text-sm truncate">{item.description}</p>
        )}
        <div className="flex items-center space-x-4 mt-1">
          {item.scheduledDate && (
            <span className="text-gray-400 text-xs flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {new Date(item.scheduledDate).toLocaleDateString()}
            </span>
          )}
          {item.duration && (
            <span className="text-gray-400 text-xs flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {item.duration}h
            </span>
          )}
        </div>
      </div>

      {item.rating && (
        <div className="flex items-center space-x-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="text-gray-300 text-sm">{item.rating}</span>
        </div>
      )}

      <div className="text-gray-400 text-sm font-mono">
        #{item.order}
      </div>
    </div>
  )
}

export default function DragDropItinerary({ tripId }: DragDropItineraryProps) {
  const [items, setItems] = useState<ItineraryItem[]>([])
  const [originalOrder, setOriginalOrder] = useState<ItineraryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  useEffect(() => {
    fetchItineraryItems()
  }, [tripId])

  const fetchItineraryItems = async () => {
    setIsLoading(true)
    try {
      // Fetch cities and activities for the trip
      const [citiesResponse, activitiesResponse] = await Promise.all([
        fetch(`/api/trips/${tripId}/cities`),
        fetch(`/api/trips/${tripId}/activities`)
      ])

      const cities = citiesResponse.ok ? await citiesResponse.json() : []
      const activities = activitiesResponse.ok ? await activitiesResponse.json() : []

      // Combine and create itinerary items
      const combinedItems: ItineraryItem[] = [
        ...cities.map((city: any, index: number) => ({
          id: `city-${city.id}`,
          name: city.name,
          type: 'city' as const,
          description: `${city.name}, ${city.country}`,
          scheduledDate: city.arrival_date,
          rating: city.rating,
          order: index + 1
        })),
        ...activities.map((activity: any, index: number) => ({
          id: `activity-${activity.id}`,
          name: activity.name,
          type: 'activity' as const,
          description: activity.description,
          scheduledDate: activity.scheduled_date,
          duration: activity.duration,
          rating: activity.rating,
          order: cities.length + index + 1
        }))
      ]

      // Sort by order
      combinedItems.sort((a, b) => a.order - b.order)
      
      setItems(combinedItems)
      setOriginalOrder([...combinedItems])
    } catch (error) {
      console.error('Error fetching itinerary items:', error)
      toast({
        title: "Error",
        description: "Failed to load itinerary items.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        const newItems = arrayMove(items, oldIndex, newIndex)
        
        // Update order numbers
        const updatedItems = newItems.map((item, index) => ({
          ...item,
          order: index + 1
        }))

        setHasChanges(true)
        return updatedItems
      })
    }
  }

  const saveOrder = async () => {
    setIsSaving(true)
    try {
      // Update order for cities and activities
      const cityUpdates = items
        .filter(item => item.type === 'city')
        .map(item => ({
          id: item.id.replace('city-', ''),
          order: item.order
        }))

      const activityUpdates = items
        .filter(item => item.type === 'activity')
        .map(item => ({
          id: item.id.replace('activity-', ''),
          order: item.order
        }))

      // Send updates to API (you would implement these endpoints)
      const updates = await Promise.all([
        fetch(`/api/trips/${tripId}/cities/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: cityUpdates })
        }),
        fetch(`/api/trips/${tripId}/activities/reorder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ updates: activityUpdates })
        })
      ])

      if (updates.every(response => response.ok)) {
        setOriginalOrder([...items])
        setHasChanges(false)
        toast({
          title: "Order Saved",
          description: "Itinerary order has been updated successfully.",
        })
      } else {
        throw new Error('Failed to save order')
      }
    } catch (error) {
      console.error('Error saving order:', error)
      toast({
        title: "Save Failed",
        description: "Failed to save itinerary order. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const resetOrder = () => {
    setItems([...originalOrder])
    setHasChanges(false)
    toast({
      title: "Order Reset",
      description: "Itinerary order has been reset to last saved state.",
    })
  }

  const calculateTotalDuration = () => {
    return items.reduce((total, item) => total + (item.duration || 0), 0)
  }

  const getItemsByType = (type: 'city' | 'activity') => {
    return items.filter(item => item.type === type)
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Loading itinerary...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Route className="w-5 h-5" />
              Drag & Drop Itinerary
            </CardTitle>
            <div className="flex items-center space-x-3">
              {hasChanges && (
                <Button
                  onClick={resetOrder}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  disabled={isSaving}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              )}
              <Button
                onClick={saveOrder}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!hasChanges || isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Order'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Items</p>
              <p className="text-2xl font-bold text-white">{items.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Cities</p>
              <p className="text-2xl font-bold text-blue-400">{getItemsByType('city').length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Activities</p>
              <p className="text-2xl font-bold text-green-400">{getItemsByType('activity').length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm">Total Duration</p>
              <p className="text-2xl font-bold text-purple-400">{calculateTotalDuration()}h</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Drag and Drop Area */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Reorder Your Itinerary</CardTitle>
          <p className="text-gray-400 text-sm">
            Drag and drop items to reorder your itinerary. Changes will be saved when you click "Save Order".
          </p>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="text-center py-12">
              <Route className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 mb-4">No itinerary items yet</p>
              <p className="text-sm text-gray-500">Add cities and activities to start planning your trip.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {items.map((item) => (
                    <SortableItem key={item.id} item={item} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <GripVertical className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-400">
              <p className="font-semibold text-gray-300 mb-1">How to Use</p>
              <ul className="space-y-1">
                <li>• Click and drag the grip icon to reorder items</li>
                <li>• Use keyboard navigation with Tab and arrow keys</li>
                <li>• Changes are highlighted and must be saved manually</li>
                <li>• Reset button restores the last saved order</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
