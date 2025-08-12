"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"
import { Mail, Copy, Check, Link } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface TripSharingProps {
  tripId: number
  isPublic: boolean
  tripName: string
}

export default function TripSharing({ tripId, isPublic, tripName }: TripSharingProps) {
  const [isPublicState, setIsPublicState] = useState(isPublic)
  const [shareToken, setShareToken] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showEmailDialog, setShowEmailDialog] = useState(false)
  const [emailData, setEmailData] = useState({
    to: "",
    subject: `Check out my trip: ${tripName}`,
    message: `Hey! I wanted to share my trip details with you.`
  })
  const [isSending, setIsSending] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleShareEmail = async () => {
    if (!emailData.to) {
      toast({
        title: "Missing email",
        description: "Please enter a recipient email address",
        variant: "destructive"
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tripId,
          ...emailData
        })
      })

      if (!response.ok) throw new Error("Failed to send email")

      toast({
        title: "Email sent!",
        description: "Trip details have been shared successfully"
      })
      setShowEmailDialog(false)
      setEmailData({
        to: "",
        subject: `Check out my trip: ${tripName}`,
        message: `Hey! I wanted to share my trip details with you.`
      })
    } catch (error) {
      console.error("Error sending email:", error)
      toast({
        title: "Failed to send email",
        description: "Please try again later",
        variant: "destructive"
      })
    } finally {
      setIsSending(false)
    }
  }

  const generateShareLink = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch(`/api/trips/${tripId}/share`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          isPublic: true,
          allowCopy: true
        })
      })

      if (!response.ok) throw new Error("Failed to generate share link")

      const data = await response.json()
      setShareToken(data.shareToken)
      setIsPublicState(true)

      toast({
        title: "Share link generated",
        description: "Your trip is now publicly accessible."
      })
    } catch (error) {
      console.error("Error generating share link:", error)
      toast({
        title: "Error",
        description: "Failed to generate share link. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true)
        toast({
          title: "Copied!",
          description: "Share link copied to clipboard"
        })
        setTimeout(() => setCopied(false), 2000)
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Please try again",
          variant: "destructive"
        })
      })
  }

  const shareUrl = shareToken 
    ? `${window.location.origin}/trips/shared/${shareToken}`
    : `${window.location.origin}/trips/${tripId}`

  return (
    <div className="space-y-6">
      {/* Share Link Generation */}
      <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Share Trip</h3>
        <div className="space-y-4">
          {!isPublicState ? (
            <Button
              onClick={generateShareLink}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? "Generating..." : "Generate Share Link"}
            </Button>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(shareUrl)}
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Email Sharing */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Share Trip via Email</DialogTitle>
            <DialogDescription>
              Share your trip details and itinerary with others
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Recipient Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="friend@example.com"
                value={emailData.to}
                onChange={(e) => setEmailData({ ...emailData, to: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Personal Message (Optional)</Label>
              <Textarea
                id="message"
                rows={4}
                value={emailData.message}
                onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEmailDialog(false)}
              disabled={isSending}
            >
              Cancel
            </Button>
            <Button onClick={handleShareEmail} disabled={isSending}>
              {isSending ? (
                <>
                  <Mail className="w-4 h-4 mr-2 animate-bounce" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setShowEmailDialog(true)}
        >
          <Mail className="w-4 h-4 mr-2" />
          Share via Email
        </Button>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => copyToClipboard(shareUrl)}
        >
          <Link className="w-4 h-4 mr-2" />
          Copy Link
        </Button>
      </div>
    </div>
  )
}