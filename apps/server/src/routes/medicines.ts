import { Router } from 'express'
import prisma from '../prisma'

const router = Router()

// GET /api/medicines
router.get('/', async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({ orderBy: { name: 'asc' } })
    return res.json({ medicines })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/medicines
router.post('/', async (req, res) => {
  const payload = req.body
  try {
    const med = await prisma.medicine.create({ data: payload })
    return res.status(201).json({ medicine: med })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// PUT /api/medicines/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params
  try {
    const med = await prisma.medicine.update({ where: { id }, data: req.body })
    return res.json({ medicine: med })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// DELETE /api/medicines/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  try {
    await prisma.medicine.delete({ where: { id } })
    return res.json({ message: 'deleted' })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
