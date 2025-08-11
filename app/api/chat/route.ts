import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { HfInference } from "@huggingface/inference"
import { searchFlightsKiwi, estimateHotelCosts } from "@/lib/external-travel"
import { getActivities } from "@/lib/database"

export const runtime = 'nodejs'

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  imageUrl: z.string().url().optional(),
})

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  currency: z.string().default("USD"),
})

// Minimal PDF text extraction fallback using PDF's binary content heuristics.
// For robust extraction, integrate a native layer or a serverless-friendly parser later.
async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Heuristic: try to decode as UTF-8; if binary, return placeholder with size
    const text = buffer.toString('utf8')
    // If the content is mostly non-printable, return empty
    const printable = text.replace(/[^\x20-\x7E\n\r\t]+/g, '')
    if (printable.trim().length < 100) return ''
    return printable.slice(0, 20000)
  } catch {
    return ''
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    const hfToken = process.env.HF_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN
    if (!hfToken) {
      return NextResponse.json({ message: "HF_TOKEN not set" }, { status: 500 })
    }
    const hf = new HfInference(hfToken)

    let messages: Array<z.infer<typeof ChatMessageSchema>> = []
    let currency = 'USD'
    let pdfText: string | null = null

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const messagesStr = form.get('messages') as string | null
      if (messagesStr) {
        try { messages = JSON.parse(messagesStr) } catch { messages = [] }
      }
      currency = (form.get('currency') as string) || 'USD'
      const file = form.get('file') as File | null
      if (file && file.type === 'application/pdf') {
        const arr = await file.arrayBuffer()
        const buffer = Buffer.from(arr)
        pdfText = await extractPdfText(buffer)
      }
    } else {
      const body = await request.json()
      const parsed = ChatRequestSchema.parse(body)
      messages = parsed.messages
      currency = parsed.currency
    }

    const lastUser = [...messages].reverse().find(m => m.role === "user")
    const imageUrl = lastUser?.imageUrl
    let imageHints: string | null = null

    if (imageUrl) {
      try {
        const imgRes = await fetch(imageUrl)
        const blob = await imgRes.blob()
        const cap = await hf.imageToText({ model: "nlpconnect/vit-gpt2-image-captioning", data: blob } as any)
        const text = (cap as any)?.generated_text || (Array.isArray(cap) ? cap?.[0]?.generated_text : null)
        if (text) imageHints = text
      } catch {}
    }

    // Heuristic: detect if user provided a scheme/itinerary to refine
    const userText = (lastUser?.content || '').toLowerCase()
    const looksLikeScheme =
      /\bday\s*\d+/i.test(userText) ||
      /itinerary|schedule|plan/gi.test(userText) ||
      (userText.split(/\n|-/).length > 6)
    const providedPlan = (pdfText && (/(day\s*\d+|itinerary|schedule|plan)/i.test(pdfText)))
      ? pdfText.slice(0, 2000)
      : looksLikeScheme ? (lastUser?.content || '').slice(0, 2000) : ''

    // Step 1: Try to extract planning fields from the conversation (+ PDF if provided)
    const extractSystem = "You extract structured fields from user travel requests. Return ONLY JSON."
    const extractUser = `Conversation (latest user goal at end):\n${messages.map(m => `${m.role.toUpperCase()}: ${m.content}`).join("\n")}\n${imageHints ? `Image context: ${imageHints}\n` : ""}${pdfText ? `PDF content (may include destination, dates, budget, constraints):\n${pdfText}\n` : ''}Extract fields if present: {"origin": string, "destination": string, "startDate": string|optional, "endDate": string|optional, "budget": number|optional, "currency": string|optional, "interests": string[]|optional}. Fill unknown fields with null. Return JSON only.`

    const extractModels = [
      "meta-llama/Meta-Llama-3-8B-Instruct",
      "mistralai/Mistral-7B-Instruct-v0.3",
      "Qwen/Qwen2.5-7B-Instruct",
    ]

    let extracted: any = null
    for (const model of extractModels) {
      try {
        const chat = await hf.chatCompletion({
          model,
          messages: [
            { role: "system", content: extractSystem },
            { role: "user", content: extractUser },
          ],
          temperature: 0,
          max_tokens: 200,
        } as any)
        let raw = ""
        const choice = (chat as any)?.choices?.[0]
        const content = choice?.message?.content
        if (typeof content === "string") raw = content
        else if (Array.isArray(content) && content[0]?.text) raw = content[0].text
        raw = raw.trim().replace(/^```json/i, "").replace(/```$/i, "").trim()
        extracted = JSON.parse(raw)
        break
      } catch {}
    }

    const destination = extracted?.destination || null
    const budget = typeof extracted?.budget === "number" ? extracted.budget : null
    const origin = extracted?.origin || null
    const startDate = extracted?.startDate || null
    const endDate = extracted?.endDate || null
    const interests: string[] = Array.isArray(extracted?.interests) ? extracted.interests : []
    const curr = extracted?.currency || currency

    let plan: any = null

    if (destination && (budget || pdfText)) {
      // Generate or refine a plan
      const days = startDate && endDate
        ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000*60*60*24)) + 1)
        : 3

      const [flightOptions, hotelEst, activities] = await Promise.all([
        origin ? searchFlightsKiwi({ origin, destination, dateFrom: startDate || undefined, dateTo: endDate || undefined, nightsInDstFrom: days - 1, nightsInDstTo: days - 1, currency: curr, adults: 1, maxPrice: budget ? Math.round(budget * 0.6) : undefined }).catch(() => []) : Promise.resolve([]),
        estimateHotelCosts({ destination, nights: Math.max(1, days - 1), currency: curr }).catch(() => ({ provider: "Heuristic", nightlyEstimate: 80, totalEstimate: 80 * Math.max(1, days - 1), currency: curr, basis: "fallback" })),
        getActivities(undefined, destination, 40).catch(() => []),
      ])
      const bestFlight = flightOptions[0]
      const flightCost = bestFlight?.price || 0
      const hotelCost = hotelEst?.totalEstimate || 0

      const system = providedPlan
        ? "You are a helpful travel assistant. Refine the user's proposed scheme to fit the budget and constraints."
        : "You are a helpful travel assistant. Keep responses concise and practical."
      const user = providedPlan
        ? `Refine the provided scheme to fit constraints.
Destination: ${destination}${origin ? ` | Origin: ${origin}` : ''}
${budget ? `Budget: ${budget} ${curr}
` : ''}Interests: ${interests.join(", ") || "general"}${imageHints ? ` | Image: ${imageHints}` : ''}
Flight baseline: ${flightCost} ${curr}. Hotel baseline: ${hotelCost} ${curr}.
Provided scheme (user):
${providedPlan}
Return a short friendly response first, then a JSON block named PLAN with itinerary and budget_breakdown.`
        : `Create a ${days}-day trip for ${destination}${origin ? ` from ${origin}` : ''}.${budget ? `\nBudget: ${budget} ${curr}.` : ''} Interests: ${interests.join(", ") || "general"}.${imageHints ? ` Image hints: ${imageHints}.` : ''}${pdfText ? `\nConsider PDF notes: ${pdfText.slice(0, 2000)}` : ''}\nFlight baseline: ${flightCost} ${curr}. Hotel baseline: ${hotelCost} ${curr}. Recommend activities and approximate costs within constraints. Return a short friendly response first, then a JSON block named PLAN with itinerary and budget_breakdown.`

      let assistantText = ""
      for (const model of extractModels) {
        try {
          const chat = await hf.chatCompletion({ model, messages: [ { role: "system", content: system }, { role: "user", content: user } ], temperature: 0.6, max_tokens: 800 } as any)
          const choice = (chat as any)?.choices?.[0]
          const content = choice?.message?.content
          if (typeof content === "string") assistantText = content
          else if (Array.isArray(content) && content[0]?.text) assistantText = content[0].text
          if (assistantText) break
        } catch {}
      }
      const match = assistantText.match(/PLAN\s*```json\s*([\s\S]*?)```/i) || assistantText.match(/PLAN\s*:\s*({[\s\S]*})/i)
      if (match) {
        try { plan = JSON.parse(match[1]) } catch {}
      }

      return NextResponse.json({
        assistant: assistantText || (providedPlan ? `Here is a refined plan for ${destination}.` : `Here is a plan for ${destination}.`),
        plan,
        options: { flight: bestFlight || null, hotel: hotelEst || null },
      })
    }

    const models = extractModels
    let responseText = ""
    for (const model of models) {
      try {
        const chat = await hf.chatCompletion({ model, messages, temperature: 0.7, max_tokens: 400 } as any)
        const choice = (chat as any)?.choices?.[0]
        const content = choice?.message?.content
        if (typeof content === "string") responseText = content
        else if (Array.isArray(content) && content[0]?.text) responseText = content[0].text
        if (responseText) break
      } catch {}
    }

    return NextResponse.json({ assistant: responseText || "Share a location and budget, or attach a PDF scheme, and I’ll plan within it." })
  } catch (err) {
    console.error("/api/chat error:", err)
    return NextResponse.json({ message: "Chat failed" }, { status: 500 })
  }
} 