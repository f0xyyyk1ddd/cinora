import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { tmdb } from "@/lib/tmdb"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { tmdbId, type } = await req.json()

    if (!tmdbId) {
      return new NextResponse("TMDB ID required", { status: 400 })
    }

    if (type === "movie") {
      const movie = await tmdb.importMovieToDb(tmdbId)
      return NextResponse.json(movie)
    } else {
      // Series import would go here
      return new NextResponse("Series import not fully implemented", { status: 501 })
    }
  } catch (error: any) {
    console.error("TMDB_IMPORT_ERROR", error)
    return new NextResponse(error.message || "Internal Error", { status: 500 })
  }
}
