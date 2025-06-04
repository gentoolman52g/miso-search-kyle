import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { MessageSquare } from "lucide-react"
import { FloatingChatButton } from "@/domains/chat"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "MISO Knowledge Manager",
  description: "Search and manage knowledge with MISO",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="light">
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-14 max-w-screen-2xl items-center">
            <div className="mr-4 flex items-center">
              <a href="/" className="mr-3 flex items-center space-x-2">
                <Image src="/gs-e&r-logo.png" alt="GS E&R Logo" width={100} height={27} priority />
              </a>
              {/* "인사팀" text removed */}
            </div>
            <div className="flex flex-1 items-center justify-end space-x-2">
              <Link href="/conversations">
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  대화 기록
                </Button>
              </Link>
            </div>
          </div>
        </header>
        {children}
        
        {/* 플로팅 채팅 버튼 */}
        <FloatingChatButton />
      </body>
    </html>
  )
}
