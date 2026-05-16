import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const router = Router()

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  // TODO: lookup user from DB using Prisma
  // For now respond with placeholder
  return res.json({ message: 'login route - implement DB lookup', email })
})

// POST /api/auth/register (doctor)
router.post('/register', async (req, res) => {
  const payload = req.body
  // TODO: validate & create user with role DOCTOR, set isApproved=false
  // notify admin via socket
  const io = (req as any).io
  io.emit('new-doctor-registration', { email: payload.email })
  return res.json({ message: 'register route - implement DB create', payload })
})

export default router
