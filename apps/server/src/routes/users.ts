import { Router } from 'express'

const router = Router()

// GET /api/users/pending
router.get('/pending', async (req, res) => {
  // TODO: return doctors with isApproved=false
  res.json({ message: 'pending users - implement' })
})

// PUT /api/users/approve/:id
router.put('/approve/:id', async (req, res) => {
  const { id } = req.params
  // TODO: set isApproved = true for user id
  res.json({ message: 'approve user - implement', id })
})

// GET /api/users (filter by role)
router.get('/', async (req, res) => {
  const { role } = req.query
  // TODO: fetch users, filter by role if provided
  res.json({ message: 'list users - implement', role })
})

export default router
