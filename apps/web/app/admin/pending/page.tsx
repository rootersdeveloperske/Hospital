'use client'

import React, { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket'

export default function AdminPendingPage() {
  const [pending, setPending] = useState<any[]>([])
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  useEffect(() => {
    fetchPending()
    const socket = getSocket()
    socket.on('new-doctor-registration', (data: any) => {
      // prepend new registration
      setPending((s) => [data, ...s])
      alert(`New doctor registered: ${data.email}`)
    })
    socket.on('doctor-approved', (data: any) => {
      // remove from pending if present
      setPending((s) => s.filter((u) => u.id !== data.id))
      alert(`Doctor approved: ${data.email}`)
    })
    return () => {
      socket.off('new-doctor-registration')
      socket.off('doctor-approved')
    }
  }, [])

  async function fetchPending() {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/users/pending`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      const json = await res.json()
      if (!res.ok) return alert('Error fetching pending: ' + (json.message || ''))
      setPending(json.pending || [])
    } catch (err: any) {
      alert('Network error: ' + String(err.message || err))
    }
  }

  async function approve(id: string) {
    if (!confirm('Approve this doctor?')) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/users/approve/${id}`, {
        method: 'PUT',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      const json = await res.json()
      if (!res.ok) return alert('Error: ' + (json.message || ''))
      setPending((s) => s.filter((u) => u.id !== id))
      alert('Approved')
    } catch (err: any) {
      alert('Network error: ' + String(err.message || err))
    }
  }

  async function reject(id: string) {
    if (!confirm('Reject this doctor? This will remove the registration.')) return
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/users/reject/${id}`, {
        method: 'PUT',
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      const json = await res.json()
      if (!res.ok) return alert('Error: ' + (json.message || ''))
      setPending((s) => s.filter((u) => u.id !== id))
      alert('Rejected')
    } catch (err: any) {
      alert('Network error: ' + String(err.message || err))
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Pending Doctor Registrations</h2>
      <div className="space-y-3">
        {pending.map((u) => (
          <div key={u.id} className="p-3 border rounded flex justify-between items-center">
            <div>
              <div className="font-semibold">{u.name}</div>
              <div className="text-sm">{u.email} — {u.specialization}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => approve(u.id)} className="bg-green-600 text-white px-3 py-1 rounded">Approve</button>
              <button onClick={() => reject(u.id)} className="bg-red-600 text-white px-3 py-1 rounded">Reject</button>
            </div>
          </div>
        ))}
        {pending.length === 0 && <div className="text-sm text-gray-500">No pending registrations</div>}
      </div>
    </div>
  )
}
