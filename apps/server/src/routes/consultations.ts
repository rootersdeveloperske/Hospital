import { Router } from 'express'

const router = Router()

// POST /api/consultations
router.post('/', async (req, res) => {
  const payload = req.body
  // TODO: create consultation and prescriptions
  res.json({ message: 'create consultation - implement', payload })
})

// GET /api/consultations/pending/:doctorId
router.get('/pending/:doctorId', async (req, res) => {
  const { doctorId } = req.params
  // TODO: fetch consultations pending for doctor
  res.json({ message: 'pending consultations - implement', doctorId })
})

export default router
