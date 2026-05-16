import { Router } from 'express'

const router = Router()

// POST /api/patients/token
router.post('/token', async (req, res) => {
  const { name, age, cnic, consultationType, visitType } = req.body
  // TODO: create patient, auto-increment tokenNo
  // notify doctor(s) via socket
  const io = (req as any).io
  io.emit('new-token', { cnic, name })
  res.json({ message: 'create token - implement', data: req.body })
})

// GET /api/patients (with status filter)
router.get('/', async (req, res) => {
  const { status } = req.query
  // TODO: fetch patients
  res.json({ message: 'list patients - implement', status })
})

// GET /api/patients/by-cnic/:cnic
router.get('/by-cnic/:cnic', async (req, res) => {
  const { cnic } = req.params
  // TODO: fetch patient by cnic
  res.json({ message: 'get patient by cnic - implement', cnic })
})

export default router
