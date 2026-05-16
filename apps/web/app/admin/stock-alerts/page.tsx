'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'

export default function StockAlertsPage() {
  const [items, setItems] = useState<any[]>([])
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/alerts/stock`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        })
        const json = await res.json()
        if (res.ok) setItems(json.lowStock || [])
      } catch (err) {
        console.error(err)
      }
    }
    load()
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Stock Alerts</h2>
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{m.name}</div>
              <div className="text-sm">Stock: {m.stock} — {m.strength}</div>
            </div>
            <div className="flex gap-2">
              <Link href={`/admin/medicines/${m.id}`} className="text-sm text-blue-600">Edit</Link>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm text-gray-500">No stock alerts</div>}
      </div>
    </div>
  )
}
