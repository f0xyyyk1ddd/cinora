import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function test() {
  const excludedGenres = ['короткометражка', 'документальный', 'для-взрослых', 'ток-шоу', 'реальное-тв'];
  const res = await prisma.movie.findMany({ 
      where: { 
        kinopoiskId: { not: null }, 
        rating: { gte: 7.5 }, 
        genres: { none: { genre: { slug: { in: excludedGenres } } } }
      }, 
      orderBy: { rating: 'desc' }, 
      take: 100 
    })
  console.log("Found movies (no videosource):", res.length)
}
test().finally(() => prisma.$disconnect())
