import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { FloatingChatButton } from "@/components/floating-chat-button"
import { AuthProvider } from "@/contexts/auth-context"
import { HeaderContent } from "@/components/header-content"
import { Toaster } from "@/components/ui/sonner"

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
        <AuthProvider>
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
              <div className="mr-4 flex items-center">
                <a href="/" className="mr-3 flex items-center space-x-2">
                  <Image src="/gs-e&r-logo.png" alt="GS E&R Logo" width={100} height={27} priority />
                </a>
              </div>
              <div className="flex flex-1 items-center justify-end space-x-2">
                <HeaderContent />
              </div>
            </div>
          </header>
          {children}
          
          {/* 플로팅 채팅 버튼 */}
          <FloatingChatButton />
          
          {/* 토스트 알림 */}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
