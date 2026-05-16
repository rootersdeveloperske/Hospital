import { Router } from 'express'
import prisma from '../prisma'
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/dashboard/summary?date=YYYY-MM-DD
router.get('/summary', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const dateStr = req.query.date ? String(req.query.date) : null
  const date = dateStr ? new Date(dateStr) : new Date()

  try {
    const start = new Date(date)
    start.setHours(0, 0, 0, 0)
    const end = new Date(date)
    end.setHours(23, 59, 59, 999)

    const todaysPatients = await prisma.patient.count({ where: { createdAt: { gte: start, lte: end } } })

    const todaysRevenueAgg = await prisma.sale.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: start, lte: end } }
    })
    const todaysRevenue = todaysRevenueAgg._sum.totalAmount || 0

    const consultationsCount = await prisma.consultation.count({ where: { createdAt: { gte: start, lte: end } } })

    const stockAlertsCount = await prisma.medicine.count({ where: { stock: { lt: 10 }, status: 'ACTIVE' } })

    const now = new Date()
    const expiryCutoff = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const lowExpiryCount = await prisma.medicine.count({ where: { expiryDate: { not: null, lte: expiryCutoff }, status: 'ACTIVE' } })

    return res.json({ todaysPatients, todaysRevenue, consultationsCount, stockAlertsCount, lowExpiryCount })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
