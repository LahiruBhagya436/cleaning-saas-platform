import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // ── Admin user ──────────────────────────────────────────────────────────────
  const adminHash = await bcrypt.hash('Admin123!', 12)
  await prisma.user.upsert({
    where:  { email: 'admin@cleaningco.se' },
    update: { passwordHash: adminHash },
    create: {
      email:        'admin@cleaningco.se',
      passwordHash: adminHash,
      fullName:     'Admin',
      role:         'admin',
    },
  })
  console.log('✓ Admin user created')

  // ── Demo staff ──────────────────────────────────────────────────────────────
  const staffHash = await bcrypt.hash('Staff123!', 12)
  await prisma.user.upsert({
    where:  { email: 'fatima@cleaningco.se' },
    update: { passwordHash: staffHash },
    create: {
      email:        'fatima@cleaningco.se',
      passwordHash: staffHash,
      fullName:     'Fatima Al-Hassan',
      role:         'staff',
      phone:        '+46701234567',
    },
  })
  console.log('✓ Staff user created')

  // ── Demo customer ───────────────────────────────────────────────────────────
  const custHash = await bcrypt.hash('Customer123!', 12)
  await prisma.user.upsert({
    where:  { email: 'anna@example.se' },
    update: { passwordHash: custHash },
    create: {
      email:        'anna@example.se',
      passwordHash: custHash,
      fullName:     'Anna Lindqvist',
      role:         'customer',
      phone:        '+46709876543',
    },
  })
  console.log('✓ Customer user created')

  // ── Services catalogue ──────────────────────────────────────────────────────
  const services = [
    {
      name:            'Regular home cleaning',
      nameSv:          'Hemstädning',
      category:        'residential' as const,
      basePricePerHour: 700,
      rutEligible:     true,
      minDurationMins: 120,
      sortOrder:       1,
    },
    {
      name:            'Deep cleaning',
      nameSv:          'Storstädning',
      category:        'residential' as const,
      basePricePerHour: 700,
      rutEligible:     true,
      minDurationMins: 240,
      sortOrder:       2,
    },
    {
      name:            'Move-in / move-out cleaning',
      nameSv:          'Flyttstädning',
      category:        'residential' as const,
      basePricePerHour: 700,
      rutEligible:     true,
      minDurationMins: 300,
      sortOrder:       3,
    },
    {
      name:            'Window cleaning',
      nameSv:          'Fönsterputning',
      category:        'residential' as const,
      basePricePerHour: 600,
      rutEligible:     true,
      minDurationMins: 60,
      sortOrder:       4,
    },
    {
      name:            'After-party cleaning',
      nameSv:          'Efterfeststädning',
      category:        'residential' as const,
      basePricePerHour: 750,
      rutEligible:     true,
      minDurationMins: 120,
      sortOrder:       5,
    },
    {
      name:            'Office cleaning',
      nameSv:          'Kontorstädning',
      category:        'commercial' as const,
      basePricePerHour: 650,
      rutEligible:     false,
      minDurationMins: 120,
      sortOrder:       6,
    },
    {
      name:            'Stairwell cleaning',
      nameSv:          'Trapphustädning',
      category:        'commercial' as const,
      basePricePerHour: 550,
      rutEligible:     false,
      minDurationMins: 60,
      sortOrder:       7,
    },
    {
      name:            'Post-construction cleaning',
      nameSv:          'Byggstädning',
      category:        'specialty' as const,
      basePricePerHour: 800,
      rutEligible:     false,
      minDurationMins: 240,
      sortOrder:       8,
    },
  ]

  for (const svc of services) {
    await prisma.service.upsert({
      where:  { name: svc.name },
      update: {},
      create: {
        name:            svc.name,
        nameSv:          svc.nameSv,
        category:        svc.category,
        basePricePerHour:svc.basePricePerHour,
        rutEligible:     svc.rutEligible,
        vatRate:         0.25,
        minDurationMins: svc.minDurationMins,
        sortOrder:       svc.sortOrder,
      },
    })
  }
  console.log(`✓ ${services.length} services created`)

  // ── Staff schedules (Fatima, weekdays for next 60 days) ──────────────────────
  const fatimaUser = await prisma.user.findUnique({ where: { email: 'fatima@cleaningco.se' } })
  if (fatimaUser) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    let schedulesAdded = 0
    for (let i = 0; i < 60; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      const dow = d.getDay() // 0=Sun, 6=Sat
      if (dow === 0 || dow === 6) continue // skip weekends
      await prisma.staffSchedule.upsert({
        where:  { staffId_workDate: { staffId: fatimaUser.id, workDate: d } },
        update: {},
        create: { staffId: fatimaUser.id, workDate: d, startTime: '08:00', endTime: '17:00', isAvailable: true },
      })
      schedulesAdded++
    }
    console.log(`✓ ${schedulesAdded} staff schedule days added for Fatima`)
  }

  console.log('')
  console.log('✅ Seed complete!')
  console.log('   Admin:    admin@cleaningco.se    / Admin123!')
  console.log('   Staff:    fatima@cleaningco.se   / Staff123!')
  console.log('   Customer: anna@example.se        / Customer123!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
