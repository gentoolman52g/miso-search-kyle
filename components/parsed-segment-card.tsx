"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { BookOpen, Hash, Edit } from 'lucide-react'
import { ParsedSegment, ParsedRegulationSegment, ParsedFaqSegment } from '@/lib/segment-parser'
import { KnowledgeSegment } from '@/lib/miso/types'

interface ParsedSegmentCardProps {
  parsedSegment: ParsedSegment
  isHovered?: boolean
  docColor: {
    bg: string
    border: string
    accent: string
  }
  onClick?: () => void
  onEditSegment?: (segment: KnowledgeSegment) => void
  originalSegment?: KnowledgeSegment
}

const RegulationSegmentContent = ({ 
  segment, 
  isHovered, 
  docColor 
}: { 
  segment: ParsedRegulationSegment
  isHovered?: boolean
  docColor: any
}) => (
  <>
    <CardHeader className="pb-3">
      <div className="space-y-2">
        {segment.documentName && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${docColor.accent} border-current`}>
              {segment.documentName}
            </Badge>
          </div>
        )}
        
        {segment.chapter && (
          <div className="flex items-center gap-2 text-sm">
            <BookOpen className={`h-3 w-3 ${docColor.accent}`} />
            <span className={`font-medium ${docColor.accent}`}>
              {segment.chapter.number}
            </span>
            <span className="text-muted-foreground">
              {segment.chapter.title}
            </span>
          </div>
        )}
        
        {segment.article && (
          <div className="flex items-center gap-2 text-sm">
            <Hash className={`h-3 w-3 ${docColor.accent}`} />
            <span className={`font-medium ${docColor.accent}`}>
              {segment.article.number}
            </span>
            <span className="text-foreground/80">
              {segment.article.title}
            </span>
          </div>
        )}
      </div>
    </CardHeader>
    
    <CardContent className="pt-0">
      <div className={`
        text-sm leading-relaxed transition-colors duration-200
        ${isHovered ? 'text-foreground' : 'text-foreground/80'}
      `}>
        <p className="line-clamp-4">
          {segment.content}
        </p>
      </div>
    </CardContent>
  </>
)

const FaqSegmentContent = ({ 
  segment, 
  isHovered, 
  docColor 
}: { 
  segment: ParsedFaqSegment
  isHovered?: boolean
  docColor: any
}) => (
  <>
    <CardHeader className="pb-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className={`text-xs ${docColor.accent} border-current`}>
            FAQ
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {segment.topic}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {segment.rowId}
          </span>
        </div>
      </div>
    </CardHeader>
    
    <CardContent className="pt-0 space-y-3">
      <div>
        <p className="text-xs text-muted-foreground mb-1">질문</p>
        <p className={`
          text-sm font-medium leading-relaxed transition-colors duration-200
          ${isHovered ? 'text-foreground' : 'text-foreground/90'}
          line-clamp-2
        `}>
          {segment.question}
        </p>
      </div>
      
      <div className={`
        pt-3 border-t transition-all duration-200
        ${isHovered 
          ? `${docColor.border} bg-background/40` 
          : 'border-border/20 bg-background/20'
        }
        rounded-xl p-3 -mx-1
      `}>
        <p className="text-xs text-muted-foreground mb-1">답변</p>
        <p className="text-sm leading-relaxed text-foreground/85 line-clamp-2">
          {segment.answer}
        </p>
      </div>
    </CardContent>
  </>
)

export const ParsedSegmentCard: React.FC<ParsedSegmentCardProps> = ({
  parsedSegment,
  isHovered = false,
  docColor,
  onClick,
  onEditSegment,
  originalSegment
}) => {
  return (
    <Card
      className={`
        h-64 overflow-hidden cursor-pointer relative
        transition-all duration-300 ease-out
        ${docColor.bg}
        ${isHovered 
          ? `${docColor.border} shadow-lg scale-[1.02] -translate-y-1` 
          : 'border-border/20 shadow-sm hover:shadow-md'
        }
        rounded-2xl
        group
      `}
    >
      {/* 편집 버튼 */}
      {onEditSegment && originalSegment && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEditSegment(originalSegment)
          }}
          className={`
            absolute top-2 right-2 z-10 p-1.5 rounded-lg
            bg-white/80 hover:bg-white border border-gray-200
            opacity-0 group-hover:opacity-100 transition-opacity duration-200
            hover:shadow-md
          `}
          title="세그먼트 수정"
        >
          <Edit className="h-3.5 w-3.5 text-gray-600" />
        </button>
      )}

      <div onClick={onClick}>
        {parsedSegment.type === 'regulation' ? (
          <RegulationSegmentContent 
            segment={parsedSegment}
            isHovered={isHovered}
            docColor={docColor}
          />
        ) : (
          <FaqSegmentContent 
            segment={parsedSegment}
            isHovered={isHovered}
            docColor={docColor}
          />
        )}
      </div>
    </Card>
  )
} 