import { getCities } from "@/lib/database"

export interface FlightSearchParams {
  origin: string
  destination: string
  dateFrom?: string // YYYY-MM-DD
  dateTo?: string // YYYY-MM-DD
  nightsInDstFrom?: number
  nightsInDstTo?: number
  currency?: string
  adults?: number
  maxPrice?: number // total per person cap in currency
}

export interface FlightOption {
  provider: string
  price: number
  currency: string
  route: Array<{ from: string; to: string; departure: string; arrival: string }>
  bookingLink?: string
  raw?: any
}

export interface HotelEstimateParams {
  destination: string
  nights: number
  rooms?: number
  adults?: number
  currency?: string
}

export interface HotelEstimate {
  provider: string
  nightlyEstimate: number
  totalEstimate: number
  currency: string
  basis: string
}

const TEQUILA_API_KEY = process.env.TEQUILA_API_KEY

export async function searchFlightsKiwi(params: FlightSearchParams): Promise<FlightOption[]> {
  const {
    origin,
    destination,
    dateFrom,
    dateTo,
    nightsInDstFrom,
    nightsInDstTo,
    currency = "USD",
    adults = 1,
    maxPrice,
  } = params

  if (!TEQUILA_API_KEY) {
    // Graceful fallback stub for local dev
    return [
      {
        provider: "Kiwi (stub)",
        price: Math.max(100, Math.min(800, maxPrice || 500)),
        currency,
        route: [
          { from: origin, to: destination, departure: `${dateFrom || "2025-01-10"}T09:00:00`, arrival: `${dateFrom || "2025-01-10"}T12:00:00` },
          { from: destination, to: origin, departure: `${dateTo || "2025-01-15"}T14:00:00`, arrival: `${dateTo || "2025-01-15"}T17:00:00` },
        ],
      },
    ]
  }

  const qs = new URLSearchParams()
  qs.set("fly_from", origin)
  qs.set("fly_to", destination)
  if (dateFrom) qs.set("date_from", new Date(dateFrom).toLocaleDateString("en-GB").replace(/\//g, "/"))
  if (dateTo) qs.set("date_to", new Date(dateTo).toLocaleDateString("en-GB").replace(/\//g, "/"))
  if (nightsInDstFrom) qs.set("nights_in_dst_from", String(nightsInDstFrom))
  if (nightsInDstTo) qs.set("nights_in_dst_to", String(nightsInDstTo))
  qs.set("curr", currency)
  qs.set("adults", String(adults))
  qs.set("one_for_city", "1")
  qs.set("sort", "price")
  qs.set("limit", "5")

  const url = `https://api.tequila.kiwi.com/v2/search?${qs.toString()}`
  const res = await fetch(url, {
    headers: { "apikey": TEQUILA_API_KEY as string },
  })
  if (!res.ok) {
    throw new Error(`Kiwi API error: ${res.status}`)
  }
  const data = await res.json()
  const flights: FlightOption[] = (data?.data || []).map((it: any) => {
    const route = (it.route || []).map((r: any) => ({
      from: r.cityCodeFrom || r.flyFrom,
      to: r.cityCodeTo || r.flyTo,
      departure: r.utc_departure,
      arrival: r.utc_arrival,
    }))
    return {
      provider: "Kiwi",
      price: it.price,
      currency: data?.currency || currency,
      route,
      bookingLink: it.deep_link,
      raw: it,
    }
  })

  return flights.filter(f => (maxPrice ? f.price <= maxPrice : true))
}

export async function estimateHotelCosts(params: HotelEstimateParams): Promise<HotelEstimate> {
  const { destination, nights, currency = "USD", adults = 2 } = params

  // Try to leverage internal DB city cost_index as a proxy if available
  try {
    const cities = await getCities(destination, 1)
    const city = cities?.[0]
    if (city && typeof (city as any).cost_index === "number") {
      const baseNightUSD = 50 // baseline
      const nightly = Math.max(30, Math.round(baseNightUSD * (city as any).cost_index))
      const total = nightly * Math.max(1, nights)
      return {
        provider: "Internal cost index",
        nightlyEstimate: nightly,
        totalEstimate: total,
        currency,
        basis: `cost_index=${(city as any).cost_index}`,
      }
    }
  } catch {}

  // Fallback heuristic when no city data
  const heuristicNight = 80
  return {
    provider: "Heuristic",
    nightlyEstimate: heuristicNight,
    totalEstimate: heuristicNight * Math.max(1, nights),
    currency,
    basis: "default heuristic",
  }
} 