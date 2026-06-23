import { NextRequest, NextResponse } from "next/server"
import { kinopoisk } from "@/lib/kinopoisk"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const SECRET = process.env.BOT_SECRET_KEY

    // Secure the endpoint with a secret key
    if (!SECRET || authHeader !== `Bearer ${SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    let { kinopoiskId, keyword } = body

    if (!kinopoiskId && keyword) {
      const searchRes = await kinopoisk.searchByKeyword(keyword)
      if (searchRes && searchRes.films && searchRes.films.length > 0) {
        kinopoiskId = searchRes.films[0].filmId
      } else {
        return new NextResponse("Not found by keyword", { status: 404 })
      }
    }

    if (!kinopoiskId) {
      return new NextResponse("Missing kinopoiskId or keyword", { status: 400 })
    }

    const kId = Number(kinopoiskId)
    
    const existingMovie = await prisma.movie.findUnique({ where: { kinopoiskId: kId } })
    const existingSeries = await prisma.series.findUnique({ where: { kinopoiskId: kId } })
    const alreadyExists = !!(existingMovie || existingSeries)

    // Call the existing import function
    const imported = await kinopoisk.importContentToDb(kId)
    
    return NextResponse.json({ success: true, item: imported, alreadyExists })
  } catch (error: any) {
    console.error("[BOT_IMPORT_ERROR]", error)
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" }, 
      { status: 500 }
    )
  }
}
