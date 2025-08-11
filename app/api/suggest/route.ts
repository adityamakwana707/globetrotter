import { NextResponse } from "next/server"
import { HfInference } from "@huggingface/inference"
import { z } from "zod"
import { getActivities } from "@/lib/database"

const SuggestionSchema = z.object({
  suggestions: z.array(z.object({
    id: z.number().optional(),
    name: z.string(),
    category: z.string().optional(),
    price_range: z.string().optional(),
    duration_hours: z.number().optional(),
    notes: z.string().optional(),
  }))
})

export async function POST(req: Request) {
  try {
    const { destination, days = 2, interests = [] } = await req.json()

    const hfToken = process.env.HF_TOKEN
    if (!hfToken) {
      return NextResponse.json({ message: "HF_TOKEN not set" }, { status: 500 })
    }
    const hf = new HfInference(hfToken)

    // Grounding with your DB activities (limit for prompt size)
    const candidates = await getActivities(undefined, destination, 30).catch(() => [])

    const system = `You are a travel assistant. Always return ONLY valid JSON with no extra text.`
    const user = `
Destination: ${destination}
Trip length: ${days} days
Interests: ${Array.isArray(interests) ? interests.join(", ") : String(interests)}

Candidates (JSON lines):
${(candidates || []).map((a: any) => JSON.stringify({
  id: a.id, name: a.name, category: a.category, price_range: a.price_range, duration_hours: a.duration_hours
})).join("\n")}

Choose up to 10 suggestions that best fit. Prefer popular or iconic options.
Return strictly:
{
  "suggestions": [
    { "id": <number_if_from_candidates_or_omit>, "name": "...", "category": "...", "price_range": "$" }
  ]
}
`

    // Prefer chatCompletion (many providers map to conversational)
    const models = [
      "meta-llama/Meta-Llama-3-8B-Instruct",
      "mistralai/Mistral-7B-Instruct-v0.3",
      "Qwen/Qwen2.5-7B-Instruct"
    ]

    let raw = ""
    let lastErr: any = null
    for (const model of models) {
      try {
        const chat = await hf.chatCompletion({
          model,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user }
          ],
          // keep output short and structured
          max_tokens: 500,
          temperature: 0.7,
        } as any)
        // Extract text from various providers' shapes
        const choice = (chat as any)?.choices?.[0]
        const content = choice?.message?.content
        if (typeof content === "string") raw = content
        else if (Array.isArray(content) && content[0]?.text) raw = content[0].text
        else if (choice?.message?.tool_calls?.length) raw = JSON.stringify(choice.message.tool_calls[0])
        if (raw) break
      } catch (e) {
        lastErr = e
        continue
      }
    }

    if (!raw) {
      throw lastErr || new Error("No chat output")
    }

    raw = raw.trim().replace(/^```json/i, "").replace(/```$/, "").trim()

    let parsed
    try {
      parsed = SuggestionSchema.parse(JSON.parse(raw))
    } catch {
      // Fallback to top N candidates
      parsed = {
        suggestions: (candidates || []).slice(0, 8).map((a: any) => ({
          id: a.id, name: a.name, category: a.category, price_range: a.price_range, duration_hours: a.duration_hours
        }))
      }
    }

    // Build a simple day-by-day schedule with start times
    // Defaults: day starts 09:00, ends 18:00, default duration 2h if unknown
    const startHour = 9
    const endHour = 18
    const defaultDuration = 2 // hours
    let currentDay = 1
    let currentMinutes = startHour * 60
    let orderIndex = 1
    const scheduled: any[] = []
    const maxDays = Math.max(1, Number(days) || 1)
    const maxMinutesPerDay = (endHour - startHour) * 60

    for (const s of parsed.suggestions) {
      const durationMin = Math.round(((s.duration_hours || defaultDuration) as number) * 60)
      if (currentMinutes - startHour * 60 + durationMin > maxMinutesPerDay) {
        // next day
        currentDay += 1
        currentMinutes = startHour * 60
        orderIndex = 1
      }
      if (currentDay > maxDays) break
      const hh = Math.floor(currentMinutes / 60).toString().padStart(2, '0')
      const mm = (currentMinutes % 60).toString().padStart(2, '0')
      const startTime = `${hh}:${mm}:00`
      scheduled.push({ ...s, dayNumber: currentDay, startTime, orderIndex })
      currentMinutes += durationMin
      orderIndex += 1
    }

    return NextResponse.json({
      suggestions: parsed.suggestions,
      scheduled
    })
  } catch (err) {
    console.error("/api/suggest error:", err)
    return NextResponse.json({ suggestions: [] })
  }
}


