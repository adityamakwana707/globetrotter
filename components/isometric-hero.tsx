import { Calendar, Compass, MapPin, Globe2 } from "lucide-react"

export default function IsometricHero() {
  return (
    <div className="relative w-full aspect-[4/3] sm:aspect-[5/4] lg:aspect-square">
      {/* Glow backdrop */}
      <div className="absolute -inset-6 sm:-inset-8 rounded-3xl bg-gradient-to-tr from-[#1E40AF]/10 via-[#10B981]/10 to-transparent blur-2xl" />

      {/* Base tile */}
      <div className="absolute inset-6 sm:inset-8 rounded-2xl bg-white border border-gray-200 shadow-xl rotate-3" />

      {/* Middle tile */}
      <div className="absolute inset-10 sm:inset-12 rounded-2xl bg-[#FAF7F0] border border-gray-200 shadow-lg -rotate-2" />

      {/* Top card with mini map */}
      <div className="absolute inset-14 sm:inset-16 rounded-2xl bg-white border border-gray-200 shadow-lg overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_30%_20%,#1E40AF_0,transparent_40%),radial-gradient(circle_at_70%_80%,#10B981_0,transparent_40%)]" />
        <div className="relative h-full grid grid-rows-2">
          {/* Mini map grid */}
          <div className="p-4 grid grid-cols-6 gap-2">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="h-3 rounded bg-slate-100" />
            ))}
          </div>
          {/* Pins and widgets */}
          <div className="relative p-4">
            <div className="absolute left-6 top-4 w-10 h-10 rounded-full bg-[#1E40AF]/10 border border-[#1E40AF]/20 grid place-items-center">
              <MapPin className="w-5 h-5 text-[#1E40AF]" />
            </div>
            <div className="absolute right-8 top-6 w-10 h-10 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 grid place-items-center">
              <Compass className="w-5 h-5 text-[#10B981]" />
            </div>
            <div className="absolute left-10 bottom-6 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur px-3 py-2 shadow-sm">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-700">3-day itinerary</span>
            </div>
            <div className="absolute right-10 bottom-6 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/80 backdrop-blur px-3 py-2 shadow-sm">
              <Globe2 className="w-4 h-4 text-slate-500" />
              <span className="text-xs text-slate-700">Multi-city</span>
            </div>
          </div>
        </div>
      </div>

      {/* Isometric ticket card */}
      <div className="absolute -left-2 top-6 sm:left-0 sm:top-10 rotate-6">
        <div className="relative w-28 h-16 sm:w-32 sm:h-18 bg-white border border-gray-200 shadow-md rounded-lg">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#FAF7F0] border border-gray-200" />
          <div className="absolute inset-2 grid grid-rows-2">
            <div className="h-2 w-16 bg-slate-100 rounded" />
            <div className="mt-2 flex gap-2">
              <div className="h-2 w-8 bg-[#10B981]/30 rounded" />
              <div className="h-2 w-10 bg-[#1E40AF]/30 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating pins */}
      <div className="absolute -top-2 right-6 sm:right-10">
        <div className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-200 grid place-items-center animate-bounce [animation-duration:2.2s]">
          <MapPin className="w-5 h-5 text-[#1E40AF]" />
        </div>
      </div>
      <div className="absolute bottom-2 -left-2 sm:left-4">
        <div className="w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 grid place-items-center animate-bounce [animation-duration:2.6s]">
          <Compass className="w-4 h-4 text-[#10B981]" />
        </div>
      </div>
    </div>
  )
} 