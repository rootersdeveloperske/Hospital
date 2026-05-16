import prisma from '../prisma'
import { Server as IOServer } from 'socket.io'

export async function checkAndEmitAlerts(io: IOServer) {
  try {
    const threshold = Number(process.env.STOCK_ALERT_THRESHOLD || '10')
    const expiryDays = Number(process.env.EXPIRY_ALERT_DAYS || '30')

    const lowStock = await prisma.medicine.findMany({ where: { stock: { lt: threshold }, status: 'ACTIVE' }, orderBy: { stock: 'asc' } })

    const now = new Date()
    const expiryCutoff = new Date(now.getTime() + expiryDays * 24 * 60 * 60 * 1000)

    const nearExpiry = await prisma.medicine.findMany({ where: { expiryDate: { not: null, lte: expiryCutoff }, status: 'ACTIVE' }, orderBy: { expiryDate: 'asc' } })

    if (lowStock.length > 0) {
      io.emit('low-stock-alert', { count: lowStock.length, items: lowStock })
    }

    if (nearExpiry.length > 0) {
      io.emit('expiry-alert', { count: nearExpiry.length, items: nearExpiry })
    }

    // Also emit a dashboard-updated event with summary
    const todaysPatients = await prisma.patient.count({ where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } })
    const todaysRevenueAgg = await prisma.sale.aggregate({ _sum: { totalAmount: true }, where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } })
    const todaysRevenue = todaysRevenueAgg._sum.totalAmount || 0

    io.emit('dashboard-updated', { todaysPatients, todaysRevenue })

    return { lowStock, nearExpiry }
  } catch (err) {
    console.error('alert checker error', err)
    return { lowStock: [], nearExpiry: [] }
  }
}
