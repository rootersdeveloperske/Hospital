'use client'

import React, { useEffect, useState } from 'react'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'
import { getSocket } from '@/lib/socket'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

export default function AdminReportsPage() {
  const [revenueData, setRevenueData] = useState<any>({ labels: [], datasets: [] })
  const [doctorData, setDoctorData] = useState<any>({ labels: [], datasets: [] })
  const [range, setRange] = useState<string>('month')
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

  async function load() {
    try {
      const rRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/reports/revenue?range=${range}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      const rJson = await rRes.json()
      const labels = rJson.data.map((d: any) => new Date(d.period).toLocaleDateString())
      const totals = rJson.data.map((d: any) => Number(d.total || 0))
      setRevenueData({ labels, datasets: [{ label: 'Revenue', data: totals, borderColor: 'rgb(75,192,192)', backgroundColor: 'rgba(75,192,192,0.4)' }] })

      const dRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/reports/doctor?range=${range}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' }
      })
      const dJson = await dRes.json()
      const dLabels = dJson.data.map((d: any) => d.doctorName || d.doctorname || d.doctorId)
      const dRevenue = dJson.data.map((d: any) => Number(d.revenue || 0))
      setDoctorData({ labels: dLabels, datasets: [{ label: 'Revenue by Doctor', data: dRevenue, backgroundColor: 'rgba(53, 162, 235, 0.5)' }] })
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    load()
    const socket = getSocket()
    socket.on('dashboard-updated', () => load())
    socket.on('medicines-dispensed', () => load())
    return () => {
      socket.off('dashboard-updated')
      socket.off('medicines-dispensed')
    }
  }, [range])

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Reports & Charts</h2>
      <div className="mb-4">
        <label className="mr-2">Range:</label>
        <select value={range} onChange={(e) => setRange(e.target.value)} className="p-1 border rounded">
          <option value="day">Last 7 days</option>
          <option value="week">Last 12 weeks</option>
          <option value="month">Last 12 months</option>
        </select>
      </div>

      <div className="mb-8">
        <h3 className="font-semibold mb-2">Revenue</h3>
        <Line data={revenueData} />
      </div>

      <div>
        <h3 className="font-semibold mb-2">Revenue by Doctor</h3>
        <Bar data={doctorData} />
      </div>
    </div>
  )
}
