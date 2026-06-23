import { NextRequest, NextResponse } from "next/server"
import { runDailyImport, getImportStatus } from "@/lib/cron-tasks"

const getCronSecret = () => {
  return process.env.CRON_SECRET || "cinora-cron-secret-2026-xyz"
}

function checkAuth(req: NextRequest): boolean {
  const secret = getCronSecret()
  
  // 1. Check Query Parameter
  const querySecret = req.nextUrl.searchParams.get("secret")
  if (querySecret === secret) return true

  // 2. Check Authorization Header
  const authHeader = req.headers.get("Authorization")
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "").trim()
    if (token === secret) return true
  }

  return false
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const status = getImportStatus()
  return NextResponse.json(status)
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const force = searchParams.get("force") === "true"

  const status = getImportStatus()
  if (status.status === "running") {
    return NextResponse.json({ status: "already_running" })
  }

  // Trigger import in the background (we do NOT await this so the response is immediate)
  runDailyImport(force)
    .catch((err) => {
      console.error("[CRON_API_ERROR] Async runDailyImport failed:", err)
    })

  return NextResponse.json({ status: "started" })
}
