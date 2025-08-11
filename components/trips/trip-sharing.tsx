"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { 
  Share2, Copy, ExternalLink, Users, Globe, 
  Lock, QrCode, Mail, MessageCircle, Facebook,
  Twitter, Linkedin, Eye, EyeOff
} from "lucide-react"

interface TripSharingProps {
  tripId: number
  isPublic: boolean
}

export default function TripSharing({ tripId, isPublic }: TripSharingProps) {
  const [isPublicState, setIsPublicState] = useState(isPublic)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  const generateShareLink = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: true,
          allowCopy: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate share link')
      }

      const result = await response.json()
      setShareToken(result.shareToken)
      setIsPublicState(true)

      toast({
        title: "Share link generated",
        description: "Your trip is now publicly accessible.",
      })
    } catch (error) {
      console.error('Error generating share link:', error)
      toast({
        title: "Error",
        description: "Failed to generate share link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const updatePublicStatus = async (makePublic: boolean) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/trips/${tripId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: makePublic
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update trip visibility')
      }

      setIsPublicState(makePublic)

      toast({
        title: makePublic ? "Trip made public" : "Trip made private",
        description: makePublic 
          ? "Your trip is now visible to everyone." 
          : "Your trip is now private and only visible to you.",
      })
    } catch (error) {
      console.error('Error updating trip visibility:', error)
      toast({
        title: "Error",
        description: "Failed to update trip visibility. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard.`,
      })
    }).catch(() => {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      })
    })
  }

  const shareUrl = shareToken 
    ? `${window.location.origin}/trips/public/${shareToken}`
    : `${window.location.origin}/trips/${tripId}`

  const shareOnSocialMedia = (platform: string) => {
    const text = `Check out my amazing trip itinerary!`
    const url = encodeURIComponent(shareUrl)
    const encodedText = encodeURIComponent(text)

    let shareLink = ''
    switch (platform) {
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodedText}&url=${url}`
        break
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${url}`
        break
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`
        break
      case 'whatsapp':
        shareLink = `https://wa.me/?text=${encodedText}%20${url}`
        break
    }

    if (shareLink) {
      window.open(shareLink, '_blank', 'width=600,height=400')
    }
  }

  return (
    <div className="space-y-6">
      {/* Privacy Settings */}
      <Card className="bg-white border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-900 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Privacy Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-slate-800 font-medium">Make trip public</Label>
              <p className="text-slate-600 text-sm">
                Allow anyone with the link to view your trip itinerary
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="public-trip"
                checked={isPublicState}
                onCheckedChange={updatePublicStatus}
                disabled={isUpdating}
              />
              {isPublicState ? (
                <Eye className="w-4 h-4 text-green-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-gray-400" />
              )}
            </div>
          </div>

          {isPublicState && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Globe className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-medium">Public Trip</span>
              </div>
              <p className="text-slate-600 text-sm">
                Your trip is publicly visible. Anyone with the link can view your itinerary.
              </p>
            </div>
          )}

          {!isPublicState && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Lock className="w-4 h-4 text-gray-400" />
                <span className="text-slate-700 font-medium">Private Trip</span>
              </div>
              <p className="text-slate-600 text-sm">
                Your trip is private. Only you can view the itinerary.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share Link */}
      {isPublicState && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Share2 className="w-5 h-5 mr-2" />
              Share Your Trip
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Generate Share Link */}
            {!shareToken && (
              <div className="text-center py-6">
                <Share2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Generate Share Link</h3>
                <p className="text-gray-400 mb-4">
                  Create a unique link to share your trip with others
                </p>
                <Button
                  onClick={generateShareLink}
                  disabled={isGenerating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isGenerating ? "Generating..." : "Generate Share Link"}
                </Button>
              </div>
            )}

            {/* Share Link Display */}
            {shareToken && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-white">Share Link</Label>
                  <div className="flex space-x-2">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(shareUrl, "Share link")}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => window.open(shareUrl, '_blank')}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Social Media Sharing */}
                <div className="space-y-3">
                  <Label className="text-white">Share on Social Media</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => shareOnSocialMedia('twitter')}
                      className="border-gray-600 text-gray-300 hover:bg-blue-600 hover:border-blue-600"
                    >
                      <Twitter className="w-4 h-4 mr-2" />
                      Twitter
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareOnSocialMedia('facebook')}
                      className="border-gray-600 text-gray-300 hover:bg-blue-700 hover:border-blue-700"
                    >
                      <Facebook className="w-4 h-4 mr-2" />
                      Facebook
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareOnSocialMedia('linkedin')}
                      className="border-gray-600 text-gray-300 hover:bg-blue-800 hover:border-blue-800"
                    >
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => shareOnSocialMedia('whatsapp')}
                      className="border-gray-600 text-gray-300 hover:bg-green-600 hover:border-green-600"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      WhatsApp
                    </Button>
                  </div>
                </div>

                {/* Direct Sharing Options */}
                <div className="space-y-3">
                  <Label className="text-white">Direct Sharing</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const subject = "Check out my trip itinerary!"
                        const body = `Hi! I wanted to share my trip itinerary with you: ${shareUrl}`
                        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
                      }}
                      className="border-gray-300 text-slate-700 hover:bg-gray-50"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      Email
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        // In a real app, you'd implement QR code generation
                        toast({
                          title: "QR Code",
                          description: "QR code feature coming soon!",
                        })
                      }}
                      className="border-gray-300 text-slate-700 hover:bg-gray-50"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      QR Code
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sharing Stats */}
      {isPublicState && (
        <Card className="bg-white border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-slate-900 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Sharing Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-slate-600 text-sm">Views</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">0</div>
                <div className="text-slate-600 text-sm">Shares</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">0</div>
                <div className="text-slate-600 text-sm">Copies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">0</div>
                <div className="text-slate-600 text-sm">Likes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sharing Tips */}
      <Card className="bg-white border-gray-200 shadow-md">
        <CardHeader>
          <CardTitle className="text-slate-900">Sharing Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-blue-700 font-medium mb-1">Travel Inspiration</h4>
              <p className="text-slate-600 text-sm">
                Share your itinerary to inspire others and get travel tips
              </p>
            </div>
            
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <h4 className="text-emerald-700 font-medium mb-1">Travel Buddies</h4>
              <p className="text-slate-600 text-sm">
                Let friends follow your journey and join activities
              </p>
            </div>
            
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="text-purple-700 font-medium mb-1">Safety First</h4>
              <p className="text-slate-600 text-sm">
                Share with family so they know your travel plans
              </p>
            </div>
            
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <h4 className="text-orange-700 font-medium mb-1">Get Feedback</h4>
              <p className="text-slate-600 text-sm">
                Ask locals and experienced travelers for recommendations
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}