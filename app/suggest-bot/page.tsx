"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  imageUrl?: string
}

export default function SuggestBotPage() {
  const [currency, setCurrency] = useState("USD")
  const [input, setInput] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I’m your travel budget bot. Tell me your origin, destination, dates, and budget, or just paste a vibe image and I’ll help." },
  ])
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState<any | null>(null)

  const sendMessage = async () => {
    if (!input.trim() && !imageUrl.trim()) return
    const newMsg: ChatMessage = { role: "user", content: input.trim() || "(image)", imageUrl: imageUrl || undefined }
    const nextMessages = [...messages, newMsg]
    setMessages(nextMessages)
    setInput("")
    setImageUrl("")
    setLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, currency }),
      })
      const data = await res.json()
      if (data?.assistant) setMessages(prev => [...prev, { role: "assistant", content: data.assistant }])
      setPlan(data?.plan || null)
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Public Travel Chatbot</CardTitle>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">Currency</span>
              <Input value={currency} onChange={e => setCurrency(e.target.value)} className="w-24" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto border rounded p-3 bg-white">
            {messages.map((m, idx) => (
              <div key={idx} className={`${m.role === 'assistant' ? 'text-blue-700' : 'text-slate-800'}`}>
                <p className="whitespace-pre-wrap text-sm">
                  <span className="font-medium">{m.role === 'assistant' ? 'Assistant' : 'You'}:</span> {m.content}
                </p>
                {m.imageUrl && (
                  <a href={m.imageUrl} className="text-xs text-blue-500 underline" target="_blank" rel="noreferrer">image</a>
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-2">
            <Input className="md:col-span-3" placeholder="Type your message (e.g., From NYC to Paris, May 1-6, budget 1200 USD)" value={input} onChange={e => setInput(e.target.value)} />
            <Input className="md:col-span-1" placeholder="Optional image URL" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
            <Button className="md:col-span-1" onClick={sendMessage} disabled={loading}>{loading ? 'Sending…' : 'Send'}</Button>
          </div>
        </CardContent>
      </Card>

      {plan && (
        <Card>
          <CardHeader>
            <CardTitle>Proposed Plan</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-3 rounded border overflow-x-auto">{JSON.stringify(plan, null, 2)}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 