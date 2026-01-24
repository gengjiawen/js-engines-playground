import type { ReactNode } from 'react'
import './globals.css'
import { Nav } from '@/components/Nav'

export const metadata = {
  title: 'JS Engines playground',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full">
        <div className="min-h-full">
          <Nav />
          {children}
        </div>
      </body>
    </html>
  )
}
