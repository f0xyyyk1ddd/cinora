import prisma from "@/lib/db"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    const userId = (session?.user as any)?.id

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { movieId, seriesId, episodeId } = body

    if (!movieId && !seriesId) {
      return NextResponse.json({ error: "Missing content ID" }, { status: 400 })
    }

    // Upsert logic for WatchHistory
    // Because Prisma requires unique constraints for upsert, and we have multiple optional fields,
    // we'll first find if an entry exists for this specific content.

    let existingHistory;

    if (movieId) {
      existingHistory = await prisma.watchHistory.findFirst({
        where: { userId, movieId }
      })
    } else if (episodeId) {
      existingHistory = await prisma.watchHistory.findFirst({
        where: { userId, episodeId }
      })
    } else if (seriesId) {
      existingHistory = await prisma.watchHistory.findFirst({
        where: { userId, seriesId }
      })
    }

    if (existingHistory) {
      await prisma.watchHistory.update({
        where: { id: existingHistory.id },
        data: { lastWatched: new Date() }
      })
    } else {
      await prisma.watchHistory.create({
        data: {
          userId,
          movieId: movieId || null,
          seriesId: seriesId || null,
          episodeId: episodeId || null,
          lastWatched: new Date(),
          progress: 0,
          duration: 0
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to update watch history:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
