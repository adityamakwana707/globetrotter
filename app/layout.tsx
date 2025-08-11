import type React from "react"
import type { Metadata } from "next"
import { Poppins } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/components/providers/auth-provider"
import { Toaster } from "@/components/ui/toaster"
import Navbar from "@/components/navbar"

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] })

export const metadata: Metadata = {
  title: "GlobeTrotter - Your Ultimate Travel Planning Companion",
  description:
    "Create, manage, and share personalized travel itineraries with intelligent features and collaborative capabilities.",
  keywords: "travel, planning, itinerary, vacation, trip, destinations",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.className} min-h-screen bg-gray-50 text-slate-900`}>
        <AuthProvider>
          <Navbar />
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
