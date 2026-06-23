import { NextRequest, NextResponse } from "next/server"
import { getKeys, saveKeys } from "@/lib/kinopoisk-keys"

export async function GET(req: NextRequest) {
  try {
    const keys = getKeys()
    return NextResponse.json({ keys })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { keys } = await req.json()
    if (!Array.isArray(keys)) {
      return NextResponse.json({ error: "Keys must be an array of strings" }, { status: 400 })
    }

    saveKeys(keys)
    return NextResponse.json({ success: true, keys: getKeys() })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
