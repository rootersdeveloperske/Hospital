import prisma from '../prisma'
import { Server as IOServer } from 'socket.io'
import { sendEmail } from './mailer'

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
      // send email to admins
      try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
        for (const a of admins) {
          await sendEmail(a.email, 'Low stock alert', `There are ${lowStock.length} medicines below the stock threshold.`, `<p>There are <strong>${lowStock.length}</strong> medicines below the stock threshold.</p>`)
        }
      } catch (e) {
        console.warn('Failed to send low-stock emails', e)
      }
    }

    if (nearExpiry.length > 0) {
      io.emit('expiry-alert', { count: nearExpiry.length, items: nearExpiry })
      try {
        const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } })
        for (const a of admins) {
          await sendEmail(a.email, 'Expiry alert', `There are ${nearExpiry.length} medicines nearing expiry.`, `<p>There are <strong>${nearExpiry.length}</strong> medicines nearing expiry.</p>`)
        }
      } catch (e) {
        console.warn('Failed to send expiry emails', e)
      }
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
