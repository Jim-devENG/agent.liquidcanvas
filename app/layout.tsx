import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Art Outreach Scraper Dashboard',
  description: 'Autonomous website discovery and outreach automation',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
