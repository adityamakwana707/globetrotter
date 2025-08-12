"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut, Plus, User, Home, Shield, Settings, MapPin, Activity, Users } from "lucide-react"

export default function Navbar() {
  const { data: session } = useSession()
  const router = useRouter()

  const initial = ((session?.user?.name || session?.user?.email || "U")[0] || "U").toUpperCase()
  const isAdmin = session?.user?.role === 'admin'

  return (
    <header className="border-b border-gray-200 bg-white/80 backdrop-blur sticky top-0 z-30">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#1E40AF] rounded-full grid place-items-center text-white">
            <span className="text-xl font-bold">GT</span>
          </div>
          <span className="text-2xl font-semibold tracking-tight text-slate-900">GlobeTrotter</span>
        </Link>
        {/* Main Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {session && (
            <>
              <Link 
                href="/dashboard" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
              <Link 
                href="/trips" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                My Trips
              </Link>
              <Link 
                href="/calendar" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Calendar
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-gray-700 hover:text-blue-600 transition-colors">
                    <MapPin className="w-4 h-4 mr-1" />
                    Explore
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem onClick={() => router.push("/cities")} className="cursor-pointer">
                    <MapPin className="w-4 h-4 mr-2" /> Cities
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/activities")} className="cursor-pointer">
                    <Activity className="w-4 h-4 mr-2" /> Activities
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link 
                href="/community" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Community
              </Link>
              <Link 
                href="/scrapbook" 
                className="text-gray-700 hover:text-blue-600 transition-colors"
              >
                Scrapbook
              </Link>
            </>
          )}
        </nav>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="p-0 h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10 border border-gray-200">
                <AvatarImage src={(session?.user as any)?.image || ""} alt={(session?.user as any)?.name || "User"} />
                <AvatarFallback>{initial}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {session?.user ? (
              <>
                <DropdownMenuLabel className="truncate">{session.user.name || session.user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin ? (
                  // Admin navigation
                  <>
                    <DropdownMenuItem onClick={() => router.push("/admin")} className="cursor-pointer">
                      <Shield className="w-4 h-4 mr-2" /> Admin Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/admin")} className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" /> System Management
                    </DropdownMenuItem>
                  </>
                ) : (
                  // Regular user navigation
                  <>
                    <DropdownMenuItem onClick={() => router.push("/dashboard")} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" /> Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/scrapbook")} className="cursor-pointer">
                      <Users className="w-4 h-4 mr-2" /> Scrapbook
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/trips/create")} className="cursor-pointer">
                      <Plus className="w-4 h-4 mr-2" /> Plan a trip
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push("/trips")} className="cursor-pointer">
                      <Home className="w-4 h-4 mr-2" /> My Trips
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut({ redirect: true, callbackUrl: "/" })} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuLabel>Welcome</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/auth/login")} className="cursor-pointer">
                  Sign In
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/auth/register")} className="cursor-pointer">
                  Get Started
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/landing")} className="cursor-pointer">
                  Explore
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
} 