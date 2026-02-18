import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Catalyst - RozgarSathi | Your AI-Powered Career Companion',
  description: 'Transform your job search with AI-powered resume building, interview preparation, and personalized job recommendations.',
  keywords: ['jobs', 'career', 'resume', 'interview', 'AI', 'India'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
