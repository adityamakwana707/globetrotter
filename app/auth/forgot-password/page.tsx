"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        toast({
          title: "Reset link sent!",
          description: "Check your email for password reset instructions.",
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to send reset email",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-white border-gray-200 rounded-2xl shadow-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full grid place-items-center bg-green-100 mb-4">
              <Mail className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-slate-900">Check Your Email</CardTitle>
            <CardDescription className="text-slate-600">
              We've sent a password reset link to <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-slate-600">
              <p>Don't see the email? Check your spam folder or</p>
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail("")
                }}
                className="text-emerald-600 hover:text-emerald-700 underline"
              >
                try a different email address
              </button>
            </div>
            <div className="pt-4">
              <Link href="/auth/login" className="w-full">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md bg-white border-gray-200 rounded-2xl shadow-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full grid place-items-center bg-[#1E40AF] mb-4">
            <span className="text-2xl font-bold text-white">GT</span>
          </div>
          <CardTitle className="text-2xl text-slate-900">Forgot Password?</CardTitle>
          <CardDescription className="text-slate-600">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-800">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white border-gray-300 text-slate-900 placeholder-slate-400"
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <Link href="/auth/login" className="text-emerald-600 hover:text-emerald-700 inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
