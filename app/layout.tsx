import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Nav } from "@/components/Nav"
import { SessionProvider } from "@/components/SessionProvider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "EdTech",
  description: "Interactive learning platform",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-zinc-50 text-zinc-900 antialiased">
        <SessionProvider>
          <Nav />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
