import { Router } from 'express'

const router = Router()

// GET /api/pharmacy/prescription/:tokenNo
router.get('/prescription/:tokenNo', async (req, res) => {
  const { tokenNo } = req.params
  // TODO: fetch prescription by token no
  res.json({ message: 'get prescription - implement', tokenNo })
})

// POST /api/pharmacy/dispense
router.post('/dispense', async (req, res) => {
  const payload = req.body
  // TODO: check stock, deduct, create sale, return receipt
  res.json({ message: 'dispense - implement', payload })
})

export default router
