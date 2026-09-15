import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'De-Blossom Cooperative Society',
  description: 'De-Blossom cooperative administration workspace.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}