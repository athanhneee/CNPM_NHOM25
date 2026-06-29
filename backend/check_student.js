const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const student = await prisma.user.findFirst({where: {studentClass: 'D23CQCN01-N'}});
  console.log(student);
}
main().finally(() => prisma.$disconnect());
