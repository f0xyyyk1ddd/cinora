const { PrismaClient } = require('/app/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const c1 = await prisma.movie.count({ where: { videoSources: { some: {} } } });
  console.log("Total movies with videoSources:", c1);
}
test().finally(() => prisma.$disconnect());
