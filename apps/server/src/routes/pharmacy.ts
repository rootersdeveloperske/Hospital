import { Router } from 'express'
import prisma from '../prisma'
import { authMiddleware, requireRole, AuthRequest } from '../middleware/auth'

const router = Router()

// GET /api/pharmacy/prescription/:tokenNo
router.get('/prescription/:tokenNo', authMiddleware, requireRole('PHARMACIST'), async (req: AuthRequest, res) => {
  const { tokenNo } = req.params
  try {
    const patient = await prisma.patient.findUnique({ where: { tokenNo: Number(tokenNo) } })
    if (!patient) return res.status(404).json({ message: 'Patient not found' })

    // Find latest consultation for patient
    const consultation = await prisma.consultation.findFirst({ where: { patientId: patient.id }, orderBy: { createdAt: 'desc' } })

    if (!consultation) return res.status(404).json({ message: 'Consultation not found for this token' })

    // Fetch prescriptions with medicine details
    const prescriptions = await prisma.prescription.findMany({
      where: { consultationId: consultation.id },
      include: { medicine: true }
    })

    return res.json({ patient, consultation, prescriptions })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ message: 'Internal server error' })
  }
})

// POST /api/pharmacy/dispense
// Body: { tokenNo, items?: [{ medicineId, quantity }], taxPercent?: number }
router.post('/dispense', authMiddleware, requireRole('PHARMACIST'), async (req: AuthRequest, res) => {
  const { tokenNo, items, taxPercent } = req.body
  const io = (req as any).io

  if (!tokenNo) return res.status(400).json({ message: 'tokenNo is required' })

  try {
    // If items are not provided, derive from latest consultation
    let dispenseItems: Array<{ medicineId: string; quantity: number }> = []

    if (!items) {
      const patient = await prisma.patient.findUnique({ where: { tokenNo: Number(tokenNo) } })
      if (!patient) return res.status(404).json({ message: 'Patient not found' })

      const consultation = await prisma.consultation.findFirst({ where: { patientId: patient.id }, orderBy: { createdAt: 'desc' } })
      if (!consultation) return res.status(404).json({ message: 'Consultation not found for this token' })

      const prescriptions = await prisma.prescription.findMany({ where: { consultationId: consultation.id } })
      dispenseItems = prescriptions.map((p) => ({ medicineId: p.medicineId, quantity: p.quantity }))
    } else {
      dispenseItems = items.map((it: any) => ({ medicineId: it.medicineId, quantity: Number(it.quantity || 0) }))
    }

    if (dispenseItems.length === 0) return res.status(400).json({ message: 'No items to dispense' })

    // Transaction: check stock, deduct, create sale
    const result = await prisma.$transaction(async (tx) => {
      const receiptItems: any[] = []
      let subtotal = 0

      for (const it of dispenseItems) {
        const med = await tx.medicine.findUnique({ where: { id: it.medicineId } })
        if (!med) throw new Error(`Medicine not found: ${it.medicineId}`)
        if (med.stock < it.quantity) throw new Error(`Insufficient stock for ${med.name}. Available: ${med.stock}`)

        const lineTotal = med.price * it.quantity
        subtotal += lineTotal

        // deduct stock
        const updated = await tx.medicine.update({ where: { id: med.id }, data: { stock: med.stock - it.quantity } })

        receiptItems.push({
          medicineId: med.id,
          name: med.name,
          quantity: it.quantity,
          unitPrice: med.price,
          lineTotal,
          remainingStock: updated.stock
        })
      }

      const tax = taxPercent ? (subtotal * Number(taxPercent)) / 100 : 0
      const total = subtotal + tax

      const sale = await tx.sale.create({ data: { tokenNo: Number(tokenNo), totalAmount: total } })

      return { receiptItems, subtotal, tax, total, sale }
    })

    // Emit event for dispensing
    try {
      io && io.emit('medicines-dispensed', { tokenNo: Number(tokenNo), saleId: result.sale.id, items: result.receiptItems })
    } catch (e) {
      console.warn('socket emit failed for medicines-dispensed', e)
    }

    return res.json({ receipt: { tokenNo: Number(tokenNo), items: result.receiptItems, subtotal: result.subtotal, tax: result.tax, total: result.total } })
  } catch (err: any) {
    console.error(err)
    return res.status(400).json({ message: err.message || 'Could not dispense medicines' })
  }
})

export default router
