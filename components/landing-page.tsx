import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Calendar, Users, TrendingUp } from "lucide-react"

export default function LandingPage() {
  const regions = [
    { name: "Europe", image: "/european-landmarks.png" },
    { name: "Asia", image: "/serene-asian-temples.png" },
    { name: "Americas", image: "/american-landscapes.png" },
    { name: "Africa", image: "/african-savanna-elephants.png" },
    { name: "Oceania", image: "/oceania-beaches.png" },
  ]

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold">GT</span>
            </div>
            <span className="text-2xl font-bold">GlobeTrotter</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/auth/login">
              <Button variant="ghost" className="text-white hover:text-blue-400">
                Sign In
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <div className="w-full h-64 bg-gray-800 rounded-lg mb-8 flex items-center justify-center border border-gray-700">
              <div className="text-center">
                <MapPin className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                <p className="text-gray-400 text-lg">Your Next Adventure Awaits</p>
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Plan Your Perfect Journey
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Create, manage, and share personalized travel itineraries with intelligent features and collaborative
              capabilities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 px-8">
                  Start Planning
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-gray-600 text-white hover:bg-gray-800 bg-transparent"
              >
                Explore Destinations
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-gray-800/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose GlobeTrotter?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                <h3 className="text-xl font-semibold mb-2 text-white">Smart Planning</h3>
                <p className="text-gray-400">AI-powered recommendations and intelligent itinerary building</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 mx-auto mb-4 text-green-400" />
                <h3 className="text-xl font-semibold mb-2 text-white">Collaborate</h3>
                <p className="text-gray-400">Share and plan trips together with friends and family</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                <h3 className="text-xl font-semibold mb-2 text-white">Budget Tracking</h3>
                <p className="text-gray-400">Real-time expense tracking with currency conversion</p>
              </CardContent>
            </Card>
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <MapPin className="w-12 h-12 mx-auto mb-4 text-red-400" />
                <h3 className="text-xl font-semibold mb-2 text-white">Discover</h3>
                <p className="text-gray-400">Explore destinations with local insights and recommendations</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Regional Selections */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Top Regional Selections</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {regions.map((region) => (
              <Card
                key={region.name}
                className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors cursor-pointer"
              >
                <CardContent className="p-0">
                  <div className="aspect-square bg-gray-700 rounded-t-lg mb-4">
                    <img
                      src={region.image || "/placeholder.svg"}
                      alt={region.name}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-center text-white">{region.name}</h3>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-lg font-bold">GT</span>
            </div>
            <span className="text-xl font-bold">GlobeTrotter</span>
          </div>
          <p className="text-gray-400">© 2024 GlobeTrotter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
