"use client"

import {
  FileCheck,
  Clock,
  Hash,
  FileType,
  Gauge,
  List,
  StickyNote,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import type { SupportingDocumentResponse } from "@/lib/types"

interface DocumentResultsProps {
  documents: SupportingDocumentResponse[]
}

export function DocumentResults({ documents }: DocumentResultsProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (documents.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-muted-foreground">
        Processed Documents ({documents.length})
      </h3>

      {documents.map((doc) => (
        <Card key={doc.document_id} className="overflow-hidden">
          <CardHeader className="pb-3 bg-muted/30">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <FileCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-sm font-medium truncate max-w-[250px]">
                    {doc.file_name}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(doc.file_size)}
                  </p>
                </div>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-100 text-emerald-800 border-emerald-200"
              >
                {doc.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Document ID</p>
                  <p className="text-sm font-mono">{doc.document_id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileType className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="text-sm">{doc.document_type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Uploaded</p>
                  <p className="text-sm">{formatDate(doc.upload_date)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <List className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Fields Extracted</p>
                  <p className="text-sm">{doc.validation.extracted_fields}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Confidence Score
                  </span>
                </div>
                <span className="text-sm font-medium">
                  {(doc.validation.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <Progress
                value={doc.validation.confidence * 100}
                className="h-2"
              />
            </div>

            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <div className="flex items-start gap-2">
                <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5" />
                <p className="text-xs text-muted-foreground">{doc.notes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
