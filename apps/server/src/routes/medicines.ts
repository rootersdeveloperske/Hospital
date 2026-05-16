import { Router } from 'express'

const router = Router()

// GET /api/medicines
router.get('/', async (req, res) => {
  // TODO: return list of medicines
  res.json({ message: 'list medicines - implement' })
})

// CRUD handlers placeholder
router.post('/', async (req, res) => {
  res.json({ message: 'create medicine - implement' })
})

router.put('/:id', async (req, res) => {
  res.json({ message: 'update medicine - implement', id: req.params.id })
})

router.delete('/:id', async (req, res) => {
  res.json({ message: 'delete medicine - implement', id: req.params.id })
})

export default router
