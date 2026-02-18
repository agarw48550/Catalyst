import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Project Catalyst',
  description: 'A Next.js application built with App Router',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
