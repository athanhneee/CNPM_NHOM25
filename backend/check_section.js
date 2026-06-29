const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const section = await prisma.section.findFirst();
  console.log(section);
}
main().finally(() => prisma.$disconnect());
