"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import ImageUpload from "@/components/community/image-upload"
import { Plus, Loader2, BookOpen, Heart, Calendar, MapPin, Camera, Edit3, Trash2, ChevronLeft, ChevronRight, Star, Compass } from "lucide-react"

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
  const [isBookOpen, setIsBookOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)
  const [currentEntryPage, setCurrentEntryPage] = useState(0)
  const [isOpening, setIsOpening] = useState(false)

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
        setIsBookOpen(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const deleteEntry = async (id: number) => {
    if (confirm("Are you sure you want to delete this memory?")) {
      try {
        const res = await fetch(`/api/scrapbook/${id}`, { method: "DELETE" })
        if (res.ok) await fetchEntries()
      } catch (error) {
        console.error("Failed to delete entry:", error)
      }
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const openBook = () => {
    setIsOpening(true)
    setTimeout(() => {
      setIsBookOpen(true)
      setIsOpening(false)
    }, 300)
  }

  const closeBook = () => {
    setIsOpening(true)
    setTimeout(() => {
      setIsBookOpen(false)
      setIsOpening(false)
    }, 300)
  }

  const nextEntryPage = () => {
    if (currentEntryPage < entries.length - 1) {
      setCurrentEntryPage(currentEntryPage + 1)
    }
  }

  const prevEntryPage = () => {
    if (currentEntryPage > 0) {
      setCurrentEntryPage(currentEntryPage - 1)
    }
  }

  const goToEntryPage = (page: number) => {
    if (page >= 0 && page < entries.length) {
      setCurrentEntryPage(page)
    }
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="w-16 h-16 mx-auto text-amber-600 mb-4" />
          <h1 className="text-2xl font-bold text-amber-800 mb-2">Your Travel Scrapbook</h1>
          <p className="text-amber-700">Please sign in to access your memories</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg border border-amber-200">
            <BookOpen className="w-8 h-8 text-amber-600" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
              My Travel Scrapbook
            </h1>
            <Heart className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
        </div>

        {/* Book Container */}
        <div className="relative">
          {/* Book Cover */}
          <div className={`relative book-cover rounded-2xl shadow-2xl border-4 border-amber-300 overflow-hidden transition-all duration-500 ${isOpening ? 'scale-105 rotate-1' : ''}`}>
            {/* Book Cover Design */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-200/50 to-orange-200/50"></div>
            
            {/* Decorative Elements */}
            <div className="absolute top-4 right-4 w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center shadow-lg">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            
            {/* Corner Decoration */}
            <div className="absolute top-0 left-0 w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 transform -rotate-45 origin-top-left"></div>
            <div className="absolute top-4 left-6 w-3 h-3 bg-white rounded-full shadow-sm"></div>
            
            {/* Book Pages */}
            <div className="relative book-pages min-h-[600px] mx-8 my-8 rounded-lg shadow-inner border border-gray-200 bg-gradient-to-br from-white via-amber-50/20 to-white">
              {!isBookOpen ? (
                /* Book Cover View */
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-24 h-24 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
                    <Camera className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-amber-800 mb-4">Capture Your Adventures</h2>
                  <p className="text-amber-700 mb-6 max-w-md">
                    Every journey tells a story. Document your travels, memories, and experiences in this beautiful digital scrapbook.
                  </p>
                  <Button 
                    onClick={openBook}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <BookOpen className="w-5 h-5 mr-2" />
                    Open Scrapbook
                  </Button>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 mt-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-amber-600">{entries.length}</div>
                      <div className="text-sm text-amber-700">Memories</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {entries.reduce((acc, entry) => acc + (entry.images?.length || 0), 0)}
                      </div>
                      <div className="text-sm text-orange-700">Photos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {entries.length > 0 ? Math.ceil(entries.reduce((acc, entry) => acc + entry.content.length, 0) / 100) : 0}
                      </div>
                      <div className="text-sm text-red-700">Pages</div>
                    </div>
                  </div>
                  
                  {/* Decorative Icons */}
                  <div className="absolute bottom-4 left-4 text-amber-400 floating-icon">
                    <Compass className="w-8 h-8" />
                  </div>
                  <div className="absolute bottom-4 right-4 text-orange-400 floating-icon">
                    <Star className="w-8 h-8" />
                  </div>
                </div>
              ) : (
                /* Book Content View */
                <div className="h-full flex flex-col">
                  {/* Book Header */}
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-t-lg">
                    <div className="flex items-center justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={closeBook}
                        className="text-white hover:bg-white/20"
                      >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Cover
                      </Button>
                      <h3 className="font-semibold">Your Travel Memories</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCurrentPage(0)}
                        className="text-white hover:bg-white/20"
                      >
                        <BookOpen className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Book Content */}
                  <div className="flex-1 p-6 overflow-y-auto book-content">
                    {currentPage === 0 ? (
                      /* Add New Entry Page */
                      <div className="max-w-2xl mx-auto">
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6 border border-amber-200 shadow-lg">
                          <h3 className="text-xl font-bold text-amber-800 mb-4 flex items-center gap-2">
                            <Edit3 className="w-5 h-5" />
                            Write a New Memory
                          </h3>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-amber-700 mb-2">Memory Title</label>
                              <Input 
                                placeholder="Give your memory a title..." 
                                value={title} 
                                onChange={(e) => setTitle(e.target.value)}
                                className="border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-amber-700 mb-2">Your Story</label>
                              <Textarea 
                                placeholder="Write about your experience, feelings, and memories..." 
                                value={content} 
                                onChange={(e) => setContent(e.target.value)} 
                                rows={6}
                                className="border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-amber-700 mb-2">Add Photos</label>
                              <ImageUpload 
                                images={images} 
                                onImagesChange={setImages} 
                                maxImages={10} 
                                uploadUrl="/api/upload/scrapbook" 
                              />
                            </div>
                            
                            <Button 
                              onClick={submit} 
                              disabled={saving || !title.trim() || !content.trim()}
                              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white py-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Saving Memory...
                                </>
                              ) : (
                                <>
                                  <Heart className="h-4 w-4 mr-2" />
                                  Save to Scrapbook
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* View Entries - Book Style */
                      <div className="h-full flex flex-col">
                        {loading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                            <span className="ml-2 text-amber-700">Loading your memories...</span>
                          </div>
                        ) : entries.length === 0 ? (
                          <div className="text-center py-12">
                            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <BookOpen className="w-8 h-8 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-amber-800 mb-2">No memories yet</h3>
                            <p className="text-amber-700">Start documenting your travels by adding your first memory!</p>
                          </div>
                        ) : (
                          <>
                            {/* Current Entry Page */}
                            <div className="flex-1">
                              <div className="bg-white rounded-lg shadow-lg border border-amber-200 overflow-hidden memory-card h-full">
                                {/* Entry Header */}
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <h3 className="text-xl font-bold text-amber-800 mb-1">
                                        {entries[currentEntryPage]?.title}
                                      </h3>
                                      <div className="flex items-center gap-4 text-sm text-amber-600">
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-4 h-4" />
                                          {entries[currentEntryPage] && formatDate(entries[currentEntryPage].created_at)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <MapPin className="w-4 h-4" />
                                          Memory #{currentEntryPage + 1} of {entries.length}
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteEntry(entries[currentEntryPage]?.id)}
                                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                                
                                {/* Book-style Two-Column Layout */}
                                <div className="flex min-h-[400px]">
                                  {/* Left Side - Text Content (Like Left Page) */}
                                  <div className="flex-1 p-6 border-r border-amber-200 book-page-left">
                                    <div className="h-full flex flex-col">
                                      {/* Story Content */}
                                      <div className="flex-1">
                                        <h4 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                                          <Edit3 className="w-4 h-4" />
                                          Your Story
                                        </h4>
                                        <div className="prose prose-amber max-w-none">
                                          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                                            {entries[currentEntryPage]?.content}
                                          </p>
                                        </div>
                                      </div>
                                      
                                      {/* Memory Details */}
                                      <div className="mt-6 pt-4 border-t border-amber-100">
                                        <div className="grid grid-cols-2 gap-4 text-xs text-amber-600">
                                          <div className="flex items-center gap-2">
                                            <Calendar className="w-3 h-3" />
                                            <span>Created: {entries[currentEntryPage] && new Date(entries[currentEntryPage].created_at).toLocaleDateString()}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <MapPin className="w-3 h-3" />
                                            <span>Memory #{currentEntryPage + 1}</span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Footer Note */}
                                      <div className="mt-4 pt-3 border-t border-amber-100">
                                        <div className="flex items-center gap-2 text-amber-500">
                                          <Heart className="w-3 h-3" />
                                          <span className="text-xs italic">A precious travel memory</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {/* Right Side - Images (Like Right Page) */}
                                  <div className="flex-1 p-6 book-page-right">
                                    <div className="h-full flex flex-col">
                                      {/* Images Header */}
                                      <div className="mb-4">
                                        <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                                          <Camera className="w-4 h-4" />
                                          Photo Memories
                                        </h4>
                                      </div>
                                      
                                      {/* Images Display */}
                                      {entries[currentEntryPage]?.images?.length > 0 ? (
                                        <div className="flex-1">
                                          <div className="grid grid-cols-1 gap-3 h-full">
                                            {entries[currentEntryPage].images.map((url, i) => (
                                              <div key={i} className="relative group overflow-hidden rounded-lg photo-hover border border-orange-200">
                                                <img 
                                                  src={url} 
                                                  alt={`Memory ${i + 1}`} 
                                                  className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" 
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                                                  Photo {i + 1}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="flex-1 flex items-center justify-center">
                                          <div className="text-center text-orange-400">
                                            <Camera className="w-16 h-16 mx-auto mb-3 opacity-50" />
                                            <p className="text-sm">No photos added yet</p>
                                            <p className="text-xs text-orange-300">Add photos to make this memory complete</p>
                                          </div>
                                        </div>
                                      )}
                                      
                                      {/* Image Counter */}
                                      <div className="mt-4 pt-3 border-t border-orange-100">
                                        <div className="text-center">
                                          <span className="text-xs text-orange-600">
                                            {entries[currentEntryPage]?.images?.length || 0} photo{(entries[currentEntryPage]?.images?.length || 0) !== 1 ? 's' : ''} captured
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Book Page Navigation */}
                            <div className="mt-6 flex items-center justify-center gap-4">
                              <Button
                                onClick={prevEntryPage}
                                disabled={currentEntryPage === 0}
                                variant="outline"
                                className="px-6 py-2 border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                              >
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Previous Page
                              </Button>
                              
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-amber-600 font-medium">
                                  Page {currentEntryPage + 1} of {entries.length}
                                </span>
                              </div>
                              
                              <Button
                                onClick={nextEntryPage}
                                disabled={currentEntryPage === entries.length - 1}
                                variant="outline"
                                className="px-6 py-2 border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                              >
                                Next Page
                                <ChevronRight className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                            
                            {/* Quick Page Navigation */}
                            {entries.length > 1 && (
                              <div className="mt-4 flex items-center justify-center gap-2">
                                <span className="text-xs text-amber-500">Go to page:</span>
                                <div className="flex gap-1">
                                  {Array.from({ length: entries.length }, (_, i) => (
                                    <Button
                                      key={i}
                                      onClick={() => goToEntryPage(i)}
                                      variant={currentEntryPage === i ? "default" : "outline"}
                                      size="sm"
                                      className={`w-8 h-8 p-0 text-xs ${
                                        currentEntryPage === i 
                                          ? 'bg-amber-600 text-white' 
                                          : 'border-amber-300 text-amber-600 hover:bg-amber-50'
                                      }`}
                                    >
                                      {i + 1}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                     )} </div>
                    
                    
                    {/* Book Content - Single Entry Display */}
                    <div className={`transition-all duration-300 ${currentPage === 1 ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                      {currentPage === 1 && (
                        <div className="h-full flex flex-col">
                          {loading ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
                              <span className="ml-2 text-amber-700">Loading your memories...</span>
                            </div>
                          ) : entries.length === 0 ? (
                            <div className="text-center py-12">
                              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-8 h-8 text-amber-600" />
                              </div>
                              <h3 className="text-lg font-semibold text-amber-800 mb-2">No memories yet</h3>
                              <p className="text-amber-700">Start documenting your travels by adding your first memory!</p>
                            </div>
                          ) : (
                            <>
                              {/* Current Entry Page */}
                              <div className="flex-1">
                                <div className="bg-white rounded-lg shadow-lg border border-amber-200 overflow-hidden memory-card h-full">
                                  {/* Entry Header */}
                                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200">
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <h3 className="text-xl font-bold text-amber-800 mb-1">
                                          {entries[currentEntryPage]?.title}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-amber-600">
                                          <span className="flex items-center gap-1">
                                            <Calendar className="w-4 h-4" />
                                            {entries[currentEntryPage] && formatDate(entries[currentEntryPage].created_at)}
                                          </span>
                                          <span className="flex items-center gap-1">
                                            <MapPin className="w-4 h-4" />
                                            Memory #{currentEntryPage + 1} of {entries.length}
                                          </span>
                                        </div>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteEntry(entries[currentEntryPage]?.id)}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  
                                  {/* Book-style Two-Column Layout */}
                                  <div className="flex min-h-[400px]">
                                    {/* Left Side - Text Content (Like Left Page) */}
                                    <div className="flex-1 p-6 border-r border-amber-200 book-page-left">
                                      <div className="h-full flex flex-col">
                                        {/* Story Content */}
                                        <div className="flex-1">
                                          <h4 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
                                            <Edit3 className="w-4 h-4" />
                                            Your Story
                                          </h4>
                                          <div className="prose prose-amber max-w-none">
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">
                                              {entries[currentEntryPage]?.content}
                                            </p>
                                          </div>
                                        </div>
                                        
                                        {/* Memory Details */}
                                        <div className="mt-6 pt-4 border-t border-amber-100">
                                          <div className="grid grid-cols-2 gap-4 text-xs text-amber-600">
                                            <div className="flex items-center gap-2">
                                              <Calendar className="w-3 h-3" />
                                              <span>Created: {entries[currentEntryPage] && new Date(entries[currentEntryPage].created_at).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <MapPin className="w-3 h-3" />
                                              <span>Memory #{currentEntryPage + 1}</span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        {/* Footer Note */}
                                        <div className="mt-4 pt-3 border-t border-amber-100">
                                          <div className="flex items-center gap-2 text-amber-500">
                                            <Heart className="w-3 h-3" />
                                            <span className="text-xs italic">A precious travel memory</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    {/* Right Side - Images (Like Right Page) */}
                                    <div className="flex-1 p-6 book-page-right">
                                      <div className="h-full flex flex-col">
                                        {/* Images Header */}
                                        <div className="mb-4">
                                          <h4 className="text-lg font-semibold text-orange-800 mb-3 flex items-center gap-2">
                                            <Camera className="w-4 h-4" />
                                            Photo Memories
                                          </h4>
                                        </div>
                                        
                                        {/* Images Display */}
                                        {entries[currentEntryPage]?.images?.length > 0 ? (
                                          <div className="flex-1">
                                            <div className="grid grid-cols-1 gap-3 h-full">
                                              {entries[currentEntryPage].images.map((url, i) => (
                                                <div key={i} className="relative group overflow-hidden rounded-lg photo-hover border border-orange-200">
                                                  <img 
                                                    src={url} 
                                                    alt={`Memory ${i + 1}`} 
                                                    className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105" 
                                                  />
                                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                                  <div className="absolute bottom-2 left-2 text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                                                    Photo {i + 1}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="flex-1 flex items-center justify-center">
                                            <div className="text-center text-orange-400">
                                              <Camera className="w-16 h-16 mx-auto mb-3 opacity-50" />
                                              <p className="text-sm">No photos added yet</p>
                                              <p className="text-xs text-orange-300">Add photos to make this memory complete</p>
                                            </div>
                                          </div>
                                        )}
                                        
                                        {/* Image Counter */}
                                        <div className="mt-4 pt-3 border-t border-orange-100">
                                          <div className="text-center">
                                            <span className="text-xs text-orange-600">
                                              {entries[currentEntryPage]?.images?.length || 0} photo{(entries[currentEntryPage]?.images?.length || 0) !== 1 ? 's' : ''} captured
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Book Page Navigation */}
                              <div className="mt-6 flex items-center justify-center gap-4">
                                <Button
                                  onClick={prevEntryPage}
                                  disabled={currentEntryPage === 0}
                                  variant="outline"
                                  className="px-6 py-2 border-amber-300 text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                                >
                                  <ChevronLeft className="w-4 h-4 mr-2" />
                                  Previous Page
                                </Button>
                                
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-amber-600 font-medium">
                                    Page {currentEntryPage + 1} of {entries.length}
                                  </span>
                                </div>
                                
                                <Button
                                  onClick={nextEntryPage}
                                  disabled={currentEntryPage === entries.length - 1}
                                  variant="outline"
                                  className="px-6 py-2 border-amber-300 text-amber-700 hover:bg-amber-50 disabled:bg-amber-50"
                                >
                                  Next Page
                                  <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                              </div>
                              
                              {/* Quick Page Navigation */}
                              {entries.length > 1 && (
                                <div className="mt-4 flex items-center justify-center gap-2">
                                  <span className="text-xs text-amber-500">Go to page:</span>
                                  <div className="flex gap-1">
                                    {Array.from({ length: entries.length }, (_, i) => (
                                      <Button
                                        key={i}
                                        onClick={() => goToEntryPage(i)}
                                        variant={currentEntryPage === i ? "default" : "outline"}
                                        size="sm"
                                        className={`w-8 h-8 p-0 text-xs ${
                                          currentEntryPage === i 
                                            ? 'bg-amber-600 text-white' 
                                            : 'border-amber-300 text-amber-600 hover:bg-amber-50'
                                        }`}
                                      >
                                        {i + 1}
                                      </Button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>

                  {/* Book Navigation */}
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-4 rounded-b-lg">
                    <div className="flex items-center justify-between">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCurrentPage(0)}
                        className={`text-white hover:bg-white/20 ${currentPage === 0 ? 'bg-white/20' : ''}`}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        New Entry
                      </Button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Page {currentPage + 1}</span>
                      </div>
                      
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setCurrentPage(1)}
                        className={`text-white hover:bg-white/20 ${currentPage === 1 ? 'bg-white/20' : ''}`}
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        View All
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}