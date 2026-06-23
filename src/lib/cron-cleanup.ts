import fs from "fs"
import path from "path"
import prisma from "./db"

export interface CleanupStatus {
  lastRun: string | null
  status: "idle" | "running" | "success" | "failed"
  processedCount: number
  deletedCount: number
  error: string | null
  logs: string[]
}

function getStatusFilePath(): string {
  const dbUrl = process.env.DATABASE_URL || "file:./prisma/dev.db"
  if (dbUrl.startsWith("file:")) {
    const relativeDbPath = dbUrl.substring(5)
    const dbDir = path.dirname(path.resolve(relativeDbPath))
    return path.join(dbDir, "cleanup-status.json")
  }
  return path.resolve("./cleanup-status.json")
}

export function getCleanupStatus(): CleanupStatus {
  const filePath = getStatusFilePath()
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"))
    } catch (e) {
      console.error("Error reading cleanup status file", e)
    }
  }
  return {
    lastRun: null,
    status: "idle",
    processedCount: 0,
    deletedCount: 0,
    error: null,
    logs: []
  }
}

function writeCleanupStatus(status: CleanupStatus) {
  const filePath = getStatusFilePath()
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(status, null, 2), "utf-8")
  } catch (e) {
    console.error("Failed to write cleanup status file", e)
  }
}

async function checkVideoExists(id: string, type: 'movies' | 'series') {
  try {
    const balancerRes = await fetch(`https://fbphdplay.top/api/players?kinopoisk=${id}`, { 
      signal: AbortSignal.timeout(5000),
      headers: {
        'Referer': 'https://cinora.ru/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    })
    
    if (balancerRes.ok) {
      const balancerJson = await balancerRes.json()
      if (balancerJson.data && Array.isArray(balancerJson.data) && balancerJson.data.length > 0) {
        const hasVideo = balancerJson.data.some((p: any) => p.iframeUrl !== null)
        return hasVideo
      }
      return false
    }
    
    return true; // Fallback in case API goes down
  } catch (e) {
    return true; // Don't delete if there's a network error
  }
}

export async function runCleanup() {
  const status = getCleanupStatus()
  if (status.status === "running") {
    console.log("[CLEANUP] Cleanup is already running. Skipping.")
    return
  }

  const logs: string[] = []
  const lastRunTime = new Date().toISOString()
  let processedCount = 0
  let deletedCount = 0

  const writeLiveStatus = (statusType: "running" | "success" | "failed", errorMsg: string | null = null) => {
    writeCleanupStatus({
      lastRun: lastRunTime,
      status: statusType,
      processedCount,
      deletedCount,
      error: errorMsg,
      logs
    })
  }

  const addLog = (msg: string) => {
    const formatted = `[${new Date().toISOString()}] ${msg}`
    console.log(formatted)
    // Keep only last 50 logs to avoid huge files
    if (logs.length > 50) logs.shift()
    logs.push(formatted)
    writeLiveStatus("running")
  }

  addLog("Starting automated database cleanup...")

  try {
    // Process Movies
    addLog("Fetching movies for verification...")
    const movies = await prisma.movie.findMany({
      where: { kinopoiskId: { not: null } },
      select: { id: true, kinopoiskId: true, title: true }
    })

    addLog(`Found ${movies.length} movies with kinopoisk ID.`)

    for (let i = 0; i < movies.length; i++) {
      const item = movies[i]
      if (!item.kinopoiskId) continue

      const hasVideo = await checkVideoExists(item.kinopoiskId.toString(), 'movies')
      processedCount++
      
      if (!hasVideo) {
        await prisma.movie.delete({ where: { id: item.id } })
        deletedCount++
        
        await prisma.blacklist.upsert({
          where: { kinopoiskId: item.kinopoiskId },
          update: {},
          create: { kinopoiskId: item.kinopoiskId }
        })
        addLog(`Deleted movie: "${item.title}" (ID: ${item.kinopoiskId}) - No video found`)
      }
      
      if (i % 50 === 0 && i > 0) {
        addLog(`Processed ${i}/${movies.length} movies. Deleted ${deletedCount} so far.`)
      }
      
      await new Promise(r => setTimeout(r, 100))
    }

    // Process Series
    addLog("Fetching series for verification...")
    const series = await prisma.series.findMany({
      where: { kinopoiskId: { not: null } },
      select: { id: true, kinopoiskId: true, title: true }
    })

    addLog(`Found ${series.length} series with kinopoisk ID.`)

    for (let i = 0; i < series.length; i++) {
      const item = series[i]
      if (!item.kinopoiskId) continue

      const hasVideo = await checkVideoExists(item.kinopoiskId.toString(), 'series')
      processedCount++
      
      if (!hasVideo) {
        await prisma.series.delete({ where: { id: item.id } })
        deletedCount++
        
        await prisma.blacklist.upsert({
          where: { kinopoiskId: item.kinopoiskId },
          update: {},
          create: { kinopoiskId: item.kinopoiskId }
        })
        addLog(`Deleted series: "${item.title}" (ID: ${item.kinopoiskId}) - No video found`)
      }
      
      if (i % 50 === 0 && i > 0) {
        addLog(`Processed ${i}/${series.length} series. Deleted ${deletedCount} so far.`)
      }
      
      await new Promise(r => setTimeout(r, 100))
    }

    addLog(`Cleanup completed! Processed ${processedCount} items, deleted ${deletedCount} items.`)
    writeLiveStatus("success")
  } catch (error: any) {
    addLog(`CRITICAL ERROR during cleanup process: ${error.message}`)
    writeLiveStatus("failed", error.message)
  }
}
