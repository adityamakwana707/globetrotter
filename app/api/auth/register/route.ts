import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { createUnverifiedUser, getUserByEmail, getUnverifiedUserByEmail, createEmailVerificationOTP, deleteUnverifiedUser } from "@/lib/database"
import { sendEmailVerificationOTP } from "@/lib/email"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phoneNumber, city, country } = body

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    console.log(`🔍 Registration attempt for email: ${email}`)

    // Check if user already exists (either verified or unverified)
    const existingUser = await getUserByEmail(email)
    const existingUnverifiedUser = await getUnverifiedUserByEmail(email)
    
    console.log(`📊 User check results:`)
    console.log(`  - Existing user: ${existingUser ? 'YES' : 'NO'}`)
    console.log(`  - Existing unverified user: ${existingUnverifiedUser ? 'YES' : 'NO'}`)
    
    if (existingUser) {
      console.log(`❌ User already exists in users table: ${existingUser.id}`)
      return NextResponse.json({ message: "User already exists" }, { status: 409 })
    }
    
    if (existingUnverifiedUser) {
      console.log(`❌ Unverified user already exists: ${existingUnverifiedUser.id}`)
      return NextResponse.json({ message: "User already exists" }, { status: 409 })
    }
 
    console.log(`✅ No existing user found, proceeding with registration`)
    
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

    console.log(`✅ Created unverified user with ID: ${tempUserId}`)

    // Send OTP verification email
    try {
      const otpCode = await createEmailVerificationOTP(tempUserId, email)
      await sendEmailVerificationOTP(email, otpCode, firstName)
      console.log(`✅ OTP email sent successfully`)
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError)
      // Clean up the unverified user since OTP creation failed
      try {
        await deleteUnverifiedUser(tempUserId)
        console.log(`🧹 Cleaned up unverified user ${tempUserId} due to OTP failure`)
      } catch (cleanupError) {
        console.error("Failed to cleanup unverified user:", cleanupError)
      }
      
      return NextResponse.json({ 
        message: "Registration failed - unable to send verification email. Please try again." 
      }, { status: 500 })
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
