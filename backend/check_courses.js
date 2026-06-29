const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const all = await prisma.course.findMany();
  console.log('Total courses:', all.length);
  const bySem = {};
  all.forEach(c => {
    bySem[c.suggestedSemester] = (bySem[c.suggestedSemester] || 0) + 1;
  });
  console.log('Courses by suggestedSemester:', bySem);
}
main().finally(() => prisma.$disconnect());
