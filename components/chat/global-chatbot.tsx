"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, Send, Minus, Settings2, X, FileText } from "lucide-react"

interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export default function GlobalChatbot() {
  const [open, setOpen] = useState(false)
  const [currency, setCurrency] = useState("USD")
  const [input, setInput] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I’m your travel budget bot. You can type details or attach a PDF with your plan/budget." },
  ])
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showOptions, setShowOptions] = useState(false)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, open])

  const sendMessage = async () => {
    if (!input.trim() && !file) return
    const newMsg: ChatMessage = { role: "user", content: input.trim() || (file ? `(PDF: ${file.name})` : "") }
    const nextMessages = [...messages, newMsg]
    setMessages(nextMessages)
    setInput("")
    setLoading(true)
    try {
      let res: Response
      if (file) {
        const form = new FormData()
        form.append('messages', JSON.stringify(nextMessages))
        form.append('currency', currency)
        form.append('file', file)
        res = await fetch('/api/chat', { method: 'POST', body: form })
      } else {
        res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: nextMessages, currency }),
        })
      }
      const data = await res.json()
      if (data?.assistant) setMessages(prev => [...prev, { role: "assistant", content: data.assistant }])
    } catch (e) {
      setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I ran into an error." }])
    } finally {
      setLoading(false)
      setFile(null)
    }
  }

  return (
    <>
      {!open && (
        <div className="fixed bottom-5 right-5 z-50">
          <Button
            onClick={() => setOpen(true)}
            className="rounded-full shadow-lg h-12 w-12 p-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
            aria-label="Open chat"
            title="Chat"
          >
            <MessageCircle className="h-6 w-6 text-white" />
          </Button>
        </div>
      )}

      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-80 md:w-96 bg-white dark:bg-slate-950 border border-gray-200 dark:border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900 text-white">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="font-semibold text-sm">Travel Chatbot</span>
              <input
                className="w-16 text-xs px-2 py-0.5 rounded bg-white/10 border border-white/20 focus:outline-none"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                title="Currency"
              />
            </div>
            <div className="flex items-center gap-1">
              <Button size="icon" variant="outline" className="h-7 w-7 bg-white/10 border-white/20 text-white" onClick={() => setShowOptions(v => !v)} aria-label="Options" title="Options">
                <Settings2 className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="outline" className="h-7 w-7 bg-white/10 border-white/20 text-white" onClick={() => setOpen(false)} aria-label="Minimize" title="Minimize">
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button size="icon" variant="outline" className="h-7 w-7 bg-white/10 border-white/20 text-white" onClick={() => setOpen(false)} aria-label="Close" title="Close">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Optional options (PDF upload) */}
          {showOptions && (
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800">
              <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <FileText className="h-4 w-4" /> Attach PDF
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-xs"
                />
              </label>
              {file && (
                <p className="text-xs mt-1 text-slate-500">Selected: {file.name}</p>
              )}
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="px-3 py-3 space-y-2 h-[28rem] overflow-y-auto bg-white dark:bg-slate-950">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${m.role === 'user' ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'} rounded-2xl px-3 py-2 max-w-[85%] shadow-sm ${m.role === 'user' ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input row */}
          <div className="p-2 bg-slate-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type your message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="flex-1"
              />
              <Button onClick={sendMessage} disabled={loading} className="shrink-0 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600" aria-label="Send">
                {loading ? (
                  <span className="text-white text-sm">…</span>
                ) : (
                  <Send className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 