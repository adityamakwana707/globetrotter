"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Loader2, User, Mail, Phone, MapPin, Globe } from "lucide-react"

interface UserProfile {
  id: string
  name: string
  email: string
  first_name: string
  last_name: string
  phone_number?: string
  city?: string
  country?: string
  role: string
  email_verified: boolean
}

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserProfile
  onProfileUpdate: (updatedUser: UserProfile) => void
}

export default function EditProfileModal({ isOpen, onClose, user, onProfileUpdate }: EditProfileModalProps) {
  const [formData, setFormData] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    phone_number: user.phone_number || "",
    city: user.city || "",
    country: user.country || "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone_number: user.phone_number || "",
        city: user.city || "",
        country: user.country || "",
      })
      setErrors({})
    }
  }, [isOpen, user])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required"
    } else if (formData.first_name.length > 50) {
      newErrors.first_name = "First name must be less than 50 characters"
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required"
    } else if (formData.last_name.length > 50) {
      newErrors.last_name = "Last name must be less than 50 characters"
    }

    if (formData.phone_number && formData.phone_number.length > 20) {
      newErrors.phone_number = "Phone number must be less than 20 characters"
    }

    if (formData.city && formData.city.length > 100) {
      newErrors.city = "City must be less than 100 characters"
    }

    if (formData.country && formData.country.length > 100) {
      newErrors.country = "Country must be less than 100 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update profile")
      }

      const result = await response.json()
      
      toast({
        title: "Success",
        description: "Profile updated successfully!",
      })

      // Update the parent component with new user data
      onProfileUpdate(result.user)
      onClose()
    } catch (error) {
      console.error("Profile update error:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Edit Profile
          </DialogTitle>
          <DialogDescription>
            Update your personal information and contact details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email (Read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500">
              Email address cannot be changed. Contact support if needed.
            </p>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                First Name *
              </Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => handleInputChange("first_name", e.target.value)}
                placeholder="Enter first name"
                className={errors.first_name ? "border-red-500" : ""}
              />
              {errors.first_name && (
                <p className="text-xs text-red-500">{errors.first_name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="last_name" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Last Name *
              </Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => handleInputChange("last_name", e.target.value)}
                placeholder="Enter last name"
                className={errors.last_name ? "border-red-500" : ""}
              />
              {errors.last_name && (
                <p className="text-xs text-red-500">{errors.last_name}</p>
              )}
            </div>
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone_number" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Phone Number
            </Label>
            <Input
              id="phone_number"
              type="tel"
              value={formData.phone_number}
              onChange={(e) => handleInputChange("phone_number", e.target.value)}
              placeholder="Enter phone number"
              className={errors.phone_number ? "border-red-500" : ""}
            />
            {errors.phone_number && (
              <p className="text-xs text-red-500">{errors.phone_number}</p>
            )}
          </div>

          {/* Location Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                City
              </Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Enter city"
                className={errors.city ? "border-red-500" : ""}
              />
              {errors.city && (
                <p className="text-xs text-red-500">{errors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Country
              </Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="Enter country"
                className={errors.country ? "border-red-500" : ""}
              />
              {errors.country && (
                <p className="text-xs text-red-500">{errors.country}</p>
              )}
            </div>
          </div>

          {/* Account Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Account Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Role:</span>
                <span className="ml-2 font-medium capitalize">{user.role}</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className={`ml-2 font-medium ${user.email_verified ? 'text-green-600' : 'text-red-600'}`}>
                  {user.email_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
