import { Router } from 'express'
import prisma from '../prisma'
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/consultations/pending/:doctorId
// Returns: { unassigned: Patient[], myPending: Consultation[] }
router.get('/pending/:doctorId', authMiddleware, async (req: AuthRequest, res) => {
  const { doctorId } = req.params
  try {
    // Unassigned patients (status = 'waiting')
    const unassigned = await prisma.patient.findMany({ where: { status: 'waiting' }, orderBy: { tokenNo: 'asc' } })

    // Consultations assigned to this doctor and pending
    const myPending = await prisma.consultation.findMany({
      where: { doctorId, status: 'pending' },
      orderBy: { createdAt: 'asc' }
    })

    return res.json({ unassigned, myPending })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/consultations/start
// Body: { doctorId, tokenNo }
router.post('/start', authMiddleware, requireRole('DOCTOR'), async (req: AuthRequest, res) => {
  const { doctorId, tokenNo } = req.body
  const io = (req as any).io
  if (!doctorId || !tokenNo) return res.status(400).json({ message: 'doctorId and tokenNo are required' })

  try {
    // Transaction: ensure patient is waiting and create consultation + update patient status
    const result = await prisma.$transaction(async (tx) => {
      const patient = await tx.patient.findUnique({ where: { tokenNo: Number(tokenNo) } })
      if (!patient) throw new Error('Patient not found')
      if (patient.status !== 'waiting') throw new Error('Patient not available for consultation')

      // Create consultation
      const consultation = await tx.consultation.create({
        data: {
          patientId: patient.id,
          doctorId,
          notes: '',
          status: 'pending'
        }
      })

      // Update patient status to in-progress
      await tx.patient.update({ where: { id: patient.id }, data: { status: 'in-progress' } })

      return { consultation, patient }
    })

    // Emit event
    try {
      io && io.emit('consultation-assigned', { consultation: result.consultation, patient: result.patient })
    } catch (e) {
      console.warn('socket emit failed for consultation-assigned', e)
    }

    return res.status(201).json({ consultation: result.consultation, patient: result.patient })
  } catch (err: any) {
    console.error(err)
    return res.status(400).json({ message: err.message || 'Could not start consultation' })
  }
})

// POST /api/consultations
// Body: { consultationId, notes, followUpDate?, prescriptions: [{ medicineId, quantity, dosage }] }
router.post('/', authMiddleware, requireRole('DOCTOR'), async (req: AuthRequest, res) => {
  const { consultationId, notes, followUpDate, prescriptions } = req.body
  const io = (req as any).io

  if (!consultationId) return res.status(400).json({ message: 'consultationId is required' })

  try {
    const result = await prisma.$transaction(async (tx) => {
      const consultation = await tx.consultation.update({
        where: { id: consultationId },
        data: {
          notes: notes ?? '',
          followUpDate: followUpDate ? new Date(followUpDate) : null,
          status: 'completed'
        }
      })

      // Create prescriptions if provided
      const createdPrescriptions: any[] = []
      if (Array.isArray(prescriptions)) {
        for (const p of prescriptions) {
          const pr = await tx.prescription.create({
            data: {
              consultationId: consultation.id,
              medicineId: p.medicineId,
              quantity: Number(p.quantity || 1),
              dosage: p.dosage || ''
            }
          })
          createdPrescriptions.push(pr)
        }
      }

      // Update patient status to completed
      await tx.patient.update({ where: { id: consultation.patientId }, data: { status: 'completed' } })

      return { consultation, prescriptions: createdPrescriptions }
    })

    // Emit events for completed consultation and new prescription
    try {
      io && io.emit('consultation-completed', { consultation: result.consultation })
      io && io.emit('new-prescription', { consultation: result.consultation, prescriptions: result.prescriptions })
    } catch (e) {
      console.warn('socket emits failed after consultation complete', e)
    }

    return res.json({ consultation: result.consultation, prescriptions: result.prescriptions })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// GET /api/consultations/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
  const { id } = req.params
  try {
    const consultation = await prisma.consultation.findUnique({ where: { id } })
    if (!consultation) return res.status(404).json({ message: 'Not found' })
    const prescriptions = await prisma.prescription.findMany({ where: { consultationId: id } })
    const patient = await prisma.patient.findUnique({ where: { id: consultation.patientId } })
    return res.json({ consultation, prescriptions, patient })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

export default router
