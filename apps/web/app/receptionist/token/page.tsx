'use client'

import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { getSocket } from '../../../lib/socket'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  age: z.number().min(0).optional(),
  cnic: z.string().min(5, 'Enter valid CNIC'),
  consultationType: z.string().optional(),
  visitType: z.string().optional(),
  isFollowUp: z.boolean().optional()
})

type FormData = z.infer<typeof schema>

export default function TokenPage() {
  const { register, handleSubmit, reset } = useForm<FormData>({
    resolver: zodResolver(schema)
  })

  useEffect(() => {
    const socket = getSocket()
    socket.on('new-token', (data: any) => {
      // basic alert - replace with your toast/shadcn integration
      alert(`New token created: ${String(data.tokenNo)} for ${data.patient?.name}`)
    })
    return () => {
      socket.off('new-token')
    }
  }, [])

  async function onSubmit(values: FormData) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/patients/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      })
      const json = await res.json()
      if (!res.ok) {
        alert('Error: ' + (json.message || 'Unknown'))
        return
      }
      alert(`Token created: ${json.patient.tokenNo}`)
      reset()
    } catch (err: any) {
      alert('Network error: ' + String(err.message || err))
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4">Generate Patient Token</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div>
          <label className="block text-sm">CNIC (required)</label>
          <input {...register('cnic')} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm">Name</label>
          <input {...register('name')} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="block text-sm">Age</label>
          <input type="number" {...register('age', { valueAsNumber: true })} className="w-full p-2 border rounded" />
        </div>
        <div>
          <label className="inline-flex items-center">
            <input type="checkbox" {...register('isFollowUp')} className="mr-2" />
            Follow-up (auto-fill details if CNIC exists)
          </label>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Create Token</button>
      </form>
    </div>
  )
}
