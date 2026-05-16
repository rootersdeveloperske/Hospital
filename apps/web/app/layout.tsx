import './globals.css'
import React from 'react'

export const metadata = {
  title: 'HMS - Hospital Management System',
  description: 'Hospital Management System'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
