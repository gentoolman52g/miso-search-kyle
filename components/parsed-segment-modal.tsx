"use client"

import React, { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileText, HelpCircle, BookOpen, Hash, X, Eye, EyeOff } from 'lucide-react'
import { ParsedSegment, ParsedRegulationSegment, ParsedFaqSegment } from '@/lib/segment-parser'

interface ParsedSegmentModalProps {
  isOpen: boolean
  onClose: () => void
  parsedSegment: ParsedSegment | null
  docColor: {
    bg: string
    border: string
    accent: string
  }
}

const RegulationModalContent = ({ 
  segment, 
  docColor 
}: { 
  segment: ParsedRegulationSegment
  docColor: any
}) => (
  <div className="space-y-6">
    <div className="space-y-4">
      {segment.documentName && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">문서명</h3>
          <Badge variant="outline" className={`text-sm ${docColor.accent} border-current px-3 py-1`}>
            {segment.documentName}
          </Badge>
        </div>
      )}
      
      {segment.chapter && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">장 정보</h3>
          <div className="flex items-center gap-3 text-base">
            <BookOpen className={`h-4 w-4 ${docColor.accent}`} />
            <span className={`font-semibold ${docColor.accent}`}>
              {segment.chapter.number}
            </span>
            <span className="text-foreground">
              {segment.chapter.title}
            </span>
          </div>
        </div>
      )}
      
      {segment.article && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">조 정보</h3>
          <div className="flex items-center gap-3 text-base">
            <Hash className={`h-4 w-4 ${docColor.accent}`} />
            <span className={`font-semibold ${docColor.accent}`}>
              {segment.article.number}
            </span>
            <span className="text-foreground">
              {segment.article.title}
            </span>
          </div>
        </div>
      )}
    </div>
    
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">내용</h3>
      <div className={`${docColor.bg} rounded-xl p-4 border ${docColor.border}`}>
        <p className="text-base leading-relaxed whitespace-pre-wrap">
          {segment.content}
        </p>
      </div>  
    </div>
  </div>
)

const FaqModalContent = ({ 
  segment, 
  docColor 
}: { 
  segment: ParsedFaqSegment
  docColor: any
}) => (
  <div className="space-y-6">
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-2">FAQ 정보</h3>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-sm ${docColor.accent} border-current px-3 py-1`}>
            FAQ
          </Badge>
          <Badge variant="secondary" className="text-sm px-3 py-1">
            {segment.topic}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {segment.rowId}
          </span>
        </div>
      </div>
    </div>
    
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">질문</h3>
      <div className="bg-muted/30 rounded-xl p-4">
        <p className="text-base font-medium leading-relaxed">
          {segment.question}
        </p>
      </div>
    </div>
    
    <div>
      <h3 className="text-sm font-medium text-muted-foreground mb-3">답변</h3>
      <div className={`${docColor.bg} rounded-xl p-4 border ${docColor.border}`}>
        <p className="text-base leading-relaxed whitespace-pre-wrap">
          {segment.answer}
        </p>
      </div>
    </div>
  </div>
)

export const ParsedSegmentModal: React.FC<ParsedSegmentModalProps> = ({
  isOpen,
  onClose,
  parsedSegment,
  docColor
}) => {
  const [showOriginal, setShowOriginal] = useState(false)

  if (!isOpen || !parsedSegment) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        <div className={`${docColor.bg} px-6 py-4 border-b border-border/20`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className={`text-lg font-semibold ${docColor.accent}`}>
                  {parsedSegment.type === 'regulation' ? 
                    (parsedSegment.documentName || '규정 문서') : 
                    'FAQ'
                  }
                </h2>
                <p className="text-sm text-muted-foreground">
                  구조화된 내용 보기
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowOriginal(!showOriginal)}
                className="rounded-full"
              >
                {showOriginal ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    구조화된 보기
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    원문 보기
                  </>
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="rounded-full"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {showOriginal ? (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">원문 내용</h3>
              <div className="text-base leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-4">
                {parsedSegment.originalContent}
              </div>
            </div>
          ) : (
            parsedSegment.type === 'regulation' ? (
              <RegulationModalContent 
                segment={parsedSegment}
                docColor={docColor}
              />
            ) : (
              <FaqModalContent 
                segment={parsedSegment}
                docColor={docColor}
              />
            )
          )}
        </div>
      </div>
    </div>
  )
} 