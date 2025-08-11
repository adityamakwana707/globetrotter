import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createUnverifiedUser, getUserByEmail, getUnverifiedUserByEmail, createEmailVerificationOTP } from "@/lib/database"
import { sendEmailVerificationOTP } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phoneNumber, city, country } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists (either verified or unverified)
    const existingUser = await getUserByEmail(email)
    const existingUnverifiedUser = await getUnverifiedUserByEmail(email)
    
    if (existingUser || existingUnverifiedUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create unverified user (not in main users table yet)
    const tempUserId = await createUnverifiedUser({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      city,
      country,
    })

    // Send OTP verification email
    try {
      const otpCode = await createEmailVerificationOTP(tempUserId, email)
      await sendEmailVerificationOTP(email, otpCode, firstName)
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError)
      // If email fails, we should clean up the unverified user
      // For now, just log it - in production you might want to implement cleanup
    }

    return NextResponse.json({ 
      message: "Registration successful! Please check your email for verification code.", 
      tempUserId,
      requiresVerification: true
    }, { status: 201 })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
