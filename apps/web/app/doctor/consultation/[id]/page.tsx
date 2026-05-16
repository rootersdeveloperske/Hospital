'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import toast from 'react-hot-toast'

const schema = z.object({
  notes: z.string().optional(),
  followUpDate: z.string().optional(),
  prescriptions: z.array(
    z.object({
      medicineId: z.string().min(1),
      quantity: z.number().min(1),
      dosage: z.string().optional()
    })
  )
})

type FormData = z.infer<typeof schema>

export default function ConsultationPage() {
  const params = useParams() as { id: string }
  const consultationId = params?.id
  const [loading, setLoading] = useState(true)
  const [medicines, setMedicines] = useState<any[]>([])
  const [initial, setInitial] = useState<any>(null)
  const router = useRouter()

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  const { register, control, handleSubmit, reset } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { prescriptions: [] } })
  const { fields, append, remove } = useFieldArray({ control, name: 'prescriptions' })

  useEffect(() => {
    async function load() {
      if (!consultationId) return
      try {
        const [cRes, mRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/consultations/${consultationId}`, {
            headers: { Authorization: token ? `Bearer ${token}` : '' }
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/medicines`)
        ])
        const cJson = await cRes.json()
        const mJson = await mRes.json()
        setInitial(cJson)
        setMedicines(mJson.medicines || [])
        setLoading(false)
      } catch (err) {
        console.error(err)
        setLoading(false)
        toast.error('Failed to load consultation or medicines')
      }
    }
    load()
  }, [consultationId])

  async function onSubmit(values: FormData) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/consultations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify({ consultationId, notes: values.notes, followUpDate: values.followUpDate, prescriptions: values.prescriptions })
      })
      const json = await res.json()
      if (!res.ok) return toast.error('Error: ' + (json.message || 'Could not save'))
      toast.success('Consultation saved')
      router.push('/doctor/dashboard')
    } catch (err: any) {
      toast.error('Network error: ' + String(err.message || err))
    }
  }

  if (loading) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Consultation</h2>
      <div className="mb-4">
        <strong>Patient:</strong> {initial?.patient?.name} — Token #{String(initial?.patient?.tokenNo).padStart(2, '0')}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm">Notes</label>
          <textarea {...register('notes')} className="w-full p-2 border rounded h-28" />
        </div>
        <div>
          <label className="block text-sm">Follow-up Date</label>
          <input type="date" {...register('followUpDate')} className="p-2 border rounded" />
        </div>

        <div>
          <h3 className="font-semibold">Prescriptions</h3>
          <div className="space-y-2">
            {fields.map((f, idx) => (
              <div key={f.id} className="flex items-center gap-2">
                <select {...register(`prescriptions.${idx}.medicineId` as const)} className="p-2 border rounded">
                  <option value="">Select medicine</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.stock} left)
                    </option>
                  ))}
                </select>
                <input type="number" {...register(`prescriptions.${idx}.quantity` as const, { valueAsNumber: true })} className="p-2 border rounded w-20" />
                <input {...register(`prescriptions.${idx}.dosage` as const)} placeholder="dosage" className="p-2 border rounded" />
                <button type="button" onClick={() => remove(idx)} className="text-red-600">Remove</button>
              </div>
            ))}
            <button type="button" onClick={() => append({ medicineId: '', quantity: 1, dosage: '' })} className="bg-gray-200 px-3 py-1 rounded">
              Add Medicine
            </button>
          </div>
        </div>

        <div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Submit Consultation</button>
        </div>
      </form>
    </div>
  )
}
