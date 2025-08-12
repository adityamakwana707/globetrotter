"use client"

import React, { Suspense } from "react"
import dynamic from "next/dynamic"

// Dynamically import the dashboard content to avoid SSR issues
const DashboardContent = dynamic(
  () => import("./dashboard-content"),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }
)

interface DashboardClientWrapperProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
  session: any
}

export default function DashboardClientWrapper(props: DashboardClientWrapperProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent {...props} />
    </Suspense>
  )
}
