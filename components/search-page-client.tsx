"use client"

import { useState, useEffect } from "react"
import { Search, ArrowRight, BrainCircuit } from "lucide-react"

const AnimatedLogo = () => {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      className={`flex items-center justify-center space-x-2 transition-all duration-700 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      }`}
    >
      <BrainCircuit size={32} className="text-accent" />
      <h1 className="text-3xl font-bold text-foreground">QueryCore</h1>
    </div>
  )
}

const SearchBar = () => {
  const [inputValue, setInputValue] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300) // Delay after logo
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className={`transition-all duration-700 ease-out ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}>
      <div
        className={`
        group relative flex items-center w-full max-w-2xl mx-auto
        bg-card rounded-lg  /* Changed from bg-secondary to bg-card for white background in light mode */
        border border-transparent
        transition-all duration-300 ease-out
        ${isFocused ? "ring-2 ring-accent shadow-focused scale-[1.02]" : "shadow-subtle"} /* Adjusted shadow classes */
      `}
      >
        <Search
          className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors duration-300 ${
            isFocused ? "text-accent" : "text-muted-foreground"
          }`}
        />
        <input
          type="text"
          placeholder="무엇이든 물어보세요..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full h-14 pl-12 pr-12 py-3 bg-transparent text-foreground placeholder-muted-foreground focus:outline-none rounded-lg text-base md:text-lg"
        />
        {inputValue && (
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-accent transition-colors duration-200"
            aria-label="검색"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

const SuggestionChip = ({ text, delay }: { text: string; delay: number }) => {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <button
      className={`
      px-4 py-2 bg-secondary rounded-full text-sm text-muted-foreground
      hover:bg-accent/10 hover:text-accent /* Adjusted hover for light theme accent */
      transition-all duration-300 ease-out transform 
      hover:scale-105
      ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}
    `}
    >
      {text}
    </button>
  )
}

export default function SearchPageClient() {
  const suggestions = [
    { text: "최신 AI 기술 동향", delay: 600 },
    { text: "양자컴퓨팅이란?", delay: 750 },
    // { text: "인기 검색어", delay: 900 }, // Can add more
  ]

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-background p-4 selection:bg-accent/30 selection:text-accent-foreground">
      <div className="w-full max-w-2xl space-y-8 text-center">
        <AnimatedLogo />
        <SearchBar />
        <div className="flex flex-wrap justify-center gap-3 pt-4">
          {suggestions.map((suggestion) => (
            <SuggestionChip key={suggestion.text} text={suggestion.text} delay={suggestion.delay} />
          ))}
        </div>
      </div>
      <footer className="absolute bottom-6 text-center w-full">
        <p className="text-xs text-muted-foreground">Powered by AI. Inspired by Perplexity.</p>
      </footer>
    </main>
  )
}
