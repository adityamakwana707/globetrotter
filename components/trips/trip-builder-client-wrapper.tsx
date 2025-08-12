"use client"

import React, { Suspense } from "react"
import dynamic from "next/dynamic"

// Dynamically import the comprehensive trip builder to avoid SSR issues
const ComprehensiveTripBuilder = dynamic(
  () => import("./comprehensive-trip-builder"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 py-8 sm:py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading trip builder...</p>
        </div>
      </div>
    )
  }
)

interface TripBuilderClientWrapperProps {
  existingTrip?: any
  existingCities?: any[]
  existingActivities?: any[]
  existingBudgets?: any[]
  existingDestinations?: string[]
  existingItinerary?: any[]
}

export default function TripBuilderClientWrapper(props: TripBuilderClientWrapperProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8 sm:py-10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading trip builder...</p>
        </div>
      </div>
    }>
      <ComprehensiveTripBuilder {...props} />
    </Suspense>
  )
}
