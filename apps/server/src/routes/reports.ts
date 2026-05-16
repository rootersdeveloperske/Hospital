import { Router } from 'express'
import prisma from '../prisma'

const router = Router()

function rangeToInterval(range: string) {
  switch (range) {
    case 'day':
      return { trunc: 'day', days: 7 }
    case 'week':
      return { trunc: 'week', days: 7 * 12 } // 12 weeks
    case 'month':
    default:
      return { trunc: 'month', days: 30 * 12 } // 12 months approx
  }
}

// GET /api/reports/revenue?range=day|week|month
router.get('/revenue', async (req, res) => {
  const range = String(req.query.range || 'month')
  const interval = rangeToInterval(range)
  try {
    const end = new Date()
    const start = new Date(end.getTime() - interval.days * 24 * 60 * 60 * 1000)

    // use raw SQL to aggregate by date_trunc
    const rows: Array<any> = await prisma.$queryRawUnsafe(`
      SELECT date_trunc('${interval.trunc}', "createdAt") AS period, SUM("totalAmount") AS total
      FROM "Sale"
      WHERE "createdAt" BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'
      GROUP BY period
      ORDER BY period ASC;
    `)

    // normalize periods to strings
    const data = rows.map((r) => ({ period: r.period, total: Number(r.total || 0) }))
    return res.json({ data })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/reports/doctor?range=day|week|month
// Returns consultations count per doctor and approximate revenue by summing sales linked to patients whose consultation doctor is that doctor in the period.
router.get('/doctor', async (req, res) => {
  const range = String(req.query.range || 'month')
  const interval = rangeToInterval(range)
  try {
    const end = new Date()
    const start = new Date(end.getTime() - interval.days * 24 * 60 * 60 * 1000)

    // consultations per doctor
    const consults: Array<any> = await prisma.$queryRawUnsafe(`
      SELECT c."doctorId", u.name as doctorName, COUNT(*) as consultations
      FROM "Consultation" c
      LEFT JOIN "User" u ON u.id = c."doctorId"
      WHERE c."createdAt" BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'
      GROUP BY c."doctorId", u.name
      ORDER BY consultations DESC;
    `)

    // approximate revenue per doctor by joining Sale -> Patient -> Consultation (latest consultation for that patient within range)
    const revenueRows: Array<any> = await prisma.$queryRawUnsafe(`
      SELECT u.id as doctorId, u.name as doctorName, SUM(s."totalAmount") as revenue
      FROM "Sale" s
      JOIN "Patient" p ON p."tokenNo" = s."tokenNo"
      JOIN "Consultation" c ON c."patientId" = p.id
      JOIN "User" u ON u.id = c."doctorId"
      WHERE s."createdAt" BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'
      GROUP BY u.id, u.name
      ORDER BY revenue DESC;
    `)

    // merge consults and revenue into a map
    const map: Record<string, any> = {}
    for (const r of consults) {
      map[r.doctorid || r.doctorId] = { doctorId: r.doctorid || r.doctorId, doctorName: r.doctorname || r.doctorName, consultations: Number(r.consultations || 0), revenue: 0 }
    }
    for (const r of revenueRows) {
      const id = r.doctorid || r.doctorId
      if (!map[id]) map[id] = { doctorId: id, doctorName: r.doctorname || r.doctorName, consultations: 0, revenue: Number(r.revenue || 0) }
      else map[id].revenue = Number(r.revenue || 0)
    }

    const data = Object.values(map)
    return res.json({ data })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
