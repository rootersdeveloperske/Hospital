import { Router } from 'express'
import prisma from '../prisma'
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth'
import { sendEmail } from '../utils/mailer'

const router = Router()

// GET /api/users/pending - list unapproved doctor registrations
router.get('/pending', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  try {
    const pending = await prisma.user.findMany({ where: { role: 'DOCTOR', isApproved: false }, orderBy: { createdAt: 'asc' } })
    return res.json({ pending })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// PUT /api/users/approve/:id - approve a doctor
router.put('/approve/:id', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const { id } = req.params
  const io = (req as any).io
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role !== 'DOCTOR') return res.status(400).json({ message: 'Only doctors can be approved via this endpoint' })

    const updated = await prisma.user.update({ where: { id }, data: { isApproved: true } })

    // notify the doctor via socket
    try {
      io && io.emit('doctor-approved', { id: updated.id, email: updated.email, name: updated.name })
    } catch (e) {
      console.warn('socket emit failed for doctor-approved', e)
    }

    // send email notification if configured
    try {
      await sendEmail(updated.email, 'Your doctor account is approved', `Hello ${updated.name},\n\nYour account has been approved by admin. You can now log in.`, `<p>Hello ${updated.name},</p><p>Your account has been <strong>approved</strong> by admin. You can now log in.</p>`)
    } catch (e) {
      console.warn('Failed to send approval email', e)
    }

    return res.json({ user: { id: updated.id, email: updated.email, name: updated.name, isApproved: updated.isApproved } })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// PUT /api/users/reject/:id - reject a doctor (simple: delete or mark as rejected)
router.put('/reject/:id', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const { id } = req.params
  try {
    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role !== 'DOCTOR') return res.status(400).json({ message: 'Only doctors can be rejected via this endpoint' })

    // For simplicity, we'll delete the user on rejection. Alternately, you could set a rejected flag.
    await prisma.user.delete({ where: { id } })

    // Optionally send email to notify rejection
    try {
      await sendEmail(user.email, 'Your doctor registration was rejected', `Hello ${user.name},\n\nYour registration was rejected by admin.`, `<p>Hello ${user.name},</p><p>Your registration was <strong>rejected</strong> by admin.</p>`)
    } catch (e) {
      console.warn('Failed to send rejection email', e)
    }

    return res.json({ message: 'Doctor rejected and removed' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/users - list users with optional role filter
router.get('/', authMiddleware, requireRole('ADMIN'), async (req: AuthRequest, res) => {
  const { role } = req.query
  try {
    const users = await prisma.user.findMany({ where: role ? { role: String(role) as any } : {}, orderBy: { createdAt: 'desc' } })
    return res.json({ users })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
