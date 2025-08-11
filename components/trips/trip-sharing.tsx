"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Share2,
  Copy,
  Globe,
  Lock,
  ExternalLink,
  Users,
  Calendar,
  Link as LinkIcon,
  Facebook,
  Twitter,
  Mail
} from "lucide-react"

interface TripSharingProps {
  tripId: string
  tripName: string
}

interface ShareSettings {
  id: string
  name: string
  isPublic: boolean
  shareToken: string | null
  allowCopy: boolean
  shareExpiresAt: string | null
  shareUrl: string | null
  ownerName: string
}

export default function TripSharing({ tripId, tripName }: TripSharingProps) {
  const [shareSettings, setShareSettings] = useState<ShareSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)

  useEffect(() => {
    fetchShareSettings()
  }, [tripId])

  const fetchShareSettings = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/share`)
      if (response.ok) {
        const data = await response.json()
        setShareSettings(data)
      } else {
        console.error('Failed to fetch share settings')
      }
    } catch (error) {
      console.error('Error fetching share settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateShareSettings = async (updates: Partial<ShareSettings>) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        const data = await response.json()
        setShareSettings(prev => prev ? { ...prev, ...data } : null)
        
        toast({
          title: "Settings Updated",
          description: "Trip sharing settings have been updated successfully.",
        })
      } else {
        const error = await response.json()
        throw new Error(error.message || 'Failed to update settings')
      }
    } catch (error) {
      console.error('Error updating share settings:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update sharing settings. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copied!",
        description: "Share link has been copied to clipboard.",
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy link to clipboard.",
        variant: "destructive",
      })
    }
  }

  const shareToSocial = (platform: string, url: string, title: string) => {
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(`Check out my trip: ${title}`)
    
    let shareUrl = ''
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        break
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`
        break
      case 'email':
        shareUrl = `mailto:?subject=${encodedTitle}&body=Check out this travel itinerary: ${encodedUrl}`
        break
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400')
    }
  }

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-400">Loading sharing settings...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!shareSettings) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <p className="text-gray-400 text-center">Failed to load sharing settings</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sharing Controls */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Trip Sharing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Public/Private Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              {shareSettings.isPublic ? (
                <Globe className="w-5 h-5 text-green-400" />
              ) : (
                <Lock className="w-5 h-5 text-gray-400" />
              )}
              <div>
                <h3 className="text-white font-semibold">
                  {shareSettings.isPublic ? 'Public Trip' : 'Private Trip'}
                </h3>
                <p className="text-gray-400 text-sm">
                  {shareSettings.isPublic 
                    ? 'Anyone with the link can view this trip'
                    : 'Only you can view this trip'
                  }
                </p>
              </div>
            </div>
            <Switch
              checked={shareSettings.isPublic}
              onCheckedChange={(checked) => updateShareSettings({ isPublic: checked })}
              disabled={isUpdating}
            />
          </div>

          {/* Copy Permission */}
          {shareSettings.isPublic && (
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <Copy className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-white font-semibold">Allow Copying</h3>
                  <p className="text-gray-400 text-sm">
                    Let others copy this trip to their account
                  </p>
                </div>
              </div>
              <Switch
                checked={shareSettings.allowCopy}
                onCheckedChange={(checked) => updateShareSettings({ allowCopy: checked })}
                disabled={isUpdating}
              />
            </div>
          )}

          {/* Share Link */}
          {shareSettings.isPublic && shareSettings.shareUrl && (
            <div className="space-y-3">
              <Label className="text-white">Share Link</Label>
              <div className="flex space-x-2">
                <Input
                  value={shareSettings.shareUrl}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  onClick={() => copyToClipboard(shareSettings.shareUrl!)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => window.open(shareSettings.shareUrl!, '_blank')}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Share Actions */}
          {shareSettings.isPublic && shareSettings.shareUrl && (
            <div className="flex flex-wrap gap-2">
              <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Trip
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Share Your Trip</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Share "{tripName}" with your friends and family
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-3">
                      <Button
                        onClick={() => shareToSocial('facebook', shareSettings.shareUrl!, tripName)}
                        className="bg-blue-600 hover:bg-blue-700 justify-start"
                      >
                        <Facebook className="w-4 h-4 mr-2" />
                        Share on Facebook
                      </Button>
                      <Button
                        onClick={() => shareToSocial('twitter', shareSettings.shareUrl!, tripName)}
                        className="bg-sky-600 hover:bg-sky-700 justify-start"
                      >
                        <Twitter className="w-4 h-4 mr-2" />
                        Share on Twitter
                      </Button>
                      <Button
                        onClick={() => shareToSocial('email', shareSettings.shareUrl!, tripName)}
                        className="bg-gray-600 hover:bg-gray-700 justify-start"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        Share via Email
                      </Button>
                    </div>
                    
                    <div className="pt-4 border-t border-gray-700">
                      <Label className="text-white text-sm">Or copy link:</Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          value={shareSettings.shareUrl}
                          readOnly
                          className="bg-gray-700 border-gray-600 text-white text-sm"
                        />
                        <Button
                          onClick={() => copyToClipboard(shareSettings.shareUrl!)}
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={() => setShowShareDialog(false)}
                      variant="outline" 
                      className="border-gray-600 text-gray-300"
                    >
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sharing Statistics */}
      {shareSettings.isPublic && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sharing Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <LinkIcon className="w-8 h-8 mx-auto mb-2 text-blue-400" />
                <p className="text-2xl font-bold text-white">-</p>
                <p className="text-gray-400 text-sm">Link Clicks</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <Copy className="w-8 h-8 mx-auto mb-2 text-green-400" />
                <p className="text-2xl font-bold text-white">-</p>
                <p className="text-gray-400 text-sm">Times Copied</p>
              </div>
              <div className="text-center p-4 bg-gray-700 rounded-lg">
                <Calendar className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                <p className="text-2xl font-bold text-white">-</p>
                <p className="text-gray-400 text-sm">Days Shared</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm text-center mt-4">
              Analytics coming soon - track how your shared trips are performing!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Privacy Notice */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Lock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-400">
              <p className="font-semibold text-gray-300 mb-1">Privacy Notice</p>
              <p>
                When you make your trip public, anyone with the link can view your itinerary, 
                including cities, activities, and budget information. Personal information 
                like your email address is never shared.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
