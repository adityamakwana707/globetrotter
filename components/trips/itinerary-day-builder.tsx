"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  GripVertical, Trash2, Plus, MapPin, Clock, DollarSign, 
  CloudSun, FileText, Paperclip, Edit, Copy, CheckCircle2,
  Upload, X, Calculator, Calendar
} from "lucide-react"
import WeatherForecastWidget from "./weather-forecast-widget"
import FileUploadZone from "./file-upload-zone"
import LocationSearch from "@/components/maps/location-search"

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
}

interface ActivityType {
  value: string
  label: string
  icon: string
  color: string
}

interface ItineraryDayBuilderProps {
  day: ItineraryDay
  onUpdate: (updates: Partial<ItineraryDay>) => void
  onRemove: () => void
  activityTypes: ActivityType[]
  destinations: string[]
}

interface BudgetItem {
  category: string
  amount: number
  description?: string
}

const BUDGET_CATEGORIES = [
  "Transportation",
  "Accommodation", 
  "Food & Dining",
  "Activities",
  "Shopping",
  "Tickets",
  "Other"
]

export default function ItineraryDayBuilder({
  day,
  onUpdate,
  onRemove,
  activityTypes,
  destinations
}: ItineraryDayBuilderProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showWeather, setShowWeather] = useState(false)
  const [showBudgetBreakdown, setShowBudgetBreakdown] = useState(false)
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>(day.budget.breakdown)
  const [newBudgetItem, setNewBudgetItem] = useState<BudgetItem>({
    category: "Transportation",
    amount: 0,
    description: ""
  })

  const selectedActivityType = activityTypes.find(type => type.value === day.activityType)

  // Update budget when items change
  useEffect(() => {
    const totalEstimated = budgetItems.reduce((sum, item) => sum + item.amount, 0)
    onUpdate({
      budget: {
        ...day.budget,
        estimated: totalEstimated,
        breakdown: budgetItems
      }
    })
  }, [budgetItems])

  const addBudgetItem = () => {
    if (newBudgetItem.amount > 0) {
      setBudgetItems([...budgetItems, { ...newBudgetItem }])
      setNewBudgetItem({
        category: "Transportation",
        amount: 0,
        description: ""
      })
    }
  }

  const removeBudgetItem = (index: number) => {
    setBudgetItems(budgetItems.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (files: File[]) => {
    // Handle file upload logic
    const newAttachments = files.map(file => ({
      name: file.name,
      url: URL.createObjectURL(file), // In real app, upload to server
      type: file.type
    }))

    onUpdate({
      attachments: [...(day.attachments || []), ...newAttachments]
    })
  }

  const removeAttachment = (index: number) => {
    const updatedAttachments = day.attachments?.filter((_, i) => i !== index) || []
    onUpdate({ attachments: updatedAttachments })
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
              <Badge 
                variant="secondary" 
                className={`${selectedActivityType?.color || 'bg-gray-600'} text-white`}
              >
                {selectedActivityType?.icon} Day {day.dayNumber}
              </Badge>
            </div>
            <div className="flex-1">
              <Input
                value={day.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                className="bg-transparent border-none text-lg font-semibold text-white p-0 h-auto focus-visible:ring-0"
                placeholder="Day title..."
              />
            </div>
            {day.completed && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-white"
            >
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onUpdate({ completed: !day.completed })}
              className="text-gray-400 hover:text-white"
            >
              {day.completed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-gray-400 hover:text-red-400"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Info - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-400">Date</Label>
            <Input
              type="date"
              value={day.date}
              onChange={(e) => onUpdate({ date: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-gray-400">Activity Type</Label>
            <Select 
              value={day.activityType} 
              onValueChange={(value) => onUpdate({ activityType: value as any })}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {activityTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <span className="flex items-center">
                      <span className="mr-2">{type.icon}</span>
                      {type.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400">Budget</Label>
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-gray-400" />
              <span className="text-white font-medium">
                ${day.budget.estimated.toLocaleString()}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowBudgetBreakdown(!showBudgetBreakdown)}
                className="text-gray-400 hover:text-white"
              >
                <Calculator className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="space-y-6 pt-4 border-t border-gray-700">
            {/* Description */}
            <div className="space-y-2">
              <Label className="text-gray-400">Description</Label>
              <Textarea
                value={day.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="Describe the activities, places to visit, or details for this day..."
                rows={3}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* Time and Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-400">Start Time</Label>
                <Input
                  type="time"
                  value={day.startTime || ""}
                  onChange={(e) => onUpdate({ startTime: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">End Time</Label>
                <Input
                  type="time"
                  value={day.endTime || ""}
                  onChange={(e) => onUpdate({ endTime: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-400">Location</Label>
                <LocationSearch
                  placeholder="Search for location or select from destinations..."
                  value={day.location.name}
                  onLocationSelect={(location) => {
                    onUpdate({
                      location: {
                        name: location.name,
                        coordinates: {
                          lat: location.lat,
                          lng: location.lng
                        },
                        address: `${location.city ? `${location.city}, ` : ''}${location.country}`
                      }
                    })
                  }}
                />
                
                {/* Quick Select from Destinations */}
                {destinations.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-gray-500 text-xs">Quick select from destinations:</Label>
                    <div className="flex flex-wrap gap-1">
                      {destinations.map((dest) => (
                        <Button
                          key={dest}
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdate({ 
                            location: { ...day.location, name: dest }
                          })}
                          className="text-xs border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          <MapPin className="w-3 h-3 mr-1" />
                          {dest}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Budget Breakdown */}
            {showBudgetBreakdown && (
              <div className="space-y-4 p-4 bg-gray-900 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium">Budget Breakdown</h4>
                  <Badge variant="secondary" className="bg-green-600 text-white">
                    Total: ${day.budget.estimated.toLocaleString()}
                  </Badge>
                </div>

                {/* Existing Budget Items */}
                <div className="space-y-2">
                  {budgetItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                      <div className="flex-1">
                        <span className="text-white font-medium">{item.category}</span>
                        {item.description && (
                          <p className="text-gray-400 text-sm">{item.description}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-white">${item.amount}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBudgetItem(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Budget Item */}
                <div className="grid grid-cols-3 gap-2">
                  <Select 
                    value={newBudgetItem.category}
                    onValueChange={(value) => setNewBudgetItem({...newBudgetItem, category: value})}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {BUDGET_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    placeholder="Amount"
                    value={newBudgetItem.amount || ""}
                    onChange={(e) => setNewBudgetItem({
                      ...newBudgetItem, 
                      amount: parseFloat(e.target.value) || 0
                    })}
                    className="bg-gray-700 border-gray-600 text-white"
                  />

                  <Button
                    type="button"
                    onClick={addBudgetItem}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                <Input
                  placeholder="Description (optional)"
                  value={newBudgetItem.description || ""}
                  onChange={(e) => setNewBudgetItem({
                    ...newBudgetItem, 
                    description: e.target.value
                  })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
            )}

            {/* Weather Widget */}
            {day.location.coordinates && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-gray-400">Weather Forecast</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowWeather(!showWeather)}
                    className="text-gray-400 hover:text-white"
                  >
                    <CloudSun className="w-4 h-4 mr-2" />
                    {showWeather ? "Hide" : "Show"} Weather
                  </Button>
                </div>
                
                {showWeather && (
                  <WeatherForecastWidget
                    latitude={day.location.coordinates.lat}
                    longitude={day.location.coordinates.lng}
                    date={day.date}
                    locationName={day.location.name}
                  />
                )}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-gray-400">Notes & Reminders</Label>
              <Textarea
                value={day.notes || ""}
                onChange={(e) => onUpdate({ notes: e.target.value })}
                placeholder="Add notes, reminders, or special instructions for this day..."
                rows={2}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            {/* File Attachments */}
            <div className="space-y-2">
              <Label className="text-gray-400">Attachments</Label>
              
              {/* Existing Attachments */}
              {day.attachments && day.attachments.length > 0 && (
                <div className="space-y-2">
                  {day.attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                      <div className="flex items-center space-x-2">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span className="text-white text-sm">{attachment.name}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* File Upload Zone */}
              <FileUploadZone
                onFilesSelected={handleFileUpload}
                acceptedTypes={["image/*", "application/pdf", ".doc,.docx"]}
                maxFiles={5}
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
