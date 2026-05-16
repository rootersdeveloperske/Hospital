import './globals.css'
import React from 'react'
import { Toaster } from 'react-hot-toast'

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
      </body>
    </html>
  )
}
