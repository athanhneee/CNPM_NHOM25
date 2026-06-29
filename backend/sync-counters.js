const { PrismaClient } = require('@prisma/client')

async function syncAllCounters() {
  const prisma = new PrismaClient()
  
  try {
    const sections = await prisma.section.findMany({
      select: { id: true, sectionCode: true, status: true, capacity: true, registeredCount: true, waitlistCount: true }
    })

    let fixed = 0
    for (const section of sections) {
      // Skip preserved statuses
      if (['CANCELLED', 'CLOSED', 'COMPLETED', 'IN_PROGRESS'].includes(section.status)) continue

      const enrollments = await prisma.enrollment.findMany({
        where: { sectionId: section.id },
        select: { status: true },
      })

      const actualRegistered = enrollments.filter(e => e.status === 'REGISTERED').length
      const actualWaitlist = enrollments.filter(e => e.status === 'WAITLISTED').length

      if (section.registeredCount !== actualRegistered || section.waitlistCount !== actualWaitlist) {
        console.log(`FIX ${section.sectionCode}: registered ${section.registeredCount} -> ${actualRegistered}, waitlist ${section.waitlistCount} -> ${actualWaitlist}`)
        
        const newStatus = actualRegistered >= section.capacity ? 'FULL' : 'OPEN'
        await prisma.section.update({
          where: { id: section.id },
          data: { registeredCount: actualRegistered, waitlistCount: actualWaitlist, status: newStatus },
        })
        fixed++
      }
    }

    console.log(`\nDone. Fixed ${fixed} sections out of ${sections.length} total.`)
  } finally {
    await prisma.$disconnect()
  }
}

syncAllCounters().catch(console.error)
