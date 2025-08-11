import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { isUserAdmin } from "@/lib/database"
import AdminDashboard from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const isAdmin = await isUserAdmin(session.user.id)
  
  if (!isAdmin) {
    redirect("/dashboard")
  }

  return <AdminDashboard user={session.user} />
}
