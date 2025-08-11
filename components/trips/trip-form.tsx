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
  status: z.enum(["planning", "active", "completed"]).optional(),
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
  id: number
  display_id: number
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
      // Clean up the data before sending (status will be auto-calculated)
      const tripData = {
        name: data.name,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        isPublic: data.isPublic,
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
        updateTrip(trip.id.toString(), result)
      } else {
        addTrip(result)
      }

      toast({
        title: trip ? "Trip updated" : "Trip created",
        description: trip ? "Your trip has been updated successfully." : "Your new trip has been created successfully.",
      })

      router.push('/landing')
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
    <div className="min-h-screen bg-gray-50 py-8 sm:py-10">
      <div className="container mx-auto px-4">
        {/* Page header */}
     
        <Card className="bg-white border-gray-200 rounded-2xl shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900 flex items-center gap-2 text-xl sm:text-2xl">
                <MapPin className="w-5 h-5 text-emerald-600" />
                {trip ? "Edit Trip" : "Create New Trip"}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.back()}
                className="border-gray-300 text-slate-700 hover:bg-slate-50"
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
                <Label className="text-slate-800">Cover Image</Label>
                <div className="flex flex-col gap-4">
                  {coverImage && (
                    <div className="relative w-full h-48 bg-gray-100 rounded-xl overflow-hidden ring-1 ring-gray-200">
                      <Image
                        src={coverImage}
                        alt="Trip cover"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="border-gray-300 text-slate-700 hover:bg-slate-50"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? "Uploading..." : "Upload Image"}
                    </Button>
                    {coverImage && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCoverImage("")}
                        className="border-gray-300 text-slate-700 hover:bg-slate-50"
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

              {/* Plan a new trip section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Plan a new trip</h3>
                {/* Trip Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-800">Trip Name</Label>
                  <Input
                    id="name"
                    {...register("name")}
                    className="bg-white border-gray-300 text-slate-900"
                    placeholder="Enter trip name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm">{errors.name.message}</p>
                  )}
                </div>

                {/* Select a Place (UI-only) */}
                <div className="space-y-2">
                  <Label className="text-slate-800">Select a Place</Label>
                  <Input
                    placeholder="Search or select a place (UI only)"
                    className="bg-white border-gray-300 text-slate-900"
                    readOnly
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-slate-800">Description</Label>
                  <Textarea
                    id="description"
                    {...register("description")}
                    className="bg-white border-gray-300 text-slate-900"
                    placeholder="Describe your trip..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-red-500 text-sm">{errors.description.message}</p>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate" className="text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Start Date
                    </Label>
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
                    <Label htmlFor="endDate" className="text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      End Date
                    </Label>
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

                {/* Status */}
                <div className="space-y-2">
                  <Label className="text-slate-800">Status</Label>
                  <Select
                    value={watch("status")}
                    onValueChange={(value: "planning" | "active" | "completed") => setValue("status", value)}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-slate-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Public/Private */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl ring-1 ring-gray-200">
                  <div className="space-y-1">
                    <Label className="text-slate-800">Make trip public</Label>
                    <p className="text-sm text-slate-500">Allow others to view and copy your trip</p>
                  </div>
                  <Switch
                    checked={watch("isPublic")}
                    onCheckedChange={(checked) => setValue("isPublic", checked)}
                  />
                </div>
              </div>

              {/* Suggestions grid (static UI) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Suggestions for Places to Visit / Activities to Perform</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {["/paris-eiffel-tower.png", "/bali-beach.png", "/vibrant-nyc-street.png", "/serene-asian-temples.png", "/oceania-beaches.png", "/european-landmarks.png"].map((img, idx) => (
                    <div key={idx} className="relative rounded-2xl overflow-hidden ring-1 ring-gray-200 shadow-sm h-48">
                      <Image src={img} alt="suggestion" fill className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-emerald-600 hover:bg-emerald-700 flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? "Saving..." : (trip ? "Update Trip" : "Create Trip")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
