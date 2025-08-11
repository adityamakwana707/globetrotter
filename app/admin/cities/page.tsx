import { getServerSession } from "next-auth"
import { redirect } from "next/navigation"
import { authOptions } from "@/lib/auth"
import { isUserAdmin } from "@/lib/database"
import AdminCitiesManagement from "@/components/admin/cities-management"

export default async function AdminCitiesPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/auth/login")
  }

  const isAdmin = await isUserAdmin(session.user.id)
  
  if (!isAdmin) {
    redirect("/dashboard")
  }

  return <AdminCitiesManagement user={session.user} />
}
