'use client'

import React, { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<any>(null)
  const [alerts, setAlerts] = useState<{ lowStock: any[]; nearExpiry: any[] }>({ lowStock: [], nearExpiry: [] })
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  async function load() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/dashboard/summary`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      const json = await res.json()
      if (res.ok) setSummary(json)

      const aRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/alerts/stock`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      const aJson = await aRes.json()
      if (aRes.ok) setAlerts({ lowStock: aJson.lowStock || [], nearExpiry: aJson.nearExpiry || [] })
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
    const socket = getSocket()
    socket.on('low-stock-alert', (data: any) => {
      alert(`Low stock alert: ${data.count} items`) // Replace with toast
      setAlerts((s) => ({ ...s, lowStock: data.items }))
    })
    socket.on('expiry-alert', (data: any) => {
      alert(`Expiry alert: ${data.count} items`) // Replace with toast
      setAlerts((s) => ({ ...s, nearExpiry: data.items }))
    })
    socket.on('dashboard-updated', (data: any) => {
      setSummary((s: any) => ({ ...s, ...data }))
    })

    return () => {
      socket.off('low-stock-alert')
      socket.off('expiry-alert')
      socket.off('dashboard-updated')
    }
  }, [])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Today's Patients</div>
          <div className="text-2xl font-bold">{summary?.todaysPatients ?? '-'}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Today's Revenue</div>
          <div className="text-2xl font-bold">${(summary?.todaysRevenue ?? 0).toFixed(2)}</div>
        </div>
        <div className="p-4 border rounded">
          <div className="text-sm text-gray-500">Stock Alerts</div>
          <div className="text-2xl font-bold">{summary?.stockAlertsCount ?? alerts.lowStock.length ?? 0}</div>
          <Link href="/admin/stock-alerts" className="text-sm text-blue-600">View details</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Low Stock Items</h3>
          <ul className="mt-2 space-y-2">
            {alerts.lowStock.map((m: any) => (
              <li key={m.id} className="flex justify-between">
                <div>{m.name}</div>
                <div>{m.stock}</div>
              </li>
            ))}
            {alerts.lowStock.length === 0 && <li className="text-sm text-gray-500">No low stock items</li>}
          </ul>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">Near Expiry</h3>
          <ul className="mt-2 space-y-2">
            {alerts.nearExpiry.map((m: any) => (
              <li key={m.id} className="flex justify-between">
                <div>{m.name}</div>
                <div>{new Date(m.expiryDate).toLocaleDateString()}</div>
              </li>
            ))}
            {alerts.nearExpiry.length === 0 && <li className="text-sm text-gray-500">No near-expiry items</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
