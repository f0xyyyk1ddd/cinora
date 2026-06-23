import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { tmdb } from "@/lib/tmdb"

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "movie"

    if (!query) {
      return NextResponse.json({ results: [] })
    }

    const data = type === "movie" 
      ? await tmdb.searchMovies(query)
      : await tmdb.searchSeries(query)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error("TMDB_SEARCH_ERROR", error)
    if (process.env.TMDB_API_KEY === "mock-tmdb-api-key") {
      return new NextResponse("mock-tmdb-api-key in .env", { status: 401 })
    }
    return new NextResponse(error.message || "Internal Error", { status: 500 })
  }
}
