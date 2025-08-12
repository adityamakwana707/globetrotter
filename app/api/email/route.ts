import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { emailTransporter } from "@/lib/email"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { tripId, to, subject, message } = await request.json()

    await emailTransporter.sendMail({
      from: `"GlobeTrotter" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: message,
      html: `<div style="font-family: Arial, sans-serif;">
        <h2>Trip Details Shared</h2>
        <p>${message}</p>
        <!-- Your existing HTML template here -->
      </div>`
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Error sending email:", error)
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    )
  }
}