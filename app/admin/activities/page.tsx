import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { isUserAdmin } from "@/lib/database"
import AdminActivitiesManagement from "@/components/admin/activities-management"

export default async function AdminActivitiesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const isAdmin = await isUserAdmin(session.user.id)
  
  if (!isAdmin) {
    redirect("/dashboard")
  }

  return <AdminActivitiesManagement user={session.user} />
}
