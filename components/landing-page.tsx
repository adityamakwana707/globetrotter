"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Calendar, Users, TrendingUp, Search, Filter, Layers, ArrowUpDown, Plus, Heart, Star, ArrowRight } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function LandingPage() {
  const { data: session } = useSession()

  const regions = [
    { name: "Europe", image: "/european-landmarks.png" },
    { name: "Asia", image: "/serene-asian-temples.png" },
    { name: "Americas", image: "/american-landscapes.png" },
    { name: "Africa", image: "/african-savanna-elephants.png" },
    { name: "Oceania", image: "/oceania-beaches.png" },
  ]

  const previousTrips = [
    { name: "Paris Getaway", image: "/paris-eiffel-tower.png" },
    { name: "NYC Weekend", image: "/vibrant-nyc-street.png" },
    { name: "Bali Escape", image: "/bali-beach.png" },
  ]

  const heroSlides = [
    { title: "Rio de Janeiro", subtitle: "Brazil · 143 reviews", image: "/american-landscapes.png" },
    { title: "Paris Highlights", subtitle: "France · 210 reviews", image: "/paris-eiffel-tower.png" },
    { title: "Bali Retreat", subtitle: "Indonesia · 188 reviews", image: "/bali-beach.png" },
  ]

  return (
    <div className="min-h-screen">
      {/* Banner Image Area - Image Carousel */}
      <section className="px-4 pt-8">
        <div className="container mx-auto">
          <div className="relative rounded-3xl overflow-hidden ring-1 ring-gray-200 bg-white">
            <Carousel opts={{ align: "start", loop: true }} className="[&_.embla__container]:h-full">
              <CarouselContent>
                {heroSlides.map((slide, idx) => (
                  <CarouselItem key={idx}>
                    <div className="relative h-[320px] sm:h-[420px] md:h-[500px]">
                      <img src={slide.image} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-10">
                        <div className="max-w-xl">
                          <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-white drop-shadow">{slide.title}</h1>
                          <p className="text-white/90 mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {slide.subtitle}</span>
                          </p>
                          <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <Button className="bg-white text-slate-900 hover:bg-gray-100 w-full sm:w-auto">See more</Button>
                            <Link href="/trips/create">
                              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white  px-5 w-full sm:w-auto">
                                Start planning <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur border-gray-200 h-9 w-9 sm:h-10 sm:w-10" />
              <CarouselNext className="hidden sm:flex right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-white/90 backdrop-blur border-gray-200 h-9 w-9 sm:h-10 sm:w-10" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Search Row */}
      <section className="px-4 pt-6">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <div className="flex-1 rounded-xl px-4 py-3 flex items-center gap-2 bg-white border border-gray-300 shadow-sm">
              <Search className="w-5 h-5 text-slate-500" />
              <input
                placeholder="Search bar ..."
                className="bg-transparent outline-none flex-1 placeholder:text-slate-400 text-sm text-slate-800"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 md:flex md:gap-2">
              <Button variant="outline" className="border-gray-300 bg-white w-full md:w-auto">
                <Layers className="w-4 h-4 mr-2" /> Group by
              </Button>
              <Button variant="outline" className="border-gray-300 bg-white w-full md:w-auto">
                <Filter className="w-4 h-4 mr-2" /> Filter
              </Button>
              <Button variant="outline" className="border-gray-300 bg-white w-full md:w-auto">
                <ArrowUpDown className="w-4 h-4 mr-2" /> Sort by
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Top Regional Selections - Carousel */}
      <section className="py-10 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl sm:text-3xl font-semibold">Top Regional Selections</h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="relative">
            <Carousel opts={{ align: "start", dragFree: true }}>
              <CarouselContent>
                {regions.map((region) => (
                  <CarouselItem key={region.name} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <Card className="bg-gray-50 border-0 shadow-none">
                      <CardContent className="p-0">
                        <div className="relative rounded-[24px] sm:rounded-[28px] overflow-hidden ring-1 ring-gray-200 shadow-md">
                          <img src={region.image || "/placeholder.svg"} alt={region.name} className="w-full h-56 sm:h-72 object-cover" />
                          <button className="absolute top-3 right-3 w-8 h-8 sm:w-10 sm:h-10 grid place-items-center rounded-full bg-white/90 shadow-md">
                            <Heart className="w-4 h-4 text-slate-700" />
                          </button>
                          <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                            <div className="rounded-xl bg-black/45 text-white backdrop-blur px-3 py-2">
                              <div className="flex items-center justify-between">
                                <p className="text-sm sm:text-base font-medium">{region.name}</p>
                                <span className="inline-flex items-center gap-1 text-xs sm:text-sm opacity-90">
                                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> 4.8
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex left-2 sm:-left-6 md:-left-12 bg-white border-gray-200 h-8 w-8" />
              <CarouselNext className="hidden sm:flex right-2 sm:-right-6 md:-right-12 bg-white border-gray-200 h-8 w-8" />
            </Carousel>
          </div>
        </div>
      </section>

      {/* Previous Trips */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl sm:text-3xl font-semibold">Previous Trips</h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {previousTrips.map((trip, idx) => (
              <Card key={idx} className="bg-gray-50 border-0 shadow-none">
                <CardContent className="p-0">
                  <div className="relative rounded-[28px] overflow-hidden ring-1 ring-gray-200 shadow-md">
                    <img src={trip.image || "/placeholder.svg"} alt={trip.name} className="w-full h-96 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="rounded-2xl bg-black/45 text-white backdrop-blur px-4 py-3">
                        <h3 className="text-xl font-semibold">{trip.name}</h3>
                        <div className="flex items-center gap-3 text-sm opacity-90">
                          <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" /> 4.6</span>
                          <span>56 reviews</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Floating CTA */}
     

      {/* Footer */}
      <footer className="border-top border-gray-200 bg-white py-10 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full grid place-items-center bg-[#1E40AF] text-white">
              <span className="text-lg font-bold">GT</span>
            </div>
            <span className="text-xl font-semibold text-slate-900">GlobeTrotter</span>
          </div>
          <p className="text-slate-500">© 2024 GlobeTrotter. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
