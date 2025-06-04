"use client"

import type React from "react"

import { useState, useEffect, useTransition, useCallback, useMemo, useRef } from "react"
import { Search, ArrowRight, Loader2, AlertTriangle, FileText, BookOpen, X, ExternalLink, Sparkles, Plus, Filter, Edit, MoreVertical } from "lucide-react"
import { searchMisoKnowledge, fetchInitialKnowledgeData, fetchAllDocuments, fetchSegmentsByDocument } from "@/app/miso-actions"
import type { KnowledgeSegment } from "@/lib/miso/types"
import { parseSegmentContent, type ParsedSegment } from "@/lib/segment-parser"
import { ParsedSegmentCard } from "@/components/parsed-segment-card"
import { ParsedSegmentModal } from "@/components/parsed-segment-modal"
import { SegmentModal, type EditSegmentData } from "@/components/add-segment-modal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

// 모달 컴포넌트
const Modal = ({ 
  isOpen, 
  onClose, 
  segment, 
  docColor 
}: { 
  isOpen: boolean
  onClose: () => void
  segment: KnowledgeSegment | null
  docColor: any
}) => {
  if (!isOpen || !segment) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-background rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] w-full mx-4 overflow-hidden">
        <div className={`${docColor.bg} px-6 py-4 border-b border-border/20`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h2 className={`text-lg font-semibold ${docColor.accent}`}>
                  {segment.documentName || '문서'}
                </h2>
                <p className="text-sm text-muted-foreground">
                  전체 내용 보기
                </p>
              </div>
            </div>
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
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {segment.content && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">원문 내용</h3>
                <div className="text-base leading-relaxed whitespace-pre-wrap bg-muted/30 rounded-xl p-4">
                  {segment.content}
                </div>
              </div>
            )}
            
            {segment.answer && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">AI 요약</h3>
                <div className={`${docColor.bg} rounded-xl p-4 border ${docColor.border}`}>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">
                    {segment.answer}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const AnimatedPageTitle = () => {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-3 transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <Image 
        src="/main-icon.png" 
        alt="검색 아이콘" 
        width={64} 
        height={64} 
        className="text-accent" 
      />
      <div className="text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">MISO Knowledge Manager</h1>
        <p className="text-muted-foreground text-sm">당신의 데이터셋을 더 편하게 관리하세요</p>
      </div>
    </div>
  )
}

const SearchBar = ({
  onSearch,
  onInputChange,
  isPending,
}: {
  onSearch: (query: string) => void
  onInputChange: (value: string) => void
  isPending: boolean
}) => {
  const [inputValue, setInputValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim() && !isPending) {
      onSearch(inputValue.trim())
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    onInputChange(value) // 실시간 필터링을 위한 콜백
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full max-w-2xl mx-auto transition-all duration-700 ease-out ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
    >
      <div
        className={`
        group relative flex items-center
        bg-background rounded-2xl border-2
        transition-all duration-300 ease-out
        ${isFocused ? "border-accent shadow-lg shadow-accent/20 scale-[1.02]" : "border-border/40 shadow-sm"}
      `}
      >
        <Search
          className={`absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
            isFocused ? "text-accent" : "text-muted-foreground"
          }`}
        />
        <Input
          type="text"
          placeholder="검색하거나 아래 카드들을 실시간으로 필터링해보세요..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full h-14 pl-14 pr-14 py-4 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none rounded-2xl text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={isPending}
        />
        {inputValue && !isPending && (
          <Button
            type="submit"
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 bg-accent hover:bg-accent/90 text-accent-foreground rounded-xl"
            aria-label="검색"
            disabled={isPending}
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
        )}
      </div>
    </form>
  )
}

// 문서 타입 정의
interface DocumentInfo {
  id: string
  name: string
  datasetId: string
  datasetName: string
}

const SearchResults = ({ 
  results, 
  error, 
  onEditSegment 
}: { 
  results: KnowledgeSegment[]
  error: string | null
  onEditSegment: (segment: KnowledgeSegment) => void
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<KnowledgeSegment | null>(null)
  const [selectedParsedSegment, setSelectedParsedSegment] = useState<ParsedSegment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isParsedModalOpen, setIsParsedModalOpen] = useState(false)

  const openModal = (segment: KnowledgeSegment) => {
    const parsedSegment = parseSegmentContent(segment.content || '')
    if (parsedSegment) {
      setSelectedParsedSegment(parsedSegment)
      setIsParsedModalOpen(true)
    } else {
      setSelectedSegment(segment)
      setIsModalOpen(true)
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setIsParsedModalOpen(false)
    setSelectedSegment(null)
    setSelectedParsedSegment(null)
  }

  if (error) {
    return (
      <div className="mt-12 text-center">
        <div className="inline-flex flex-col items-center gap-4 p-8 bg-destructive/5 rounded-2xl border border-destructive/20 animate-fade-in-up">
          <div className="p-3 rounded-2xl bg-destructive/10">
            <AlertTriangle size={32} className="text-destructive" />
          </div>
          <div>
            <p className="font-semibold text-lg text-destructive mb-1">검색 중 오류가 발생했습니다</p>
            <p className="text-sm text-destructive/70">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="mt-12 text-center animate-fade-in-up">
        <div className="inline-flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-muted/20">
            <FileText size={32} className="text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-lg font-medium mb-1">검색 결과가 없습니다</p>
            <p className="text-sm text-muted-foreground/60">다른 키워드로 다시 검색해보세요</p>
          </div>
        </div>
      </div>
    )
  }

  // 문서별 색상 매핑을 위한 함수 (문서 ID 기준, 20가지 색상)
  const getDocumentColor = (documentId: string) => {
    const colors = [
      { name: 'blue', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800/50', accent: 'text-blue-600 dark:text-blue-400' },
      { name: 'purple', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800/50', accent: 'text-purple-600 dark:text-purple-400' },
      { name: 'green', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800/50', accent: 'text-green-600 dark:text-green-400' },
      { name: 'orange', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800/50', accent: 'text-orange-600 dark:text-orange-400' },
      { name: 'pink', bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-200 dark:border-pink-800/50', accent: 'text-pink-600 dark:text-pink-400' },
      { name: 'cyan', bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800/50', accent: 'text-cyan-600 dark:text-cyan-400' },
      { name: 'indigo', bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800/50', accent: 'text-indigo-600 dark:text-indigo-400' },
      { name: 'red', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800/50', accent: 'text-red-600 dark:text-red-400' },
      { name: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800/50', accent: 'text-yellow-600 dark:text-yellow-400' },
      { name: 'teal', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800/50', accent: 'text-teal-600 dark:text-teal-400' },
      { name: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/50', accent: 'text-emerald-600 dark:text-emerald-400' },
      { name: 'lime', bg: 'bg-lime-50 dark:bg-lime-950/30', border: 'border-lime-200 dark:border-lime-800/50', accent: 'text-lime-600 dark:text-lime-400' },
      { name: 'amber', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/50', accent: 'text-amber-600 dark:text-amber-400' },
      { name: 'rose', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800/50', accent: 'text-rose-600 dark:text-rose-400' },
      { name: 'fuchsia', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30', border: 'border-fuchsia-200 dark:border-fuchsia-800/50', accent: 'text-fuchsia-600 dark:text-fuchsia-400' },
      { name: 'violet', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800/50', accent: 'text-violet-600 dark:text-violet-400' },
      { name: 'sky', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800/50', accent: 'text-sky-600 dark:text-sky-400' },
      { name: 'slate', bg: 'bg-slate-50 dark:bg-slate-950/30', border: 'border-slate-200 dark:border-slate-800/50', accent: 'text-slate-600 dark:text-slate-400' },
      { name: 'zinc', bg: 'bg-zinc-50 dark:bg-zinc-950/30', border: 'border-zinc-200 dark:border-zinc-800/50', accent: 'text-zinc-600 dark:text-zinc-400' },
      { name: 'stone', bg: 'bg-stone-50 dark:bg-stone-950/30', border: 'border-stone-200 dark:border-stone-800/50', accent: 'text-stone-600 dark:text-stone-400' }
    ]
    
    const neutralColor = { name: 'neutral', bg: 'bg-muted/30', border: 'border-border/40', accent: 'text-muted-foreground' }
    
    if (!documentId) return neutralColor
    
    // 문서 ID 해시를 기반으로 일관된 색상 선택
    const hash = documentId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  return (
    <>
      <div className="mt-12 w-full max-w-7xl">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            {results.length}개의 검색 결과 • 카드를 클릭하여 전체 내용을 확인하세요
          </p>
        </div>
        
        {/* Material Design 3 균일한 높이 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {results.map((segment, index) => {
            const cardId = segment.id || `segment-${index}`
            const isHovered = hoveredCard === cardId
            const docColor = getDocumentColor(segment.documentId || '')
            const parsedSegment = parseSegmentContent(segment.content || '')
            
            return (
              <div
                key={cardId}
                style={{ 
                  animationDelay: `${index * 50}ms`
                }}
                onMouseEnter={() => setHoveredCard(cardId)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => openModal(segment)}
                className="animate-fade-in-up"
              >
                {parsedSegment ? (
                  <ParsedSegmentCard
                    parsedSegment={parsedSegment}
                    isHovered={isHovered}
                    docColor={docColor}
                    onClick={() => openModal(segment)}
                    onEditSegment={onEditSegment}
                    originalSegment={segment}
                  />
                ) : (
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditSegment(segment)
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

                    <CardHeader className="pb-3" onClick={() => openModal(segment)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {segment.documentName && (
                            <CardTitle className={`
                              text-sm font-medium leading-snug transition-colors duration-200 line-clamp-2
                              ${isHovered ? docColor.accent : 'text-foreground'}
                            `}>
                              {segment.documentName}
                            </CardTitle>
                          )}
                        </div>
                        {isHovered && (
                          <ExternalLink className={`h-3 w-3 ${docColor.accent} opacity-60 flex-shrink-0 ml-2`} />
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 h-[calc(100%-80px)] flex flex-col" onClick={() => openModal(segment)}>
                      {segment.content && (
                        <div className={`
                          text-sm leading-relaxed transition-colors duration-200 flex-1
                          ${isHovered ? 'text-foreground' : 'text-foreground/80'}
                        `}>
                          <p className="line-clamp-4 mb-3">{segment.content}</p>
                        </div>
                      )}
                      
                      {segment.answer && (
                        <div className={`
                          mt-auto pt-3 border-t transition-all duration-200
                          ${isHovered 
                            ? `${docColor.border} bg-background/40` 
                            : 'border-border/20 bg-background/20'
                          }
                          rounded-xl p-3 -mx-1
                        `}>
                          <p className="text-xs text-muted-foreground mb-1">AI 요약</p>
                          <p className="text-sm leading-relaxed text-foreground/85 line-clamp-2">
                            {segment.answer}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* 기존 모달 */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        segment={selectedSegment}
        docColor={selectedSegment ? getDocumentColor(selectedSegment.documentId || '') : null}
      />
      
      {/* 파싱된 세그먼트 모달 */}
      <ParsedSegmentModal
        isOpen={isParsedModalOpen}
        onClose={closeModal}
        parsedSegment={selectedParsedSegment}
        docColor={selectedParsedSegment ? getDocumentColor('') : { bg: 'bg-muted/30', border: 'border-border/40', accent: 'text-muted-foreground' }}
      />
    </>
  )
}

// 초기 지식 데이터를 보여주는 컴포넌트 (필터링 및 무한 스크롤 지원)
const InitialKnowledge = ({ 
  results, 
  error, 
  isLoading,
  filterText,
  onLoadMore,
  hasMore,
  isLoadingMore,
  onAddSegment,
  onEditSegment,
  selectedDocumentId,
  onDocumentChange,
  documents,
  isLoadingDocuments
}: { 
  results: KnowledgeSegment[]
  error: string | null
  isLoading: boolean
  filterText: string
  onLoadMore: () => void
  hasMore: boolean
  isLoadingMore: boolean
  onAddSegment: () => void
  onEditSegment: (segment: KnowledgeSegment) => void
  selectedDocumentId: string
  onDocumentChange: (documentId: string) => void
  documents: DocumentInfo[]
  isLoadingDocuments: boolean
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)
  const [selectedSegment, setSelectedSegment] = useState<KnowledgeSegment | null>(null)
  const [selectedParsedSegment, setSelectedParsedSegment] = useState<ParsedSegment | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isParsedModalOpen, setIsParsedModalOpen] = useState(false)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // 필터링된 결과 계산 - 텍스트와 문서 필터 모두 적용
  const filteredResults = useMemo(() => {
    let filtered = results

    // 텍스트 필터 적용
    if (filterText.trim()) {
      const searchTerm = filterText.toLowerCase()
      filtered = filtered.filter((segment) => {
        const content = segment.content?.toLowerCase() || ''
        const answer = segment.answer?.toLowerCase() || ''
        const documentName = segment.documentName?.toLowerCase() || ''
        return content.includes(searchTerm) || answer.includes(searchTerm) || documentName.includes(searchTerm)
      })
    }

    // 문서 필터 적용 (전체 문서일 때만 - 특정 문서 선택 시에는 이미 해당 문서 데이터만 로드됨)
    if (selectedDocumentId && selectedDocumentId !== 'all') {
      // 특정 문서가 선택된 경우, 이미 해당 문서의 데이터만 results에 있으므로 추가 필터링 불필요
      // 하지만 안전을 위해 한 번 더 필터링
      filtered = filtered.filter((segment) => segment.documentId === selectedDocumentId)
    }

    return filtered
  }, [results, filterText, selectedDocumentId])

  // Intersection Observer로 무한 스크롤 구현
  useEffect(() => {
    if (!hasMore || isLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, onLoadMore])

  const openModal = useCallback((segment: KnowledgeSegment) => {
    const parsedSegment = parseSegmentContent(segment.content || '')
    if (parsedSegment) {
      setSelectedParsedSegment(parsedSegment)
      setIsParsedModalOpen(true)
    } else {
      setSelectedSegment(segment)
      setIsModalOpen(true)
    }
  }, [])

  const closeModal = useCallback(() => {
    setIsModalOpen(false)
    setIsParsedModalOpen(false)
    setSelectedSegment(null)
    setSelectedParsedSegment(null)
  }, [])

  // 문서별 색상 매핑을 위한 함수 (기존과 동일)
  const getDocumentColor = useCallback((documentId: string) => {
    const colors = [
      { name: 'blue', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800/50', accent: 'text-blue-600 dark:text-blue-400' },
      { name: 'purple', bg: 'bg-purple-50 dark:bg-purple-950/30', border: 'border-purple-200 dark:border-purple-800/50', accent: 'text-purple-600 dark:text-purple-400' },
      { name: 'green', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-200 dark:border-green-800/50', accent: 'text-green-600 dark:text-green-400' },
      { name: 'orange', bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800/50', accent: 'text-orange-600 dark:text-orange-400' },
      { name: 'pink', bg: 'bg-pink-50 dark:bg-pink-950/30', border: 'border-pink-200 dark:border-pink-800/50', accent: 'text-pink-600 dark:text-pink-400' },
      { name: 'cyan', bg: 'bg-cyan-50 dark:bg-cyan-950/30', border: 'border-cyan-200 dark:border-cyan-800/50', accent: 'text-cyan-600 dark:text-cyan-400' },
      { name: 'indigo', bg: 'bg-indigo-50 dark:bg-indigo-950/30', border: 'border-indigo-200 dark:border-indigo-800/50', accent: 'text-indigo-600 dark:text-indigo-400' },
      { name: 'red', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800/50', accent: 'text-red-600 dark:text-red-400' },
      { name: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-950/30', border: 'border-yellow-200 dark:border-yellow-800/50', accent: 'text-yellow-600 dark:text-yellow-400' },
      { name: 'teal', bg: 'bg-teal-50 dark:bg-teal-950/30', border: 'border-teal-200 dark:border-teal-800/50', accent: 'text-teal-600 dark:text-teal-400' },
      { name: 'emerald', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800/50', accent: 'text-emerald-600 dark:text-emerald-400' },
      { name: 'lime', bg: 'bg-lime-50 dark:bg-lime-950/30', border: 'border-lime-200 dark:border-lime-800/50', accent: 'text-lime-600 dark:text-lime-400' },
      { name: 'amber', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800/50', accent: 'text-amber-600 dark:text-amber-400' },
      { name: 'rose', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800/50', accent: 'text-rose-600 dark:text-rose-400' },
      { name: 'fuchsia', bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/30', border: 'border-fuchsia-200 dark:border-fuchsia-800/50', accent: 'text-fuchsia-600 dark:text-fuchsia-400' },
      { name: 'violet', bg: 'bg-violet-50 dark:bg-violet-950/30', border: 'border-violet-200 dark:border-violet-800/50', accent: 'text-violet-600 dark:text-violet-400' },
      { name: 'sky', bg: 'bg-sky-50 dark:bg-sky-950/30', border: 'border-sky-200 dark:border-sky-800/50', accent: 'text-sky-600 dark:text-sky-400' },
      { name: 'slate', bg: 'bg-slate-50 dark:bg-slate-950/30', border: 'border-slate-200 dark:border-slate-800/50', accent: 'text-slate-600 dark:text-slate-400' },
      { name: 'zinc', bg: 'bg-zinc-50 dark:bg-zinc-950/30', border: 'border-zinc-200 dark:border-zinc-800/50', accent: 'text-zinc-600 dark:text-zinc-400' },
      { name: 'stone', bg: 'bg-stone-50 dark:bg-stone-950/30', border: 'border-stone-200 dark:border-stone-800/50', accent: 'text-stone-600 dark:text-stone-400' }
    ]
    
    const neutralColor = { name: 'neutral', bg: 'bg-muted/30', border: 'border-border/40', accent: 'text-muted-foreground' }
    
    if (!documentId) return neutralColor
    
    const hash = documentId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }, [])

  if (isLoading) {
    return (
      <div className="mt-12 w-full max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">지식 데이터셋 미리보기</h2>
            <p className="text-sm text-muted-foreground">사용 가능한 지식 데이터를 불러오는 중...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card 
              key={index} 
              className="h-64 bg-muted/20 border-border/20 animate-pulse rounded-2xl"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-muted/40 rounded-xl" />
                  <div className="flex-1">
                    <div className="w-3/4 h-4 bg-muted/40 rounded mb-2" />
                    <div className="w-1/2 h-3 bg-muted/30 rounded" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-muted/30 rounded" />
                  <div className="w-5/6 h-3 bg-muted/30 rounded" />
                  <div className="w-4/5 h-3 bg-muted/30 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mt-12 w-full max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">지식 데이터셋 미리보기</h2>
            <p className="text-sm text-muted-foreground">사용 가능한 지식 데이터를 미리 확인하세요</p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="inline-flex flex-col items-center gap-4 p-8 bg-destructive/5 rounded-2xl border border-destructive/20">
            <div className="p-3 rounded-2xl bg-destructive/10">
              <AlertTriangle size={32} className="text-destructive" />
            </div>
            <div>
              <p className="font-semibold text-lg text-destructive mb-1">데이터 로딩 중 오류가 발생했습니다</p>
              <p className="text-sm text-destructive/70">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (filteredResults.length === 0 && results.length > 0) {
    return (
      <div className="mt-12 w-full max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">지식 데이터셋 미리보기</h2>
            <p className="text-sm text-muted-foreground">
              총 {results.length}개 중 0개 필터링 결과
            </p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="p-4 rounded-2xl bg-muted/20">
              <Search size={32} className="text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-lg font-medium mb-1">"{filterText}"에 대한 결과가 없습니다</p>
              <p className="text-sm text-muted-foreground/60">다른 키워드로 검색해보세요</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="mt-12 w-full max-w-7xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent/10">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">지식 데이터셋 미리보기</h2>
            <p className="text-sm text-muted-foreground">사용 가능한 데이터가 없습니다</p>
          </div>
        </div>
        
        <div className="text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="p-4 rounded-2xl bg-muted/20">
              <FileText size={32} className="text-muted-foreground/50" />
            </div>
            <div>
              <p className="text-lg font-medium mb-1">지식 데이터셋을 먼저 설정해주세요</p>
              <p className="text-sm text-muted-foreground/60">지식 데이터셋을 먼저 설정해주세요</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="mt-12 w-full max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-accent/10">
              <Sparkles className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">지식 데이터셋 미리보기</h2>
              <p className="text-sm text-muted-foreground">
                {filterText ? `"${filterText}"에 대한 ${filteredResults.length}개 결과` : `${filteredResults.length}개의 지식 세그먼트`} • 카드를 클릭하여 전체 내용을 확인하세요
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedDocumentId} onValueChange={onDocumentChange}>
              <SelectTrigger className="w-[200px] rounded-xl">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="flex-1 text-left">
                    {isLoadingDocuments 
                      ? "로딩 중..." 
                      : selectedDocumentId === "all" 
                        ? "전체 문서" 
                        : documents.find(doc => doc.id === selectedDocumentId)?.name || "문서 선택"
                    }
                  </span>
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 문서</SelectItem>
                {documents.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{doc.name}</span>
                      <span className="text-xs text-muted-foreground">{doc.datasetName}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={onAddSegment}
              className="rounded-xl"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              추가하기
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredResults.map((segment, index) => {
            const cardId = `${segment.id}-${index}-${results.length}` // 고유한 key 생성
            const isHovered = hoveredCard === cardId
            const docColor = getDocumentColor(segment.documentId || '')
            const parsedSegment = parseSegmentContent(segment.content || '')
            
            return (
              <div
                key={cardId}
                style={{ 
                  animationDelay: `${index * 30}ms`
                }}
                onMouseEnter={() => setHoveredCard(cardId)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => openModal(segment)}
                className="animate-fade-in-up"
              >
                {parsedSegment ? (
                  <ParsedSegmentCard
                    parsedSegment={parsedSegment}
                    isHovered={isHovered}
                    docColor={docColor}
                    onClick={() => openModal(segment)}
                    onEditSegment={onEditSegment}
                    originalSegment={segment}
                  />
                ) : (
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditSegment(segment)
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

                    <CardHeader className="pb-3" onClick={() => openModal(segment)}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          {segment.documentName && (
                            <CardTitle className={`
                              text-sm font-medium leading-snug transition-colors duration-200 line-clamp-2
                              ${isHovered ? docColor.accent : 'text-foreground'}
                            `}>
                              {segment.documentName}
                            </CardTitle>
                          )}
                        </div>
                        {isHovered && (
                          <ExternalLink className={`h-3 w-3 ${docColor.accent} opacity-60 flex-shrink-0 ml-2`} />
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 h-[calc(100%-80px)] flex flex-col" onClick={() => openModal(segment)}>
                      {segment.content && (
                        <div className={`
                          text-sm leading-relaxed transition-colors duration-200 flex-1
                          ${isHovered ? 'text-foreground' : 'text-foreground/80'}
                        `}>
                          <p className="line-clamp-4 mb-3">{segment.content}</p>
                        </div>
                      )}
                      
                      {segment.answer && (
                        <div className={`
                          mt-auto pt-3 border-t transition-all duration-200
                          ${isHovered 
                            ? `${docColor.border} bg-background/40` 
                            : 'border-border/20 bg-background/20'
                          }
                          rounded-xl p-3 -mx-1
                        `}>
                          <p className="text-xs text-muted-foreground mb-1">AI 요약</p>
                          <p className="text-sm leading-relaxed text-foreground/85 line-clamp-2">
                            {segment.answer}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          })}
        </div>

        {/* 무한 스크롤을 위한 로드 더 버튼/인디케이터 */}
        {!filterText && selectedDocumentId === "all" && hasMore && (
          <div ref={loadMoreRef} className="mt-8 flex justify-center">
            {isLoadingMore ? (
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-accent/5">
                <Loader2 className="h-5 w-5 animate-spin text-accent" />
                <span className="text-sm text-muted-foreground">더 많은 데이터를 불러오는 중...</span>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={onLoadMore}
                className="px-6 py-3 rounded-2xl border-dashed hover:bg-accent/5"
              >
                더 많은 지식 데이터 보기
              </Button>
            )}
          </div>
        )}
      </div>
      
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        segment={selectedSegment}
        docColor={selectedSegment ? getDocumentColor(selectedSegment.documentId || '') : null}
      />
      
      <ParsedSegmentModal
        isOpen={isParsedModalOpen}
        onClose={closeModal}
        parsedSegment={selectedParsedSegment}
        docColor={selectedParsedSegment ? getDocumentColor('') : { bg: 'bg-muted/30', border: 'border-border/40', accent: 'text-muted-foreground' }}
      />
    </>
  )
}

export default function MisoKnowledgeManagerClient() {
  const [isPending, startTransition] = useTransition()
  const [searchResults, setSearchResults] = useState<KnowledgeSegment[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  
  // 초기 데이터 상태 관리
  const [initialData, setInitialData] = useState<KnowledgeSegment[]>([])
  const [initialError, setInitialError] = useState<string | null>(null)
  const [isLoadingInitial, setIsLoadingInitial] = useState(true)
  const [filterText, setFilterText] = useState("")
  const [hasMoreData, setHasMoreData] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [loadedSegmentIds, setLoadedSegmentIds] = useState<Set<string>>(new Set()) // 중복 방지를 위한 세트

  // 추가하기 모달 상태
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  // 편집 모달 상태
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editSegmentData, setEditSegmentData] = useState<EditSegmentData | undefined>(undefined)

  // 문서 필터링 상태
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("all")
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(true)
  const [isLoadingDocumentSegments, setIsLoadingDocumentSegments] = useState(false)

  // 문서 목록 로드
  useEffect(() => {
    const loadDocuments = async () => {
      setIsLoadingDocuments(true)
      try {
        const result = await fetchAllDocuments()
        if (result.error) {
          console.error('Error loading documents:', result.error)
        } else if (result.data) {
          setDocuments(result.data)
        }
      } catch (error) {
        console.error('Error loading documents:', error)
      } finally {
        setIsLoadingDocuments(false)
      }
    }

    loadDocuments()
  }, [])

  // 초기 데이터 로드
  useEffect(() => {
    const loadInitialData = async () => {
      if (selectedDocumentId !== "all") return // 특정 문서 선택 시에는 초기 데이터 로드하지 않음
      
      setIsLoadingInitial(true)
      setInitialError(null)
      setLoadedSegmentIds(new Set()) // 초기화
      setCurrentOffset(0)
      
      try {
        const result = await fetchInitialKnowledgeData(50, 0)
        if (result.error) {
          setInitialError(result.error)
          setInitialData([])
        } else if (result.data) {
          // 중복 제거
          const newLoadedIds = new Set<string>()
          const uniqueSegments = result.data.filter(segment => {
            if (!newLoadedIds.has(segment.id)) {
              newLoadedIds.add(segment.id)
              return true
            }
            return false
          })
          
          setLoadedSegmentIds(newLoadedIds)
          setInitialData(uniqueSegments)
          setHasMoreData(result.hasMore || false)
          setCurrentOffset(uniqueSegments.length)
        }
      } catch (error) {
        console.error('Error loading initial data:', error)
        setInitialError('초기 데이터를 불러오는 중 문제가 발생했습니다.')
      } finally {
        setIsLoadingInitial(false)
      }
    }

    loadInitialData()
  }, [selectedDocumentId]) // selectedDocumentId가 변경될 때마다 다시 로드

  // 더 많은 데이터 로드 (전체 문서일 때만)
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMoreData || selectedDocumentId !== "all") return

    setIsLoadingMore(true)
    try {
      const result = await fetchInitialKnowledgeData(50, currentOffset)
      if (result.error) {
        setInitialError(result.error)
      } else if (result.data) {
        // 중복 제거
        const uniqueNewSegments = result.data.filter(segment => {
          return !loadedSegmentIds.has(segment.id)
        })
        
        if (uniqueNewSegments.length > 0) {
          // 로드된 세그먼트 ID 세트 업데이트
          setLoadedSegmentIds(prev => {
            const newSet = new Set(prev)
            uniqueNewSegments.forEach(segment => newSet.add(segment.id))
            return newSet
          })
          
          setInitialData(prev => [...prev, ...uniqueNewSegments])
          setCurrentOffset(prev => prev + uniqueNewSegments.length)
        }
        
        setHasMoreData(result.hasMore || false)
      }
    } catch (error) {
      console.error('Error loading more data:', error)
      setInitialError('추가 데이터를 불러오는 중 문제가 발생했습니다.')
    } finally {
      setIsLoadingMore(false)
    }
  }, [currentOffset, hasMoreData, isLoadingMore, loadedSegmentIds, selectedDocumentId])

  const handleSearch = useCallback((query: string) => {
    setHasSearched(true)
    setSearchError(null)
    setSearchResults([])
    setFilterText("")
    setSelectedDocumentId("all") // 검색 시 문서 필터 초기화
    startTransition(async () => {
      const result = await searchMisoKnowledge(query)
      if (result.error) {
        setSearchError(result.error)
        setSearchResults([])
      } else if (result.data) {
        setSearchResults(result.data)
      }
    })
  }, [])

  const handleInputChange = useCallback((value: string) => {
    if (!hasSearched) {
      setFilterText(value)
    }
  }, [hasSearched])

  const handleDocumentChange = useCallback(async (documentId: string) => {
    setSelectedDocumentId(documentId)
    setFilterText("") // 필터 텍스트 초기화
    
    if (documentId === "all") {
      // 전체 문서 선택 시 초기 데이터 다시 로드
      return // useEffect에서 처리됨
    } else {
      // 특정 문서 선택 시 해당 문서의 모든 세그먼트 로드
      setIsLoadingDocumentSegments(true)
      setInitialError(null)
      
      try {
        const selectedDoc = documents.find(doc => doc.id === documentId)
        if (selectedDoc) {
          const result = await fetchSegmentsByDocument(documentId, selectedDoc.datasetId)
          if (result.error) {
            setInitialError(result.error)
            setInitialData([])
          } else if (result.data) {
            setInitialData(result.data)
            setHasMoreData(false) // 특정 문서의 모든 데이터를 로드했으므로 더 이상 로드할 데이터 없음
          }
        }
      } catch (error) {
        console.error('Error loading document segments:', error)
        setInitialError('문서 세그먼트를 불러오는 중 문제가 발생했습니다.')
      } finally {
        setIsLoadingDocumentSegments(false)
      }
    }
  }, [documents])

  // 추가하기 모달 관련 핸들러
  const handleAddSegmentSuccess = useCallback(async () => {
    // 성공 시 데이터 새로고침
    if (selectedDocumentId === "all") {
      // 전체 문서일 때는 초기 데이터 새로고침
      setIsLoadingInitial(true)
      setInitialError(null)
      setLoadedSegmentIds(new Set())
      setCurrentOffset(0)
      
      try {
        const result = await fetchInitialKnowledgeData(50, 0)
        if (result.error) {
          setInitialError(result.error)
          setInitialData([])
        } else if (result.data) {
          const newLoadedIds = new Set<string>()
          const uniqueSegments = result.data.filter(segment => {
            if (!newLoadedIds.has(segment.id)) {
              newLoadedIds.add(segment.id)
              return true
            }
            return false
          })
          
          setLoadedSegmentIds(newLoadedIds)
          setInitialData(uniqueSegments)
          setHasMoreData(result.hasMore || false)
          setCurrentOffset(uniqueSegments.length)
        }
      } catch (error) {
        console.error('Error refreshing initial data:', error)
        setInitialError('데이터를 새로고침하는 중 문제가 발생했습니다.')
      } finally {
        setIsLoadingInitial(false)
      }
    } else {
      // 특정 문서일 때는 해당 문서 데이터 새로고침
      handleDocumentChange(selectedDocumentId)
    }
  }, [selectedDocumentId, handleDocumentChange])

  // 편집 세그먼트 핸들러
  const handleEditSegment = useCallback((segment: KnowledgeSegment) => {
    if (!segment.documentId) {
      console.error('No document ID found for segment')
      return
    }

    // 세그먼트가 속한 문서의 데이터셋 ID 찾기
    const document = documents.find(doc => doc.id === segment.documentId)
    if (!document) {
      console.error('Document not found for segment')
      return
    }

    setEditSegmentData({
      id: segment.id,
      documentId: segment.documentId,
      datasetId: document.datasetId,
      content: segment.content || '',
      answer: segment.answer,
      keywords: segment.keywords
    })
    setIsEditModalOpen(true)
  }, [documents])

  // 편집 성공 핸들러 (추가와 동일한 로직 사용)
  const handleEditSegmentSuccess = useCallback(async () => {
    setIsEditModalOpen(false)
    setEditSegmentData(undefined)
    await handleAddSegmentSuccess() // 동일한 새로고침 로직 사용
  }, [handleAddSegmentSuccess])

  return (
    <main className="flex flex-col items-center justify-start min-h-screen pt-16 pb-24 px-6 bg-gradient-to-br from-background via-background to-muted/20 selection:bg-accent/30 selection:text-accent-foreground">
      <div className="w-full max-w-3xl space-y-12 text-center">
        <AnimatedPageTitle />
        <SearchBar 
          onSearch={handleSearch} 
          onInputChange={handleInputChange}
          isPending={isPending} 
        />
      </div>
      
      {isPending && (
        <div className="mt-16 flex flex-col items-center text-muted-foreground animate-fade-in-up">
          <div className="p-4 rounded-2xl bg-accent/10">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
          <p className="mt-4 text-sm font-medium">지식베이스에서 검색 중...</p>
        </div>
      )}
      
      {hasSearched && !isPending && <SearchResults results={searchResults} error={searchError} onEditSegment={handleEditSegment} />}
      
      {/* 검색하지 않았을 때만 초기 지식 데이터 표시 */}
      {!hasSearched && !isPending && (
        <InitialKnowledge 
          results={initialData} 
          error={initialError}
          isLoading={isLoadingInitial || isLoadingDocumentSegments}
          filterText={filterText}
          onLoadMore={handleLoadMore}
          hasMore={hasMoreData}
          isLoadingMore={isLoadingMore}
          onAddSegment={() => setIsAddModalOpen(true)}
          onEditSegment={handleEditSegment}
          selectedDocumentId={selectedDocumentId}
          onDocumentChange={handleDocumentChange}
          documents={documents}
          isLoadingDocuments={isLoadingDocuments}
        />
      )}

      {/* 추가하기 모달 */}
      <SegmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddSegmentSuccess}
      />

      {/* 편집 모달 */}
      <SegmentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setEditSegmentData(undefined)
        }}
        onSuccess={handleEditSegmentSuccess}
        editSegment={editSegmentData}
      />

      <footer className="fixed bottom-0 left-0 right-0 h-12 flex items-center justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/20">
        <p className="text-xs text-muted-foreground">Made by GS E&R Unit</p>
      </footer>
    </main>
  )
}
