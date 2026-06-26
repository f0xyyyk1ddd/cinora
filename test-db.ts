import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

async function test() {
   const topAsc = await prisma.movie.findMany({ orderBy: { createdAt: 'asc' }, take: 10, select: { title: true, rating: true, year: true } })
   console.log("Oldest (Should be popular):", topAsc)
   
   const topRatingDesc = await prisma.movie.findMany({ orderBy: { rating: 'desc' }, take: 10, select: { title: true, rating: true, year: true } })
   console.log("Highest Rating (Current problem):", topRatingDesc)
}
test().finally(() => prisma.$disconnect())
