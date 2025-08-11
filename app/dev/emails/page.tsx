"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { RefreshCw, Mail, Clock, User, Eye } from "lucide-react"

interface StoredEmail {
  id: string
  from: string
  to: string
  subject: string
  html: string
  timestamp: string
}

export default function EmailPreviewPage() {
  const [emails, setEmails] = useState<StoredEmail[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedEmail, setSelectedEmail] = useState<StoredEmail | null>(null)

  const fetchEmails = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/dev/emails')
      if (response.ok) {
        const data = await response.json()
        setEmails(data)
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEmails()
    
    // Auto-refresh every 5 seconds
    const interval = setInterval(fetchEmails, 5000)
    return () => clearInterval(interval)
  }, [])

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const openEmailPreview = (email: StoredEmail) => {
    // Open email in new tab
    window.open(`/api/dev/emails?id=${email.id}`, '_blank')
  }

  if (process.env.NODE_ENV !== 'development') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Not Available</h2>
            <p className="text-slate-600">Email preview is only available in development mode.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Mail className="w-8 h-8" />
              Email Preview
            </h1>
            <p className="text-slate-600 mt-1">Development email preview for GlobeTrotter</p>
          </div>
          <Button onClick={fetchEmails} disabled={isLoading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading && emails.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-slate-400" />
              <p className="text-slate-600">Loading emails...</p>
            </CardContent>
          </Card>
        ) : emails.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Mail className="w-12 h-12 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-semibold mb-2">No emails yet</h3>
              <p className="text-slate-600 mb-4">
                Trigger a password reset to see emails appear here.
              </p>
              <a 
                href="/auth/forgot-password" 
                className="text-emerald-600 hover:text-emerald-700 underline"
              >
                Go to Forgot Password
              </a>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {emails.map((email) => (
              <Card key={email.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{email.subject}</CardTitle>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          From: {email.from}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          To: {email.to}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(email.timestamp)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Password reset email sent to user
                    </p>
                    <Button 
                      onClick={() => openEmailPreview(email)}
                      size="sm"
                      className="flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      Preview Email
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">
            📧 This page shows emails sent during development. In production, emails will be sent via your configured email service.
          </p>
        </div>
      </div>
    </div>
  )
}
