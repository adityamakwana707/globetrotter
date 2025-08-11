"use client"

import { useState, useRef } from "react"
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
import { toast } from "@/hooks/use-toast"
import { useTripStore } from "@/lib/store"
import { Upload, Calendar, MapPin, Save, ArrowLeft } from "lucide-react"
import Image from "next/image"

const tripSchema = z.object({
  name: z.string().min(1, "Trip name is required").max(255, "Trip name too long"),
  description: z.string().max(1000, "Description too long"),
  startDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid start date"),
  endDate: z.string().refine((date) => !isNaN(Date.parse(date)), "Invalid end date"),
  status: z.enum(["planning", "active", "completed"]),
  isPublic: z.boolean()
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return start <= end
}, {
  message: "End date must be after start date",
  path: ["endDate"]
})

type TripFormData = z.infer<typeof tripSchema>

interface Trip {
  id: string
  name: string
  description: string
  start_date: string
  end_date: string
  status: "planning" | "active" | "completed"
  cover_image?: string
  is_public: boolean
}

interface TripFormProps {
  trip?: Trip
}

export default function TripForm({ trip }: TripFormProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [coverImage, setCoverImage] = useState<string>(trip?.cover_image || "")
  const { addTrip, updateTrip } = useTripStore()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TripFormData>({
    resolver: zodResolver(tripSchema),
    defaultValues: {
      name: trip?.name || "",
      description: trip?.description || "",
      startDate: trip?.start_date ? new Date(trip.start_date).toISOString().split('T')[0] : "",
      endDate: trip?.end_date ? new Date(trip.end_date).toISOString().split('T')[0] : "",
      status: trip?.status || "planning",
      isPublic: trip?.is_public || false
    }
  })

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
        title: "Image uploaded",
        description: "Cover image uploaded successfully.",
      })
    } catch (error) {
      console.error('Upload error:', error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const onSubmit = async (data: TripFormData) => {
    setIsSubmitting(true)
    try {
      // Clean up the data before sending
      const tripData = {
        ...data,
        ...(coverImage && coverImage.trim() !== "" && { coverImage })
      }

      let response
      if (trip) {
        // Update existing trip
        response = await fetch(`/api/trips/${trip.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tripData)
        })
      } else {
        // Create new trip
        response = await fetch('/api/trips', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tripData)
        })
      }

      if (!response.ok) {
        const error = await response.json()
        console.error('API Error:', error)
        
        // Show validation errors if available
        if (error.errors && Array.isArray(error.errors)) {
          const errorMessages = error.errors.map((err: any) => `${err.path?.join('.')}: ${err.message}`).join(', ')
          throw new Error(errorMessages)
        }
        
        throw new Error(error.message || 'Operation failed')
      }

      const result = await response.json()

      // Update Zustand store
      if (trip) {
        updateTrip(trip.id, result)
      } else {
        addTrip(result)
      }

      toast({
        title: trip ? "Trip updated" : "Trip created",
        description: trip ? "Your trip has been updated successfully." : "Your new trip has been created successfully.",
      })

      router.push('/dashboard')
    } catch (error) {
      console.error('Submit error:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Something went wrong.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {trip ? "Edit Trip" : "Create New Trip"}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Cover Image Upload */}
          <div className="space-y-2">
            <Label className="text-white">Cover Image</Label>
            <div className="flex flex-col gap-4">
              {coverImage && (
                <div className="relative w-full h-48 bg-gray-700 rounded-lg overflow-hidden">
                  <Image
                    src={coverImage}
                    alt="Trip cover"
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? "Uploading..." : "Upload Image"}
                </Button>
                {coverImage && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCoverImage("")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Remove
                  </Button>
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
          </div>

          {/* Trip Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-white">Trip Name</Label>
            <Input
              id="name"
              {...register("name")}
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Enter trip name"
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
              className="bg-gray-700 border-gray-600 text-white"
              placeholder="Describe your trip..."
              rows={3}
            />
            {errors.description && (
              <p className="text-red-400 text-sm">{errors.description.message}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Start Date
              </Label>
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
              <Label htmlFor="endDate" className="text-white flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                End Date
              </Label>
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

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-white">Status</Label>
            <Select
              value={watch("status")}
              onValueChange={(value: "planning" | "active" | "completed") => setValue("status", value)}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                <SelectItem value="planning" className="text-white hover:bg-gray-600">Planning</SelectItem>
                <SelectItem value="active" className="text-white hover:bg-gray-600">Active</SelectItem>
                <SelectItem value="completed" className="text-white hover:bg-gray-600">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Public/Private */}
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="space-y-1">
              <Label className="text-white">Make trip public</Label>
              <p className="text-sm text-gray-400">Allow others to view and copy your trip</p>
            </div>
            <Switch
              checked={watch("isPublic")}
              onCheckedChange={(checked) => setValue("isPublic", checked)}
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700 flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? "Saving..." : (trip ? "Update Trip" : "Create Trip")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
