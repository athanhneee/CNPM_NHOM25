const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const course = await prisma.course.findFirst({ where: { code: 'INT101' } });
  console.log(course);
}

main().finally(() => prisma.$disconnect());
