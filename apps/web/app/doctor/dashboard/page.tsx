'use client'

import React, { useEffect, useState } from 'react'
import { getSocket } from '@/lib/socket'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

type Patient = {
  id: string
  name: string
  age: number
  cnic: string
  tokenNo: number
  status: string
}

type Consultation = {
  id: string
  patientId: string
  doctorId: string
  notes: string
  status: string
}

export default function DoctorDashboard() {
  const [unassigned, setUnassigned] = useState<Patient[]>([])
  const [myPending, setMyPending] = useState<Consultation[]>([])
  const router = useRouter()

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

  useEffect(() => {
    async function load() {
      if (!userId) return
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/consultations/pending/${userId}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      const json = await res.json()
      setUnassigned(json.unassigned || [])
      setMyPending(json.myPending || [])
    }
    load()
  }, [userId])

  useEffect(() => {
    const socket = getSocket()
    socket.on('new-token', (data: any) => {
      if (data?.patient) {
        setUnassigned((s) => [...s, data.patient])
        toast.info(`New token: #${String(data.patient.tokenNo).padStart(2,'0')} - ${data.patient.name}`)
      }
    })
    socket.on('consultation-assigned', (data: any) => {
      if (data?.consultation) setMyPending((s) => [...s, data.consultation])
      if (data?.patient) setUnassigned((s) => s.filter((p) => p.id !== data.patient.id))
    })

    socket.on('consultation-completed', (data: any) => {
      setMyPending((s) => s.filter((c) => c.id !== data.consultation?.id))
      toast.success('Consultation completed')
    })

    return () => {
      socket.off('new-token')
      socket.off('consultation-assigned')
      socket.off('consultation-completed')
    }
  }, [])

  async function startConsultation(tokenNo: number) {
    if (!userId) return toast.error('Missing userId - please login')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/consultations/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ doctorId: userId, tokenNo })
      })
      const json = await res.json()
      if (!res.ok) return toast.error('Error: ' + (json.message || 'Could not start'))
      // navigate to consultation form
      router.push(`/doctor/consultation/${json.consultation.id}`)
    } catch (err: any) {
      toast.error('Network error: ' + String(err.message || err))
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Doctor Dashboard</h2>
      <div className="grid grid-cols-2 gap-6">
        <div className="p-4 border rounded">
          <h3 className="font-semibold">Waiting Tokens</h3>
          <ul className="mt-2 space-y-2">
            {unassigned.map((p) => (
              <li key={p.id} className="flex justify-between items-center">
                <div>
                  #{String(p.tokenNo).padStart(2, '0')} — {p.name} ({p.age})
                </div>
                <div>
                  <button onClick={() => startConsultation(p.tokenNo)} className="bg-green-600 text-white px-3 py-1 rounded">
                    Start
                  </button>
                </div>
              </li>
            ))}
            {unassigned.length === 0 && <li className="text-sm text-gray-500">No waiting tokens</li>}
          </ul>
        </div>

        <div className="p-4 border rounded">
          <h3 className="font-semibold">My Pending Consultations</h3>
          <ul className="mt-2 space-y-2">
            {myPending.map((c) => (
              <li key={c.id} className="flex justify-between items-center">
                <div>Consultation: {c.id}</div>
                <div>
                  <button onClick={() => router.push(`/doctor/consultation/${c.id}`)} className="bg-blue-600 text-white px-3 py-1 rounded">
                    Open
                  </button>
                </div>
              </li>
            ))}
            {myPending.length === 0 && <li className="text-sm text-gray-500">No pending consultations</li>}
          </ul>
        </div>
      </div>
    </div>
  )
}
