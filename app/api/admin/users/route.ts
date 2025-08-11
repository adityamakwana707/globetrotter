import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { 
  getUserAnalytics,
  searchUsers,
  updateUserRole,
  isUserAdmin 
} from "@/lib/database"
import { z } from "zod"

const updateUserRoleSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum(["user", "admin", "moderator"], {
    errorMap: () => ({ message: "Role must be user, admin, or moderator" })
  })
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (search) {
      const users = await searchUsers(search, limit)
      return NextResponse.json(users)
    } else {
      const users = await getUserAnalytics(limit, offset)
      return NextResponse.json(users)
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = await isUserAdmin(session.user.id)
    if (!isAdmin) {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    
    // Validate request body
    const validationResult = updateUserRoleSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: "Validation failed", 
          errors: validationResult.error.errors 
        }, 
        { status: 400 }
      )
    }

    const { userId, role } = validationResult.data

    // Prevent admin from changing their own role to prevent lockout
    if (userId === session.user.id && role !== 'admin') {
      return NextResponse.json(
        { message: "Cannot change your own admin role" }, 
        { status: 400 }
      )
    }

    const success = await updateUserRole(userId, role)

    if (!success) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "User role updated successfully" })
  } catch (error) {
    console.error("Error updating user role:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
