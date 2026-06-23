import prisma from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ likedIds: [] })
    const userId = (session.user as any).id

    const ratings = await prisma.rating.findMany({
      where: { userId, value: { gte: 4 } },
      select: { movieId: true, seriesId: true }
    })

    const likedIds = ratings.map(r => r.movieId || r.seriesId).filter(Boolean)
    return NextResponse.json({ likedIds })
  } catch (error) {
    return NextResponse.json({ likedIds: [] })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    
    const userId = (session.user as any).id
    const { contentId, type } = await req.json()

    if (!contentId || !type) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 })
    }

    const isMovie = type === "movie"

    // Check if it's already liked
    const existing = await prisma.rating.findFirst({
      where: {
        userId,
        movieId: isMovie ? contentId : null,
        seriesId: !isMovie ? contentId : null,
      }
    })

    if (existing) {
      // Toggle off (delete)
      await prisma.rating.delete({ where: { id: existing.id } })
      return NextResponse.json({ success: true, liked: false })
    } else {
      // Toggle on (insert 5)
      await prisma.rating.create({
        data: {
          userId,
          movieId: isMovie ? contentId : null,
          seriesId: !isMovie ? contentId : null,
          value: 5
        }
      })
      return NextResponse.json({ success: true, liked: true })
    }
  } catch (error) {
    console.error("Rating error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
