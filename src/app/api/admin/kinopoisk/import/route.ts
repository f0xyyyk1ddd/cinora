import { NextRequest, NextResponse } from "next/server"
import { kinopoisk } from "@/lib/kinopoisk"

export async function POST(req: NextRequest) {
  try {
    const { kinopoiskId } = await req.json()

    if (!kinopoiskId) {
      return new NextResponse("Kinopoisk ID is required", { status: 400 })
    }

    const kId = Number(kinopoiskId)

    const imported = await kinopoisk.importContentToDb(kId)

    return NextResponse.json({ success: true, item: imported })
  } catch (error: any) {
    console.error("[KINOPOISK_IMPORT_ERROR]", error)
    return new NextResponse(error.message || "Internal Server Error", { status: 500 })
  }
}
