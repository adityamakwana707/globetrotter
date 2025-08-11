import { NextRequest, NextResponse } from "next/server"
import { emailStorage } from "@/lib/email-storage"

export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { message: "Email preview only available in development" },
        { status: 404 }
      )
    }

    const { searchParams } = new URL(request.url)
    const emailId = searchParams.get('id')

    if (emailId) {
      // Get specific email
      const email = emailStorage.getEmailById(emailId)
      if (!email) {
        return NextResponse.json(
          { message: "Email not found" },
          { status: 404 }
        )
      }
      
      // Return HTML content for preview
      return new Response(email.html, {
        headers: {
          'Content-Type': 'text/html',
        },
      })
    } else {
      // Get all emails
      const emails = emailStorage.getAllEmails()
      return NextResponse.json(emails)
    }
  } catch (error) {
    console.error("Email preview error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
