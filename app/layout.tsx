import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

export const metadata: Metadata = {
  title: "QueryCore Search",
  description: "Advanced AI Search Engine",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className="light">
      {" "}
      <body className={cn("min-h-screen bg-background font-sans antialiased", inter.variable)}>{children}</body>{" "}
    </html>
  )
}
