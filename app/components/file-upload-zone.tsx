"use client"

import { useCallback, useState } from "react"
import { Upload, FileText, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadZoneProps {
  onFileSelect: (file: File) => void
  acceptedTypes?: string
  disabled?: boolean
  className?: string
}

export function FileUploadZone({
  onFileSelect,
  acceptedTypes = ".pdf,.docx,.png,.jpg,.jpeg",
  disabled = false,
  className,
}: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): boolean => {
    const validExtensions = acceptedTypes.split(",").map((ext) => ext.trim().toLowerCase())
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`
    
    if (!validExtensions.includes(fileExtension)) {
      setError(`Invalid file type. Accepted: ${acceptedTypes}`)
      return false
    }
    
    // 50MB max file size
    if (file.size > 50 * 1024 * 1024) {
      setError("File size must be less than 50MB")
      return false
    }
    
    setError(null)
    return true
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const file = e.dataTransfer.files[0]
      if (file && validateFile(file)) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    },
    [disabled, onFileSelect]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file && validateFile(file)) {
        setSelectedFile(file)
        onFileSelect(file)
      }
    },
    [onFileSelect]
  )

  const clearFile = () => {
    setSelectedFile(null)
    setError(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className={className}>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative rounded-lg border-2 border-dashed transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer"
        )}
      >
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileInput}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
          <p className="text-xs text-muted-foreground mb-4">Upload Acord125</p>
          {selectedFile ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  clearFile()
                }}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mb-3">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                Drag and drop your file here
              </p>
              <p className="text-xs text-muted-foreground">
                or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                PDF, DOCX, PNG, JPG (max 50MB)
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 mt-2 text-sm text-destructive">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
