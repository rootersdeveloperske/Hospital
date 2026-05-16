import bcrypt from 'bcrypt'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@gmail.com'
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (existing) {
    console.log('Admin already exists')
  } else {
    const hashed = await bcrypt.hash('123', 10)
    const admin = await prisma.user.create({
      data: {
        name: 'Admin',
        email: adminEmail,
        password: hashed,
        role: 'ADMIN',
        isApproved: true
      }
    })
    console.log('Created admin:', admin.email)
  }

  // optional: create a sample approved doctor for testing
  const doctorEmail = 'doctor1@example.com'
  const existingDoc = await prisma.user.findUnique({ where: { email: doctorEmail } })
  if (!existingDoc) {
    const hashedDoc = await bcrypt.hash('123', 10)
    const doctor = await prisma.user.create({
      data: {
        name: 'Dr. Test',
        email: doctorEmail,
        password: hashedDoc,
        role: 'DOCTOR',
        specialization: 'General',
        qualification: 'MBBS',
        fee: 10.0,
        isApproved: true
      }
    })
    console.log('Created sample doctor:', doctor.email)
  } else {
    console.log('Sample doctor already exists')
  }

  // optional: create a couple of sample medicines
  const meds = [
    {
      name: 'Paracetamol',
      genericName: 'Acetaminophen',
      brandName: 'Tylenol',
      strength: '500mg',
      dosageForm: 'TABLET',
      category: 'Painkiller',
      requiresRx: false,
      baseUnit: 'TABLET',
      stock: 100,
      price: 1.5,
      status: 'ACTIVE'
    },
    {
      name: 'Amoxicillin',
      genericName: 'Amoxicillin',
      brandName: 'Amoxil',
      strength: '500mg',
      dosageForm: 'CAPSULE',
      category: 'Antibiotic',
      requiresRx: true,
      baseUnit: 'CAPSULE',
      stock: 50,
      price: 2.0,
      status: 'ACTIVE'
    }
  ]

  for (const m of meds) {
    await prisma.medicine.upsert({ where: { name: m.name }, update: {}, create: m as any })
  }

  console.log('Seed complete')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
