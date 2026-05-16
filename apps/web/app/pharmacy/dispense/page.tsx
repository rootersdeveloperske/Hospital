'use client'

import React, { useState } from 'react'
import { getSocket } from '@/lib/socket'

export default function PharmacyDispensePage() {
  const [tokenNo, setTokenNo] = useState('')
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<any>(null)
  const [items, setItems] = useState<any[]>([])
  const [tax, setTax] = useState<number>(0)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  async function fetchPrescription() {
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/pharmacy/prescription/${tokenNo}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      const json = await res.json()
      if (!res.ok) return alert('Error: ' + (json.message || 'Not found'))
      setData(json)
      // map prescriptions to items with stock info
      const mapped = json.prescriptions.map((p: any) => ({ medicineId: p.medicineId, name: p.medicine.name, quantity: p.quantity, unitPrice: p.medicine.price, stock: p.medicine.stock }))
      setItems(mapped)
    } catch (err: any) {
      alert('Network error: ' + String(err.message || err))
    } finally {
      setLoading(false)
    }
  }

  function updateQty(idx: number, qty: number) {
    setItems((s) => s.map((it, i) => (i === idx ? { ...it, quantity: qty } : it)))
  }

  function calcSubtotal() {
    return items.reduce((sum, it) => sum + (Number(it.unitPrice) || 0) * Number(it.quantity || 0), 0)
  }

  async function dispense() {
    if (!tokenNo) return alert('Enter token no')
    setLoading(true)
    try {
      const payload = { tokenNo: Number(tokenNo), items: items.map((it) => ({ medicineId: it.medicineId, quantity: Number(it.quantity) })), taxPercent: tax }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/pharmacy/dispense`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      if (!res.ok) return alert('Error: ' + (json.message || 'Could not dispense'))
      alert('Dispensed. Total: ' + json.receipt.total)
      // simple receipt view
      console.log('receipt', json.receipt)
      // notify other clients
      const socket = getSocket()
      socket.emit('pharmacy-dispensed', { tokenNo: Number(tokenNo), receipt: json.receipt })
      setData(null)
      setItems([])
      setTokenNo('')
    } catch (err: any) {
      alert('Network error: ' + String(err.message || err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Pharmacy - Dispense Medicines</h2>
      <div className="flex gap-2 mb-4">
        <input value={tokenNo} onChange={(e) => setTokenNo(e.target.value)} placeholder="Enter token no" className="p-2 border rounded" />
        <button onClick={fetchPrescription} className="bg-blue-600 text-white px-3 py-1 rounded">Fetch</button>
      </div>

      {loading && <div>Loading...</div>}

      {data && (
        <div className="border p-4 rounded">
          <div className="mb-2"><strong>Patient:</strong> {data.patient.name} (Token #{String(data.patient.tokenNo).padStart(2,'0')})</div>

          <div className="space-y-2">
            {items.map((it, idx) => (
              <div key={it.medicineId} className="flex items-center gap-2">
                <div className="w-64">{it.name} (stock: {it.stock})</div>
                <input type="number" value={it.quantity} onChange={(e) => updateQty(idx, Number(e.target.value))} className="p-1 border rounded w-20" />
                <div>Unit: {it.unitPrice}</div>
                <div>Line: {(Number(it.unitPrice) * Number(it.quantity || 0)).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <label className="block">Tax %</label>
            <input type="number" value={tax} onChange={(e) => setTax(Number(e.target.value))} className="p-1 border rounded w-24" />
          </div>

          <div className="mt-4">
            <div>Subtotal: {calcSubtotal().toFixed(2)}</div>
            <div>Tax: {((calcSubtotal() * tax) / 100).toFixed(2)}</div>
            <div className="font-semibold">Total: {(calcSubtotal() + (calcSubtotal() * tax) / 100).toFixed(2)}</div>
          </div>

          <div className="mt-4">
            <button onClick={dispense} className="bg-green-600 text-white px-4 py-2 rounded">Dispense</button>
          </div>
        </div>
      )}
    </div>
  )
}
