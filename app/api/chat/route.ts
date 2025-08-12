import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { HfInference } from "@huggingface/inference"
import { searchFlightsKiwi, estimateHotelCosts } from "@/lib/external-travel"
import { getActivities, getCities } from "@/lib/database"

export const runtime = 'nodejs'
const MODEL = "meta-llama/Meta-Llama-3-8B-Instruct"
const NOVITA_MODEL = "meta-llama/llama-3-8b-instruct"
const NOVITA_BASE_URL = process.env.NOVITA_BASE_URL || "https://api.novita.ai/v3/openai/chat/completions"

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  imageUrl: z.string().url().optional(),
})

const ChatRequestSchema = z.object({
  messages: z.array(ChatMessageSchema).min(1),
  currency: z.string().default("USD"),
})

async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    const text = buffer.toString('utf8')
    const printable = text.replace(/[^\x20-\x7E\n\r\t]+/g, '')
    if (printable.trim().length < 100) return ''
    return printable.slice(0, 20000)
  } catch {
    return ''
  }
}

const STOP_WORDS = new Set(["go","the","a","an","and","my","me","us","we","you","to","in","for","on","at","of"]) 
const GREET_RX = /\b(hi|hello|hey|yo|hola|namaste|salaam|salam|bonjour|ciao)\b/i
const TRAVEL_HINT_RX = /(visit|trip|travel|plan|itinerary|budget|usd|eur|gbp|hotel|flight|days|nights|to\s+[A-Za-z]|in\s+[A-Za-z])/i

async function resolveCityCandidate(candidate: string): Promise<string | null> {
  const clean = candidate.replace(/[.,!?:;]+$/g, '').replace(/\s+/g, ' ').trim()
  if (!clean) return null
  try {
    const city = (await getCities(clean, 1).catch(() => []))?.[0]
    if (city?.name) return city.name
  } catch {}
  const parts = clean.split(' ')
  for (const span of [2, 1]) {
    if (parts.length >= span) {
      const tail = parts.slice(-span).join(' ')
      const first = parts[0].toLowerCase()
      if (STOP_WORDS.has(first)) {
        const noFirst = parts.slice(1).slice(-span).join(' ')
        try {
          const cityB = (await getCities(noFirst, 1).catch(() => []))?.[0]
          if (cityB?.name) return cityB.name
        } catch {}
      }
      try {
        const cityC = (await getCities(tail, 1).catch(() => []))?.[0]
        if (cityC?.name) return cityC.name
      } catch {}
    }
  }
  const last = parts[parts.length - 1]
  if (last && !STOP_WORDS.has(last.toLowerCase())) return last[0].toUpperCase() + last.slice(1)
  return null
}

async function llmClarify(hf: HfInference, missing: 'both'|'destination'|'budget', context: { history: string; currency: string; guessDestination?: string|null }) {
  const system = "You are a friendly, concise travel assistant. Ask ONE short, polite question to get missing info."
  const user = `Conversation so far:\n${context.history}\nMissing: ${missing === 'both' ? 'destination and budget' : missing}. ${context.guessDestination ? `Guessed destination: ${context.guessDestination}. `: ''}Answer with ONE short question only, no extra text.`
  try {
    const content = await chatCompletionUnified(hf, [ { role: 'system', content: system }, { role: 'user', content: user } ], 0.2, 60)
    if (content) return content
  } catch {}
  if (missing === 'both') return "Could you share the destination city and your total budget (e.g., ‘Paris, 400 USD’)?"
  if (missing === 'destination') return "Which city would you like to visit?"
  return "What’s your total budget (and currency)?"
}

async function llmGreet(hf: HfInference, history: string) {
  const system = "You are a warm, concise travel assistant. Greet briefly and give 2 example prompts to get started."
  const user = `User said hello / small talk. Conversation:\n${history}\nRespond with: a short greeting + two bullet examples (like 'Paris, 400 USD for 3 days' and 'Rome plan in attached PDF with 600 EUR'), max 2 lines.`
  try {
    const content = await chatCompletionUnified(hf, [ { role: 'system', content: system }, { role: 'user', content: user } ], 0.5, 80)
    if (content) return content
  } catch {}
  return "Hi! Share a city and budget (e.g., 'Paris, 400 USD') or attach a PDF plan, and I’ll craft the best trip within it."
}

// Unified chat completion with Novita default, HF fallback
async function chatCompletionUnified(hf: HfInference, messages: Array<{ role: 'system'|'user'|'assistant'; content: string }>, temperature: number, max_tokens: number): Promise<string> {
  const chat = await hf.chatCompletion({ model: MODEL, messages, temperature, max_tokens } as any)
  const choice = (chat as any)?.choices?.[0]
  const content = choice?.message?.content
  if (typeof content === 'string') return content
  if (Array.isArray(content) && content[0]?.text) return content[0].text
  return ''
}

// Tool-calling planning loop with the LLM
async function llmPlanWithTools(hf: HfInference, ctx: {
  destination: string
  budget: number
  currency: string
  origin?: string|null
  days?: number
  interests?: string[]
  imageHints?: string|null
  pdfText?: string|null
}) {
  const toolsSpec = `You can call tools by responding ONLY with strict JSON:\n{\n  "tool_call": { "name": "<tool_name>", "arguments": { ... } }\n}\nTools available:\n- search_flights: args { origin: string, destination: string, dateFrom?: string, dateTo?: string, maxPrice?: number, currency: string }\n- estimate_hotels: args { destination: string, nights: number, currency: string }\n- get_activities: args { destination: string, limit?: number }\nWhen done, return:\n{ "final_answer": string, "plan": { ... }, "budget_breakdown": { ... } }\nNever include extra text or code fences.`

  const messages: Array<{ role: 'system'|'user'|'assistant'; content: string }> = [
    { role: 'system', content: toolsSpec },
    { role: 'user', content: `Plan a ${ctx.days || 3}-day trip to ${ctx.destination} within ${ctx.budget} ${ctx.currency}.${ctx.origin ? ` Origin: ${ctx.origin}.` : ''} Interests: ${(ctx.interests||[]).join(', ') || 'general'}.${ctx.imageHints ? ` Image hints: ${ctx.imageHints}.` : ''}${ctx.pdfText ? ` Notes: ${ctx.pdfText.slice(0, 600)}.` : ''}` }
  ]

  const toolResult = async (name: string, args: any) => {
    try {
      if (name === 'search_flights') {
        const res = await searchFlightsKiwi({ origin: args.origin, destination: args.destination, dateFrom: args.dateFrom, dateTo: args.dateTo, currency: args.currency || ctx.currency, maxPrice: args.maxPrice })
        return { ok: true, data: res.slice(0, 3) }
      }
      if (name === 'estimate_hotels') {
        const nights = Number(args.nights) || Math.max(1, (ctx.days||3) - 1)
        const res = await estimateHotelCosts({ destination: args.destination, nights, currency: args.currency || ctx.currency })
        return { ok: true, data: res }
      }
      if (name === 'get_activities') {
        const acts = await getActivities(undefined, args.destination, Math.min(Number(args.limit)||20, 40)).catch(()=>[])
        return { ok: true, data: acts.slice(0, 20).map(a=>({ name: a.name, category: a.category, price_range: a.price_range, duration_hours: a.duration_hours })) }
      }
      return { ok: false, error: 'unknown tool' }
    } catch (e: any) {
      return { ok: false, error: String(e?.message||e) }
    }
  }

  for (let i = 0; i < 3; i++) {
    const content = await chatCompletionUnified(hf, messages, 0.3, 700)
    const raw = content.trim().replace(/^```json/i, '').replace(/```$/i, '').trim()
    try {
      const parsed = JSON.parse(raw)
      if (parsed.tool_call?.name) {
        const name = parsed.tool_call.name as string
        const args = parsed.tool_call.arguments || {}
        const result = await toolResult(name, args)
        messages.push({ role: 'assistant', content: JSON.stringify(parsed) })
        messages.push({ role: 'user', content: JSON.stringify({ tool_result: { name, result } }) })
        continue
      }
      if (parsed.final_answer) return parsed
    } catch {}
    break
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || ''

    const hfToken = process.env.HF_TOKEN || process.env.NEXT_PUBLIC_HF_TOKEN
    if (!hfToken && !process.env.NOVITA_API_KEY) {
      return NextResponse.json({ message: "HF_TOKEN or NOVITA_API_KEY not set" }, { status: 500 })
    }
    const hf = new HfInference(hfToken || '')

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
        // Keep HF for vision; Novita path focuses on chat
        if (hfToken) {
          const cap = await (new HfInference(hfToken)).imageToText({ model: "nlpconnect/vit-gpt2-image-captioning", data: blob } as any)
          const text = (cap as any)?.generated_text || (Array.isArray(cap) ? cap?.[0]?.generated_text : null)
          if (text) imageHints = text
        }
      } catch {}
    }

    const userTextRaw = lastUser?.content || ''
    const userText = userTextRaw.toLowerCase()
    const looksLikeScheme =
      /\bday\s*\d+/i.test(userText) ||
      /itinerary|schedule|plan/gi.test(userText) ||
      (userText.split(/\n|-/).length > 6)
    const providedPlan = (pdfText && (/(day\s*\d+|itinerary|schedule|plan)/i.test(pdfText)))
      ? pdfText.slice(0, 2000)
      : looksLikeScheme ? userTextRaw.slice(0, 2000) : ''

    const userHistory = messages.filter(m => m.role === 'user').map(m => m.content).join(' \n ')

    const lastTwoUser = messages.filter(m => m.role === 'user').slice(-2)
    const assistantShortQs = messages.filter(m => m.role === 'assistant').slice(-3).filter(m => m.content.trim().length < 120 && m.content.trim().endsWith('?')).length
    const isGreeting = GREET_RX.test(userTextRaw) || userTextRaw.trim().length <= 3
    const isTravelIntent = TRAVEL_HINT_RX.test(userTextRaw) || !!pdfText

    // Step 1: extract using USER MESSAGES ONLY
    const extractSystem = "You extract structured fields from user travel requests. Return ONLY JSON."
    const extractUser = `User messages (latest last):\n${messages.filter(m=>m.role==='user').map(m => m.content).join("\n")}\n${imageHints ? `Image context: ${imageHints}\n` : ""}${pdfText ? `PDF content (may include destination, dates, budget, constraints):\n${pdfText}\n` : ''}Extract fields if present: {"origin": string, "destination": string, "startDate": string|optional, "endDate": string|optional, "budget": number|optional, "currency": string|optional, "interests": string[]|optional}. Fill unknown fields with null. Return JSON only.`

    let extracted: any = null
    try {
      const content = await chatCompletionUnified(hf, [ { role: 'system', content: extractSystem }, { role: 'user', content: extractUser } ], 0, 200)
      const raw = content.trim().replace(/^```json/i, '').replace(/```$/i, '').trim()
      extracted = JSON.parse(raw)
    } catch {}

    let destination = extracted?.destination || null
    let budget = typeof extracted?.budget === "number" ? extracted.budget : null
    let origin = extracted?.origin || null
    let startDate = extracted?.startDate || null
    let endDate = extracted?.endDate || null
    let interests: string[] = Array.isArray(extracted?.interests) ? extracted.interests : []
    let curr = extracted?.currency || currency

    // Fallbacks over full history + PDF
    let userResolvedDestination: string | null = null
    if (!userResolvedDestination) {
      const textForDest = `${userHistory} ${pdfText || ''}`
      const destRegexes = [
        /\bvisit\s+([A-Za-z][A-Za-z\s-]{2,})/gi,
        /\bto\s+([A-Za-z][A-Za-z\s-]{2,})/gi,
        /\bin\s+([A-Za-z][A-Za-z\s-]{2,})/gi,
      ]
      for (const rx of destRegexes) {
        let m: RegExpExecArray | null
        let lastMatch: string | null = null
        while ((m = rx.exec(textForDest)) !== null) {
          if (m[1]) lastMatch = m[1].trim()
        }
        if (lastMatch) {
          const resolved = await resolveCityCandidate(lastMatch)
          if (resolved) { userResolvedDestination = resolved; break }
        }
      }
    }
    if (!userResolvedDestination) {
      try {
        const city = (await getCities(userHistory, 1).catch(() => []))?.[0]
        if (city?.name) userResolvedDestination = city.name
      } catch {}
    }
    // Last message capitalized city-like fallback
    if (!userResolvedDestination) {
      const capsRx = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g
      let mm: RegExpExecArray | null
      let lastCaps: string | null = null
      while ((mm = capsRx.exec(lastUser?.content || '')) !== null) {
        const cand = (mm[1] || '').trim()
        if (cand && !STOP_WORDS.has(cand.toLowerCase())) lastCaps = cand
      }
      if (lastCaps) {
        const resolved = await resolveCityCandidate(lastCaps)
        if (resolved) userResolvedDestination = resolved
      }
    }
    if (userResolvedDestination) destination = userResolvedDestination

    if (!budget) {
      const textForBudget = `${userHistory} ${pdfText || ''}`
      const moneyRx = /([£$€])?\s*(\d{2,}(?:[.,]\d{1,2})?)\s*(usd|dollars|eur|euro|gbp|pounds|inr|rs|aed|sar|cad|aud)?/ig
      let m: RegExpExecArray | null
      let last: { symbol: string; amt: string; label: string } | null = null
      while ((m = moneyRx.exec(textForBudget)) !== null) {
        last = { symbol: m[1] || '', amt: m[2] || '', label: (m[3] || '').toLowerCase() }
      }
      if (last) {
        const amount = Math.round(parseFloat(last.amt.replace(/,/g, '')))
        let inferred = curr
        if (last.label.includes('usd') || last.label.includes('dollar') || last.symbol === '$') inferred = 'USD'
        else if (last.label.includes('gbp') || last.label.includes('pound') || last.symbol === '£') inferred = 'GBP'
        else if (last.label.includes('eur') || last.label.includes('euro') || last.symbol === '€') inferred = 'EUR'
        curr = inferred || curr
        if (!isNaN(amount)) budget = amount
      }
    }

    if (!destination && !budget && !isTravelIntent) {
      const content = await chatCompletionUnified(hf, messages as any, 0.7, 120)
      return NextResponse.json({ assistant: content || "Tell me a city and budget when you’re ready, and I’ll plan the trip." })
    }

    if (!destination && !budget && isGreeting) {
      const assistant = await llmGreet(hf, userHistory)
      return NextResponse.json({ assistant })
    }
    if (!destination && !budget && assistantShortQs >= 1 && lastTwoUser.length >= 1 && !/\d|\$/i.test(lastTwoUser[lastTwoUser.length-1].content)) {
      const assistant = await llmGreet(hf, userHistory)
      return NextResponse.json({ assistant })
    }

    let plan: any = null

    if (destination && (budget || pdfText)) {
      const days = startDate && endDate
        ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000*60*60*24)) + 1)
        : 3

      const toolPlan = await llmPlanWithTools(hf, {
        destination,
        budget: budget || 0,
        currency: curr,
        origin,
        days: days,
        interests,
        imageHints,
        pdfText
      })
      if (toolPlan && toolPlan.final_answer) {
        return NextResponse.json({ assistant: toolPlan.final_answer, plan: toolPlan.plan || null, budget_breakdown: toolPlan.budget_breakdown || null })
      }

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
        ? `Refine the provided scheme to fit constraints. Destination: ${destination}${origin ? ` | Origin: ${origin}` : ''}\n${budget ? `Budget: ${budget} ${curr}\n` : ''}Interests: ${interests.join(", ") || "general"}${imageHints ? ` | Image: ${imageHints}` : ''}\nFlight baseline: ${flightCost} ${curr}. Hotel baseline: ${hotelCost} ${curr}.\nProvided scheme (user):\n${providedPlan}\nReturn a short friendly response first, then a JSON block named PLAN with itinerary and budget_breakdown.`
        : `Create a ${days}-day trip for ${destination}${origin ? ` from ${origin}` : ''}.${budget ? `\nBudget: ${budget} ${curr}.` : ''} Interests: ${interests.join(", ") || "general"}.${imageHints ? ` Image hints: ${imageHints}.` : ''}${pdfText ? `\nConsider PDF notes: ${pdfText.slice(0, 2000)}` : ''}\nFlight baseline: ${flightCost} ${curr}. Hotel baseline: ${hotelCost} ${curr}. Recommend activities and approximate costs within constraints. Return a short friendly response first, then a JSON block named PLAN with itinerary and budget_breakdown.`

      const assistantText = await chatCompletionUnified(hf, [ { role: 'system', content: system }, { role: 'user', content: user } ], 0.6, 800)
      try {
        const m = assistantText.match(/PLAN\s*```json\s*([\s\S]*?)```/i) || assistantText.match(/PLAN\s*:\s*({[\s\S]*})/i)
        if (m) plan = JSON.parse(m[1])
      } catch {}

      return NextResponse.json({
        assistant: assistantText || `Here is a plan for ${destination}.`,
        plan,
        options: { flight: bestFlight || null, hotel: hotelEst || null },
      })
    }

    if (!destination && !budget) {
      const assistant = await llmClarify(hf, 'both', { history: userHistory, currency: curr })
      return NextResponse.json({ assistant })
    }
    if (!destination) {
      const assistant = await llmClarify(hf, 'destination', { history: userHistory, currency: curr })
      return NextResponse.json({ assistant })
    }
    if (!budget) {
      const assistant = await llmClarify(hf, 'budget', { history: userHistory, currency: curr, guessDestination: destination })
      return NextResponse.json({ assistant })
    }

    const responseText = await chatCompletionUnified(hf, messages as any, 0.7, 400)
    return NextResponse.json({ assistant: responseText || "Could you share the destination and total budget?" })
  } catch (err) {
    console.error("/api/chat error:", err)
    return NextResponse.json({ message: "Chat failed" }, { status: 500 })
  }
} 