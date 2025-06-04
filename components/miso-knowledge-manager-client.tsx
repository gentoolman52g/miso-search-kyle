"use client"

import type React from "react"

import { useState, useEffect, useTransition } from "react"
import { Search, ArrowRight, Loader2, AlertTriangle, FileText } from "lucide-react" // Removed BrainCircuit
import { searchMisoKnowledge } from "@/app/miso-actions"
import type { KnowledgeSegment } from "@/lib/miso/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

const AnimatedPageTitle = () => {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`flex flex-col items-center justify-center space-y-2 transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      {/* BrainCircuit icon removed from here */}
      <h1 className="text-3xl md:text-4xl font-bold text-foreground text-center">MISO Knowledge Manager</h1>
    </div>
  )
}

const SearchBar = ({
  onSearch,
  isPending,
}: {
  onSearch: (query: string) => void
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
      // Prevent search if already pending
      onSearch(inputValue.trim())
    }
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
        bg-card rounded-lg
        border
        transition-all duration-300 ease-out
        ${isFocused ? "ring-2 ring-accent shadow-focused scale-[1.02]" : "shadow-subtle border-border"}
      `}
      >
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
            isFocused ? "text-accent" : "text-muted-foreground"
          }`}
        />
        <Input
          type="text"
          placeholder="MISO 지식베이스에서 검색하세요..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full h-14 pl-12 pr-12 py-3 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none rounded-lg text-base md:text-lg border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          disabled={isPending}
        />
        {/* Loader2 icon removed from here, submit button shown if not pending */}
        {inputValue && !isPending && (
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-accent"
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

const SearchResults = ({ results, error }: { results: KnowledgeSegment[]; error: string | null }) => {
  if (error) {
    return (
      <div className="mt-8 text-center text-red-500 flex flex-col items-center gap-2 p-4 bg-destructive/10 rounded-lg">
        <AlertTriangle size={48} className="text-destructive" />
        <p className="font-semibold text-lg text-destructive">오류가 발생했습니다</p>
        <p className="text-sm text-destructive/80">{error}</p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="mt-8 text-center text-muted-foreground">
        <FileText size={48} className="mx-auto mb-2" />
        <p>검색 결과가 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4 w-full max-w-3xl">
      {results.map((segment, index) => (
        <Card
          key={segment.id || index}
          className="overflow-hidden animate-fade-in-up text-left"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardHeader>
            {segment.documentName && <CardTitle className="text-lg">{segment.documentName}</CardTitle>}
            <CardDescription>Segment ID: {segment.id}</CardDescription>
          </CardHeader>
          <CardContent>
            {segment.content && <p className="mb-3 text-sm leading-relaxed">{segment.content}</p>}
            {segment.answer && (
              <div className="mt-3 pt-3 border-t border-border/60">
                <p className="text-xs font-semibold text-accent mb-1">요약/답변:</p>
                <p className="text-sm text-foreground/90">{segment.answer}</p>
              </div>
            )}
            {segment.keywords && segment.keywords.length > 0 && (
              <div className="mt-4 pt-3 border-t border-border/60">
                <p className="text-xs font-semibold text-muted-foreground mb-1.5">키워드:</p>
                <div className="flex flex-wrap gap-1.5">
                  {segment.keywords.map((keyword, kwIndex) => (
                    <span
                      key={kwIndex}
                      className="px-2.5 py-1 bg-secondary text-secondary-foreground text-xs rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function MisoKnowledgeManagerClient() {
  const [isPending, startTransition] = useTransition()
  const [searchResults, setSearchResults] = useState<KnowledgeSegment[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = (query: string) => {
    setHasSearched(true)
    setSearchError(null)
    setSearchResults([])
    startTransition(async () => {
      const result = await searchMisoKnowledge(query)
      if (result.error) {
        setSearchError(result.error)
        setSearchResults([])
      } else if (result.data) {
        setSearchResults(result.data)
      }
    })
  }

  return (
    <main className="flex flex-col items-center justify-start min-h-[calc(100vh-3.5rem)] pt-12 pb-20 px-4 selection:bg-accent/30 selection:text-accent-foreground">
      <div className="w-full max-w-3xl space-y-8 text-center">
        <AnimatedPageTitle />
        <SearchBar onSearch={handleSearch} isPending={isPending} />
      </div>
      {isPending && ( // This is the main page loading indicator
        <div className="mt-8 flex flex-col items-center text-muted-foreground">
          <Loader2 size={32} className="animate-spin text-accent mb-2" />
          <p>검색 중...</p>
        </div>
      )}
      {hasSearched && !isPending && <SearchResults results={searchResults} error={searchError} />}

      <footer className="fixed bottom-0 left-0 right-0 h-10 flex items-center justify-center bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/40">
        <p className="text-xs text-muted-foreground">MISO Knowledge Manager</p>
      </footer>
    </main>
  )
}
