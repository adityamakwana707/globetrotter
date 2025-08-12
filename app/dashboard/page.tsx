import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { isUserAdmin } from "@/lib/database"
import DashboardClientWrapper from "@/components/dashboard/dashboard-client-wrapper"
import { pool } from "@/lib/database"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  // Check if user is admin and redirect to admin dashboard
  const isAdmin = await isUserAdmin(session.user.id)
  
  if (isAdmin) {
    redirect("/admin")
  }

  // Fetch complete user profile data
  let userProfile = {
    id: session.user.id,
    name: session.user.name || session.user.email || "",
    email: session.user.email || "",
    first_name: "",
    last_name: "",
    phone_number: "",
    city: "",
    country: "",
    role: session.user.role || "user",
    email_verified: false,
  }

  try {
    const result = await pool.query(
      `SELECT first_name, last_name, phone_number, city, country, email_verified, role
       FROM users WHERE id = $1`,
      [session.user.id]
    )

    if (result.rowCount && result.rowCount > 0) {
      const userData = result.rows[0]
      userProfile = {
        ...userProfile,
        first_name: userData.first_name || "",
        last_name: userData.last_name || "",
        phone_number: userData.phone_number || "",
        city: userData.city || "",
        country: userData.country || "",
        email_verified: userData.email_verified || false,
        role: userData.role || "user",
        name: userData.first_name && userData.last_name 
          ? `${userData.first_name} ${userData.last_name}` 
          : session.user.name || session.user.email || "",
      }
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    // Continue with default values if there's an error
  }

  return <DashboardClientWrapper user={userProfile} session={session} />
}
