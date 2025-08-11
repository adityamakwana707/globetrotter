"use client"

import { useState, useRef, DragEvent } from "react"
import { Button } from "@/components/ui/button"
import { Upload, X, FileText, Image, File } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void
  acceptedTypes?: string[]
  maxFiles?: number
  maxSizeInMB?: number
  className?: string
}

export default function FileUploadZone({
  onFilesSelected,
  acceptedTypes = ["image/*", "application/pdf", ".doc,.docx"],
  maxFiles = 5,
  maxSizeInMB = 10,
  className = ""
}: FileUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return

    // Validate file count
    if (files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      })
      return
    }

    // Validate file sizes and types
    const validFiles: File[] = []
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024

    for (const file of files) {
      // Check file size
      if (file.size > maxSizeInBytes) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxSizeInMB}MB limit`,
          variant: "destructive",
        })
        continue
      }

      // Check file type
      const isValidType = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase())
        }
        return file.type.match(type.replace('*', '.*'))
      })

      if (!isValidType) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an accepted file type`,
          variant: "destructive",
        })
        continue
      }

      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      setIsUploading(true)
      try {
        await onFilesSelected(validFiles)
        toast({
          title: "Files uploaded",
          description: `${validFiles.length} file(s) uploaded successfully`,
        })
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Failed to upload files. Please try again.",
          variant: "destructive",
        })
      } finally {
        setIsUploading(false)
      }
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase()
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return <Image className="w-8 h-8 text-blue-400" />
    }
    
    if (['pdf'].includes(extension || '')) {
      return <FileText className="w-8 h-8 text-red-400" />
    }
    
    if (['doc', 'docx'].includes(extension || '')) {
      return <FileText className="w-8 h-8 text-blue-600" />
    }
    
    return <File className="w-8 h-8 text-gray-400" />
  }

  const getAcceptedTypesText = () => {
    return acceptedTypes.map(type => {
      if (type === "image/*") return "Images"
      if (type === "application/pdf") return "PDF"
      if (type === ".doc,.docx") return "Word Documents"
      return type
    }).join(", ")
  }

  return (
    <div
      className={`
        border-2 border-dashed rounded-lg p-6 text-center transition-colors
        ${isDragOver 
          ? 'border-blue-500 bg-blue-500/10' 
          : 'border-gray-600 hover:border-gray-500'
        }
        ${className}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isUploading ? (
        <div className="space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400">Uploading files...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mx-auto">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
          </div>
          
          <div>
            <p className="text-white font-medium mb-1">
              Drop files here or click to browse
            </p>
            <p className="text-gray-400 text-sm">
              Accepted: {getAcceptedTypesText()}
            </p>
            <p className="text-gray-400 text-sm">
              Max {maxFiles} files, {maxSizeInMB}MB each
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Choose Files
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}
    </div>
  )
}
