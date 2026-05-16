import { Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'change_this_to_a_strong_secret'
const SALT_ROUNDS = 10

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' })

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ message: 'Invalid credentials' })

    const match = await bcrypt.compare(password, user.password)
    if (!match) return res.status(401).json({ message: 'Invalid credentials' })

    if (user.role !== 'ADMIN' && !user.isApproved) {
      return res.status(403).json({ message: 'Account not approved by admin yet' })
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role, email: user.email, name: user.name },
      JWT_SECRET,
      { expiresIn: '8h' }
    )

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      cnic: user.cnic,
      specialization: user.specialization,
      qualification: user.qualification,
      fee: user.fee,
      isApproved: user.isApproved,
      createdAt: user.createdAt
    }

    return res.json({ token, user: safeUser })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/auth/register (doctor)
router.post('/register', async (req, res) => {
  const { name, email, password, cnic, specialization, qualification, fee } = req.body
  if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' })

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(409).json({ message: 'Email already in use' })

    const hashed = await bcrypt.hash(password, SALT_ROUNDS)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashed,
        role: 'DOCTOR',
        cnic,
        specialization,
        qualification,
        fee: fee ? Number(fee) : undefined,
        isApproved: false
      }
    })

    // notify admin(s)
    try {
      const io = (req as any).io
      io && io.emit('new-doctor-registration', { id: newUser.id, email: newUser.email, name: newUser.name })
    } catch (e) {
      console.warn('Socket notify failed for new-doctor-registration', e)
    }

    const safeUser = {
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      isApproved: newUser.isApproved,
      createdAt: newUser.createdAt
    }

    return res.status(201).json({ user: safeUser })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
