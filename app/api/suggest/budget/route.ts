import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { HfInference } from "@huggingface/inference"
import { searchFlightsKiwi, estimateHotelCosts } from "@/lib/external-travel"
import { getActivities } from "@/lib/database"

const RequestSchema = z.object({
  origin: z.string().min(2),
  destination: z.string().min(2),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  days: z.number().int().positive().optional(),
  budget: z.number().positive(), // total budget in currency for trip
  currency: z.string().default("USD"),
  interests: z.array(z.string()).optional().default([]),
  imageUrl: z.string().url().optional(), // optional multimodal input
})

const ResponseSchema = z.object({
  itinerary: z.array(z.object({
    day: z.number(),
    items: z.array(z.object({
      name: z.string(),
      category: z.string().optional(),
      startTime: z.string().optional(),
      duration_hours: z.number().optional(),
      estimated_cost: z.number().optional(),
      notes: z.string().optional(),
    }))
  })),
  budget_breakdown: z.object({
    flights: z.number().optional().default(0),
    hotels: z.number().optional().default(0),
    activities: z.number().optional().default(0),
    total: z.number(),
    currency: z.string(),
  }),
  options: z.object({
    flight: z.any().optional(),
    hotel: z.any().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const input = RequestSchema.parse(body)

    const hfToken = process.env.HF_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN
    if (!hfToken) {
      return NextResponse.json({ message: "HF_TOKEN not set" }, { status: 500 })
    }

    const hf = new HfInference(hfToken)

    // Optional multimodal: caption input image to extract vibe
    let imageHints: string | null = null
    if (input.imageUrl) {
      try {
        const imgRes = await fetch(input.imageUrl)
        const blob = await imgRes.blob()
        const caption = await hf.imageToText({
          model: "nlpconnect/vit-gpt2-image-captioning",
          data: blob,
        } as any)
        const text = (caption as any)?.generated_text || (Array.isArray(caption) ? caption?.[0]?.generated_text : null)
        if (text) imageHints = text
      } catch (e) {
        // non-fatal
      }
    }

    // Tool calls: flights and hotels pre-fetch for deterministic grounding
    const days = input.days || (input.startDate && input.endDate ? Math.max(1, Math.ceil((new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) / (1000*60*60*24)) + 1) : 3)

    const [flightOptions, hotelEst] = await Promise.all([
      searchFlightsKiwi({
        origin: input.origin,
        destination: input.destination,
        dateFrom: input.startDate,
        dateTo: input.endDate,
        nightsInDstFrom: days - 1,
        nightsInDstTo: days - 1,
        currency: input.currency,
        adults: 1,
        maxPrice: Math.round(input.budget * 0.6), // 60% budget cap for flights as a soft guard
      }).catch(() => []),
      estimateHotelCosts({ destination: input.destination, nights: Math.max(1, days - 1), currency: input.currency }).catch(() => ({ provider: "Heuristic", nightlyEstimate: 80, totalEstimate: 80 * Math.max(1, days - 1), currency: input.currency, basis: "fallback" })),
    ])

    const bestFlight = flightOptions[0]
    const flightCost = bestFlight?.price || 0
    const hotelCost = hotelEst?.totalEstimate || 0

    // Ground with local activities
    const activities = await getActivities(undefined, input.destination, 40).catch(() => [])

    const systemPrompt = `You are a strict JSON planner. Always return ONLY valid JSON matching the provided response schema.`

    const userPrompt = `Plan a ${days}-day trip to ${input.destination} within total budget ${input.budget} ${input.currency}.
Interests: ${(input.interests || []).join(", ") || "general"}${imageHints ? `\nImage hints: ${imageHints}` : ""}
Flight baseline cost: ${flightCost} ${input.currency}
Hotel baseline total: ${hotelCost} ${input.currency}
Remaining for activities: ${Math.max(0, input.budget - flightCost - hotelCost)} ${input.currency}

Activities candidates (JSON lines):
${activities.map((a: any) => JSON.stringify({ name: a.name, category: a.category, price_range: a.price_range, duration_hours: a.duration_hours })).join("\n")}

Return JSON with an itinerary per day and a budget_breakdown that sums to total <= budget.`

    const models = [
      "meta-llama/Meta-Llama-3-8B-Instruct",
      "mistralai/Mistral-7B-Instruct-v0.3",
      "Qwen/Qwen2.5-7B-Instruct",
    ]

    let raw = ""
    let lastErr: any = null
    for (const model of models) {
      try {
        const chat = await hf.chatCompletion({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.5,
          max_tokens: 800,
        } as any)
        const choice = (chat as any)?.choices?.[0]
        const content = choice?.message?.content
        if (typeof content === "string") raw = content
        else if (Array.isArray(content) && content[0]?.text) raw = content[0].text
        if (raw) break
      } catch (e) {
        lastErr = e
        continue
      }
    }

    if (!raw) throw lastErr || new Error("No model output")

    raw = raw.trim().replace(/^```json/i, "").replace(/```$/, "").trim()

    let parsed: z.infer<typeof ResponseSchema>
    try {
      const json = JSON.parse(raw)
      parsed = ResponseSchema.parse(json)
    } catch {
      // Construct a minimal reasonable fallback
      const perActivityBudget = Math.max(0, Math.round((input.budget - flightCost - hotelCost) / Math.max(1, days) / 2))
      parsed = {
        itinerary: Array.from({ length: days }, (_, i) => ({
          day: i + 1,
          items: (activities || []).slice(i * 3, i * 3 + 3).map((a: any) => ({
            name: a.name,
            category: a.category,
            duration_hours: a.duration_hours || 2,
            estimated_cost: perActivityBudget,
          })),
        })),
        budget_breakdown: {
          flights: flightCost,
          hotels: hotelCost,
          activities: perActivityBudget * Math.max(1, days) * 2,
          total: flightCost + hotelCost + perActivityBudget * Math.max(1, days) * 2,
          currency: input.currency,
        },
        options: { flight: bestFlight, hotel: hotelEst },
      }
    }

    // Enforce total within budget
    if (parsed.budget_breakdown.total > input.budget) {
      const scale = input.budget / Math.max(1, parsed.budget_breakdown.total)
      parsed.budget_breakdown.flights = Math.round((parsed.budget_breakdown.flights || 0) * scale)
      parsed.budget_breakdown.hotels = Math.round((parsed.budget_breakdown.hotels || 0) * scale)
      parsed.budget_breakdown.activities = Math.round((parsed.budget_breakdown.activities || 0) * scale)
      parsed.budget_breakdown.total = Math.min(input.budget, parsed.budget_breakdown.total)
    }

    return NextResponse.json({
      ...parsed,
      options: { flight: bestFlight || null, hotel: hotelEst || null },
    })
  } catch (err) {
    console.error("/api/suggest/budget error:", err)
    return NextResponse.json({ message: "Failed to generate budget plan" }, { status: 500 })
  }
} 