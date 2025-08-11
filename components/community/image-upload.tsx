"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  disabled = false 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList) => {
    if (disabled || files.length === 0) return;

    // Check if adding these files would exceed the limit
    if (images.length + files.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append("files", file);
      });

      const response = await fetch("/api/upload/community", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        onImagesChange([...images, ...data.data.urls]);
      } else {
        alert(data.error || "Failed to upload images");
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Failed to upload images");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeImage = (index: number) => {
    if (disabled) return;
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          dragOver 
            ? "border-blue-400 bg-blue-50" 
            : disabled
              ? "border-gray-200 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 hover:border-gray-400"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <CardContent className="p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/webp"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
            className="hidden"
            disabled={disabled}
          />
          
          {uploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 text-blue-500 mx-auto animate-spin" />
              <p className="text-gray-600">Uploading images...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className={`h-8 w-8 mx-auto ${disabled ? "text-gray-300" : "text-gray-400"}`} />
              <div>
                <p className={`font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}>
                  Drop images here or click to browse
                </p>
                <p className={`text-sm ${disabled ? "text-gray-300" : "text-gray-500"}`}>
                  PNG, JPG, WebP up to 5MB each. Max {maxImages} images.
                </p>
                <p className={`text-xs ${disabled ? "text-gray-300" : "text-gray-400"}`}>
                  {images.length}/{maxImages} images uploaded
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                <img
                  src={imageUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback for broken images
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMiAxNkM5Ljc5IDI2IDggMTQuMjEgOCAxMkM4IDkuNzkgOS43OSA4IDEyIDhDMTQuMjEgOCAxNiA5Ljc5IDE2IDEyQzE2IDE0LjIxIDE0LjIxIDE2IDEyIDE2WiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K";
                  }}
                />
              </div>
              
              {!disabled && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black bg-opacity-50 rounded text-white text-xs px-2 py-1">
                  Image {index + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button (alternative to drag/drop) */}
      {images.length < maxImages && !uploading && (
        <Button
          variant="outline"
          onClick={openFileDialog}
          disabled={disabled}
          className="w-full"
        >
          <ImageIcon className="h-4 w-4 mr-2" />
          Add More Images ({images.length}/{maxImages})
        </Button>
      )}
    </div>
  );
}
