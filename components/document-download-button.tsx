"use client"

import { useState } from "react"
import { Download, FileText, FileDown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu"
import { reconstructDocument, downloadDocument, convertKnowledgeSegmentsToSegmentData } from "@/lib/document-download"
import { fetchSegmentsByDocument } from "@/app/miso-actions"
import { toast } from "sonner"

interface DocumentDownloadButtonProps {
  datasetId: string
  documentId: string
  documentName: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
  className?: string
}

export function DocumentDownloadButton({
  datasetId,
  documentId,
  documentName,
  variant = "outline",
  size = "sm",
  showText = true,
  className = ""
}: DocumentDownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownload = async (format: 'text' | 'markdown', includeMetadata: boolean = true) => {
    if (isDownloading) return

    setIsDownloading(true)
    
    try {
      // 서버 액션을 통해 세그먼트 조회
      const result = await fetchSegmentsByDocument(documentId, datasetId)
      
      if (result.error) {
        throw new Error(result.error)
      }

      const segments = result.data || []
      
      if (segments.length === 0) {
        throw new Error('문서에 세그먼트가 없습니다')
      }

      // KnowledgeSegment를 SegmentData로 변환
      const segmentData = convertKnowledgeSegmentsToSegmentData(segments)
      
      // 문서 재구성
      const content = reconstructDocument(segmentData, {
        includeMetadata,
        separateSegments: true,
        format
      })
      
      // 파일 다운로드
      const sanitizedName = documentName.replace(/[^\w\s-]/g, '').trim() || 'document'
      downloadDocument(content, sanitizedName, format)
      
      toast.success(`${documentName} 다운로드가 완료되었습니다`, {
        description: `${format === 'markdown' ? 'Markdown' : '텍스트'} 파일로 저장되었습니다`
      })
      
    } catch (error) {
      console.error('다운로드 실패:', error)
      toast.error("다운로드 실패", {
        description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다"
      })
    } finally {
      setIsDownloading(false)
    }
  }

  if (size === "icon" || !showText) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={variant}
            size={size}
            disabled={isDownloading}
            className={className}
            aria-label="문서 다운로드"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => handleDownload('text', true)}>
            <FileText className="mr-2 h-4 w-4" />
            텍스트 파일 (.txt)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload('markdown', true)}>
            <FileDown className="mr-2 h-4 w-4" />
            마크다운 파일 (.md)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDownload('text', false)}>
            <FileText className="mr-2 h-4 w-4" />
            텍스트 (메타데이터 제외)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={isDownloading}
          className={className}
        >
          {isDownloading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isDownloading ? "다운로드 중..." : "다운로드"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleDownload('text', true)}>
          <FileText className="mr-2 h-4 w-4" />
          텍스트 파일 (.txt)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownload('markdown', true)}>
          <FileDown className="mr-2 h-4 w-4" />
          마크다운 파일 (.md)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => handleDownload('text', false)}>
          <FileText className="mr-2 h-4 w-4" />
          텍스트 (메타데이터 제외)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 