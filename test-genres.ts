import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function test() {
   const genres = await prisma.genre.findMany()
   console.log(genres.map(g => g.slug))
}
test().finally(() => prisma.$disconnect())
