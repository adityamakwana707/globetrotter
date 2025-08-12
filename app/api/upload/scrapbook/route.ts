import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { randomUUID } from "crypto"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 })
    }

    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, error: "No files provided" }, { status: 400 })
    }

    const maxFileSize = 5 * 1024 * 1024
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    const maxFiles = 10

    if (files.length > maxFiles) {
      return NextResponse.json({ success: false, error: `Maximum ${maxFiles} files allowed` }, { status: 400 })
    }

    for (const file of files) {
      if (file.size > maxFileSize) {
        return NextResponse.json({ success: false, error: "File size must be less than 5MB" }, { status: 400 })
      }
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json({ success: false, error: "Only JPEG, PNG, and WebP images are allowed" }, { status: 400 })
      }
    }

    const uploadsDir = join(process.cwd(), "public", "uploads", "scrapbook")
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch {}

    const urls: string[] = []
    for (const file of files) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ext = file.name.split(".").pop()
      const filename = `${randomUUID()}.${ext}`
      await writeFile(join(uploadsDir, filename), buffer)
      urls.push(`/uploads/scrapbook/${filename}`)
    }

    return NextResponse.json({ success: true, data: { urls } })
  } catch (error) {
    console.error("Error uploading scrapbook images:", error)
    return NextResponse.json({ success: false, error: "Failed to upload images" }, { status: 500 })
  }
}


