import { Router } from 'express'
import prisma from '../prisma'

const router = Router()

// Helper: ensure the sequence exists
async function ensureSequenceExists() {
  try {
    await prisma.$executeRawUnsafe(`CREATE SEQUENCE IF NOT EXISTS patient_token_seq START 1`)
  } catch (err) {
    console.warn('Could not ensure sequence exists', err)
  }
}

// POST /api/patients/token
// Body: { name, age, cnic, consultationType, visitType, isFollowUp }
router.post('/token', async (req, res) => {
  const { name, age, cnic, consultationType, visitType, isFollowUp } = req.body
  const io = (req as any).io

  if (!cnic) return res.status(400).json({ message: 'CNIC is required' })

  try {
    await ensureSequenceExists()

    // If follow-up and existing patient with CNIC found, pre-fill name/age
    let prefill: any = {}
    if (isFollowUp) {
      const existing = await prisma.patient.findFirst({
        where: { cnic },
        orderBy: { createdAt: 'desc' }
      })
      if (existing) {
        prefill.name = existing.name
        prefill.age = existing.age
      }
    }

    // Get next token atomically from Postgres sequence
    const result: Array<any> = await prisma.$queryRawUnsafe(`SELECT nextval('patient_token_seq') as nextval`)
    const tokenNo = parseInt(String(result[0]?.nextval || '0'), 10)

    const patient = await prisma.patient.create({
      data: {
        name: name ?? prefill.name ?? 'Unknown',
        age: age ?? prefill.age ?? 0,
        cnic,
        tokenNo,
        status: 'waiting'
      }
    })

    // Emit real-time event to doctors / interested clients
    try {
      io && io.emit('new-token', { tokenNo: patient.tokenNo, patient })
    } catch (err) {
      console.warn('Socket emit failed for new-token', err)
    }

    return res.status(201).json({ patient })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/patients (with optional ?status=waiting|completed)
router.get('/', async (req, res) => {
  const { status } = req.query
  try {
    const patients = await prisma.patient.findMany({
      where: status ? { status: String(status) } : {},
      orderBy: { tokenNo: 'asc' }
    })
    return res.json({ patients })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/patients/by-cnic/:cnic
router.get('/by-cnic/:cnic', async (req, res) => {
  const { cnic } = req.params
  try {
    const patient = await prisma.patient.findFirst({
      where: { cnic },
      orderBy: { createdAt: 'desc' }
    })
    if (!patient) return res.status(404).json({ message: 'Not found' })
    return res.json({ patient })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
