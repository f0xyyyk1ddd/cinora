import { NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")
    
    if (!q) {
      return NextResponse.json({ movies: [], series: [] })
    }

    const queryLower = q.toLowerCase()

    // SQLite Prisma doesn't support case-insensitive contains for Cyrillic
    // Since our DB is small (from mass import), we fetch all and filter in JS
    const allMovies = await prisma.movie.findMany()
    const movies = allMovies.filter(m => 
      m.title.toLowerCase().includes(queryLower) || 
      (m.originalTitle && m.originalTitle.toLowerCase().includes(queryLower)) ||
      (m.description && m.description.toLowerCase().includes(queryLower))
    ).slice(0, 20)

    const allSeries = await prisma.series.findMany()
    const series = allSeries.filter(s => 
      s.title.toLowerCase().includes(queryLower) || 
      (s.originalTitle && s.originalTitle.toLowerCase().includes(queryLower)) ||
      (s.description && s.description.toLowerCase().includes(queryLower))
    ).slice(0, 20)

    return NextResponse.json({ movies, series }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      }
    })
  } catch (error) {
    console.error("SEARCH_ERROR", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
