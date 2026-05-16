import express from 'express'
import http from 'http'
import { Server as IOServer } from 'socket.io'
import cors from 'cors'
import dotenv from 'dotenv'

import prisma from './prisma'
import authRouter from './routes/auth'
import usersRouter from './routes/users'
import patientsRouter from './routes/patients'
import consultationsRouter from './routes/consultations'
import medicinesRouter from './routes/medicines'
import pharmacyRouter from './routes/pharmacy'

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new IOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

// Socket.io connection
io.on('connection', (socket) => {
  console.log('socket connected', socket.id)
  socket.on('disconnect', () => console.log('socket disconnected', socket.id))
})

// Simple middleware to attach io to req
app.use((req, _res, next) => {
  ;(req as any).io = io
  next()
})

// API routes
app.use('/api/auth', authRouter)
app.use('/api/users', usersRouter)
app.use('/api/patients', patientsRouter)
app.use('/api/consultations', consultationsRouter)
app.use('/api/medicines', medicinesRouter)
app.use('/api/pharmacy', pharmacyRouter)

async function ensureStartup() {
  try {
    await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS patient_token_seq START 1`)
    console.log('Ensured patient_token_seq exists')
  } catch (err) {
    console.warn('Could not ensure sequence:', err)
  }
}

const PORT = process.env.PORT || 4000

ensureStartup()
  .catch((e) => console.error('Startup sequence error', e))
  .finally(() => {
    server.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  })
