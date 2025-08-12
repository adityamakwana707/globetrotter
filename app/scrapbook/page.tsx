"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import ImageUpload from "@/components/community/image-upload"
import { Plus, Loader2 } from "lucide-react"

interface ScrapbookEntry {
  id: number
  title: string
  content: string
  images: string[]
  created_at: string
}

export default function ScrapbookPage() {
  const { data: session } = useSession()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [entries, setEntries] = useState<ScrapbookEntry[]>([])

  const fetchEntries = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/scrapbook?limit=50")
      const data = await res.json()
      if (data.success) setEntries(data.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) fetchEntries()
  }, [session?.user])

  const submit = async () => {
    if (!title.trim() || !content.trim()) return
    setSaving(true)
    try {
      const res = await fetch("/api/scrapbook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, images }),
      })
      const data = await res.json()
      if (data.success) {
        setTitle("")
        setContent("")
        setImages([])
        await fetchEntries()
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" /> Add a memory
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea placeholder="Write your memory..." value={content} onChange={(e) => setContent(e.target.value)} rows={5} />
          <ImageUpload images={images} onImagesChange={setImages} maxImages={10} uploadUrl="/api/upload/scrapbook" />
          <div className="flex justify-end">
            <Button onClick={submit} disabled={saving || !title.trim() || !content.trim()}>
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Save
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading...</div>
        ) : entries.length === 0 ? (
          <p className="text-gray-500">No memories yet.</p>
        ) : (
          entries.map((e) => (
            <Card key={e.id}>
              <CardHeader>
                <CardTitle>{e.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="whitespace-pre-wrap">{e.content}</p>
                {e.images?.length ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {e.images.map((url, i) => (
                      <img key={i} src={url} alt="memory" className="w-full h-40 object-cover rounded" />
                    ))}
                  </div>
                ) : null}
                <p className="text-xs text-gray-500">{new Date(e.created_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}


