const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const enrollments = await prisma.enrollment.findMany({where: {studentId: 'N23DCCN001'}});
  console.log(enrollments);
}
main().finally(() => prisma.$disconnect());
