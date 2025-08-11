import { NextResponse } from "next/server"
import { testConnection } from "@/lib/database"

export async function GET() {
  try {
    const isConnected = await testConnection()
    
    if (isConnected) {
      return NextResponse.json({ 
        status: "success", 
        message: "Database connection successful" 
      })
    } else {
      return NextResponse.json({ 
        status: "error", 
        message: "Database connection failed" 
      }, { status: 500 })
    }
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json({ 
      status: "error", 
      message: "Database test failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
