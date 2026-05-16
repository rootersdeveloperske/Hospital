import { Router } from 'express'
import prisma from '../prisma'
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/alerts/stock?threshold=10&expiryDays=30
router.get('/stock', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const threshold = req.query.threshold ? Number(req.query.threshold) : 10
  const expiryDays = req.query.expiryDays ? Number(req.query.expiryDays) : 30

  try {
    const lowStock = await prisma.medicine.findMany({ where: { stock: { lt: threshold }, status: 'ACTIVE' }, orderBy: { stock: 'asc' } })

    const now = new Date()
    const expiryCutoff = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000)

    const nearExpiry = await prisma.medicine.findMany({ where: { expiryDate: { not: null, lte: expiryCutoff }, status: 'ACTIVE' }, orderBy: { expiryDate: 'asc' } })

    return res.json({ lowStock, nearExpiry })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
