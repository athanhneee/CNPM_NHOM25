const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.section.findMany({where: {sectionCode: {in: ['INT204-1', 'INT205-1']}}}).then(r => console.log(r)).finally(()=>p.$disconnect());
