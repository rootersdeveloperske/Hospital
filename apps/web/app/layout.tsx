import './globals.css'
import React from 'react'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/next'

export const metadata = {
  title: 'HMS - Hospital Management System',
  description: 'Hospital Management System'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" />
        <Analytics />
      </body>
    </html>
  )
}
