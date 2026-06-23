import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import prisma from "@/lib/db"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ favoriteIds: [] }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ favoriteIds: [] }, { status: 401 })
    }

    const favorites = await prisma.favorite.findMany({
      where: { userId: user.id },
      select: { movieId: true, seriesId: true }
    })

    const favoriteIds = favorites.map(f => f.movieId || f.seriesId).filter(Boolean) as string[]

    return NextResponse.json({ favoriteIds })
  } catch (error) {
    console.error("Favorites GET Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { contentId, type } = body

    if (!contentId || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Check if it's already a favorite
    let existingFavorite = null
    
    if (type === "movie") {
      existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_movieId: {
            userId: user.id,
            movieId: contentId
          }
        }
      })
    } else if (type === "series") {
      existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_seriesId: {
            userId: user.id,
            seriesId: contentId
          }
        }
      })
    }

    if (existingFavorite) {
      // Remove it
      await prisma.favorite.delete({
        where: { id: existingFavorite.id }
      })
      return NextResponse.json({ action: "removed" })
    } else {
      // Add it
      await prisma.favorite.create({
        data: {
          userId: user.id,
          movieId: type === "movie" ? contentId : null,
          seriesId: type === "series" ? contentId : null,
        }
      })
      return NextResponse.json({ action: "added" })
    }
  } catch (error) {
    console.error("Favorites POST Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
