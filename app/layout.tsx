import React from "react"
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from '@/components/ui/sonner'

import './globals.css'
import { Providers } from './providers'

const _geist = Geist({ subsets: ['latin'] })
const _geistMono = Geist_Mono({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Rakshak AI - Emergency Intelligence Platform',
  description: 'Advanced AI-powered emergency response system for faster, smarter coordination between citizens and emergency responders.',
  generator: 'v0.app',
  keywords: ['emergency', 'AI', 'dispatch', 'responder', 'medical', 'police'],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
