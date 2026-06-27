const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.enrollment.findMany({
  where: { sectionId: { in: ['sec-int204-1', 'sec-int205-1'] } },
  include: { section: true }
}).then(r => console.log(JSON.stringify(r, null, 2))).finally(()=>p.$disconnect());
